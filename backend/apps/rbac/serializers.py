from rest_framework import serializers

from apps.rbac.models import Permission, Role, UserRoleAssignment
from apps.users.models import UserRole


class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ("codename", "name", "module")
        read_only_fields = fields


class RoleSerializer(serializers.ModelSerializer):
    permission_codenames = serializers.SerializerMethodField()
    user_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Role
        fields = (
            "id", "code", "name", "description", "archetype", "is_system",
            "is_active", "permission_codenames", "user_count", "created_at",
        )
        read_only_fields = fields

    def get_permission_codenames(self, role) -> list[str]:
        return sorted(rp.permission.codename for rp in role.role_permissions.all())


class RoleWriteSerializer(serializers.Serializer):
    code = serializers.SlugField(max_length=64)
    name = serializers.CharField(max_length=120)
    description = serializers.CharField(required=False, allow_blank=True, default="")
    archetype = serializers.ChoiceField(choices=UserRole.choices)
    is_active = serializers.BooleanField(required=False, default=True)
    permission_codenames = serializers.ListField(
        child=serializers.CharField(max_length=100), required=False, allow_empty=True
    )


class AssignmentSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source="user.email", read_only=True)
    user_name = serializers.CharField(source="user.full_name", read_only=True)
    role_code = serializers.CharField(source="role.code", read_only=True)
    role_name = serializers.CharField(source="role.name", read_only=True)
    assigned_by_email = serializers.EmailField(source="assigned_by.email", read_only=True, default=None)

    class Meta:
        model = UserRoleAssignment
        fields = (
            "id",
            "user",
            "user_email",
            "user_name",
            "role",
            "role_code",
            "role_name",
            "assigned_by_email",
            "created_at",
        )
        read_only_fields = fields


class AssignmentWriteSerializer(serializers.Serializer):
    user_id = serializers.UUIDField()
    role_id = serializers.UUIDField()
