"""
RBAC seeding — shared by the 0002 data migration and `seed_rbac`.

Every function takes model classes as parameters so the data migration can
pass historical models from `apps.get_model(...)` while the management command
passes the real ones. Idempotent throughout.

Sync semantics (deliberate, per ADR-001):
- Permissions: code owns them → create missing AND refresh name/module.
- System roles: created if absent; names/permissions are NOT force-reset on
  re-run, except the 'admin' role, which is always topped up to hold every
  registry permission (lockout protection).
- Assignments: every user gets the system role matching their archetype
  (User.role) — existing extra assignments are never touched.
"""

from apps.rbac.permissions_registry import (
    ALL_CODENAMES,
    DEFAULT_ROLE_PERMISSIONS,
    PERMISSION_REGISTRY,
    SYSTEM_ROLE_NAMES,
)


def sync_permissions(PermissionModel) -> int:
    created = 0
    for codename, name, module in PERMISSION_REGISTRY:
        _, was_created = PermissionModel.objects.update_or_create(
            codename=codename, defaults={"name": name, "module": module}
        )
        created += int(was_created)
    return created


def ensure_system_roles(RoleModel, PermissionModel, RolePermissionModel) -> int:
    permissions_by_codename = {p.codename: p for p in PermissionModel.objects.all()}
    created = 0

    for archetype, (name, description) in SYSTEM_ROLE_NAMES.items():
        role, was_created = RoleModel.objects.get_or_create(
            code=archetype,
            defaults={"name": name, "description": description, "archetype": archetype, "is_system": True},
        )
        created += int(was_created)

        wanted = DEFAULT_ROLE_PERMISSIONS.get(archetype, [])
        codenames = ALL_CODENAMES if wanted == "*" else list(wanted)

        if was_created or archetype == "admin":
            existing = set(
                RolePermissionModel.objects.filter(role=role).values_list("permission__codename", flat=True)
            )
            for codename in codenames:
                permission = permissions_by_codename.get(codename)
                if permission and codename not in existing:
                    RolePermissionModel.objects.create(role=role, permission=permission)
    return created


def assign_archetype_roles(UserModel, RoleModel, AssignmentModel) -> int:
    roles_by_code = {role.code: role for role in RoleModel.objects.filter(is_system=True)}
    created = 0
    for user in UserModel.objects.all().only("id", "role"):
        role = roles_by_code.get(user.role)
        if not role:
            continue
        _, was_created = AssignmentModel.objects.get_or_create(user_id=user.id, role=role)
        created += int(was_created)
    return created
