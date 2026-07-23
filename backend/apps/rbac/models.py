from django.conf import settings
from django.db import models

from apps.core.models import BaseModel
from apps.users.models import UserRole

"""
Dynamic RBAC (ADR-001, Decision 3).

`Role` rows are data — creatable in the admin panel ("Music Teacher",
"Exam Consultant") with a display identity and a permission set. Each role is
anchored to one of the five structural ARCHETYPES (UserRole), which own the
profile data models and portals. `Permission` rows mirror the code-owned
registry (permissions_registry.py): codenames are referenced by code, so code
is their source of truth and the table is synced from it — the reverse of
master data, and deliberately so.
"""


class Permission(BaseModel):
    codename = models.CharField(max_length=100, unique=True)  # e.g. "bookings.create"
    name = models.CharField(max_length=160)
    module = models.CharField(max_length=64, db_index=True)

    class Meta:
        db_table = "rbac_permissions"
        ordering = ("module", "codename")

    def __str__(self) -> str:
        return self.codename


class Role(BaseModel):
    code = models.SlugField(max_length=64, unique=True)
    name = models.CharField(max_length=120)
    description = models.TextField(blank=True)
    # The structural anchor: which profile model + portal this role lives in.
    archetype = models.CharField(max_length=32, choices=UserRole.choices, db_index=True)
    is_system = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    permissions = models.ManyToManyField(Permission, through="RolePermission", related_name="roles")

    class Meta:
        db_table = "rbac_roles"
        ordering = ("archetype", "name")

    def __str__(self) -> str:
        return f"{self.name} [{self.archetype}]"


class RolePermission(BaseModel):
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name="role_permissions")
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE, related_name="permission_roles")

    class Meta:
        db_table = "rbac_role_permissions"
        constraints = [
            models.UniqueConstraint(fields=("role", "permission"), name="uniq_rbac_role_permission"),
        ]


class UserRoleAssignment(BaseModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="role_assignments")
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name="assignments")
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="roles_granted"
    )

    class Meta:
        db_table = "rbac_user_roles"
        constraints = [
            models.UniqueConstraint(fields=("user", "role"), name="uniq_rbac_user_role"),
        ]

    def __str__(self) -> str:
        return f"{self.user_id} → {self.role_id}"
