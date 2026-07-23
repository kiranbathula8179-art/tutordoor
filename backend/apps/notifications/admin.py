from django.contrib import admin

from apps.notifications.models import DeviceToken, Notification, NotificationDeliveryLog, NotificationPreference


class NotificationDeliveryLogInline(admin.TabularInline):
    model = NotificationDeliveryLog
    extra = 0
    readonly_fields = ("channel", "status", "provider_message_id", "error_message", "sent_at")


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("recipient", "notification_type", "title", "is_read", "created_at")
    list_filter = ("notification_type", "is_read")
    search_fields = ("recipient__email", "title")
    inlines = [NotificationDeliveryLogInline]


@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = ("user", "email_enabled", "sms_enabled", "whatsapp_enabled", "push_enabled")


@admin.register(DeviceToken)
class DeviceTokenAdmin(admin.ModelAdmin):
    list_display = ("user", "platform", "is_active", "last_used_at")
    list_filter = ("platform", "is_active")
