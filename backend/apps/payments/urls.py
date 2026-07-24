from django.urls import path

from apps.payments import views

app_name = "payments"

urlpatterns = [
    path("admin/payments/", views.AdminPaymentListView.as_view(), name="admin_payments"),
    path("admin/coupons/", views.AdminCouponListCreateView.as_view(), name="admin_coupons"),
    path("admin/coupons/<uuid:coupon_id>/", views.AdminCouponUpdateView.as_view(), name="admin_coupon_update"),
    path("wallet/", views.MyWalletView.as_view(), name="my_wallet"),
    path("wallet/transactions/", views.MyWalletTransactionsView.as_view(), name="wallet_transactions"),
    path("wallet/topup/", views.WalletTopupView.as_view(), name="wallet_topup"),
    path("initiate/", views.InitiatePaymentView.as_view(), name="initiate"),
    path("confirm/razorpay/", views.ConfirmRazorpayPaymentView.as_view(), name="confirm_razorpay"),
    path("webhooks/razorpay/", views.RazorpayWebhookView.as_view(), name="webhook_razorpay"),
    path("webhooks/stripe/", views.StripeWebhookView.as_view(), name="webhook_stripe"),
    path("me/", views.MyPaymentsView.as_view(), name="my_payments"),
    path("<uuid:payment_id>/refund/", views.InitiateRefundView.as_view(), name="initiate_refund"),
    path("coupons/validate/", views.ValidateCouponView.as_view(), name="validate_coupon"),
    path("subscriptions/plans/", views.SubscriptionPlanListView.as_view(), name="subscription_plans"),
    path("subscriptions/subscribe/", views.SubscribeView.as_view(), name="subscribe"),
    path("subscriptions/me/", views.MySubscriptionView.as_view(), name="my_subscription"),
    path(
        "subscriptions/<uuid:subscription_id>/cancel/",
        views.CancelSubscriptionView.as_view(),
        name="cancel_subscription",
    ),
]
