from django.db import models

from apps.core.models import BaseModel


class DailyPlatformMetrics(BaseModel):
    """
    A materialized daily snapshot of platform-wide KPIs, computed once by a
    Celery beat task (see tasks.snapshot_daily_metrics_task). Historical
    dashboard charts read from this table instead of re-aggregating the
    entire bookings/payments history on every request.
    """

    date = models.DateField(unique=True, db_index=True)

    total_users = models.PositiveIntegerField(default=0)
    total_tutors = models.PositiveIntegerField(default=0)
    total_students = models.PositiveIntegerField(default=0)
    new_signups = models.PositiveIntegerField(default=0)

    total_bookings_created = models.PositiveIntegerField(default=0)
    completed_bookings = models.PositiveIntegerField(default=0)
    cancelled_bookings = models.PositiveIntegerField(default=0)

    gross_merchandise_value = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    platform_revenue = models.DecimalField(max_digits=14, decimal_places=2, default=0)

    active_subscriptions = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "daily_platform_metrics"
        ordering = ["-date"]

    def __str__(self):
        return f"Metrics<{self.date}>"
