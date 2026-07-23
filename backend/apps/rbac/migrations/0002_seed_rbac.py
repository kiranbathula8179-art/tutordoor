"""Data migration: sync the permission registry, create the five system
roles, and grant every existing user their archetype's system role.

Plain `migrate` on any environment — fresh or existing — leaves RBAC ready
without a manual step. The logic lives in apps.rbac.seeding (shared with the
`seed_rbac` command) and only touches models passed in, so historical models
are safe here.
"""

from django.conf import settings
from django.db import migrations

from apps.rbac.seeding import assign_archetype_roles, ensure_system_roles, sync_permissions


def seed_forward(apps, schema_editor):
    Permission = apps.get_model("rbac", "Permission")
    Role = apps.get_model("rbac", "Role")
    RolePermission = apps.get_model("rbac", "RolePermission")
    UserRoleAssignment = apps.get_model("rbac", "UserRoleAssignment")
    app_label, model_name = settings.AUTH_USER_MODEL.split(".")
    User = apps.get_model(app_label, model_name)

    sync_permissions(Permission)
    ensure_system_roles(Role, Permission, RolePermission)
    assign_archetype_roles(User, Role, UserRoleAssignment)


class Migration(migrations.Migration):

    dependencies = [
        ("rbac", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_forward, migrations.RunPython.noop),
    ]
