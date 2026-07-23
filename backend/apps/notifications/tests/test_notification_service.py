from unittest.mock import patch

import pytest

from apps.notifications.models import NotificationChannel, NotificationType
from apps.notifications.repositories.notification_repository import NotificationPreferenceRepository
from apps.notifications.services.notification_service import NotificationService
from apps.users.tests.factories import UserFactory

pytestmark = pytest.mark.django_db


class TestNotificationService:
    @patch("apps.notifications.tasks.dispatch_channel_delivery_task.delay")
    def test_notify_creates_in_app_record_and_dispatches_channels(self, mock_delay):
        user = UserFactory()

        notification = NotificationService().notify(
            user, notification_type=NotificationType.BOOKING_UPDATE,
            title="Booking confirmed", body="Your session is confirmed.",
            channels=[NotificationChannel.EMAIL, NotificationChannel.PUSH],
        )

        assert notification.title == "Booking confirmed"
        assert mock_delay.call_count == 2

    @patch("apps.notifications.tasks.dispatch_channel_delivery_task.delay")
    def test_muted_notification_type_skips_dispatch(self, mock_delay):
        user = UserFactory()
        preference = NotificationPreferenceRepository().get_or_create(user)
        preference.muted_types = [NotificationType.PROMOTIONAL]
        preference.save(update_fields=["muted_types"])

        NotificationService().notify(
            user, notification_type=NotificationType.PROMOTIONAL,
            title="Sale!", body="50% off subscriptions.", channels=[NotificationChannel.EMAIL],
        )

        mock_delay.assert_not_called()

    @patch("apps.notifications.tasks.dispatch_channel_delivery_task.delay")
    def test_disabled_channel_is_skipped_not_dispatched(self, mock_delay):
        user = UserFactory()
        repository = NotificationPreferenceRepository()
        preference = repository.get_or_create(user)
        repository.update(preference, sms_enabled=False)

        NotificationService().notify(
            user, notification_type=NotificationType.SYSTEM,
            title="Heads up", body="System maintenance tonight.", channels=[NotificationChannel.SMS],
        )

        mock_delay.assert_not_called()

    def test_mark_all_read(self):
        user = UserFactory()
        service = NotificationService()
        for _ in range(3):
            service.notify(user, notification_type=NotificationType.SYSTEM, title="X", body="Y", channels=[])

        assert service.unread_count(user) == 3
        marked = service.mark_all_read(user)
        assert marked == 3
        assert service.unread_count(user) == 0
