from rest_framework.permissions import BasePermission, SAFE_METHODS


class HasRole(BasePermission):
    """
    Generic role-check permission. Subclass and set `allowed_roles`,
    or instantiate via `HasRole.for_roles("tutor", "admin")`.
    """

    allowed_roles: tuple[str, ...] = ()
    message = "You do not have the required role to perform this action."

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (user.role in self.allowed_roles or user.is_superuser)
        )

    @classmethod
    def for_roles(cls, *roles):
        return type("DynamicHasRole", (cls,), {"allowed_roles": roles})


class IsStudent(HasRole):
    allowed_roles = ("student",)


class IsTutor(HasRole):
    allowed_roles = ("tutor",)


class IsParent(HasRole):
    allowed_roles = ("parent",)


class IsInstituteAdmin(HasRole):
    allowed_roles = ("institute_admin",)


class IsPlatformAdmin(HasRole):
    allowed_roles = ("admin",)


class IsVerifiedTutor(BasePermission):
    message = "Your tutor profile must be verified before performing this action."

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated and user.role == "tutor"):
            return False
        profile = getattr(user, "tutor_profile", None)
        return bool(profile and profile.verification_status == "verified")


class IsOwnerOrReadOnly(BasePermission):
    """Object-level permission: only the owner can write; anyone authenticated can read."""

    owner_field = "user"

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        owner = getattr(obj, self.owner_field, None)
        return owner == request.user


class ReadOnly(BasePermission):
    def has_permission(self, request, view):
        return request.method in SAFE_METHODS
