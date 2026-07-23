from decimal import Decimal
from typing import Optional

from django.db.models import Sum

from apps.payments.models import Payment, Refund


class PaymentRepository:
    model = Payment

    def create(self, **fields) -> Payment:
        return self.model.objects.create(**fields)

    def get_by_id(self, payment_id) -> Optional[Payment]:
        return self.model.objects.filter(id=payment_id).first()

    def get_by_gateway_order_id(self, gateway_order_id: str) -> Optional[Payment]:
        return self.model.objects.filter(gateway_order_id=gateway_order_id).first()

    def update(self, payment: Payment, **fields) -> Payment:
        for key, value in fields.items():
            setattr(payment, key, value)
        payment.save(update_fields=list(fields.keys()) + ["updated_at"])
        return payment

    def list_for_user(self, user, status=None, purpose=None):
        qs = self.model.objects.filter(user=user)
        if status:
            qs = qs.filter(status=status)
        if purpose:
            qs = qs.filter(purpose=purpose)
        return qs.order_by("-created_at")

    def has_completed_payment(self, user) -> bool:
        return self.model.objects.filter(user=user, status="paid").exists()

    def count_completed_payments(self, user) -> int:
        return self.model.objects.filter(user=user, status="paid").count()


class RefundRepository:
    model = Refund

    def create(self, **fields) -> Refund:
        return self.model.objects.create(**fields)

    def update(self, refund: Refund, **fields) -> Refund:
        for key, value in fields.items():
            setattr(refund, key, value)
        refund.save(update_fields=list(fields.keys()) + ["updated_at"])
        return refund

    def list_for_payment(self, payment):
        return self.model.objects.filter(payment=payment).order_by("-created_at")

    def total_refunded(self, payment) -> Decimal:
        total = self.model.objects.filter(payment=payment, status="processed").aggregate(total=Sum("amount"))["total"]
        return total or Decimal("0")
