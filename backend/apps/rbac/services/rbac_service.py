from django.contrib.auth import get_user_model
from django.db import transaction

from apps.core.exceptions import ApplicationError, ConflictError, ResourceNotFoundError
from apps.rbac.models import Role, RolePermission, UserRoleAssignment
from apps.rbac.repositories.rbac_repository import RbacRepository
from apps.users.models import UserRole

User = get_user_model()


class RbacService:
    """Governance rules for dynamic roles.

    System roles (the five archetype mirrors) are structurally protected:
    no delete, no code/archetype change, no deactivation — and the 'admin'
    system role's permission set is immutable (belt to the authorization
    layer's braces). Everything else is admin-panel clay.
    """

    def __init__(self) -> None:
        self.repository = RbacRepository()

    # ---------------------------------------------------------------- roles
    @transaction.atomic
    def create_role(self, actor, *, code: str, name: str, archetype: str, description: str = "",
                    permission_codenames: list[str] | None = None, is_active: bool = True) -> Role:
        if archetype not in UserRole.values:
            raise ApplicationError(f"Archetype must be one of: {', '.join(UserRole.values)}.")
        if self.repository.get_role_by_code(code):
            raise ConflictError(f"A role with code '{code}' already exists.")

        role = Role.objects.create(
            code=code, name=name, description=description, archetype=archetype, is_active=is_active
        )
        if permission_codenames:
            self._set_permissions(role, permission_codenames)
        return role

    @transaction.atomic
    def update_role(self, actor, role_id, **fields) -> Role:
        role = self.repository.get_role(role_id)
        if not role:
            raise ResourceNotFoundError("Role not found.")

        if role.is_system:
            for locked in ("code", "archetype"):
                if locked in fields and fields[locked] != getattr(role, locked):
                    raise ApplicationError("System roles cannot change their code or archetype.")
            if fields.get("is_active") is False:
                raise ApplicationError("System roles cannot be deactivated.")
            if role.code == "admin" and "permission_codenames" in fields:
                raise ApplicationError("The admin system role's permissions are immutable.")

        if "code" in fields and fields["code"] != role.code and self.repository.get_role_by_code(fields["code"]):
            raise ConflictError(f"A role with code '{fields['code']}' already exists.")

        permission_codenames = fields.pop("permission_codenames", None)
        for field in ("code", "name", "description", "archetype", "is_active"):
            if field in fields:
                setattr(role, field, fields[field])
        role.save()

        if permission_codenames is not None:
            self._set_permissions(role, permission_codenames)
        return self.repository.get_role(role.id)

    @transaction.atomic
    def delete_role(self, actor, role_id) -> None:
        role = self.repository.get_role(role_id)
        if not role:
            raise ResourceNotFoundError("Role not found.")
        if role.is_system:
            raise ApplicationError("System roles cannot be deleted.")
        assignment_count = role.assignments.count()
        if assignment_count:
            raise ConflictError(
                f"'{role.name}' is assigned to {assignment_count} user(s). Unassign them first."
            )
        role.delete()  # soft delete

    def _set_permissions(self, role: Role, codenames: list[str]) -> None:
        found = {p.codename: p for p in self.repository.permissions_by_codenames(codenames)}
        unknown = [c for c in codenames if c not in found]
        if unknown:
            raise ApplicationError(f"Unknown permission codename(s): {', '.join(sorted(unknown))}.")

        current = {rp.permission.codename: rp for rp in role.role_permissions.select_related("permission")}
        wanted = set(codenames)
        for codename, role_permission in current.items():
            if codename not in wanted:
                role_permission.delete(hard=True)
        for codename in wanted:
            if codename not in current:
                RolePermission.objects.create(role=role, permission=found[codename])

    # ---------------------------------------------------------------- assignments
    @transaction.atomic
    def assign_role(self, actor, *, user_id, role_id) -> UserRoleAssignment:
        role = self.repository.get_role(role_id)
        if not role:
            raise ResourceNotFoundError("Role not found.")
        if not role.is_active:
            raise ApplicationError("Inactive roles cannot be assigned.")
        user = User.objects.filter(id=user_id).first()
        if not user:
            raise ResourceNotFoundError("User not found.")
        if user.role != role.archetype:
            raise ApplicationError(
                f"'{role.name}' is a {role.archetype} role; {user.email} is a {user.role}. "
                "Roles can only be assigned within their archetype."
            )
        assignment, created = UserRoleAssignment.objects.get_or_create(
            user=user, role=role, defaults={"assigned_by": actor}
        )
        if not created:
            raise ConflictError(f"{user.email} already has the '{role.name}' role.")
        return assignment

    @transaction.atomic
    def unassign_role(self, actor, assignment_id) -> None:
        assignment = self.repository.get_assignment(assignment_id)
        if not assignment:
            raise ResourceNotFoundError("Assignment not found.")
        if assignment.role.is_system and assignment.role.code == assignment.user.role:
            raise ApplicationError(
                "This is the user's base archetype role and cannot be removed. "
                "Additional roles can be unassigned freely."
            )
        assignment.delete(hard=True)
