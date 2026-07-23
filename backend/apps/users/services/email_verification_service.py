import secrets
from datetime import timedelta

from django.conf import settings
from django.utils import timezone

from apps.core.exceptions import ApplicationError
from apps.users.repositories.otp_repository import EmailVerificationRepository
from apps.users.repositories.user_repository import UserRepository
from apps.users.tasks import send_verification_email_task


class EmailVerificationService:
    def __init__(
        self,
        verification_repository: EmailVerificationRepository = None,
        user_repository: UserRepository = None,
    ):
        self.verification_repository = verification_repository or EmailVerificationRepository()
        self.user_repository = user_repository or UserRepository()

    def send_verification_email(self, user):
        self.verification_repository.invalidate_active(user)
        token = secrets.token_urlsafe(48)
        expires_at = timezone.now() + timedelta(hours=settings.EMAIL_VERIFICATION_TOKEN_EXPIRY_HOURS)

        self.verification_repository.create(user=user, token=token, expires_at=expires_at)

        verification_link = f"{settings.FRONTEND_URL}/verify-email?token={token}"
        send_verification_email_task.delay(
            user_id=str(user.id), email=user.email, verification_link=verification_link
        )

    def confirm(self, token: str):
        record = self.verification_repository.get_by_token(token)

        if record is None:
            raise ApplicationError("Invalid or already-used verification link.")
        if record.is_expired:
            raise ApplicationError("This verification link has expired. Please request a new one.")

        self.verification_repository.mark_used(record)
        self.user_repository.update(record.user, is_email_verified=True)
        return record.user
