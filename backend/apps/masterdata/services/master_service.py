import csv
import io

from django.db import transaction

from apps.core.exceptions import ApplicationError, ConflictError, ResourceNotFoundError
from apps.masterdata.models import AuditAction, MasterDataAuditLog, MasterDataItem, MasterDataType
from apps.masterdata.repositories.master_repository import MasterDataRepository

AUDITED_FIELDS = ("code", "label", "description", "sort_order", "is_active", "metadata")
EXPORT_COLUMNS = ("type_code", "code", "label", "description", "sort_order", "is_active", "metadata")


class MasterDataService:
    """Business rules for the master data engine: every mutation is audited
    with a field-level diff; imports are transactional upserts by (type, code)."""

    def __init__(self) -> None:
        self.repository = MasterDataRepository()

    # ---------------------------------------------------------------- audit
    def _log(self, actor, action: str, type_code: str, item_code: str = "", changes: dict | None = None) -> None:
        MasterDataAuditLog.objects.create(
            actor=actor, action=action, type_code=type_code, item_code=item_code, changes=changes or {}
        )

    @staticmethod
    def _diff(before: dict, after: dict) -> dict:
        return {
            field: {"from": before[field], "to": after[field]}
            for field in AUDITED_FIELDS
            if before.get(field) != after.get(field)
        }

    @staticmethod
    def _snapshot(item: MasterDataItem) -> dict:
        return {field: getattr(item, field) for field in AUDITED_FIELDS}

    # ---------------------------------------------------------------- items
    @transaction.atomic
    def create_item(self, actor, *, type_code: str, **fields) -> MasterDataItem:
        data_type = self.repository.get_type_by_code(type_code)
        if not data_type:
            raise ResourceNotFoundError(f"Unknown master data type '{type_code}'.")
        if self.repository.get_item(type_code, fields.get("code", "")):
            raise ConflictError(f"An item with code '{fields.get('code')}' already exists in {type_code}.")

        item = MasterDataItem.objects.create(type=data_type, **fields)
        self._log(actor, AuditAction.CREATED, type_code, item.code, {"created": self._snapshot(item)})
        return item

    @transaction.atomic
    def update_item(self, actor, item_id, **fields) -> MasterDataItem:
        item = self.repository.get_item_by_id(item_id)
        if not item:
            raise ResourceNotFoundError("Master data item not found.")

        if "code" in fields and fields["code"] != item.code:
            if self.repository.get_item(item.type.code, fields["code"]):
                raise ConflictError(f"An item with code '{fields['code']}' already exists in {item.type.code}.")

        before = self._snapshot(item)
        for field, value in fields.items():
            if field in AUDITED_FIELDS:
                setattr(item, field, value)
        item.save()

        changes = self._diff(before, self._snapshot(item))
        if changes:
            self._log(actor, AuditAction.UPDATED, item.type.code, item.code, changes)
        return item

    @transaction.atomic
    def set_active(self, actor, item_id, *, active: bool) -> MasterDataItem:
        item = self.repository.get_item_by_id(item_id)
        if not item:
            raise ResourceNotFoundError("Master data item not found.")
        if item.is_active == active:
            return item
        item.is_active = active
        item.save(update_fields=["is_active", "updated_at"])
        self._log(actor, AuditAction.ACTIVATED if active else AuditAction.DEACTIVATED, item.type.code, item.code)
        return item

    @transaction.atomic
    def delete_item(self, actor, item_id) -> None:
        item = self.repository.get_item_by_id(item_id)
        if not item:
            raise ResourceNotFoundError("Master data item not found.")
        type_code, code = item.type.code, item.code
        item.delete()  # BaseModel soft delete
        self._log(actor, AuditAction.DELETED, type_code, code)

    # ---------------------------------------------------------------- import / export
    def export_csv(self, *, type_code: str | None = None) -> str:
        buffer = io.StringIO()
        writer = csv.writer(buffer)
        writer.writerow(EXPORT_COLUMNS)
        for item in self.repository.list_items_admin(type_code=type_code):
            writer.writerow(
                [
                    item.type.code,
                    item.code,
                    item.label,
                    item.description,
                    item.sort_order,
                    "1" if item.is_active else "0",
                    __import__("json").dumps(item.metadata) if item.metadata else "",
                ]
            )
        return buffer.getvalue()

    @transaction.atomic
    def import_csv(self, actor, file_bytes: bytes) -> dict:
        """Upsert rows by (type_code, code). Unknown types are reported, not
        silently created — the type registry stays deliberate."""
        import json

        try:
            text = file_bytes.decode("utf-8-sig")
        except UnicodeDecodeError as exc:
            raise ApplicationError("The file must be UTF-8 encoded CSV.") from exc

        reader = csv.DictReader(io.StringIO(text))
        required = {"type_code", "code", "label"}
        if not reader.fieldnames or not required.issubset(set(reader.fieldnames)):
            raise ApplicationError("CSV must include columns: type_code, code, label.")

        created = updated = 0
        errors: list[str] = []
        types_cache: dict[str, MasterDataType | None] = {}

        for line_number, row in enumerate(reader, start=2):
            type_code = (row.get("type_code") or "").strip()
            code = (row.get("code") or "").strip()
            label = (row.get("label") or "").strip()
            if not type_code or not code or not label:
                errors.append(f"Line {line_number}: type_code, code and label are required.")
                continue

            if type_code not in types_cache:
                types_cache[type_code] = self.repository.get_type_by_code(type_code)
            data_type = types_cache[type_code]
            if not data_type:
                errors.append(f"Line {line_number}: unknown type '{type_code}'.")
                continue

            metadata = {}
            raw_metadata = (row.get("metadata") or "").strip()
            if raw_metadata:
                try:
                    metadata = json.loads(raw_metadata)
                except json.JSONDecodeError:
                    errors.append(f"Line {line_number}: metadata is not valid JSON.")
                    continue

            defaults = {
                "label": label,
                "description": (row.get("description") or "").strip(),
                "sort_order": int(row.get("sort_order") or 0),
                "is_active": (row.get("is_active") or "1").strip() not in ("0", "false", "False"),
                "metadata": metadata,
            }
            _, was_created = MasterDataItem.objects.update_or_create(type=data_type, code=code, defaults=defaults)
            created += int(was_created)
            updated += int(not was_created)

        self._log(actor, AuditAction.IMPORTED, type_code="*", changes={"created": created, "updated": updated, "errors": len(errors)})
        return {"created": created, "updated": updated, "errors": errors}


# ---------------------------------------------------------------------------
# Validation helper for other apps (ADR-001 migration strategy): serializers
# validate vocabulary fields against ACTIVE items instead of code enums.
# ---------------------------------------------------------------------------

def validate_master_code(type_code: str, value: str, *, allow_blank: bool = False) -> str:
    if not value:
        if allow_blank:
            return value
        raise ApplicationError(f"A value is required for {type_code}.")
    if value not in MasterDataRepository().active_codes(type_code):
        raise ApplicationError(f"'{value}' is not an active {type_code.replace('_', ' ')} option.")
    return value
