import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="MasterDataType",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("code", models.SlugField(max_length=64, unique=True)),
                ("name", models.CharField(max_length=120)),
                ("description", models.TextField(blank=True)),
                ("is_system", models.BooleanField(default=False)),
            ],
            options={"db_table": "master_data_types", "ordering": ("name",)},
        ),
        migrations.CreateModel(
            name="MasterDataItem",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("code", models.SlugField(max_length=64)),
                ("label", models.CharField(max_length=160)),
                ("description", models.CharField(blank=True, max_length=255)),
                ("sort_order", models.PositiveIntegerField(default=0)),
                ("is_active", models.BooleanField(default=True)),
                ("metadata", models.JSONField(blank=True, default=dict)),
                (
                    "type",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="items",
                        to="masterdata.masterdatatype",
                    ),
                ),
            ],
            options={"db_table": "master_data_items", "ordering": ("sort_order", "label")},
        ),
        migrations.CreateModel(
            name="MasterDataAuditLog",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                (
                    "action",
                    models.CharField(
                        choices=[
                            ("created", "Created"),
                            ("updated", "Updated"),
                            ("activated", "Activated"),
                            ("deactivated", "Deactivated"),
                            ("deleted", "Deleted"),
                            ("imported", "Imported"),
                        ],
                        max_length=16,
                    ),
                ),
                ("type_code", models.CharField(max_length=64)),
                ("item_code", models.CharField(blank=True, max_length=64)),
                ("changes", models.JSONField(blank=True, default=dict)),
                (
                    "actor",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="masterdata_audit_entries",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={"db_table": "master_data_audit_log", "ordering": ("-created_at",)},
        ),
        migrations.AddConstraint(
            model_name="masterdataitem",
            constraint=models.UniqueConstraint(fields=("type", "code"), name="uniq_masterdata_type_code"),
        ),
    ]
