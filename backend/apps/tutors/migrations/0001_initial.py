import uuid

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("users", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="SubjectCategory",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("name", models.CharField(max_length=100, unique=True)),
                ("slug", models.SlugField(max_length=110, unique=True)),
                ("icon", models.CharField(blank=True, max_length=50)),
                ("display_order", models.PositiveSmallIntegerField(default=0)),
            ],
            options={
                "db_table": "subject_categories",
                "verbose_name_plural": "Subject Categories",
                "ordering": ["display_order", "name"],
            },
        ),
        migrations.CreateModel(
            name="Subject",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("name", models.CharField(max_length=120)),
                ("slug", models.SlugField(max_length=140, unique=True)),
                ("description", models.TextField(blank=True)),
                ("is_active", models.BooleanField(default=True)),
                ("category", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="subjects", to="tutors.subjectcategory")),
            ],
            options={"db_table": "subjects", "ordering": ["name"]},
        ),
        migrations.CreateModel(
            name="TutorProfile",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("headline", models.CharField(blank=True, max_length=150)),
                ("bio", models.TextField(blank=True)),
                ("education", models.CharField(blank=True, max_length=255)),
                ("experience_years", models.PositiveSmallIntegerField(default=0)),
                ("hourly_rate", models.DecimalField(decimal_places=2, max_digits=8)),
                ("currency", models.CharField(default="INR", max_length=3)),
                ("teaching_mode", models.CharField(choices=[("online", "Online"), ("offline", "In-Person"), ("both", "Online & In-Person")], default="online", max_length=10)),
                ("languages", models.JSONField(blank=True, default=list)),
                ("intro_video_url", models.URLField(blank=True)),
                ("address", models.CharField(blank=True, max_length=255)),
                ("city", models.CharField(blank=True, db_index=True, max_length=100)),
                ("state", models.CharField(blank=True, max_length=100)),
                ("country", models.CharField(blank=True, default="India", max_length=100)),
                ("latitude", models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
                ("longitude", models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
                ("travel_radius_km", models.PositiveSmallIntegerField(default=10)),
                ("verification_status", models.CharField(choices=[("not_submitted", "Not Submitted"), ("pending", "Pending Review"), ("verified", "Verified"), ("rejected", "Rejected")], db_index=True, default="not_submitted", max_length=20)),
                ("verified_at", models.DateTimeField(blank=True, null=True)),
                ("rejection_reason", models.TextField(blank=True)),
                ("rating_average", models.DecimalField(decimal_places=2, default=0, max_digits=3)),
                ("rating_count", models.PositiveIntegerField(default=0)),
                ("total_sessions_completed", models.PositiveIntegerField(default=0)),
                ("response_time_minutes", models.PositiveIntegerField(default=60)),
                ("is_featured", models.BooleanField(default=False)),
                ("is_accepting_students", models.BooleanField(default=True)),
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="tutor_profile", to="users.user")),
                ("verified_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="tutors_verified", to="users.user")),
            ],
            options={"db_table": "tutor_profiles"},
        ),
        migrations.CreateModel(
            name="TutorSubject",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("expertise_level", models.CharField(choices=[("beginner", "Beginner"), ("intermediate", "Intermediate"), ("advanced", "Advanced"), ("all_levels", "All Levels")], default="all_levels", max_length=20)),
                ("years_experience", models.PositiveSmallIntegerField(default=0)),
                ("subject", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="tutor_subjects", to="tutors.subject")),
                ("tutor", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="tutor_subjects", to="tutors.tutorprofile")),
            ],
            options={"db_table": "tutor_subjects"},
        ),
        migrations.AddField(
            model_name="tutorprofile",
            name="subjects",
            field=models.ManyToManyField(related_name="tutors", through="tutors.TutorSubject", to="tutors.subject"),
        ),
        migrations.CreateModel(
            name="VerificationDocument",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("document_type", models.CharField(choices=[("government_id", "Government ID"), ("degree_certificate", "Degree Certificate"), ("experience_letter", "Experience Letter"), ("police_verification", "Police Verification"), ("address_proof", "Address Proof")], max_length=30)),
                ("file", models.FileField(upload_to="verification_documents/%Y/%m/")),
                ("status", models.CharField(choices=[("pending", "Pending Review"), ("approved", "Approved"), ("rejected", "Rejected")], default="pending", max_length=20)),
                ("admin_notes", models.TextField(blank=True)),
                ("reviewed_at", models.DateTimeField(blank=True, null=True)),
                ("reviewed_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="documents_reviewed", to="users.user")),
                ("tutor", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="verification_documents", to="tutors.tutorprofile")),
            ],
            options={"db_table": "tutor_verification_documents"},
        ),
        migrations.CreateModel(
            name="WeeklyAvailability",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("day_of_week", models.PositiveSmallIntegerField(choices=[(0, "Monday"), (1, "Tuesday"), (2, "Wednesday"), (3, "Thursday"), (4, "Friday"), (5, "Saturday"), (6, "Sunday")])),
                ("start_time", models.TimeField()),
                ("end_time", models.TimeField()),
                ("is_active", models.BooleanField(default=True)),
                ("tutor", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="weekly_availability", to="tutors.tutorprofile")),
            ],
            options={"db_table": "tutor_weekly_availability", "ordering": ["day_of_week", "start_time"]},
        ),
        migrations.CreateModel(
            name="AvailabilityException",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("date", models.DateField(db_index=True)),
                ("is_available", models.BooleanField(default=False)),
                ("start_time", models.TimeField(blank=True, null=True)),
                ("end_time", models.TimeField(blank=True, null=True)),
                ("reason", models.CharField(blank=True, max_length=255)),
                ("tutor", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="availability_exceptions", to="tutors.tutorprofile")),
            ],
            options={"db_table": "tutor_availability_exceptions"},
        ),
        migrations.AddConstraint(
            model_name="tutorsubject",
            constraint=models.UniqueConstraint(fields=("tutor", "subject"), name="unique_tutor_subject"),
        ),
        migrations.AddConstraint(
            model_name="weeklyavailability",
            constraint=models.CheckConstraint(check=models.Q(("end_time__gt", models.F("start_time"))), name="availability_end_after_start"),
        ),
        migrations.AddConstraint(
            model_name="availabilityexception",
            constraint=models.UniqueConstraint(fields=("tutor", "date", "start_time"), name="unique_tutor_date_exception"),
        ),
        migrations.AddIndex(
            model_name="subject",
            index=models.Index(fields=["category", "is_active"], name="subjects_cat_active_idx"),
        ),
        migrations.AddIndex(
            model_name="tutorprofile",
            index=models.Index(fields=["verification_status", "is_accepting_students"], name="tutor_verif_accept_idx"),
        ),
        migrations.AddIndex(
            model_name="tutorprofile",
            index=models.Index(fields=["city"], name="tutor_city_idx"),
        ),
        migrations.AddIndex(
            model_name="tutorprofile",
            index=models.Index(fields=["rating_average"], name="tutor_rating_idx"),
        ),
        migrations.AddIndex(
            model_name="verificationdocument",
            index=models.Index(fields=["tutor", "status"], name="verif_doc_tutor_status_idx"),
        ),
        migrations.AddIndex(
            model_name="weeklyavailability",
            index=models.Index(fields=["tutor", "day_of_week", "is_active"], name="weekly_avail_tutor_day_idx"),
        ),
        migrations.AddIndex(
            model_name="availabilityexception",
            index=models.Index(fields=["tutor", "date"], name="avail_exception_tutor_date_idx"),
        ),
    ]
