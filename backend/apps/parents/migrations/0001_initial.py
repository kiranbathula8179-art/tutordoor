import uuid

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("users", "0001_initial"),
        ("students", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="ParentProfile",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("occupation", models.CharField(blank=True, max_length=150)),
                ("city", models.CharField(blank=True, max_length=100)),
                ("preferred_contact_method", models.CharField(choices=[("email", "Email"), ("sms", "SMS"), ("whatsapp", "WhatsApp")], default="email", max_length=20)),
                ("receives_progress_reports", models.BooleanField(default=True)),
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="parent_profile", to="users.user")),
            ],
            options={"db_table": "parent_profiles"},
        ),
        migrations.CreateModel(
            name="ParentStudentLink",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("relationship", models.CharField(choices=[("father", "Father"), ("mother", "Mother"), ("guardian", "Guardian"), ("other", "Other")], default="guardian", max_length=20)),
                ("status", models.CharField(choices=[("pending", "Pending Confirmation"), ("active", "Active"), ("revoked", "Revoked")], default="pending", max_length=20)),
                ("can_manage_bookings", models.BooleanField(default=True)),
                ("can_manage_payments", models.BooleanField(default=True)),
                ("can_view_progress", models.BooleanField(default=True)),
                ("confirmation_token", models.CharField(blank=True, db_index=True, max_length=64)),
                ("confirmed_at", models.DateTimeField(blank=True, null=True)),
                ("parent", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="student_links", to="parents.parentprofile")),
                ("student", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="parent_links", to="students.studentprofile")),
            ],
            options={"db_table": "parent_student_links"},
        ),
        migrations.AddConstraint(
            model_name="parentstudentlink",
            constraint=models.UniqueConstraint(fields=("parent", "student"), name="unique_parent_student_link"),
        ),
        migrations.AddIndex(
            model_name="parentstudentlink",
            index=models.Index(fields=["student", "status"], name="parent_link_student_status_idx"),
        ),
    ]
