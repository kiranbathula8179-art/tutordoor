from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken

from apps.core.exceptions import ApplicationError, ConflictError
from apps.users.models import LoginAuditLog, OTPPurpose, UserRole
from apps.users.repositories.user_repository import UserRepository
from apps.users.services.email_verification_service import EmailVerificationService
from apps.users.services.otp_service import OTPService


class AuthService:
    """
    Orchestrates the full authentication lifecycle. Controllers (views) call
    this service exclusively; they never touch repositories or models directly.
    """

    def __init__(
        self,
        user_repository: UserRepository = None,
        otp_service: OTPService = None,
        email_verification_service: EmailVerificationService = None,
    ):
        self.user_repository = user_repository or UserRepository()
        self.otp_service = otp_service or OTPService()
        self.email_verification_service = email_verification_service or EmailVerificationService()

    # ---------------------------------------------------------------- issue tokens
    @staticmethod
    def issue_tokens(user) -> dict:
        refresh = RefreshToken.for_user(user)
        refresh["role"] = user.role
        refresh["email"] = user.email
        return {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }

    # ---------------------------------------------------------------- register
    def register(self, *, email, password, first_name, last_name, role, phone_number=None, referral_code=None):
        if role == UserRole.ADMIN:
            raise ApplicationError("Cannot self-register as a platform admin.")

        if self.user_repository.email_exists(email):
            raise ConflictError("An account with this email already exists.")
        if phone_number and self.user_repository.phone_exists(phone_number):
            raise ConflictError("An account with this phone number already exists.")

        referred_by = None
        if referral_code:
            referred_by = self.user_repository.get_by_referral_code(referral_code)
            if not referred_by:
                raise ApplicationError("Invalid referral code.")

        user = self.user_repository.create(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            role=role,
            phone_number=phone_number,
            referred_by=referred_by,
            signup_source="email",
        )

        self.email_verification_service.send_verification_email(user)

        if phone_number:
            self.otp_service.request_otp(
                user, destination=str(phone_number), purpose=OTPPurpose.PHONE_VERIFICATION, channel="sms"
            )

        return user

    # ---------------------------------------------------------------- login
    def login(self, *, email, password, ip_address=None, user_agent=""):
        user = self.user_repository.get_by_email(email)

        if user is None or not user.check_password(password):
            LoginAuditLog.objects.create(
                user=user, event="login_failed", ip_address=ip_address, user_agent=user_agent,
                metadata={"email_attempted": email},
            )
            raise ApplicationError("Invalid email or password.")

        if not user.is_active:
            raise ApplicationError("This account has been deactivated. Contact support.")

        user.last_login_ip = ip_address
        user.last_active_at = timezone.now()
        user.save(update_fields=["last_login_ip", "last_active_at"])

        LoginAuditLog.objects.create(
            user=user, event="login_success", ip_address=ip_address, user_agent=user_agent
        )

        tokens = self.issue_tokens(user)
        return user, tokens

    # ---------------------------------------------------------------- phone verification
    def verify_phone(self, user, code: str):
        self.otp_service.verify_otp(user, purpose=OTPPurpose.PHONE_VERIFICATION, submitted_code=code)
        self.user_repository.update(user, is_phone_verified=True)
        return user

    # ---------------------------------------------------------------- password reset
    def request_password_reset(self, email: str):
        user = self.user_repository.get_by_email(email)
        if user is None:
            # Do not leak account existence.
            return
        destination = str(user.phone_number) if user.phone_number else user.email
        channel = "sms" if user.phone_number else "email"
        self.otp_service.request_otp(
            user, destination=destination, purpose=OTPPurpose.PASSWORD_RESET, channel=channel
        )

    def confirm_password_reset(self, *, email: str, code: str, new_password: str):
        user = self.user_repository.get_by_email(email)
        if user is None:
            raise ApplicationError("Invalid request.")

        self.otp_service.verify_otp(user, purpose=OTPPurpose.PASSWORD_RESET, submitted_code=code)
        self.user_repository.set_password(user, new_password)

        LoginAuditLog.objects.create(user=user, event="password_reset")
        return user

    def change_password(self, user, *, old_password: str, new_password: str):
        if not user.check_password(old_password):
            raise ApplicationError("Current password is incorrect.")
        self.user_repository.set_password(user, new_password)
        LoginAuditLog.objects.create(user=user, event="password_changed")
        return user
