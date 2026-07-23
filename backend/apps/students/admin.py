from django.contrib import admin

from apps.students.models import StudentProfile, StudentSubjectInterest


class StudentSubjectInterestInline(admin.TabularInline):
    model = StudentSubjectInterest
    extra = 0


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "grade_level", "school_name", "city", "total_sessions_completed", "created_at")
    list_filter = ("grade_level", "preferred_learning_mode")
    search_fields = ("user__email", "user__first_name", "user__last_name", "school_name")
    inlines = [StudentSubjectInterestInline]
