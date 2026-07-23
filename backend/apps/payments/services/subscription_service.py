from datetime import timedelta
from decimal import Decimal

from django.utils import timezone

from apps.core.exceptions import ApplicationError, ConflictError
from apps.payments.models import PaymentPurpose, SubscriptionStatus
from apps.payments.repositories.payment_repository import PaymentRepository
from apps.payments.repositories.subscription_repository import SubscriptionPlanRepository, UserSubscriptionRepository

_INTERVAL_DAYS = {"monthly": 30, "quarterly": 90, "yearly": 365}


class SubscriptionService:
    def __init__(
        self,
        plan_repository: SubscriptionPlanRepository = None,
        subscription_repository: UserSubscriptionRepository = None,
        payment_repository: PaymentRepository = None,
    ):
        self.plan_repository = plan_repository or SubscriptionPlanRepository()
        self.subscription_repository = subscription_repository or UserSubscriptionRepository()
        self.payment_repository = payment_repository or PaymentRepository()

    def list_plans(self, target_role=None):
        return self.plan_repository.list_active(target_role=target_role)

    def subscribe(self, user, plan, *, gateway: str, coupon_code: str = None):
        if user.role != plan.target_role:
            raise ApplicationError(f"This plan is only available to {plan.target_role} accounts.")

        existing = self.subscription_repository.get_active_for_user(user)
        if existing:
            raise ConflictError("You already have an active subscription. Cancel it before subscribing to a new plan.")

        from apps.payments.services.payment_service import PaymentService

        period_days = _INTERVAL_DAYS[plan.billing_interval]
        subscription = self.subscription_repository.create(
            user=user,
            plan=plan,
            status=SubscriptionStatus.PENDING_PAYMENT,
            started_at=timezone.now(),
            current_period_end=timezone.now() + timedelta(days=period_days),
        )

        payment, gateway_response = PaymentService().initiate_payment(
            user,
            purpose=PaymentPurpose.SUBSCRIPTION,
            reference_id=subscription.id,
            amount=Decimal(plan.price),
            gateway=gateway,
            currency=plan.currency,
            coupon_code=coupon_code,
        )
        return subscription, payment, gateway_response

    def activate_after_payment(self, payment):
        subscription = self.subscription_repository.get_by_id(payment.reference_id)
        if not subscription:
            return None
        return self.subscription_repository.update(subscription, status=SubscriptionStatus.ACTIVE)

    def cancel(self, subscription, *, at_period_end: bool = True):
        if at_period_end:
            return self.subscription_repository.update(subscription, cancel_at_period_end=True)
        return self.subscription_repository.update(
            subscription, status=SubscriptionStatus.CANCELLED, cancelled_at=timezone.now()
        )

    def expire_due_subscriptions(self):
        due = self.subscription_repository.list_due_for_expiry()
        count = 0
        for subscription in due:
            new_status = SubscriptionStatus.CANCELLED if subscription.cancel_at_period_end else SubscriptionStatus.EXPIRED
            self.subscription_repository.update(subscription, status=new_status)
            count += 1
        return count
