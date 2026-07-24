from apps.notifications.models import NotificationChannel
from apps.notifications.repositories.notification_repository import (
    DeliveryLogRepository,
    NotificationPreferenceRepository,
    NotificationRepository,
)


class NotificationService:
    """
    Central fan-out point: creates the in-app Notification record, then
    dispatches to whichever channels the user has enabled (respecting muted
    types), via Celery tasks so a slow SMS/push provider never blocks the
    request that triggered it.
    """

    def __init__(
        self,
        notification_repository: NotificationRepository = None,
        preference_repository: NotificationPreferenceRepository = None,
        delivery_log_repository: DeliveryLogRepository = None,
    ):
        self.notification_repository = notification_repository or NotificationRepository()
        self.preference_repository = preference_repository or NotificationPreferenceRepository()
        self.delivery_log_repository = delivery_log_repository or DeliveryLogRepository()

    def notify(
        self,
        recipient,
        *,
        notification_type: str,
        title: str,
        body: str,
        data: dict = None,
        action_url: str = "",
        channels: list[str] = None,
    ):
        from apps.notifications.tasks import dispatch_channel_delivery_task

        notification = self.notification_repository.create(
            recipient=recipient,
            notification_type=notification_type,
            title=title,
            body=body,
            data=data or {},
            action_url=action_url,
        )

        preference = self.preference_repository.get_or_create(recipient)
        if notification_type in preference.muted_types:
            return notification

        target_channels = channels or [NotificationChannel.EMAIL, NotificationChannel.PUSH]
        for channel in target_channels:
            if channel == NotificationChannel.IN_APP:
                continue  # already created above
            if not preference.is_channel_enabled(channel):
                self.delivery_log_repository.create(notification=notification, channel=channel, status="skipped")
                continue

            log = self.delivery_log_repository.create(notification=notification, channel=channel, status="pending")
            dispatch_channel_delivery_task.delay(str(log.id))

        return notification

    def mark_read(self, notification):
        return self.notification_repository.mark_read(notification)

    def mark_all_read(self, user) -> int:
        return self.notification_repository.mark_all_read(user)

    def list_for_user(self, user, unread_only: bool = False):
        return self.notification_repository.list_for_user(user, unread_only=unread_only)

    def unread_count(self, user) -> int:
        return self.notification_repository.unread_count(user)
