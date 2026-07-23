from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from apps.core.exceptions import ApplicationError
from apps.core.pagination import StandardResultsSetPagination
from apps.core.permissions import IsPlatformAdmin
from apps.core.utils import get_client_ip
from apps.users.models import OTPPurpose, User
from apps.users.serializers import (
    AdminUserSerializer,
    ChangePasswordSerializer,
    EmailVerificationConfirmSerializer,
    GoogleAuthSerializer,
    LoginSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    RegisterSerializer,
    RequestOTPSerializer,
    UserSerializer,
    VerifyPhoneSerializer,
)
from apps.users.services.auth_service import AuthService
from apps.users.services.email_verification_service import EmailVerificationService
from apps.users.services.google_auth_service import GoogleAuthService
from apps.users.services.otp_service import OTPService


class RegisterView(APIView):
    """Creates a new student / tutor / parent / institute-admin account."""

    permission_classes = [AllowAny]
    throttle_scope = "register"

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = AuthService().register(**serializer.validated_data)
        tokens = AuthService.issue_tokens(user)

        return Response(
            {
                "success": True,
                "message": "Account created. Please check your email to verify your address.",
                "user": UserSerializer(user).data,
                "tokens": tokens,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = "login"

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user, tokens = AuthService().login(
            **serializer.validated_data,
            ip_address=get_client_ip(request),
            user_agent=request.META.get("HTTP_USER_AGENT", ""),
        )

        return Response(
            {
                "success": True,
                "message": "Login successful.",
                "user": UserSerializer(user).data,
                "tokens": tokens,
            }
        )


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            raise ApplicationError("Refresh token is required to log out.")
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError as exc:
            raise ApplicationError("Invalid or already-expired refresh token.") from exc

        return Response({"success": True, "message": "Logged out successfully."})


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"success": True, "user": UserSerializer(request.user).data})

    def patch(self, request):
        allowed_fields = {"first_name", "last_name", "avatar"}
        updates = {k: v for k, v in request.data.items() if k in allowed_fields}
        for key, value in updates.items():
            setattr(request.user, key, value)
        request.user.save(update_fields=list(updates.keys()) + ["updated_at"])
        return Response({"success": True, "user": UserSerializer(request.user).data})


class GoogleAuthView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = GoogleAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user, created = GoogleAuthService().authenticate(
            id_token_str=serializer.validated_data["id_token"],
            requested_role=serializer.validated_data["role"],
        )
        tokens = AuthService.issue_tokens(user)

        user.last_login_ip = get_client_ip(request)
        user.last_active_at = timezone.now()
        user.save(update_fields=["last_login_ip", "last_active_at"])

        return Response(
            {
                "success": True,
                "message": "Account created via Google." if created else "Login successful.",
                "user": UserSerializer(user).data,
                "tokens": tokens,
                "is_new_user": created,
            }
        )


class RequestOTPView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_scope = "otp_request"

    def post(self, request):
        serializer = RequestOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        purpose = serializer.validated_data["purpose"]

        if purpose == OTPPurpose.PHONE_VERIFICATION and not request.user.phone_number:
            raise ApplicationError("Add a phone number to your profile before requesting verification.")

        destination = str(request.user.phone_number)
        OTPService().request_otp(request.user, destination=destination, purpose=purpose, channel="sms")

        return Response({"success": True, "message": f"OTP sent to {destination}."})


class VerifyPhoneView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = VerifyPhoneSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        AuthService().verify_phone(request.user, serializer.validated_data["code"])
        return Response({"success": True, "message": "Phone number verified successfully."})


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = "password_reset"

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        AuthService().request_password_reset(serializer.validated_data["email"])
        return Response(
            {"success": True, "message": "If an account exists for that email, a reset code has been sent."}
        )


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = "password_reset"

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        AuthService().confirm_password_reset(**serializer.validated_data)
        return Response({"success": True, "message": "Password reset successfully. You may now log in."})


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        AuthService().change_password(request.user, **serializer.validated_data)
        return Response({"success": True, "message": "Password changed successfully."})


class EmailVerificationConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = EmailVerificationConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = EmailVerificationService().confirm(serializer.validated_data["token"])
        return Response(
            {"success": True, "message": "Email verified successfully.", "user": UserSerializer(user).data}
        )


class ResendVerificationEmailView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_scope = "register"

    def post(self, request):
        if request.user.is_email_verified:
            raise ApplicationError("This account is already verified.")
        EmailVerificationService().send_verification_email(request.user)
        return Response({"success": True, "message": "Verification email sent."})


class AdminUserListView(APIView):
    """Paginated user directory for platform admins, with role/search/status filters."""

    permission_classes = [IsPlatformAdmin]
    pagination_class = StandardResultsSetPagination

    def get(self, request):
        from django.db.models import Q

        queryset = User.objects.order_by("-created_at")

        role = request.query_params.get("role")
        if role:
            queryset = queryset.filter(role=role)

        is_active = request.query_params.get("is_active")
        if is_active in ("true", "false"):
            queryset = queryset.filter(is_active=(is_active == "true"))

        query = request.query_params.get("q")
        if query:
            queryset = queryset.filter(
                Q(email__icontains=query) | Q(first_name__icontains=query) | Q(last_name__icontains=query)
            )

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        return paginator.get_paginated_response(AdminUserSerializer(page, many=True).data)
