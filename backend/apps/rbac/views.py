from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.exceptions import ResourceNotFoundError
from apps.core.pagination import StandardResultsSetPagination
from apps.rbac.authorization import HasPermission, user_permission_codenames
from apps.rbac.repositories.rbac_repository import RbacRepository
from apps.rbac.serializers import (
    AssignmentSerializer,
    AssignmentWriteSerializer,
    PermissionSerializer,
    RoleSerializer,
    RoleWriteSerializer,
)
from apps.rbac.services.rbac_service import RbacService


class MyPermissionsView(APIView):
    """What the frontend gates UI on: the caller's roles + permission set."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        assignments = RbacRepository().list_assignments(user_id=request.user.id)
        roles = [
            {"code": a.role.code, "name": a.role.name, "archetype": a.role.archetype}
            for a in assignments
            if a.role.is_active
        ]
        return Response(
            {
                "success": True,
                "archetype": request.user.role,
                "roles": roles,
                "permissions": sorted(user_permission_codenames(request.user)),
            }
        )


class AdminPermissionListView(APIView):
    permission_classes = [HasPermission("rbac.view")]

    def get(self, request):
        permissions = RbacRepository().list_permissions()
        return Response({"success": True, "results": PermissionSerializer(permissions, many=True).data})


class AdminRoleListCreateView(APIView):
    def get_permissions(self):
        codename = "rbac.view" if self.request.method == "GET" else "rbac.manage_roles"
        return [HasPermission(codename)()]

    def get(self, request):
        roles = RbacRepository().list_roles()
        return Response({"success": True, "results": RoleSerializer(roles, many=True).data})

    def post(self, request):
        serializer = RoleWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        role = RbacService().create_role(request.user, **serializer.validated_data)
        return Response(
            {"success": True, "role": RoleSerializer(RbacRepository().get_role(role.id)).data},
            status=status.HTTP_201_CREATED,
        )


class AdminRoleDetailView(APIView):
    def get_permissions(self):
        codename = "rbac.view" if self.request.method == "GET" else "rbac.manage_roles"
        return [HasPermission(codename)()]

    def get(self, request, role_id):
        role = RbacRepository().get_role(role_id)
        if not role:
            raise ResourceNotFoundError("Role not found.")
        return Response({"success": True, "role": RoleSerializer(role).data})

    def patch(self, request, role_id):
        serializer = RoleWriteSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        role = RbacService().update_role(request.user, role_id, **serializer.validated_data)
        return Response({"success": True, "role": RoleSerializer(role).data})

    def delete(self, request, role_id):
        RbacService().delete_role(request.user, role_id)
        return Response({"success": True, "message": "Role deleted."})


class AdminAssignmentListCreateView(APIView):
    permission_classes = [HasPermission("rbac.assign_roles")]
    pagination_class = StandardResultsSetPagination

    def get(self, request):
        queryset = RbacRepository().list_assignments(user_id=request.query_params.get("user_id"))
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        return paginator.get_paginated_response(AssignmentSerializer(page, many=True).data)

    def post(self, request):
        serializer = AssignmentWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        assignment = RbacService().assign_role(request.user, **serializer.validated_data)
        return Response(
            {"success": True, "assignment": AssignmentSerializer(assignment).data},
            status=status.HTTP_201_CREATED,
        )


class AdminAssignmentDeleteView(APIView):
    permission_classes = [HasPermission("rbac.assign_roles")]

    def delete(self, request, assignment_id):
        RbacService().unassign_role(request.user, assignment_id)
        return Response({"success": True, "message": "Role unassigned."})
