from typing import Optional

from apps.payments.models import Wallet, WalletTransaction


class WalletRepository:
    model = Wallet

    def get_by_user(self, user) -> Optional[Wallet]:
        return self.model.objects.filter(user=user).first()

    def get_or_create(self, user) -> Wallet:
        wallet, _ = self.model.objects.get_or_create(user=user)
        return wallet

    def lock_for_update(self, wallet_id):
        """Row-locks the wallet for the duration of the enclosing transaction, preventing concurrent balance races."""
        return self.model.objects.select_for_update().get(id=wallet_id)

    def update_balance(self, wallet: Wallet, new_balance) -> Wallet:
        wallet.balance = new_balance
        wallet.save(update_fields=["balance", "updated_at"])
        return wallet

    def record_transaction(self, wallet: Wallet, **fields) -> WalletTransaction:
        return WalletTransaction.objects.create(wallet=wallet, **fields)

    def list_transactions(self, wallet: Wallet, category=None):
        qs = WalletTransaction.objects.filter(wallet=wallet)
        if category:
            qs = qs.filter(category=category)
        return qs.order_by("-created_at")
