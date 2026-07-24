from django.urls import path

from apps.masterdata import views

urlpatterns = [
    # Public — option lists for the frontend
    path("bootstrap/", views.BootstrapView.as_view(), name="masterdata_bootstrap"),
    # Admin — the Master Data Admin module
    path("admin/types/", views.AdminTypeListView.as_view(), name="masterdata_admin_types"),
    path("admin/items/", views.AdminItemListCreateView.as_view(), name="masterdata_admin_items"),
    path("admin/items/import/", views.AdminImportCsvView.as_view(), name="masterdata_admin_import"),
    path("admin/items/export/", views.AdminExportCsvView.as_view(), name="masterdata_admin_export"),
    path("admin/items/<uuid:item_id>/", views.AdminItemDetailView.as_view(), name="masterdata_admin_item"),
    path(
        "admin/items/<uuid:item_id>/activate/", views.AdminItemActivateView.as_view(), name="masterdata_admin_activate"
    ),
    path(
        "admin/items/<uuid:item_id>/deactivate/",
        views.AdminItemDeactivateView.as_view(),
        name="masterdata_admin_deactivate",
    ),
    path("admin/audit/", views.AdminAuditListView.as_view(), name="masterdata_admin_audit"),
    # Keep the catch-all type route LAST so it never shadows the above.
    path("<slug:type_code>/", views.TypeItemsView.as_view(), name="masterdata_type_items"),
]
