from rest_framework import status
from rest_framework.parsers import JSONParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.exceptions import ApplicationError, PermissionDeniedError, ResourceNotFoundError
from apps.core.pagination import StandardResultsSetPagination
from apps.core.permissions import IsPlatformAdmin
from apps.payments.models import Coupon, Payment, PaymentPurpose
from apps.payments.repositories.payment_repository import PaymentRepository
from apps.payments.repositories.subscription_repository import SubscriptionPlanRepository, UserSubscriptionRepository
from apps.payments.serializers import (
    AdminPaymentSerializer,
    CancelSubscriptionSerializer,
    ConfirmRazorpayPaymentSerializer,
    CouponSerializer,
    InitiatePaymentSerializer,
    InitiateRefundSerializer,
    PaymentSerializer,
    RefundSerializer,
    SubscribeSerializer,
    SubscriptionPlanSerializer,
    UserSubscriptionSerializer,
    ValidateCouponSerializer,
    WalletSerializer,
    WalletTopupSerializer,
    WalletTransactionSerializer,
)
from apps.payments.services.coupon_service import CouponService
from apps.payments.services.payment_service import PaymentService
from apps.payments.services.refund_service import RefundService
from apps.payments.services.subscription_service import SubscriptionService
from apps.payments.services.wallet_service import WalletService


class MyWalletView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        wallet = WalletService().get_or_create_wallet(request.user)
        return Response({"success": True, "wallet": WalletSerializer(wallet).data})


class MyWalletTransactionsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        transactions = WalletService().get_transaction_history(
            request.user, category=request.query_params.get("category")
        )
        return Response({"success": True, "results": WalletTransactionSerializer(transactions, many=True).data})


class WalletTopupView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = WalletTopupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        payment, gateway_response = PaymentService().initiate_wallet_topup(request.user, **serializer.validated_data)
        return Response(
            {"success": True, "payment": PaymentSerializer(payment).data, "gateway": gateway_response},
            status=status.HTTP_201_CREATED,
        )


def _resolve_reference_amount(user, purpose: str, reference_id):
    """Looks up the authoritative price for what's being paid for, and confirms the user owns it."""
    if purpose == PaymentPurpose.BOOKING:
        from apps.bookings.repositories.booking_repository import BookingRepository

        booking = BookingRepository().get_by_id(reference_id)
        if not booking:
            raise ResourceNotFoundError("Booking not found.")
        if booking.student.user_id != user.id and booking.booked_by_id != user.id:
            raise PermissionDeniedError("This booking does not belong to you.")
        if booking.status != "pending_payment":
            raise ApplicationError(f"This booking is not awaiting payment (status: {booking.status}).")
        return booking.price, booking.currency

    if purpose == PaymentPurpose.COURSE_ENROLLMENT:
        from apps.courses.repositories.course_repository import EnrollmentRepository

        enrollment = EnrollmentRepository().get_by_id(reference_id)
        if not enrollment:
            raise ResourceNotFoundError("Enrollment not found.")
        if enrollment.student.user_id != user.id:
            raise PermissionDeniedError("This enrollment does not belong to you.")
        if enrollment.status != "pending_payment":
            raise ApplicationError(f"This enrollment is not awaiting payment (status: {enrollment.status}).")
        return enrollment.course.price, enrollment.course.currency

    if purpose == PaymentPurpose.SUBSCRIPTION:
        subscription = UserSubscriptionRepository().get_by_id(reference_id)
        if not subscription:
            raise ResourceNotFoundError("Subscription not found.")
        if subscription.user_id != user.id:
            raise PermissionDeniedError("This subscription does not belong to you.")
        if subscription.status != "pending_payment":
            raise ApplicationError(f"This subscription is not awaiting payment (status: {subscription.status}).")
        return subscription.plan.price, subscription.plan.currency

    raise ApplicationError(f"Cannot initiate a generic payment for purpose '{purpose}'.")


class InitiatePaymentView(APIView):
    """
    Generic entry point for paying an existing pending_payment domain object
    (a Booking, CourseEnrollment, or UserSubscription). The amount is always
    looked up server-side from that object — never trusted from the client.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = InitiatePaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        amount, currency = _resolve_reference_amount(request.user, data["purpose"], data["reference_id"])

        payment, gateway_response = PaymentService().initiate_payment(
            request.user,
            purpose=data["purpose"],
            reference_id=data["reference_id"],
            amount=amount,
            gateway=data["gateway"],
            currency=currency,
            coupon_code=data["coupon_code"] or None,
        )
        return Response(
            {"success": True, "payment": PaymentSerializer(payment).data, "gateway": gateway_response},
            status=status.HTTP_201_CREATED,
        )


class ConfirmRazorpayPaymentView(APIView):
    """Called by the frontend after Razorpay Checkout succeeds client-side, to verify + finalize."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ConfirmRazorpayPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        payment = PaymentRepository().get_by_id(data["payment_id"])
        if not payment or payment.user_id != request.user.id:
            raise ResourceNotFoundError("Payment not found.")

        confirmed = PaymentService().confirm_razorpay_payment(
            payment, razorpay_payment_id=data["razorpay_payment_id"], razorpay_signature=data["razorpay_signature"]
        )
        return Response({"success": True, "payment": PaymentSerializer(confirmed).data})


