from rest_framework import serializers

from apps.notifications.models import DevicePlatform, Notification, NotificationPreference, NotificationType


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = (
            "id", "notification_type", "title", "body", "data", "action_url",
            "is_read", "read_at", "created_at",
        )
        read_only_fields = fields


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = ("email_enabled", "sms_enabled", "whatsapp_enabled", "push_enabled", "muted_types")


class UpdatePreferenceSerializer(serializers.Serializer):
    email_enabled = serializers.BooleanField(required=False)
    sms_enabled = serializers.BooleanField(required=False)
    whatsapp_enabled = serializers.BooleanField(required=False)
    push_enabled = serializers.BooleanField(required=False)
    muted_types = serializers.ListField(child=serializers.ChoiceField(choices=NotificationType.choices), required=False)


class RegisterDeviceSerializer(serializers.Serializer):
    token = serializers.CharField(max_length=255)
    platform = serializers.ChoiceField(choices=DevicePlatform.choices)
