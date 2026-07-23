import uuid

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="DailyPlatformMetrics",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("date", models.DateField(db_index=True, unique=True)),
                ("total_users", models.PositiveIntegerField(default=0)),
                ("total_tutors", models.PositiveIntegerField(default=0)),
                ("total_students", models.PositiveIntegerField(default=0)),
                ("new_signups", models.PositiveIntegerField(default=0)),
                ("total_bookings_created", models.PositiveIntegerField(default=0)),
                ("completed_bookings", models.PositiveIntegerField(default=0)),
                ("cancelled_bookings", models.PositiveIntegerField(default=0)),
                ("gross_merchandise_value", models.DecimalField(decimal_places=2, default=0, max_digits=14)),
                ("platform_revenue", models.DecimalField(decimal_places=2, default=0, max_digits=14)),
                ("active_subscriptions", models.PositiveIntegerField(default=0)),
            ],
            options={"db_table": "daily_platform_metrics", "ordering": ["-date"]},
        ),
    ]
