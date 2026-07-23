import logging

from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger("tutordoor")


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def notify_institute_verification_result_task(self, user_id: str, approved: bool, reason: str = ""):
    from apps.users.models import User

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        logger.warning("notify_institute_verification_result_task: user %s not found", user_id)
        return

    if approved:
        subject = "Your institute is now verified on TutorDoor"
        message = (
            f"Hi {user.first_name}, your institute profile has been verified. "
            "You can now invite tutors and enroll students."
        )
    else:
        subject = "Update on your institute verification"
        message = f"Hi {user.first_name}, your institute verification was not approved.\n\nReason: {reason}"

    try:
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=False)
    except Exception as exc:  # noqa: BLE001
        logger.exception("Failed to send institute verification result email to %s", user.email)
        raise self.retry(exc=exc)
