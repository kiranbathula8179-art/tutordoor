from rest_framework import serializers

from apps.masterdata.models import MasterDataAuditLog, MasterDataItem, MasterDataType


class MasterDataItemPublicSerializer(serializers.ModelSerializer):
    """What dropdowns consume: value/label plus metadata for richer widgets."""

    value = serializers.CharField(source="code", read_only=True)

    class Meta:
        model = MasterDataItem
        fields = ("value", "label", "description", "sort_order", "metadata")
        read_only_fields = fields


class MasterDataTypeSerializer(serializers.ModelSerializer):
    item_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = MasterDataType
        fields = ("id", "code", "name", "description", "is_system", "item_count")
        read_only_fields = fields


class MasterDataItemAdminSerializer(serializers.ModelSerializer):
    type_code = serializers.CharField(source="type.code", read_only=True)
    type_name = serializers.CharField(source="type.name", read_only=True)

    class Meta:
        model = MasterDataItem
        fields = (
            "id", "type_code", "type_name", "code", "label", "description",
            "sort_order", "is_active", "metadata", "created_at", "updated_at",
        )
        read_only_fields = ("id", "type_code", "type_name", "created_at", "updated_at")


class MasterDataItemWriteSerializer(serializers.Serializer):
    code = serializers.SlugField(max_length=64)
    label = serializers.CharField(max_length=160)
    description = serializers.CharField(max_length=255, required=False, allow_blank=True, default="")
    sort_order = serializers.IntegerField(required=False, min_value=0, default=0)
    is_active = serializers.BooleanField(required=False, default=True)
    metadata = serializers.JSONField(required=False, default=dict)


class MasterDataAuditSerializer(serializers.ModelSerializer):
    actor_email = serializers.EmailField(source="actor.email", read_only=True, default=None)

    class Meta:
        model = MasterDataAuditLog
        fields = ("id", "actor_email", "action", "type_code", "item_code", "changes", "created_at")
        read_only_fields = fields
