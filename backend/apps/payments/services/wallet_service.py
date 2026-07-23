from decimal import Decimal

from django.db import transaction

from apps.core.exceptions import ApplicationError
from apps.payments.models import WalletTransactionType
from apps.payments.repositories.wallet_repository import WalletRepository


class InsufficientBalanceError(ApplicationError):
    default_detail = "Insufficient wallet balance for this operation."
    default_code = "insufficient_balance"


class WalletService:
    def __init__(self, wallet_repository: WalletRepository = None):
        self.wallet_repository = wallet_repository or WalletRepository()

    def get_or_create_wallet(self, user):
        return self.wallet_repository.get_or_create(user)

    @transaction.atomic
    def credit(self, user, *, amount: Decimal, category: str, description: str = "", reference_type: str = "", reference_id=None):
        wallet = self.wallet_repository.get_or_create(user)
        wallet = self.wallet_repository.lock_for_update(wallet.id)

        new_balance = wallet.balance + amount
        self.wallet_repository.update_balance(wallet, new_balance)
        return self.wallet_repository.record_transaction(
            wallet,
            transaction_type=WalletTransactionType.CREDIT,
            category=category,
            amount=amount,
            balance_after=new_balance,
            description=description,
            reference_type=reference_type,
            reference_id=reference_id,
        )

    @transaction.atomic
    def debit(self, user, *, amount: Decimal, category: str, description: str = "", reference_type: str = "", reference_id=None):
        wallet = self.wallet_repository.get_or_create(user)
        wallet = self.wallet_repository.lock_for_update(wallet.id)

        if wallet.is_frozen:
            raise ApplicationError("This wallet is frozen and cannot be debited.")
        if wallet.balance < amount:
            raise InsufficientBalanceError()

        new_balance = wallet.balance - amount
        self.wallet_repository.update_balance(wallet, new_balance)
        return self.wallet_repository.record_transaction(
            wallet,
            transaction_type=WalletTransactionType.DEBIT,
            category=category,
            amount=amount,
            balance_after=new_balance,
            description=description,
            reference_type=reference_type,
            reference_id=reference_id,
        )

    def get_balance(self, user) -> Decimal:
        wallet = self.wallet_repository.get_or_create(user)
        return wallet.balance

    def get_transaction_history(self, user, category=None):
        wallet = self.wallet_repository.get_or_create(user)
        return self.wallet_repository.list_transactions(wallet, category=category)
