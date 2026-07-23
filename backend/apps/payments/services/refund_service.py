from django.utils import timezone

from apps.core.exceptions import ApplicationError
from apps.payments.gateways.razorpay_gateway import RazorpayGateway
from apps.payments.gateways.stripe_gateway import StripeGateway
from apps.payments.models import PaymentGateway, PaymentStatus, RefundStatus
from apps.payments.repositories.payment_repository import PaymentRepository, RefundRepository


class RefundService:
    def __init__(
        self,
        refund_repository: RefundRepository = None,
        payment_repository: PaymentRepository = None,
    ):
        self.refund_repository = refund_repository or RefundRepository()
        self.payment_repository = payment_repository or PaymentRepository()
        self.razorpay_gateway = RazorpayGateway()
        self.stripe_gateway = StripeGateway()

    def initiate_refund(self, payment, *, initiated_by, amount, reason: str = ""):
        if payment.status not in (PaymentStatus.PAID, PaymentStatus.PARTIALLY_REFUNDED):
            raise ApplicationError(f"A payment with status '{payment.status}' cannot be refunded.")

        already_refunded = self.refund_repository.total_refunded(payment)
        if already_refunded + amount > payment.net_payable:
            raise ApplicationError("Refund amount exceeds the remaining refundable balance.")

        refund = self.refund_repository.create(payment=payment, amount=amount, reason=reason, initiated_by=initiated_by)

        try:
            if payment.gateway == PaymentGateway.RAZORPAY:
                result = self.razorpay_gateway.create_refund(gateway_payment_id=payment.gateway_payment_id, amount=amount)
                gateway_refund_id = result.get("id", "")
            elif payment.gateway == PaymentGateway.STRIPE:
                result = self.stripe_gateway.create_refund(gateway_payment_id=payment.gateway_payment_id, amount=amount)
                gateway_refund_id = result.get("id", "")
            else:
                gateway_refund_id = ""  # wallet-funded payments have nothing to refund at a gateway

            self.refund_repository.update(
                refund, status=RefundStatus.PROCESSED, gateway_refund_id=gateway_refund_id, processed_at=timezone.now()
            )
        except Exception as exc:  # noqa: BLE001
            self.refund_repository.update(refund, status=RefundStatus.FAILED)
            raise ApplicationError("The refund could not be processed by the payment gateway.") from exc

        new_total_refunded = already_refunded + amount
        new_status = (
            PaymentStatus.REFUNDED if new_total_refunded >= payment.net_payable else PaymentStatus.PARTIALLY_REFUNDED
        )
        self.payment_repository.update(payment, status=new_status)

        return refund
