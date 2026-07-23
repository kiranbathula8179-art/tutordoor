from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from apps.users.models import EmailVerificationToken, LoginAuditLog, OTP, User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    ordering = ("-created_at",)
    list_display = ("email", "get_full_name", "role", "is_active", "is_email_verified", "is_phone_verified", "created_at")
    list_filter = ("role", "is_active", "is_email_verified", "is_phone_verified", "signup_source")
    search_fields = ("email", "first_name", "last_name", "phone_number", "referral_code")
    readonly_fields = ("id", "referral_code", "created_at", "updated_at", "last_login_ip", "last_active_at")
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal Info", {"fields": ("first_name", "last_name", "phone_number", "avatar")}),
        ("Role & Status", {"fields": ("role", "is_active", "is_staff", "is_superuser")}),
        ("Verification", {"fields": ("is_email_verified", "is_phone_verified")}),
        ("Referral", {"fields": ("referral_code", "referred_by")}),
        ("Google", {"fields": ("google_id", "signup_source")}),
        ("Activity", {"fields": ("last_login_ip", "last_active_at", "last_login", "created_at", "updated_at")}),
        ("Permissions", {"fields": ("groups", "user_permissions")}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "first_name", "last_name", "role", "password1", "password2"),
        }),
    )
    filter_horizontal = ("groups", "user_permissions")


@admin.register(OTP)
class OTPAdmin(admin.ModelAdmin):
    list_display = ("destination", "purpose", "user", "is_used", "expires_at", "attempt_count", "created_at")
    list_filter = ("purpose", "is_used")
    search_fields = ("destination", "user__email")
    readonly_fields = ("code_hash",)


@admin.register(EmailVerificationToken)
class EmailVerificationTokenAdmin(admin.ModelAdmin):
    list_display = ("user", "is_used", "expires_at", "created_at")
    search_fields = ("user__email",)


@admin.register(LoginAuditLog)
class LoginAuditLogAdmin(admin.ModelAdmin):
    list_display = ("user", "event", "ip_address", "created_at")
    list_filter = ("event",)
    search_fields = ("user__email", "ip_address")
    readonly_fields = [f.name for f in LoginAuditLog._meta.fields]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
