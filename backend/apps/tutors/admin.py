from django.contrib import admin

from apps.tutors.models import (
    AvailabilityException,
    Subject,
    SubjectCategory,
    TutorProfile,
    TutorSubject,
    VerificationDocument,
    WeeklyAvailability,
)


@admin.register(SubjectCategory)
class SubjectCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "display_order")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "is_active")
    list_filter = ("category", "is_active")
    search_fields = ("name",)
    prepopulated_fields = {"slug": ("name",)}


class TutorSubjectInline(admin.TabularInline):
    model = TutorSubject
    extra = 0


class VerificationDocumentInline(admin.TabularInline):
    model = VerificationDocument
    extra = 0
    readonly_fields = ("created_at",)


@admin.register(TutorProfile)
class TutorProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "verification_status", "hourly_rate", "rating_average", "city", "is_accepting_students", "created_at")
    list_filter = ("verification_status", "teaching_mode", "is_featured", "is_accepting_students")
    search_fields = ("user__email", "user__first_name", "user__last_name", "city")
    readonly_fields = ("rating_average", "rating_count", "total_sessions_completed", "verified_at", "created_at", "updated_at")
    inlines = [TutorSubjectInline, VerificationDocumentInline]


@admin.register(WeeklyAvailability)
class WeeklyAvailabilityAdmin(admin.ModelAdmin):
    list_display = ("tutor", "day_of_week", "start_time", "end_time", "is_active")
    list_filter = ("day_of_week", "is_active")


@admin.register(AvailabilityException)
class AvailabilityExceptionAdmin(admin.ModelAdmin):
    list_display = ("tutor", "date", "is_available", "start_time", "end_time")
    list_filter = ("is_available",)
