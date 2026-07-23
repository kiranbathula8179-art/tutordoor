import pytest

from apps.payments.services.wallet_service import InsufficientBalanceError, WalletService
from apps.users.tests.factories import UserFactory

pytestmark = pytest.mark.django_db


class TestWalletService:
    def test_credit_increases_balance_and_logs_transaction(self):
        user = UserFactory()
        service = WalletService()

        txn = service.credit(user, amount=500, category="wallet_topup", description="Top-up")

        assert txn.balance_after == 500
        assert service.get_balance(user) == 500

    def test_debit_decreases_balance(self):
        user = UserFactory()
        service = WalletService()
        service.credit(user, amount=1000, category="wallet_topup")

        txn = service.debit(user, amount=300, category="withdrawal")

        assert txn.balance_after == 700
        assert service.get_balance(user) == 700

    def test_debit_more_than_balance_raises(self):
        user = UserFactory()
        service = WalletService()
        service.credit(user, amount=100, category="wallet_topup")

        with pytest.raises(InsufficientBalanceError):
            service.debit(user, amount=500, category="withdrawal")

    def test_frozen_wallet_cannot_be_debited(self):
        user = UserFactory()
        service = WalletService()
        wallet = service.get_or_create_wallet(user)
        service.credit(user, amount=1000, category="wallet_topup")
        wallet.is_frozen = True
        wallet.save(update_fields=["is_frozen"])

        from apps.core.exceptions import ApplicationError

        with pytest.raises(ApplicationError):
            service.debit(user, amount=100, category="withdrawal")

    def test_transaction_history_filters_by_category(self):
        user = UserFactory()
        service = WalletService()
        service.credit(user, amount=100, category="wallet_topup")
        service.credit(user, amount=50, category="referral_bonus")

        referral_only = service.get_transaction_history(user, category="referral_bonus")
        assert referral_only.count() == 1
