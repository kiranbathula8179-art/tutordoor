from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from apps.users import views

app_name = "users"

urlpatterns = [
    path("register/", views.RegisterView.as_view(), name="register"),
    path("login/", views.LoginView.as_view(), name="login"),
    path("logout/", views.LogoutView.as_view(), name="logout"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("google/", views.GoogleAuthView.as_view(), name="google_auth"),
    path("me/", views.MeView.as_view(), name="me"),
    path("otp/request/", views.RequestOTPView.as_view(), name="otp_request"),
    path("otp/verify-phone/", views.VerifyPhoneView.as_view(), name="verify_phone"),
    path("password/reset/", views.PasswordResetRequestView.as_view(), name="password_reset_request"),
    path("password/reset/confirm/", views.PasswordResetConfirmView.as_view(), name="password_reset_confirm"),
    path("password/change/", views.ChangePasswordView.as_view(), name="password_change"),
    path("email/verify/", views.EmailVerificationConfirmView.as_view(), name="email_verify"),
    path("email/resend/", views.ResendVerificationEmailView.as_view(), name="email_resend"),
    path("admin/users/", views.AdminUserListView.as_view(), name="admin_users"),
]
