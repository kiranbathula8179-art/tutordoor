from decimal import ROUND_HALF_UP, Decimal

from django.utils import timezone

from apps.core.exceptions import ApplicationError
from apps.payments.models import DiscountType
from apps.payments.repositories.coupon_repository import CouponRepository


class CouponService:
    def __init__(self, coupon_repository: CouponRepository = None):
        self.coupon_repository = coupon_repository or CouponRepository()

    def validate_and_compute_discount(self, code: str, *, user, order_amount: Decimal, purpose: str):
        coupon = self.coupon_repository.get_by_code(code)
        if not coupon:
            raise ApplicationError("Invalid or expired coupon code.")

        now = timezone.now()
        if not (coupon.valid_from <= now <= coupon.valid_until):
            raise ApplicationError("This coupon is not currently valid.")

        # PaymentPurpose uses "course_enrollment" while CouponApplicability uses
        # "course" — normalize so a courses-only coupon matches course purchases.
        normalized_purpose = {"course_enrollment": "course"}.get(purpose, purpose)
        if coupon.applicable_to != "all" and coupon.applicable_to != normalized_purpose:
            raise ApplicationError(f"This coupon cannot be applied to {normalized_purpose} purchases.")

        if order_amount < coupon.min_order_amount:
            raise ApplicationError(f"This coupon requires a minimum order of {coupon.min_order_amount}.")

        if coupon.usage_limit_total is not None and coupon.times_used >= coupon.usage_limit_total:
            raise ApplicationError("This coupon has reached its usage limit.")

        user_redemptions = self.coupon_repository.count_user_redemptions(coupon, user)
        if user_redemptions >= coupon.usage_limit_per_user:
            raise ApplicationError("You have already used this coupon the maximum number of times.")

        discount = self._compute_discount(coupon, order_amount)
        return coupon, discount

    def _compute_discount(self, coupon, order_amount: Decimal) -> Decimal:
        if coupon.discount_type == DiscountType.PERCENTAGE:
            discount = (order_amount * coupon.discount_value / Decimal(100)).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
            if coupon.max_discount_amount is not None:
                discount = min(discount, coupon.max_discount_amount)
        else:
            discount = coupon.discount_value

        return min(discount, order_amount)

    def redeem(self, coupon, user, payment, discount_applied: Decimal):
        self.coupon_repository.record_redemption(coupon, user, payment, discount_applied)
        self.coupon_repository.increment_usage(coupon)
