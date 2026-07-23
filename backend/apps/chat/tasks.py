import logging

from celery import shared_task

logger = logging.getLogger("tutordoor")


@shared_task
def notify_new_message_task(recipient_id: str, sender_id: str, conversation_id: str, preview: str):
    from apps.notifications.models import NotificationChannel, NotificationType
    from apps.notifications.services.notification_service import NotificationService
    from apps.users.models import User

    try:
        recipient = User.objects.get(id=recipient_id)
        sender = User.objects.get(id=sender_id)
    except User.DoesNotExist:
        return

    NotificationService().notify(
        recipient,
        notification_type=NotificationType.CHAT_MESSAGE,
        title=f"New message from {sender.get_full_name()}",
        body=preview or "Sent an attachment.",
        data={"conversation_id": conversation_id},
        action_url=f"/chat/{conversation_id}",
        channels=[NotificationChannel.PUSH],
    )
