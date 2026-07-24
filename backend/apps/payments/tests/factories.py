import datetime

import factory
from factory.django import DjangoModelFactory

from apps.payments.models import (
    Coupon,
    DiscountType,
    Payment,
    PaymentGateway,
    PaymentPurpose,
    PaymentStatus,
    SubscriptionPlan,
)
from apps.users.tests.factories import UserFactory


class CouponFactory(DjangoModelFactory):
    class Meta:
        model = Coupon
        django_get_or_create = ("code",)

    code = factory.Sequence(lambda n: f"SAVE{n}")
    discount_type = DiscountType.PERCENTAGE
    discount_value = 10
    applicable_to = "all"
    valid_from = factory.LazyFunction(lambda: datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=1))
    valid_until = factory.LazyFunction(
        lambda: datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=30)
    )
    usage_limit_per_user = 1


class SubscriptionPlanFactory(DjangoModelFactory):
    class Meta:
        model = SubscriptionPlan

    name = factory.Sequence(lambda n: f"Pro Plan {n}")
    target_role = "tutor"
    price = 999
    billing_interval = "monthly"
    commission_discount_percent = 5


class PaymentFactory(DjangoModelFactory):
    class Meta:
        model = Payment

    user = factory.SubFactory(UserFactory)
    gateway = PaymentGateway.RAZORPAY
    purpose = PaymentPurpose.WALLET_TOPUP
    reference_id = factory.Faker("uuid4")
    amount = 500
    status = PaymentStatus.PENDING
    gateway_order_id = factory.Sequence(lambda n: f"order_test_{n}")
