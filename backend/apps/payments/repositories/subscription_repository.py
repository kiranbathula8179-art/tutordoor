from typing import Optional

from apps.payments.models import SubscriptionPlan, UserSubscription


class SubscriptionPlanRepository:
    model = SubscriptionPlan

    def list_active(self, target_role=None):
        qs = self.model.objects.filter(is_active=True)
        if target_role:
            qs = qs.filter(target_role=target_role)
        return qs.order_by("price")

    def get_by_id(self, plan_id) -> Optional[SubscriptionPlan]:
        return self.model.objects.filter(id=plan_id).first()


class UserSubscriptionRepository:
    model = UserSubscription

    def create(self, **fields) -> UserSubscription:
        return self.model.objects.create(**fields)

    def get_active_for_user(self, user) -> Optional[UserSubscription]:
        return (
            self.model.objects.filter(user=user, status="active")
            .select_related("plan")
            .order_by("-created_at")
            .first()
        )

    def get_by_id(self, subscription_id) -> Optional[UserSubscription]:
        return self.model.objects.select_related("plan", "user").filter(id=subscription_id).first()

    def update(self, subscription: UserSubscription, **fields) -> UserSubscription:
        for key, value in fields.items():
            setattr(subscription, key, value)
        subscription.save(update_fields=list(fields.keys()) + ["updated_at"])
        return subscription

    def list_due_for_expiry(self):
        from django.utils import timezone

        return self.model.objects.filter(status="active", current_period_end__lt=timezone.now())
