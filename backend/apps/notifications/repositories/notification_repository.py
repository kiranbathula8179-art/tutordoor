from typing import Optional

from apps.notifications.models import DeviceToken, Notification, NotificationDeliveryLog, NotificationPreference


class NotificationRepository:
    model = Notification

    def create(self, **fields) -> Notification:
        return self.model.objects.create(**fields)

    def get_by_id(self, notification_id) -> Optional[Notification]:
        return self.model.objects.filter(id=notification_id).first()

    def list_for_user(self, user, unread_only: bool = False):
        qs = self.model.objects.filter(recipient=user)
        if unread_only:
            qs = qs.filter(is_read=False)
        return qs

    def mark_read(self, notification: Notification):
        from django.utils import timezone

        notification.is_read = True
        notification.read_at = timezone.now()
        notification.save(update_fields=["is_read", "read_at", "updated_at"])
        return notification

    def mark_all_read(self, user) -> int:
        from django.utils import timezone

        return self.model.objects.filter(recipient=user, is_read=False).update(is_read=True, read_at=timezone.now())

    def unread_count(self, user) -> int:
        return self.model.objects.filter(recipient=user, is_read=False).count()


class DeliveryLogRepository:
    model = NotificationDeliveryLog

    def create(self, **fields) -> NotificationDeliveryLog:
        return self.model.objects.create(**fields)

    def update(self, log: NotificationDeliveryLog, **fields) -> NotificationDeliveryLog:
        for key, value in fields.items():
            setattr(log, key, value)
        log.save(update_fields=list(fields.keys()) + ["updated_at"])
        return log


class NotificationPreferenceRepository:
    model = NotificationPreference

    def get_or_create(self, user) -> NotificationPreference:
        preference, _ = self.model.objects.get_or_create(user=user)
        return preference

    def update(self, preference: NotificationPreference, **fields) -> NotificationPreference:
        for key, value in fields.items():
            setattr(preference, key, value)
        preference.save(update_fields=list(fields.keys()) + ["updated_at"])
        return preference


class DeviceTokenRepository:
    model = DeviceToken

    def register(self, user, *, token: str, platform: str) -> DeviceToken:
        existing = self.model.objects.filter(token=token).first()
        if existing:
            existing.user = user
            existing.platform = platform
            existing.is_active = True
            existing.save(update_fields=["user", "platform", "is_active", "updated_at"])
            return existing
        return self.model.objects.create(user=user, token=token, platform=platform)

    def deactivate(self, token: str):
        self.model.objects.filter(token=token).update(is_active=False)

    def list_active_for_user(self, user):
        return self.model.objects.filter(user=user, is_active=True)
