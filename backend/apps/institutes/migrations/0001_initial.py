import uuid

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("users", "0001_initial"),
        ("tutors", "0001_initial"),
        ("students", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="InstituteProfile",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("institute_name", models.CharField(max_length=255)),
                ("registration_number", models.CharField(blank=True, max_length=100)),
                ("description", models.TextField(blank=True)),
                ("logo", models.ImageField(blank=True, null=True, upload_to="institute_logos/%Y/%m/")),
                ("website", models.URLField(blank=True)),
                ("established_year", models.PositiveSmallIntegerField(blank=True, null=True)),
                ("address", models.CharField(blank=True, max_length=255)),
                ("city", models.CharField(blank=True, db_index=True, max_length=100)),
                ("state", models.CharField(blank=True, max_length=100)),
                ("country", models.CharField(blank=True, default="India", max_length=100)),
                ("latitude", models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
                ("longitude", models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
                ("verification_status", models.CharField(choices=[("not_submitted", "Not Submitted"), ("pending", "Pending Review"), ("verified", "Verified"), ("rejected", "Rejected")], db_index=True, default="not_submitted", max_length=20)),
                ("verified_at", models.DateTimeField(blank=True, null=True)),
                ("rejection_reason", models.TextField(blank=True)),
                ("rating_average", models.DecimalField(decimal_places=2, default=0, max_digits=3)),
                ("rating_count", models.PositiveIntegerField(default=0)),
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="institute_profile", to="users.user")),
                ("verified_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="institutes_verified", to="users.user")),
            ],
            options={"db_table": "institute_profiles"},
        ),
        migrations.CreateModel(
            name="InstituteTutor",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("role_title", models.CharField(blank=True, max_length=100)),
                ("status", models.CharField(choices=[("pending", "Pending"), ("active", "Active"), ("removed", "Removed")], default="pending", max_length=20)),
                ("joined_at", models.DateTimeField(blank=True, null=True)),
                ("institute", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="tutor_links", to="institutes.instituteprofile")),
                ("tutor", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="institute_links", to="tutors.tutorprofile")),
            ],
            options={"db_table": "institute_tutors"},
        ),
        migrations.CreateModel(
            name="InstituteStudentEnrollment",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("status", models.CharField(choices=[("active", "Active"), ("completed", "Completed"), ("withdrawn", "Withdrawn")], default="active", max_length=20)),
                ("enrolled_at", models.DateTimeField(auto_now_add=True)),
                ("notes", models.TextField(blank=True)),
                ("institute", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="student_enrollments", to="institutes.instituteprofile")),
                ("student", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="institute_enrollments", to="students.studentprofile")),
            ],
            options={"db_table": "institute_student_enrollments"},
        ),
        migrations.AddConstraint(
            model_name="institutetutor",
            constraint=models.UniqueConstraint(fields=("institute", "tutor"), name="unique_institute_tutor"),
        ),
        migrations.AddConstraint(
            model_name="institutestudentenrollment",
            constraint=models.UniqueConstraint(fields=("institute", "student"), name="unique_institute_student_enrollment"),
        ),
        migrations.AddIndex(
            model_name="instituteprofile",
            index=models.Index(fields=["verification_status"], name="institute_verif_status_idx"),
        ),
        migrations.AddIndex(
            model_name="instituteprofile",
            index=models.Index(fields=["city"], name="institute_city_idx"),
        ),
        migrations.AddIndex(
            model_name="institutetutor",
            index=models.Index(fields=["institute", "status"], name="institute_tutor_status_idx"),
        ),
        migrations.AddIndex(
            model_name="institutestudentenrollment",
            index=models.Index(fields=["institute", "status"], name="institute_enroll_status_idx"),
        ),
    ]
