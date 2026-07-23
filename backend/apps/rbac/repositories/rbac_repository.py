from django.db.models import Count, QuerySet

from apps.rbac.models import Permission, Role, UserRoleAssignment


class RbacRepository:
    """Data access for roles, permissions, and assignments."""

    def list_permissions(self) -> QuerySet[Permission]:
        return Permission.objects.order_by("module", "codename")

    def list_roles(self) -> QuerySet[Role]:
        return (
            Role.objects.annotate(user_count=Count("assignments", distinct=True))
            .prefetch_related("role_permissions__permission")
            .order_by("archetype", "name")
        )

    def get_role(self, role_id) -> Role | None:
        return (
            Role.objects.annotate(user_count=Count("assignments", distinct=True))
            .prefetch_related("role_permissions__permission")
            .filter(id=role_id)
            .first()
        )

    def get_role_by_code(self, code: str) -> Role | None:
        return Role.objects.filter(code=code).first()

    def permissions_by_codenames(self, codenames: list[str]) -> QuerySet[Permission]:
        return Permission.objects.filter(codename__in=codenames)

    def list_assignments(self, *, user_id=None) -> QuerySet[UserRoleAssignment]:
        qs = UserRoleAssignment.objects.select_related("user", "role", "assigned_by").order_by("-created_at")
        if user_id:
            qs = qs.filter(user_id=user_id)
        return qs

    def get_assignment(self, assignment_id) -> UserRoleAssignment | None:
        return UserRoleAssignment.objects.select_related("user", "role").filter(id=assignment_id).first()
