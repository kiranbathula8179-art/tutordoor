from django.contrib import admin

from apps.masterdata.models import MasterDataAuditLog, MasterDataItem, MasterDataType


@admin.register(MasterDataType)
class MasterDataTypeAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "is_system")
    search_fields = ("code", "name")


@admin.register(MasterDataItem)
class MasterDataItemAdmin(admin.ModelAdmin):
    list_display = ("type", "code", "label", "sort_order", "is_active")
    list_filter = ("type", "is_active")
    search_fields = ("code", "label")


@admin.register(MasterDataAuditLog)
class MasterDataAuditLogAdmin(admin.ModelAdmin):
    list_display = ("created_at", "action", "type_code", "item_code", "actor")
    list_filter = ("action", "type_code")
    readonly_fields = ("actor", "action", "type_code", "item_code", "changes", "created_at")
