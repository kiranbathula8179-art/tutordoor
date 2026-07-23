from django.core.validators import MinValueValidator
from django.db import models

from apps.core.models import BaseModel
from apps.users.models import User


class Wallet(BaseModel):
    """One wallet per user. Balance changes only ever happen through WalletTransaction + service methods, never direct writes."""

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="wallet")
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    currency = models.CharField(max_length=3, default="INR")
    is_frozen = models.BooleanField(default=False, help_text="Frozen wallets cannot be debited or withdrawn from.")

    class Meta:
        db_table = "wallets"

    def __str__(self):
        return f"Wallet<{self.user.email}: {self.balance} {self.currency}>"


class WalletTransactionType(models.TextChoices):
    CREDIT = "credit", "Credit"
    DEBIT = "debit", "Debit"


class WalletTransactionCategory(models.TextChoices):
    BOOKING_PAYOUT = "booking_payout", "Booking Payout"
    COURSE_PAYOUT = "course_payout", "Course Payout"
    REFUND = "refund", "Refund"
    REFERRAL_BONUS = "referral_bonus", "Referral Bonus"
    COUPON_CREDIT = "coupon_credit", "Coupon Credit"
    WALLET_TOPUP = "wallet_topup", "Wallet Top-up"
    WITHDRAWAL = "withdrawal", "Withdrawal"
    MANUAL_ADJUSTMENT = "manual_adjustment", "Manual Adjustment"
    SUBSCRIPTION_PAYMENT = "subscription_payment", "Subscription Payment"


class WalletTransaction(BaseModel):
    """Immutable ledger entry. balance_after is a point-in-time snapshot for audit — never recomputed."""

    wallet = models.ForeignKey(Wallet, on_delete=models.CASCADE, related_name="transactions")
    transaction_type = models.CharField(max_length=10, choices=WalletTransactionType.choices)
    category = models.CharField(max_length=30, choices=WalletTransactionCategory.choices)
    amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0.01)])
    balance_after = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.CharField(max_length=255, blank=True)

    reference_type = models.CharField(
        max_length=50, blank=True, help_text="e.g. 'booking', 'course_enrollment', 'payment' — lightweight polymorphic link."
    )
    reference_id = models.UUIDField(null=True, blank=True)

    class Meta:
        db_table = "wallet_transactions"
        indexes = [
            models.Index(fields=["wallet", "created_at"]),
            models.Index(fields=["reference_type", "reference_id"]),
        ]

    def __str__(self):
        return f"{self.transaction_type} {self.amount} ({self.category})"


class PaymentGateway(models.TextChoices):
    RAZORPAY = "razorpay", "Razorpay"
    STRIPE = "stripe", "Stripe"
    WALLET = "wallet", "Wallet Balance"


class PaymentPurpose(models.TextChoices):
    BOOKING = "booking", "Booking"
    COURSE_ENROLLMENT = "course_enrollment", "Course Enrollment"
    SUBSCRIPTION = "subscription", "Subscription"
    WALLET_TOPUP = "wallet_topup", "Wallet Top-up"


class PaymentStatus(models.TextChoices):
    CREATED = "created", "Created"
    PENDING = "pending", "Pending"
    PAID = "paid", "Paid"
    FAILED = "failed", "Failed"
    REFUNDED = "refunded", "Refunded"
    PARTIALLY_REFUNDED = "partially_refunded", "Partially Refunded"


class Payment(BaseModel):
    """
    A single gateway payment transaction. `purpose` + `reference_id` link it
    back to the domain object it's paying for (a Booking, CourseEnrollment,
    or UserSubscription) without a hard cross-app foreign key, keeping the
    payments app decoupled from booking/course internals.
    """

    user = models.ForeignKey(User, on_delete=models.PROTECT, related_name="payments")
    gateway = models.CharField(max_length=20, choices=PaymentGateway.choices)
    purpose = models.CharField(max_length=30, choices=PaymentPurpose.choices)
    reference_id = models.UUIDField(help_text="ID of the Booking / CourseEnrollment / UserSubscription being paid for.")

    amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    currency = models.CharField(max_length=3, default="INR")
    status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.CREATED, db_index=True)

    gateway_order_id = models.CharField(max_length=255, blank=True, db_index=True)
    gateway_payment_id = models.CharField(max_length=255, blank=True, db_index=True)
    gateway_signature = models.CharField(max_length=512, blank=True)
    raw_response = models.JSONField(default=dict, blank=True)

    coupon = models.ForeignKey("Coupon", null=True, blank=True, on_delete=models.SET_NULL, related_name="payments")

    paid_at = models.DateTimeField(null=True, blank=True)
    failure_reason = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = "payments"
        indexes = [
            models.Index(fields=["user", "status"]),
            models.Index(fields=["purpose", "reference_id"]),
        ]

    def __str__(self):
        return f"Payment<{self.gateway}:{self.amount}{self.currency} - {self.status}>"

    @property
    def net_payable(self):
        return self.amount - self.discount_amount


class RefundStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    PROCESSED = "processed", "Processed"
    FAILED = "failed", "Failed"


