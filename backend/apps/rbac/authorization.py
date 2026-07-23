"""
Authorization primitives for dynamic RBAC.

`HasPermission("module.action")` is the new, finer-grained companion to the
legacy archetype classes (IsTutor, IsPlatformAdmin, ...), which remain
untouched and fully supported — adoption is incremental by design (ADR-001).

Safety property: users whose ARCHETYPE is `admin` implicitly hold every
permission. This mirrors the legacy IsPlatformAdmin semantics exactly, and
guarantees that no role-table state — missing seed, over-zealous edit — can
ever lock platform administrators out of governance endpoints.
"""

from rest_framework.permissions import BasePermission

from apps.rbac.models import UserRoleAssignment
from apps.users.models import UserRole

_REQUEST_CACHE_ATTR = "_rbac_codename_cache"


def user_permission_codenames(user) -> set[str]:
    """All active permission codenames granted to a user via active roles."""
    if not user or not user.is_authenticated:
        return set()
    return set(
        UserRoleAssignment.objects.filter(user=user, role__is_active=True)
        .values_list("role__role_permissions__permission__codename", flat=True)
        .exclude(role__role_permissions__permission__codename=None)
    )


def user_has_permission(user, codename: str, request=None) -> bool:
    if not user or not user.is_authenticated:
        return False
    if getattr(user, "role", None) == UserRole.ADMIN or user.is_superuser:
        return True

    if request is not None:
        cache = getattr(request, _REQUEST_CACHE_ATTR, None)
        if cache is None:
            cache = user_permission_codenames(user)
            setattr(request, _REQUEST_CACHE_ATTR, cache)
        return codename in cache

    return codename in user_permission_codenames(user)


def HasPermission(codename: str) -> type[BasePermission]:
    """Usage: permission_classes = [HasPermission("bookings.create")]."""

    class _HasPermission(BasePermission):
        message = f"You need the '{codename}' permission for this action."

        def has_permission(self, request, view) -> bool:
            return user_has_permission(request.user, codename, request=request)

    _HasPermission.__name__ = f"HasPermission_{codename.replace('.', '_')}"
    return _HasPermission
