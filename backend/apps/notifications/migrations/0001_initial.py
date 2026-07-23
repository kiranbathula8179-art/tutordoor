import uuid

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("users", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Notification",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("notification_type", models.CharField(choices=[("booking_update", "Booking Update"), ("payment_update", "Payment Update"), ("course_update", "Course Update"), ("chat_message", "Chat Message"), ("verification_update", "Verification Update"), ("referral", "Referral"), ("system", "System"), ("promotional", "Promotional")], db_index=True, max_length=30)),
                ("title", models.CharField(max_length=200)),
                ("body", models.CharField(max_length=500)),
                ("data", models.JSONField(blank=True, default=dict)),
                ("action_url", models.CharField(blank=True, max_length=255)),
                ("is_read", models.BooleanField(db_index=True, default=False)),
                ("read_at", models.DateTimeField(blank=True, null=True)),
                ("recipient", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="notifications", to="users.user")),
            ],
            options={"db_table": "notifications", "ordering": ["-created_at"]},
        ),
        migrations.CreateModel(
            name="NotificationDeliveryLog",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("channel", models.CharField(choices=[("email", "Email"), ("sms", "SMS"), ("whatsapp", "WhatsApp"), ("push", "Push"), ("in_app", "In-App")], max_length=15)),
                ("status", models.CharField(choices=[("pending", "Pending"), ("sent", "Sent"), ("failed", "Failed"), ("skipped", "Skipped (muted/disabled)")], default="pending", max_length=15)),
                ("provider_message_id", models.CharField(blank=True, max_length=255)),
                ("error_message", models.CharField(blank=True, max_length=500)),
                ("sent_at", models.DateTimeField(blank=True, null=True)),
                ("notification", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="delivery_logs", to="notifications.notification")),
            ],
            options={"db_table": "notification_delivery_logs"},
        ),
        migrations.CreateModel(
            name="NotificationPreference",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("email_enabled", models.BooleanField(default=True)),
                ("sms_enabled", models.BooleanField(default=True)),
                ("whatsapp_enabled", models.BooleanField(default=False)),
                ("push_enabled", models.BooleanField(default=True)),
                ("muted_types", models.JSONField(blank=True, default=list)),
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="notification_preference", to="users.user")),
            ],
            options={"db_table": "notification_preferences"},
        ),
        migrations.CreateModel(
            name="DeviceToken",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("token", models.CharField(max_length=255, unique=True)),
                ("platform", models.CharField(choices=[("ios", "iOS"), ("android", "Android"), ("web", "Web")], max_length=10)),
                ("is_active", models.BooleanField(default=True)),
                ("last_used_at", models.DateTimeField(auto_now=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="device_tokens", to="users.user")),
            ],
            options={"db_table": "device_tokens"},
        ),
        migrations.AddIndex(
            model_name="notification",
            index=models.Index(fields=["recipient", "is_read"], name="notification_recipient_read_idx"),
        ),
        migrations.AddIndex(
            model_name="notificationdeliverylog",
            index=models.Index(fields=["notification", "channel"], name="delivery_log_notif_channel_idx"),
        ),
        migrations.AddIndex(
            model_name="devicetoken",
            index=models.Index(fields=["user", "is_active"], name="device_token_user_active_idx"),
        ),
    ]
