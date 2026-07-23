"""Seed the master data registry and vocabularies (idempotent):

    python manage.py seed_master_data

The 0002 data migration runs the same seed on `migrate`; this command exists
for demo seeding and manual re-syncs after adding vocabularies to seed_data.
"""

from django.core.management.base import BaseCommand

from apps.masterdata.models import MasterDataItem, MasterDataType
from apps.masterdata.seed_data import apply_seed


class Command(BaseCommand):
    help = "Seed master data types and vocabulary items (idempotent)."

    def handle(self, *args, **options):
        types_ensured, items_created = apply_seed(MasterDataType, MasterDataItem)
        self.stdout.write(
            self.style.SUCCESS(
                f"Master data ready: {types_ensured} types, {items_created} new items "
                f"({MasterDataItem.objects.count()} total)."
            )
        )
