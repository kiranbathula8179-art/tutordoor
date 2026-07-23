from django.contrib import admin

from apps.analytics.models import DailyPlatformMetrics


@admin.register(DailyPlatformMetrics)
class DailyPlatformMetricsAdmin(admin.ModelAdmin):
    list_display = (
        "date", "total_users", "new_signups", "total_bookings_created",
        "completed_bookings", "gross_merchandise_value", "platform_revenue",
    )
    date_hierarchy = "date"
    ordering = ("-date",)

    def has_add_permission(self, request):
        return False
