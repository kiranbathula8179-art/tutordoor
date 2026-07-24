from django.conf import settings
from django.db import models

from apps.core.models import BaseModel

"""
The Master Data Engine (ADR-001, Decision 2).

One generic registry instead of twenty near-identical lookup tables:
`MasterDataType` declares a vocabulary; `MasterDataItem` holds its values with
ordering, activation, and a metadata JSON pocket for per-type extras (a
notification template's subject/body, a city's state code). Every mutation is
written to `MasterDataAuditLog` with a field-level diff.

State machines (booking/payment status, teaching_mode, ...) deliberately do
NOT live here — see the ADR for why.
"""


class MasterDataType(BaseModel):
    code = models.SlugField(max_length=64, unique=True)
    name = models.CharField(max_length=120)
    description = models.TextField(blank=True)
    # System types are seeded by code and cannot be deleted from the admin UI;
    # their ITEMS remain fully manageable.
    is_system = models.BooleanField(default=False)

    class Meta:
        db_table = "master_data_types"
        ordering = ("name",)

    def __str__(self) -> str:
        return f"{self.name} ({self.code})"


class MasterDataItem(BaseModel):
    type = models.ForeignKey(MasterDataType, on_delete=models.CASCADE, related_name="items")
    code = models.SlugField(max_length=64)
    label = models.CharField(max_length=160)
    description = models.CharField(max_length=255, blank=True)
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "master_data_items"
        ordering = ("sort_order", "label")
        constraints = [
            models.UniqueConstraint(fields=("type", "code"), name="uniq_masterdata_type_code"),
        ]

    def __str__(self) -> str:
        return f"{self.type.code}:{self.code}"


class AuditAction(models.TextChoices):
    CREATED = "created", "Created"
    UPDATED = "updated", "Updated"
    ACTIVATED = "activated", "Activated"
    DEACTIVATED = "deactivated", "Deactivated"
    DELETED = "deleted", "Deleted"
    IMPORTED = "imported", "Imported"


class MasterDataAuditLog(BaseModel):
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="masterdata_audit_entries",
    )
    action = models.CharField(max_length=16, choices=AuditAction.choices)
    type_code = models.CharField(max_length=64)
    item_code = models.CharField(max_length=64, blank=True)
    # {"field": {"from": ..., "to": ...}} — or {"count": n} for imports.
    changes = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "master_data_audit_log"
        ordering = ("-created_at",)

    def __str__(self) -> str:
        return f"{self.action} {self.type_code}:{self.item_code}"
