from django.urls import path

from apps.rbac import views

urlpatterns = [
    path("my-permissions/", views.MyPermissionsView.as_view(), name="rbac_my_permissions"),
    path("admin/permissions/", views.AdminPermissionListView.as_view(), name="rbac_admin_permissions"),
    path("admin/roles/", views.AdminRoleListCreateView.as_view(), name="rbac_admin_roles"),
    path("admin/roles/<uuid:role_id>/", views.AdminRoleDetailView.as_view(), name="rbac_admin_role"),
    path("admin/assignments/", views.AdminAssignmentListCreateView.as_view(), name="rbac_admin_assignments"),
    path(
        "admin/assignments/<uuid:assignment_id>/",
        views.AdminAssignmentDeleteView.as_view(),
        name="rbac_admin_assignment",
    ),
]
