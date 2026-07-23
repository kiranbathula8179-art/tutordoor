from rest_framework import serializers

from apps.payments.models import (
    Coupon,
    Payment,
    PaymentGateway,
    PaymentPurpose,
    Refund,
    SubscriptionPlan,
    UserSubscription,
    Wallet,
    WalletTransaction,
)


class WalletSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wallet
        fields = ("id", "balance", "currency", "is_frozen", "updated_at")
        read_only_fields = fields


class WalletTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WalletTransaction
        fields = (
            "id", "transaction_type", "category", "amount", "balance_after",
            "description", "reference_type", "reference_id", "created_at",
        )
        read_only_fields = fields


class WalletTopupSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=1)
    gateway = serializers.ChoiceField(choices=[PaymentGateway.RAZORPAY, PaymentGateway.STRIPE])
    currency = serializers.CharField(max_length=3, default="INR")


class PaymentSerializer(serializers.ModelSerializer):
    net_payable = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Payment
        fields = (
            "id", "gateway", "purpose", "reference_id", "amount", "discount_amount", "net_payable",
            "currency", "status", "gateway_order_id", "paid_at", "failure_reason", "created_at",
        )
        read_only_fields = fields


class AdminPaymentSerializer(PaymentSerializer):
    """Payment row for the admin ledger — adds the paying user's identity."""

    user_email = serializers.EmailField(source="user.email", read_only=True)
    user_name = serializers.CharField(source="user.get_full_name", read_only=True)

    class Meta(PaymentSerializer.Meta):
        fields = PaymentSerializer.Meta.fields + ("user_email", "user_name")
        read_only_fields = fields


class InitiatePaymentSerializer(serializers.Serializer):
    purpose = serializers.ChoiceField(choices=PaymentPurpose.choices)
    reference_id = serializers.UUIDField()
    gateway = serializers.ChoiceField(choices=[PaymentGateway.RAZORPAY, PaymentGateway.STRIPE])
    coupon_code = serializers.CharField(required=False, allow_blank=True, default="")


class ConfirmRazorpayPaymentSerializer(serializers.Serializer):
    payment_id = serializers.UUIDField(help_text="TutorDoor's internal Payment ID (not the gateway's).")
    razorpay_payment_id = serializers.CharField()
    razorpay_signature = serializers.CharField()


class RefundSerializer(serializers.ModelSerializer):
    class Meta:
        model = Refund
        fields = ("id", "payment", "amount", "reason", "status", "gateway_refund_id", "processed_at", "created_at")
        read_only_fields = fields


class InitiateRefundSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0.01)
    reason = serializers.CharField(required=False, allow_blank=True, default="")


class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = (
            "id", "code", "description", "discount_type", "discount_value", "max_discount_amount",
            "min_order_amount", "applicable_to", "valid_from", "valid_until",
            "usage_limit_total", "usage_limit_per_user", "times_used", "is_active",
        )
        read_only_fields = ("id", "times_used")


class ValidateCouponSerializer(serializers.Serializer):
    code = serializers.CharField()
    order_amount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0)
    purpose = serializers.ChoiceField(choices=["all", "booking", "course", "subscription"])


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = (
            "id", "name", "target_role", "description", "price", "currency", "billing_interval",
            "features", "max_bookings_per_month", "commission_discount_percent",
        )
        read_only_fields = fields


class UserSubscriptionSerializer(serializers.ModelSerializer):
    plan = SubscriptionPlanSerializer(read_only=True)

    class Meta:
        model = UserSubscription
        fields = (
            "id", "plan", "status", "started_at", "current_period_end",
            "cancel_at_period_end", "cancelled_at",
        )
        read_only_fields = fields


class SubscribeSerializer(serializers.Serializer):
    plan_id = serializers.UUIDField()
    gateway = serializers.ChoiceField(choices=[PaymentGateway.RAZORPAY, PaymentGateway.STRIPE])
    coupon_code = serializers.CharField(required=False, allow_blank=True, default="")


class CancelSubscriptionSerializer(serializers.Serializer):
    at_period_end = serializers.BooleanField(default=True)
