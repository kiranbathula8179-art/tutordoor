from django.contrib import admin

from apps.institutes.models import InstituteProfile, InstituteStudentEnrollment, InstituteTutor


class InstituteTutorInline(admin.TabularInline):
    model = InstituteTutor
    extra = 0


class InstituteStudentEnrollmentInline(admin.TabularInline):
    model = InstituteStudentEnrollment
    extra = 0


@admin.register(InstituteProfile)
class InstituteProfileAdmin(admin.ModelAdmin):
    list_display = ("institute_name", "verification_status", "city", "rating_average", "created_at")
    list_filter = ("verification_status",)
    search_fields = ("institute_name", "user__email", "registration_number")
    readonly_fields = ("rating_average", "rating_count", "verified_at", "created_at", "updated_at")
    inlines = [InstituteTutorInline, InstituteStudentEnrollmentInline]


@admin.register(InstituteTutor)
class InstituteTutorAdmin(admin.ModelAdmin):
    list_display = ("institute", "tutor", "role_title", "status", "joined_at")
    list_filter = ("status",)


@admin.register(InstituteStudentEnrollment)
class InstituteStudentEnrollmentAdmin(admin.ModelAdmin):
    list_display = ("institute", "student", "status", "enrolled_at")
    list_filter = ("status",)
