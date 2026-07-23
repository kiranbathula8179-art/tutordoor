from django.contrib import admin

from apps.payments.models import (
    Coupon,
    CouponRedemption,
    Payment,
    ReferralReward,
    Refund,
    SubscriptionPlan,
    UserSubscription,
    Wallet,
    WalletTransaction,
)


class WalletTransactionInline(admin.TabularInline):
    model = WalletTransaction
    extra = 0
    readonly_fields = ("transaction_type", "category", "amount", "balance_after", "description", "created_at")
    can_delete = False


@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ("user", "balance", "currency", "is_frozen", "updated_at")
    search_fields = ("user__email",)
    inlines = [WalletTransactionInline]


class RefundInline(admin.TabularInline):
    model = Refund
    extra = 0


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "gateway", "purpose", "amount", "discount_amount", "status", "created_at")
    list_filter = ("gateway", "purpose", "status")
    search_fields = ("user__email", "gateway_order_id", "gateway_payment_id")
    readonly_fields = ("raw_response", "created_at", "updated_at", "paid_at")
    inlines = [RefundInline]


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ("code", "discount_type", "discount_value", "applicable_to", "is_active", "times_used")
    list_filter = ("discount_type", "applicable_to", "is_active")
    search_fields = ("code",)


@admin.register(CouponRedemption)
class CouponRedemptionAdmin(admin.ModelAdmin):
    list_display = ("coupon", "user", "discount_applied", "created_at")


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ("name", "target_role", "price", "billing_interval", "is_active")
    list_filter = ("target_role", "billing_interval", "is_active")


@admin.register(UserSubscription)
class UserSubscriptionAdmin(admin.ModelAdmin):
    list_display = ("user", "plan", "status", "current_period_end", "cancel_at_period_end")
    list_filter = ("status",)


@admin.register(ReferralReward)
class ReferralRewardAdmin(admin.ModelAdmin):
    list_display = ("referrer", "referred_user", "amount", "status", "credited_at")
    list_filter = ("status",)
