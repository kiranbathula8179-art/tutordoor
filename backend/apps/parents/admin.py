from django.contrib import admin

from apps.parents.models import ParentProfile, ParentStudentLink


@admin.register(ParentProfile)
class ParentProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "occupation", "city", "preferred_contact_method", "created_at")
    search_fields = ("user__email", "user__first_name", "user__last_name")


@admin.register(ParentStudentLink)
class ParentStudentLinkAdmin(admin.ModelAdmin):
    list_display = ("parent", "student", "relationship", "status", "confirmed_at")
    list_filter = ("relationship", "status")
    search_fields = ("parent__user__email", "student__user__email")
