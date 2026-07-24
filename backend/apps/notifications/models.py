from django.db import models

from apps.core.models import BaseModel
from apps.users.models import User


class NotificationType(models.TextChoices):
    BOOKING_UPDATE = "booking_update", "Booking Update"
    PAYMENT_UPDATE = "payment_update", "Payment Update"
    COURSE_UPDATE = "course_update", "Course Update"
    CHAT_MESSAGE = "chat_message", "Chat Message"
    VERIFICATION_UPDATE = "verification_update", "Verification Update"
    REFERRAL = "referral", "Referral"
    SYSTEM = "system", "System"
    PROMOTIONAL = "promotional", "Promotional"


class Notification(BaseModel):
    """The in-app notification record (bell icon / notification center)."""

    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")
    notification_type = models.CharField(max_length=30, choices=NotificationType.choices, db_index=True)
    title = models.CharField(max_length=200)
    body = models.CharField(max_length=500)
    data = models.JSONField(default=dict, blank=True, help_text="Extra structured payload, e.g. related object IDs.")
    action_url = models.CharField(max_length=255, blank=True, help_text="Frontend route to deep-link to on tap.")

    is_read = models.BooleanField(default=False, db_index=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "notifications"
        indexes = [models.Index(fields=["recipient", "is_read"])]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.notification_type} -> {self.recipient.email}"


class NotificationChannel(models.TextChoices):
    EMAIL = "email", "Email"
    SMS = "sms", "SMS"
    WHATSAPP = "whatsapp", "WhatsApp"
    PUSH = "push", "Push"
    IN_APP = "in_app", "In-App"


class DeliveryStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    SENT = "sent", "Sent"
    FAILED = "failed", "Failed"
    SKIPPED = "skipped", "Skipped (muted/disabled)"


class NotificationDeliveryLog(BaseModel):
    """Tracks one channel-delivery attempt for a Notification.

    A single notification may fan out to several channels.
    """

    notification = models.ForeignKey(Notification, on_delete=models.CASCADE, related_name="delivery_logs")
    channel = models.CharField(max_length=15, choices=NotificationChannel.choices)
    status = models.CharField(max_length=15, choices=DeliveryStatus.choices, default=DeliveryStatus.PENDING)
    provider_message_id = models.CharField(max_length=255, blank=True)
    error_message = models.CharField(max_length=500, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "notification_delivery_logs"
        indexes = [models.Index(fields=["notification", "channel"])]


class NotificationPreference(BaseModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="notification_preference")

    email_enabled = models.BooleanField(default=True)
    sms_enabled = models.BooleanField(default=True)
    whatsapp_enabled = models.BooleanField(default=False)
    push_enabled = models.BooleanField(default=True)

    muted_types = models.JSONField(
        default=list, blank=True, help_text="List of NotificationType values the user has opted out of."
    )

    class Meta:
        db_table = "notification_preferences"

    def is_channel_enabled(self, channel: str) -> bool:
        return {
            NotificationChannel.EMAIL: self.email_enabled,
            NotificationChannel.SMS: self.sms_enabled,
            NotificationChannel.WHATSAPP: self.whatsapp_enabled,
            NotificationChannel.PUSH: self.push_enabled,
        }.get(channel, True)


class DevicePlatform(models.TextChoices):
    IOS = "ios", "iOS"
    ANDROID = "android", "Android"
    WEB = "web", "Web"


class DeviceToken(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="device_tokens")
    token = models.CharField(max_length=255, unique=True)
    platform = models.CharField(max_length=10, choices=DevicePlatform.choices)
    is_active = models.BooleanField(default=True)
    last_used_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "device_tokens"
        indexes = [models.Index(fields=["user", "is_active"])]
