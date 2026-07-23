import logging

from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger("tutordoor")


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def send_parent_link_invite_task(self, student_email: str, parent_name: str, confirmation_link: str):
    try:
        send_mail(
            subject=f"{parent_name} wants to link as your parent/guardian on TutorDoor",
            message=(
                f"{parent_name} has requested to be linked as your parent/guardian on TutorDoor, "
                f"which lets them manage bookings, payments, and view your learning progress.\n\n"
                f"Confirm this request: {confirmation_link}\n\n"
                "If you didn't expect this, you can safely ignore this email."
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[student_email],
            fail_silently=False,
        )
    except Exception as exc:  # noqa: BLE001
        logger.exception("Failed to send parent link invite to %s", student_email)
        raise self.retry(exc=exc)