class RazorpayWebhookView(APIView):
    """Server-to-server webhook — no user auth; authenticity is verified via HMAC signature instead."""

    permission_classes = [AllowAny]
    authentication_classes = []
    parser_classes = [JSONParser]

    def post(self, request):
        signature = request.headers.get("X-Razorpay-Signature", "")
        event = request.data
        PaymentService().handle_razorpay_webhook(payload_body=request.body, signature=signature, event=event)
        return Response({"success": True})


class StripeWebhookView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    parser_classes = [JSONParser]

    def post(self, request):
        signature = request.headers.get("Stripe-Signature", "")
        PaymentService().handle_stripe_webhook(payload_body=request.body, signature=signature)
        return Response({"success": True})


class MyPaymentsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        payments = PaymentRepository().list_for_user(
            request.user, status=request.query_params.get("status"), purpose=request.query_params.get("purpose")
        )
        return Response({"success": True, "results": PaymentSerializer(payments, many=True).data})


class InitiateRefundView(APIView):
    """Platform-admin action: refund a completed payment (partial or full)."""

    permission_classes = [IsAuthenticated]

    def post(self, request, payment_id):
        if not request.user.is_superuser:
            raise PermissionDeniedError("Only platform admins can initiate refunds.")

        payment = PaymentRepository().get_by_id(payment_id)
        if not payment:
            raise ResourceNotFoundError("Payment not found.")

        serializer = InitiateRefundSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        refund = RefundService().initiate_refund(payment, initiated_by=request.user, **serializer.validated_data)
        return Response({"success": True, "refund": RefundSerializer(refund).data}, status=status.HTTP_201_CREATED)


class ValidateCouponView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ValidateCouponSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        coupon, discount = CouponService().validate_and_compute_discount(
            data["code"], user=request.user, order_amount=data["order_amount"], purpose=data["purpose"]
        )
        return Response(
            {"success": True, "coupon": CouponSerializer(coupon).data, "discount_amount": discount}
        )


class SubscriptionPlanListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        plans = SubscriptionPlanRepository().list_active(target_role=request.query_params.get("target_role"))
        return Response({"success": True, "results": SubscriptionPlanSerializer(plans, many=True).data})


class SubscribeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = SubscribeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        plan = SubscriptionPlanRepository().get_by_id(data["plan_id"])
        if not plan:
            raise ResourceNotFoundError("Plan not found.")

        subscription, payment, gateway_response = SubscriptionService().subscribe(
            request.user, plan, gateway=data["gateway"], coupon_code=data["coupon_code"] or None
        )
        return Response(
            {
                "success": True,
                "subscription": UserSubscriptionSerializer(subscription).data,
                "payment": PaymentSerializer(payment).data,
                "gateway": gateway_response,
            },
            status=status.HTTP_201_CREATED,
        )


class MySubscriptionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        subscription = UserSubscriptionRepository().get_active_for_user(request.user)
        if not subscription:
            raise ResourceNotFoundError("You do not have an active subscription.")
        return Response({"success": True, "subscription": UserSubscriptionSerializer(subscription).data})


class CancelSubscriptionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, subscription_id):
        subscription = UserSubscriptionRepository().get_by_id(subscription_id)
        if not subscription or subscription.user_id != request.user.id:
            raise ResourceNotFoundError("Subscription not found.")

        serializer = CancelSubscriptionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        updated = SubscriptionService().cancel(subscription, **serializer.validated_data)
        return Response({"success": True, "subscription": UserSubscriptionSerializer(updated).data})


class AdminPaymentListView(APIView):
    """The full payment ledger for platform admins, filterable and searchable."""

    permission_classes = [IsPlatformAdmin]
    pagination_class = StandardResultsSetPagination

    def get(self, request):
        from django.db.models import Q

        queryset = Payment.objects.select_related("user").order_by("-created_at")

        status_filter = request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        purpose = request.query_params.get("purpose")
        if purpose:
            queryset = queryset.filter(purpose=purpose)

        query = request.query_params.get("q")
        if query:
            queryset = queryset.filter(
                Q(user__email__icontains=query)
                | Q(user__first_name__icontains=query)
                | Q(user__last_name__icontains=query)
                | Q(gateway_order_id__icontains=query)
            )

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        return paginator.get_paginated_response(AdminPaymentSerializer(page, many=True).data)


class AdminCouponListCreateView(APIView):
    """List every coupon and mint new ones."""

    permission_classes = [IsPlatformAdmin]

    def get(self, request):
        coupons = Coupon.objects.order_by("-created_at")
        return Response({"success": True, "results": CouponSerializer(coupons, many=True).data})

    def post(self, request):
        serializer = CouponSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        coupon = serializer.save(created_by=request.user)
        return Response(
            {"success": True, "message": "Coupon created.", "coupon": CouponSerializer(coupon).data},
            status=status.HTTP_201_CREATED,
        )


class AdminCouponUpdateView(APIView):
    """Partial update — primarily toggling a coupon on/off or fixing its window."""

    permission_classes = [IsPlatformAdmin]

    def patch(self, request, coupon_id):
        coupon = Coupon.objects.filter(id=coupon_id).first()
        if not coupon:
            raise ResourceNotFoundError("Coupon not found.")
        serializer = CouponSerializer(coupon, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        coupon = serializer.save()
        return Response({"success": True, "coupon": CouponSerializer(coupon).data})
