from django.conf import settings
from django.utils import timezone

from apps.payments.repositories.referral_repository import ReferralRewardRepository
from apps.payments.services.wallet_service import WalletService


class ReferralService:
    def __init__(
        self,
        referral_repository: ReferralRewardRepository = None,
        wallet_service: WalletService = None,
    ):
        self.referral_repository = referral_repository or ReferralRewardRepository()
        self.wallet_service = wallet_service or WalletService()

    def credit_referral_bonus_if_eligible(self, referred_user, *, triggering_payment=None):
        """
        Called after a user's first successful payment. If they were referred
        by someone (users.User.referred_by), and haven't already triggered a
        reward, credits the referrer's wallet with the platform's referral bonus.
        """
        referrer = referred_user.referred_by
        if not referrer:
            return None

        existing = self.referral_repository.get(referrer, referred_user)
        if existing and existing.status == "credited":
            return existing

        amount = settings.REFERRAL_BONUS_AMOUNT
        reward = existing or self.referral_repository.create(
            referrer=referrer, referred_user=referred_user, amount=amount
        )

        self.wallet_service.credit(
            referrer,
            amount=amount,
            category="referral_bonus",
            description=f"Referral bonus for inviting {referred_user.get_full_name()}",
            reference_type="referral_reward",
            reference_id=reward.id,
        )
        self.referral_repository.update(
            reward, status="credited", credited_at=timezone.now(), triggering_payment=triggering_payment
        )
        return reward
