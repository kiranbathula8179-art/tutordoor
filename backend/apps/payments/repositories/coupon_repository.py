from typing import Optional

from apps.payments.models import Coupon, CouponRedemption


class CouponRepository:
    model = Coupon

    def get_by_code(self, code: str) -> Optional[Coupon]:
        return self.model.objects.filter(code__iexact=code, is_active=True).first()

    def create(self, **fields) -> Coupon:
        return self.model.objects.create(**fields)

    def increment_usage(self, coupon: Coupon):
        coupon.times_used = coupon.times_used + 1
        coupon.save(update_fields=["times_used", "updated_at"])

    def count_user_redemptions(self, coupon: Coupon, user) -> int:
        return CouponRedemption.objects.filter(coupon=coupon, user=user).count()

    def record_redemption(self, coupon: Coupon, user, payment, discount_applied) -> CouponRedemption:
        return CouponRedemption.objects.create(
            coupon=coupon, user=user, payment=payment, discount_applied=discount_applied
        )

    def list_active(self):
        return self.model.objects.filter(is_active=True).order_by("-created_at")
