"""Sync the RBAC permission registry, system roles, and archetype
assignments:

    python manage.py seed_rbac

Idempotent; safe to run any time (the 0002 data migration runs the same
logic on `migrate`, so this is mainly for demo seeding after users are
created, and for re-syncing after registry changes)."""

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from apps.rbac.models import Permission, Role, RolePermission, UserRoleAssignment
from apps.rbac.seeding import assign_archetype_roles, ensure_system_roles, sync_permissions


class Command(BaseCommand):
    help = "Seed RBAC permissions, system roles, and archetype role assignments (idempotent)."

    def handle(self, *args, **options):
        new_permissions = sync_permissions(Permission)
        new_roles = ensure_system_roles(Role, Permission, RolePermission)
        new_assignments = assign_archetype_roles(get_user_model(), Role, UserRoleAssignment)
        self.stdout.write(
            self.style.SUCCESS(
                f"RBAC ready: +{new_permissions} permissions, +{new_roles} roles, "
                f"+{new_assignments} assignments "
                f"({Permission.objects.count()} permissions, {Role.objects.count()} roles total)."
            )
        )
