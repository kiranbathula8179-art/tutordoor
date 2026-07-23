from decimal import ROUND_HALF_UP, Decimal

from django.conf import settings

from apps.payments.services.wallet_service import WalletService


class PayoutService:
    """
    Credits the tutor's wallet with their share of a completed, paid booking
    or course enrollment, after deducting the platform's commission.
    """

    def __init__(self, wallet_service: WalletService = None):
        self.wallet_service = wallet_service or WalletService()

    def _commission_rate(self, tutor_user) -> Decimal:
        from apps.payments.repositories.subscription_repository import UserSubscriptionRepository

        active_subscription = UserSubscriptionRepository().get_active_for_user(tutor_user)
        base_rate = Decimal(str(settings.PLATFORM_COMMISSION_PERCENT))
        if active_subscription:
            base_rate = max(base_rate - active_subscription.plan.commission_discount_percent, Decimal(0))
        return base_rate

    def credit_tutor_for_booking(self, booking):
        if booking.price <= 0 or booking.payment_status != "paid":
            return None

        commission_rate = self._commission_rate(booking.tutor.user)
        commission = (booking.price * commission_rate / Decimal(100)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        payout_amount = booking.price - commission

        return self.wallet_service.credit(
            booking.tutor.user,
            amount=payout_amount,
            category="booking_payout",
            description=f"Payout for session on {booking.start_time.strftime('%d %b %Y')} (commission: {commission_rate}%)",
            reference_type="booking",
            reference_id=booking.id,
        )

    def credit_tutor_for_course_enrollment(self, enrollment):
        course = enrollment.course
        if course.price <= 0:
            return None

        commission_rate = self._commission_rate(course.tutor.user)
        commission = (course.price * commission_rate / Decimal(100)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        payout_amount = course.price - commission

        return self.wallet_service.credit(
            course.tutor.user,
            amount=payout_amount,
            category="course_payout",
            description=f"Payout for enrollment in '{course.title}' (commission: {commission_rate}%)",
            reference_type="course_enrollment",
            reference_id=enrollment.id,
        )
