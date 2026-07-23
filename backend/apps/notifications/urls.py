from django.urls import path

from apps.notifications import views

app_name = "notifications"

urlpatterns = [
    path("", views.MyNotificationsView.as_view(), name="my_notifications"),
    path("unread-count/", views.UnreadCountView.as_view(), name="unread_count"),
    path("<uuid:notification_id>/read/", views.MarkNotificationReadView.as_view(), name="mark_read"),
    path("read-all/", views.MarkAllNotificationsReadView.as_view(), name="mark_all_read"),
    path("preferences/", views.NotificationPreferenceView.as_view(), name="preferences"),
    path("devices/register/", views.RegisterDeviceView.as_view(), name="register_device"),
]
