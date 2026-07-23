from django.contrib import admin

from apps.courses.models import (
    Assignment,
    AssignmentSubmission,
    Course,
    CourseAttendance,
    CourseEnrollment,
    CourseSession,
)


class CourseSessionInline(admin.TabularInline):
    model = CourseSession
    extra = 0


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ("title", "tutor", "subject", "status", "price", "max_students", "enrolled_count", "created_at")
    list_filter = ("status", "level", "mode")
    search_fields = ("title", "tutor__user__email")
    prepopulated_fields = {"slug": ("title",)}
    inlines = [CourseSessionInline]


@admin.register(CourseSession)
class CourseSessionAdmin(admin.ModelAdmin):
    list_display = ("course", "session_number", "scheduled_start", "status")
    list_filter = ("status",)


@admin.register(CourseEnrollment)
class CourseEnrollmentAdmin(admin.ModelAdmin):
    list_display = ("course", "student", "status", "progress_percent", "enrolled_at")
    list_filter = ("status",)


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ("title", "course", "due_at", "max_score")
    search_fields = ("title", "course__title")


@admin.register(AssignmentSubmission)
class AssignmentSubmissionAdmin(admin.ModelAdmin):
    list_display = ("assignment", "student", "status", "score", "submitted_at")
    list_filter = ("status",)


@admin.register(CourseAttendance)
class CourseAttendanceAdmin(admin.ModelAdmin):
    list_display = ("session", "student", "status")
    list_filter = ("status",)
