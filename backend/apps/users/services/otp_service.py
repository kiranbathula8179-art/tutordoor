import hashlib
import random
from datetime import timedelta

from django.conf import settings
from django.utils import timezone

from apps.core.exceptions import ApplicationError, RateLimitedError
from apps.users.repositories.otp_repository import OTPRepository
from apps.users.tasks import send_otp_email_task, send_otp_sms_task


class OTPService:
    """
    Generates, sends, and verifies one-time passcodes for phone verification,
    OTP-based login, and password reset. Codes are never stored in plaintext.
    """

    MAX_OTPS_PER_HOUR_PER_DESTINATION = 5

    def __init__(self, otp_repository: OTPRepository = None):
        self.otp_repository = otp_repository or OTPRepository()

    @staticmethod
    def _hash_code(code: str) -> str:
        return hashlib.sha256(code.encode()).hexdigest()

    def _generate_code(self) -> str:
        length = settings.OTP_LENGTH
        return "".join(random.choices("0123456789", k=length))

    def request_otp(self, user, destination: str, purpose: str, channel: str = "sms"):
        window_start = timezone.now() - timedelta(hours=1)
        recent_count = self.otp_repository.count_recent_for_destination(destination, window_start)
        if recent_count >= self.MAX_OTPS_PER_HOUR_PER_DESTINATION:
            raise RateLimitedError("Too many OTP requests for this destination. Please try again later.")

        self.otp_repository.invalidate_active(user, purpose)

        code = self._generate_code()
        expires_at = timezone.now() + timedelta(minutes=settings.OTP_EXPIRY_MINUTES)

        otp = self.otp_repository.create(
            user=user,
            destination=destination,
            purpose=purpose,
            code_hash=self._hash_code(code),
            expires_at=expires_at,
        )

        if channel == "email":
            send_otp_email_task.delay(user_id=str(user.id), email=destination, code=code, purpose=purpose)
        else:
            send_otp_sms_task.delay(phone_number=destination, code=code, purpose=purpose)

        return otp

    def verify_otp(self, user, purpose: str, submitted_code: str) -> bool:
        otp = self.otp_repository.get_latest_active(user, purpose)

        if otp is None:
            raise ApplicationError("No active OTP found. Please request a new code.")
        if otp.is_expired:
            raise ApplicationError("This OTP has expired. Please request a new one.")
        if otp.is_exhausted:
            raise ApplicationError("Maximum verification attempts exceeded. Please request a new OTP.")

        self.otp_repository.increment_attempt(otp)

        if otp.code_hash != self._hash_code(submitted_code):
            raise ApplicationError("Invalid OTP code.")

        self.otp_repository.mark_used(otp)
        return True
