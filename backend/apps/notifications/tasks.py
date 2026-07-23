import logging

from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger("tutordoor")


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def dispatch_channel_delivery_task(self, delivery_log_id: str):
    """Routes a single NotificationDeliveryLog to the right channel-specific sender."""
    from apps.notifications.models import NotificationDeliveryLog
    from apps.notifications.repositories.notification_repository import DeliveryLogRepository

    log = NotificationDeliveryLog.objects.select_related("notification__recipient").filter(id=delivery_log_id).first()
    if not log:
        return

    repository = DeliveryLogRepository()
    notification = log.notification
    recipient = notification.recipient

    try:
        if log.channel == "email":
            _send_email(recipient, notification)
        elif log.channel == "sms":
            _send_sms(recipient, notification)
        elif log.channel == "whatsapp":
            _send_whatsapp(recipient, notification)
        elif log.channel == "push":
            _send_push(recipient, notification)

        from django.utils import timezone

        repository.update(log, status="sent", sent_at=timezone.now())
    except Exception as exc:  # noqa: BLE001
        logger.exception("Notification delivery failed (channel=%s, log=%s)", log.channel, delivery_log_id)
        repository.update(log, status="failed", error_message=str(exc)[:500])
        raise self.retry(exc=exc)


def _send_email(recipient, notification):
    send_mail(
        subject=notification.title,
        message=notification.body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[recipient.email],
        fail_silently=False,
    )


def _send_sms(recipient, notification):
    if not recipient.phone_number:
        return
    from twilio.rest import Client

    if not settings.TWILIO_ACCOUNT_SID:
        logger.info("Twilio not configured; SMS to %s: %s", recipient.phone_number, notification.body)
        return

    client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
    client.messages.create(body=notification.body, from_=settings.TWILIO_FROM_NUMBER, to=str(recipient.phone_number))


def _send_whatsapp(recipient, notification):
    if not recipient.phone_number:
        return
    from twilio.rest import Client

    if not settings.TWILIO_ACCOUNT_SID:
        logger.info("Twilio not configured; WhatsApp to %s: %s", recipient.phone_number, notification.body)
        return

    client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
    client.messages.create(
        body=notification.body,
        from_=f"whatsapp:{settings.TWILIO_WHATSAPP_FROM}",
        to=f"whatsapp:{recipient.phone_number}",
    )


def _send_push(recipient, notification):
    from apps.notifications.services.push_service import PushService

    PushService().send_to_user(recipient, title=notification.title, body=notification.body, data=notification.data)
