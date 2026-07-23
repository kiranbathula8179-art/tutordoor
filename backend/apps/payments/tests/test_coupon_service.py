import datetime

import pytest
from django.utils import timezone

from apps.core.exceptions import ApplicationError
from apps.payments.models import DiscountType
from apps.payments.services.coupon_service import CouponService
from apps.payments.tests.factories import CouponFactory
from apps.users.tests.factories import UserFactory

pytestmark = pytest.mark.django_db


class TestCouponService:
    def test_percentage_discount_is_computed_correctly(self):
        coupon = CouponFactory(discount_type=DiscountType.PERCENTAGE, discount_value=20)
        user = UserFactory()

        _, discount = CouponService().validate_and_compute_discount(
            coupon.code, user=user, order_amount=1000, purpose="booking"
        )
        assert discount == 200

    def test_percentage_discount_respects_max_cap(self):
        coupon = CouponFactory(discount_type=DiscountType.PERCENTAGE, discount_value=50, max_discount_amount=100)
        user = UserFactory()

        _, discount = CouponService().validate_and_compute_discount(
            coupon.code, user=user, order_amount=1000, purpose="booking"
        )
        assert discount == 100

    def test_flat_discount_cannot_exceed_order_amount(self):
        coupon = CouponFactory(discount_type=DiscountType.FLAT, discount_value=500)
        user = UserFactory()

        _, discount = CouponService().validate_and_compute_discount(
            coupon.code, user=user, order_amount=200, purpose="booking"
        )
        assert discount == 200

    def test_expired_coupon_is_rejected(self):
        coupon = CouponFactory(
            valid_from=timezone.now() - datetime.timedelta(days=10),
            valid_until=timezone.now() - datetime.timedelta(days=1),
        )
        user = UserFactory()

        with pytest.raises(ApplicationError):
            CouponService().validate_and_compute_discount(coupon.code, user=user, order_amount=500, purpose="booking")

    def test_wrong_purpose_is_rejected(self):
        coupon = CouponFactory(applicable_to="subscription")
        user = UserFactory()

        with pytest.raises(ApplicationError):
            CouponService().validate_and_compute_discount(coupon.code, user=user, order_amount=500, purpose="booking")

    def test_below_minimum_order_amount_is_rejected(self):
        coupon = CouponFactory(min_order_amount=1000)
        user = UserFactory()

        with pytest.raises(ApplicationError):
            CouponService().validate_and_compute_discount(coupon.code, user=user, order_amount=500, purpose="booking")

    def test_redemption_limit_per_user_is_enforced(self):
        coupon = CouponFactory(usage_limit_per_user=1)
        user = UserFactory()
        service = CouponService()

        service.redeem(coupon, user, None, discount_applied=50)

        with pytest.raises(ApplicationError):
            service.validate_and_compute_discount(coupon.code, user=user, order_amount=500, purpose="booking")
