import uuid
from decimal import Decimal

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from apps.core.exceptions import ApplicationError
from apps.payments.gateways.razorpay_gateway import RazorpayGateway
from apps.payments.gateways.stripe_gateway import StripeGateway
from apps.payments.models import Payment, PaymentGateway, PaymentPurpose, PaymentStatus
from apps.payments.repositories.payment_repository import PaymentRepository
from apps.payments.services.coupon_service import CouponService
from apps.payments.services.referral_service import ReferralService
from apps.payments.services.wallet_service import WalletService


class PaymentService:
    def __init__(
        self,
        payment_repository: PaymentRepository = None,
        coupon_service: CouponService = None,
        wallet_service: WalletService = None,
        referral_service: ReferralService = None,
    ):
        self.payment_repository = payment_repository or PaymentRepository()
        self.coupon_service = coupon_service or CouponService()
        self.wallet_service = wallet_service or WalletService()
        self.referral_service = referral_service or ReferralService()
        self.razorpay_gateway = RazorpayGateway()
        self.stripe_gateway = StripeGateway()

    # ---------------------------------------------------------------- initiate
    def initiate_payment(
        self, user, *, purpose: str, reference_id, amount: Decimal, gateway: str,
        currency: str = "INR", coupon_code: str = None,
    ):
        discount = Decimal("0")
        coupon = None
        if coupon_code:
            coupon, discount = self.coupon_service.validate_and_compute_discount(
                coupon_code, user=user, order_amount=amount, purpose=purpose
            )

        net_amount = amount - discount

        payment = self.payment_repository.create(
            user=user,
            gateway=gateway,
            purpose=purpose,
            reference_id=reference_id,
            amount=amount,
            discount_amount=discount,
            currency=currency,
            coupon=coupon,
            status=PaymentStatus.CREATED,
        )

        if net_amount <= 0:
            # Fully covered by discount/credits — no gateway round-trip needed.
            self._mark_paid(payment, gateway_payment_id="", raw_response={"note": "fully covered by discount"})
            return payment, {"requires_gateway": False}

        gateway_response = self._create_gateway_order(payment, net_amount)
        return payment, gateway_response

    def initiate_wallet_topup(self, user, *, amount: Decimal, gateway: str, currency: str = "INR"):
        return self.initiate_payment(
            user, purpose=PaymentPurpose.WALLET_TOPUP, reference_id=uuid.uuid4(), amount=amount,
            gateway=gateway, currency=currency,
        )

    def _create_gateway_order(self, payment: Payment, net_amount: Decimal) -> dict:
        if payment.gateway == PaymentGateway.RAZORPAY:
            order = self.razorpay_gateway.create_order(
                amount=net_amount, currency=payment.currency, receipt=str(payment.id)
            )
            self.payment_repository.update(payment, gateway_order_id=order["id"], status=PaymentStatus.PENDING)
            return {
                "requires_gateway": True,
                "gateway": "razorpay",
                "order_id": order["id"],
                "amount": order["amount"],
                "currency": order["currency"],
                "key_id": settings.RAZORPAY_KEY_ID,
            }

        if payment.gateway == PaymentGateway.STRIPE:
            intent = self.stripe_gateway.create_payment_intent(
                amount=net_amount, currency=payment.currency,
                metadata={"payment_id": str(payment.id), "purpose": payment.purpose},
            )
            self.payment_repository.update(payment, gateway_order_id=intent["id"], status=PaymentStatus.PENDING)
            return {
                "requires_gateway": True,
                "gateway": "stripe",
                "client_secret": intent["client_secret"],
                "payment_intent_id": intent["id"],
            }

        raise ApplicationError(f"Unsupported payment gateway: {payment.gateway}")

    # ---------------------------------------------------------------- client-side confirmation (Razorpay)
    def confirm_razorpay_payment(self, payment: Payment, *, razorpay_payment_id: str, razorpay_signature: str):
        verified = self.razorpay_gateway.verify_payment_signature(
            order_id=payment.gateway_order_id, payment_id=razorpay_payment_id, signature=razorpay_signature
        )
        if not verified:
            self._mark_failed(payment, reason="Signature verification failed.")
            raise ApplicationError("Payment verification failed.")

        return self._mark_paid(
            payment, gateway_payment_id=razorpay_payment_id, raw_response={"signature_verified": True}
        )

    # ---------------------------------------------------------------- webhooks
    def handle_razorpay_webhook(self, *, payload_body: bytes, signature: str, event: dict):
        if not self.razorpay_gateway.verify_webhook_signature(payload_body=payload_body, signature=signature):
            raise ApplicationError("Invalid Razorpay webhook signature.")

        event_type = event.get("event")
        payload_entity = event.get("payload", {}).get("payment", {}).get("entity", {})
        order_id = payload_entity.get("order_id")
        if not order_id:
            return

        payment = self.payment_repository.get_by_gateway_order_id(order_id)
        if not payment:
            return

        if event_type == "payment.captured":
            self._mark_paid(payment, gateway_payment_id=payload_entity.get("id", ""), raw_response=payload_entity)
        elif event_type == "payment.failed":
            self._mark_failed(payment, reason=payload_entity.get("error_description", "Payment failed."))

    def handle_stripe_webhook(self, *, payload_body: bytes, signature: str):
        event = self.stripe_gateway.construct_webhook_event(payload_body=payload_body, signature=signature)

        if event["type"] == "payment_intent.succeeded":
            intent = event["data"]["object"]
            payment = self.payment_repository.get_by_gateway_order_id(intent["id"])
            if payment:
                self._mark_paid(payment, gateway_payment_id=intent["id"], raw_response=intent)
        elif event["type"] == "payment_intent.payment_failed":
            intent = event["data"]["object"]
            payment = self.payment_repository.get_by_gateway_order_id(intent["id"])
            if payment:
                self._mark_failed(payment, reason="Stripe payment failed.")

    # ---------------------------------------------------------------- shared confirmation logic
    @transaction.atomic
    def _mark_paid(self, payment: Payment, *, gateway_payment_id: str, raw_response: dict):
        if payment.status == PaymentStatus.PAID:
            return payment  # idempotent — webhooks can and will retry

        self.payment_repository.update(
            payment,
            status=PaymentStatus.PAID,
            gateway_payment_id=gateway_payment_id,
            raw_response=raw_response,
            paid_at=timezone.now(),
        )

        if payment.coupon:
            self.coupon_service.redeem(payment.coupon, payment.user, payment, payment.discount_amount)

        self._dispatch_domain_confirmation(payment)

        from apps.payments.tasks import send_payment_receipt_task

        send_payment_receipt_task.delay(str(payment.id))

        is_first_payment = self.payment_repository.count_completed_payments(payment.user) == 1
        if is_first_payment:
            self.referral_service.credit_referral_bonus_if_eligible(payment.user, triggering_payment=payment)

        return payment

    def _mark_failed(self, payment: Payment, *, reason: str):
        if payment.status == PaymentStatus.PAID:
            return payment
        return self.payment_repository.update(payment, status=PaymentStatus.FAILED, failure_reason=reason)

    def _dispatch_domain_confirmation(self, payment: Payment):
        """Lazy-imports the relevant app's service to avoid a circular import
        (bookings/courses call back into payments for payouts)."""

        if payment.purpose == PaymentPurpose.BOOKING:
            from apps.bookings.repositories.booking_repository import BookingRepository
            from apps.bookings.services.booking_service import BookingService

            booking = BookingRepository().get_by_id(payment.reference_id)
            if booking:
                BookingService().confirm_after_payment(booking)

        elif payment.purpose == PaymentPurpose.COURSE_ENROLLMENT:
            from apps.courses.repositories.course_repository import EnrollmentRepository
            from apps.courses.services.enrollment_service import EnrollmentService
            from apps.payments.services.payout_service import PayoutService

            enrollment = EnrollmentRepository().get_by_id(payment.reference_id)
            if enrollment:
                EnrollmentService().confirm_after_payment(enrollment)
                # Courses are pre-recorded/self-paced content rather than a live
                # 1:1 session, so the tutor is paid out immediately on purchase
                # rather than waiting for a "completion" event (see PayoutService).
                PayoutService().credit_tutor_for_course_enrollment(enrollment)

        elif payment.purpose == PaymentPurpose.SUBSCRIPTION:
            from apps.payments.services.subscription_service import SubscriptionService

            SubscriptionService().activate_after_payment(payment)

        elif payment.purpose == PaymentPurpose.WALLET_TOPUP:
            self.wallet_service.credit(
                payment.user,
                amount=payment.net_payable,
                category="wallet_topup",
                description="Wallet top-up",
                reference_type="payment",
                reference_id=payment.id,
            )
