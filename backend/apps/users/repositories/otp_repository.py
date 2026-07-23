from django.utils import timezone

from apps.users.models import EmailVerificationToken, OTP


class OTPRepository:
    model = OTP

    def create(self, **fields) -> OTP:
        return self.model.objects.create(**fields)

    def get_latest_active(self, user, purpose: str):
        return (
            self.model.objects.filter(user=user, purpose=purpose, is_used=False)
            .order_by("-created_at")
            .first()
        )

    def invalidate_active(self, user, purpose: str) -> None:
        self.model.objects.filter(user=user, purpose=purpose, is_used=False).update(is_used=True)

    def mark_used(self, otp: OTP) -> None:
        otp.is_used = True
        otp.save(update_fields=["is_used", "updated_at"])

    def increment_attempt(self, otp: OTP) -> None:
        otp.attempt_count = otp.attempt_count + 1
        otp.save(update_fields=["attempt_count", "updated_at"])

    def count_recent_for_destination(self, destination: str, since):
        return self.model.objects.filter(destination=destination, created_at__gte=since).count()


class EmailVerificationRepository:
    model = EmailVerificationToken

    def create(self, **fields) -> EmailVerificationToken:
        return self.model.objects.create(**fields)

    def get_by_token(self, token: str):
        return self.model.objects.filter(token=token, is_used=False).first()

    def invalidate_active(self, user) -> None:
        self.model.objects.filter(user=user, is_used=False).update(is_used=True)

    def mark_used(self, instance: EmailVerificationToken) -> None:
        instance.is_used = True
        instance.save(update_fields=["is_used", "updated_at"])

    def purge_expired(self):
        return self.model.objects.filter(expires_at__lt=timezone.now()).delete()
