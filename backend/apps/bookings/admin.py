from django.contrib import admin

from apps.bookings.models import (
    Booking,
    BookingStatusHistory,
    LiveClassSession,
    RescheduleRequest,
    SessionAttendance,
)


class BookingStatusHistoryInline(admin.TabularInline):
    model = BookingStatusHistory
    extra = 0
    readonly_fields = ("from_status", "to_status", "changed_by", "reason", "created_at")
    can_delete = False


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ("id", "student", "tutor", "booking_type", "mode", "status", "start_time", "price", "payment_status")
    list_filter = ("status", "booking_type", "mode", "payment_status")
    search_fields = ("student__user__email", "tutor__user__email")
    readonly_fields = ("created_at", "updated_at", "cancelled_at", "completed_at")
    inlines = [BookingStatusHistoryInline]
    date_hierarchy = "start_time"


@admin.register(RescheduleRequest)
class RescheduleRequestAdmin(admin.ModelAdmin):
    list_display = ("booking", "requested_by", "proposed_start_time", "status", "responded_at")
    list_filter = ("status",)


@admin.register(LiveClassSession)
class LiveClassSessionAdmin(admin.ModelAdmin):
    list_display = ("booking", "provider", "status", "started_at", "ended_at")
    list_filter = ("status", "provider")


@admin.register(SessionAttendance)
class SessionAttendanceAdmin(admin.ModelAdmin):
    list_display = ("session", "user", "role", "joined_at", "left_at", "duration_seconds")
    list_filter = ("role",)
