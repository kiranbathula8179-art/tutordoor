"""DRF field for vocabulary values: a CharField validated against ACTIVE
master data items. The database is the choice list — new admin-added values
are instantly valid; deactivated ones instantly stop being accepted."""

from rest_framework import serializers

from apps.masterdata.services.master_service import validate_master_code


class MasterDataSlugField(serializers.CharField):
    def __init__(self, type_code: str, **kwargs):
        self.type_code = type_code
        super().__init__(**kwargs)

    def to_internal_value(self, data):
        value = super().to_internal_value(data)
        if value == "":
            return value  # allow_blank is enforced by CharField itself
        return validate_master_code(self.type_code, value)