class Refund(BaseModel):
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name="refunds")
    amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0.01)])
    reason = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=20, choices=RefundStatus.choices, default=RefundStatus.PENDING)
    gateway_refund_id = models.CharField(max_length=255, blank=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    initiated_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")

    class Meta:
        db_table = "refunds"


class DiscountType(models.TextChoices):
    PERCENTAGE = "percentage", "Percentage"
    FLAT = "flat", "Flat Amount"


class CouponApplicability(models.TextChoices):
    ALL = "all", "All Purchases"
    BOOKING = "booking", "Bookings Only"
    COURSE = "course", "Courses Only"
    SUBSCRIPTION = "subscription", "Subscriptions Only"


class Coupon(BaseModel):
    code = models.CharField(max_length=30, unique=True, db_index=True)
    description = models.CharField(max_length=255, blank=True)
    discount_type = models.CharField(max_length=15, choices=DiscountType.choices)
    discount_value = models.DecimalField(max_digits=8, decimal_places=2, validators=[MinValueValidator(0)])
    max_discount_amount = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    min_order_amount = models.DecimalField(max_digits=8, decimal_places=2, default=0)

    applicable_to = models.CharField(max_length=20, choices=CouponApplicability.choices, default=CouponApplicability.ALL)
    valid_from = models.DateTimeField()
    valid_until = models.DateTimeField()
    usage_limit_total = models.PositiveIntegerField(null=True, blank=True, help_text="Blank = unlimited.")
    usage_limit_per_user = models.PositiveSmallIntegerField(default=1)
    times_used = models.PositiveIntegerField(default=0)

    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="coupons_created")

    class Meta:
        db_table = "coupons"
        indexes = [models.Index(fields=["code", "is_active"])]

    def __str__(self):
        return self.code


class CouponRedemption(BaseModel):
    coupon = models.ForeignKey(Coupon, on_delete=models.CASCADE, related_name="redemptions")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="coupon_redemptions")
    payment = models.ForeignKey(Payment, on_delete=models.SET_NULL, null=True, blank=True, related_name="+")
    discount_applied = models.DecimalField(max_digits=8, decimal_places=2)

    class Meta:
        db_table = "coupon_redemptions"
        indexes = [models.Index(fields=["coupon", "user"])]


class BillingInterval(models.TextChoices):
    MONTHLY = "monthly", "Monthly"
    QUARTERLY = "quarterly", "Quarterly"
    YEARLY = "yearly", "Yearly"


class SubscriptionTargetRole(models.TextChoices):
    STUDENT = "student", "Student"
    TUTOR = "tutor", "Tutor"
    INSTITUTE_ADMIN = "institute_admin", "Institute"


class SubscriptionPlan(BaseModel):
    name = models.CharField(max_length=100)
    target_role = models.CharField(max_length=20, choices=SubscriptionTargetRole.choices)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    currency = models.CharField(max_length=3, default="INR")
    billing_interval = models.CharField(max_length=15, choices=BillingInterval.choices, default=BillingInterval.MONTHLY)
    features = models.JSONField(default=list, blank=True)
    max_bookings_per_month = models.PositiveIntegerField(null=True, blank=True, help_text="Blank = unlimited.")
    commission_discount_percent = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "subscription_plans"

    def __str__(self):
        return f"{self.name} ({self.get_billing_interval_display()})"


class SubscriptionStatus(models.TextChoices):
    PENDING_PAYMENT = "pending_payment", "Pending Payment"
    ACTIVE = "active", "Active"
    CANCELLED = "cancelled", "Cancelled"
    EXPIRED = "expired", "Expired"
    PAST_DUE = "past_due", "Past Due"


class UserSubscription(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="subscriptions")
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.PROTECT, related_name="subscribers")
    status = models.CharField(max_length=20, choices=SubscriptionStatus.choices, default=SubscriptionStatus.PENDING_PAYMENT)

    started_at = models.DateTimeField()
    current_period_end = models.DateTimeField()
    cancel_at_period_end = models.BooleanField(default=False)
    cancelled_at = models.DateTimeField(null=True, blank=True)

    gateway_subscription_id = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = "user_subscriptions"
        indexes = [models.Index(fields=["user", "status"])]

    @property
    def is_active(self):
        return self.status == SubscriptionStatus.ACTIVE


class ReferralRewardStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    CREDITED = "credited", "Credited"


class ReferralReward(BaseModel):
    """Credited to the referrer's wallet once the referred user completes their first paid transaction."""

    referrer = models.ForeignKey(User, on_delete=models.CASCADE, related_name="referral_rewards_earned")
    referred_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="referral_reward_source")
    amount = models.DecimalField(max_digits=8, decimal_places=2)
    status = models.CharField(max_length=20, choices=ReferralRewardStatus.choices, default=ReferralRewardStatus.PENDING)
    triggering_payment = models.ForeignKey(Payment, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    credited_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "referral_rewards"
        constraints = [
            models.UniqueConstraint(fields=["referrer", "referred_user"], name="unique_referral_reward")
        ]
