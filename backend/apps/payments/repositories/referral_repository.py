from typing import Optional

from apps.payments.models import ReferralReward


class ReferralRewardRepository:
    model = ReferralReward

    def get(self, referrer, referred_user) -> Optional[ReferralReward]:
        return self.model.objects.filter(referrer=referrer, referred_user=referred_user).first()

    def create(self, **fields) -> ReferralReward:
        return self.model.objects.create(**fields)

    def update(self, reward: ReferralReward, **fields) -> ReferralReward:
        for key, value in fields.items():
            setattr(reward, key, value)
        reward.save(update_fields=list(fields.keys()) + ["updated_at"])
        return reward

    def list_for_referrer(self, referrer):
        return self.model.objects.filter(referrer=referrer).select_related("referred_user").order_by("-created_at")
