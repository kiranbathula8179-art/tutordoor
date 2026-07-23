from django.contrib import admin

from apps.rbac.models import Permission, Role, RolePermission, UserRoleAssignment


@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ("codename", "name", "module")
    list_filter = ("module",)
    search_fields = ("codename", "name")


class RolePermissionInline(admin.TabularInline):
    model = RolePermission
    extra = 0


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "archetype", "is_system", "is_active")
    list_filter = ("archetype", "is_system", "is_active")
    search_fields = ("code", "name")
    inlines = [RolePermissionInline]


@admin.register(UserRoleAssignment)
class UserRoleAssignmentAdmin(admin.ModelAdmin):
    list_display = ("user", "role", "assigned_by", "created_at")
    search_fields = ("user__email", "role__code")
