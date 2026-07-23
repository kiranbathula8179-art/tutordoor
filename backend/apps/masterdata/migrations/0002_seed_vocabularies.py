"""Data migration: seed the vocabulary registry so `migrate` alone leaves
every environment — including test databases — with valid master data for
serializer validation (ADR-001 rollout ⑤)."""

from django.db import migrations

from apps.masterdata.seed_data import apply_seed


def seed_forward(apps, schema_editor):
    apply_seed(apps.get_model("masterdata", "MasterDataType"), apps.get_model("masterdata", "MasterDataItem"))


class Migration(migrations.Migration):

    dependencies = [("masterdata", "0001_initial")]

    operations = [migrations.RunPython(seed_forward, migrations.RunPython.noop)]
