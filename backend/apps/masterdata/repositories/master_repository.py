from django.db.models import Q, QuerySet

from apps.masterdata.models import MasterDataAuditLog, MasterDataItem, MasterDataType


class MasterDataRepository:
    """Data access for the master data engine — no business rules here."""

    # ---------------------------------------------------------------- types
    def list_types(self) -> QuerySet[MasterDataType]:
        return MasterDataType.objects.order_by("name")

    def get_type_by_code(self, code: str) -> MasterDataType | None:
        return MasterDataType.objects.filter(code=code).first()

    # ---------------------------------------------------------------- items
    def list_active_items(self, type_code: str) -> QuerySet[MasterDataItem]:
        return (
            MasterDataItem.objects.filter(type__code=type_code, is_active=True)
            .select_related("type")
            .order_by("sort_order", "label")
        )

    def bootstrap_map(self, type_codes: list[str]) -> dict[str, list[MasterDataItem]]:
        """Active items for several types in one query, keyed by type code."""
        items = (
            MasterDataItem.objects.filter(type__code__in=type_codes, is_active=True)
            .select_related("type")
            .order_by("type__code", "sort_order", "label")
        )
        grouped: dict[str, list[MasterDataItem]] = {code: [] for code in type_codes}
        for item in items:
            grouped[item.type.code].append(item)
        return grouped

    def list_items_admin(
        self, *, type_code: str | None = None, query: str | None = None, status: str | None = None
    ) -> QuerySet[MasterDataItem]:
        qs = MasterDataItem.objects.select_related("type").order_by("type__code", "sort_order", "label")
        if type_code:
            qs = qs.filter(type__code=type_code)
        if status == "active":
            qs = qs.filter(is_active=True)
        elif status == "inactive":
            qs = qs.filter(is_active=False)
        if query:
            qs = qs.filter(Q(code__icontains=query) | Q(label__icontains=query) | Q(description__icontains=query))
        return qs

    def get_item_by_id(self, item_id) -> MasterDataItem | None:
        return MasterDataItem.objects.select_related("type").filter(id=item_id).first()

    def get_item(self, type_code: str, code: str) -> MasterDataItem | None:
        return MasterDataItem.objects.filter(type__code=type_code, code=code).first()

    def active_codes(self, type_code: str) -> set[str]:
        return set(
            MasterDataItem.objects.filter(type__code=type_code, is_active=True).values_list("code", flat=True)
        )

    # ---------------------------------------------------------------- audit
    def list_audit(self, *, type_code: str | None = None) -> QuerySet[MasterDataAuditLog]:
        qs = MasterDataAuditLog.objects.select_related("actor").order_by("-created_at")
        if type_code:
            qs = qs.filter(type_code=type_code)
        return qs
