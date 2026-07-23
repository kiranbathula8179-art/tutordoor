import uuid

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("users", "0001_initial"),
        ("tutors", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="StudentProfile",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("date_of_birth", models.DateField(blank=True, null=True)),
                ("grade_level", models.CharField(choices=[("primary", "Primary School (1-5)"), ("middle", "Middle School (6-8)"), ("secondary", "Secondary School (9-10)"), ("senior_secondary", "Senior Secondary (11-12)"), ("undergraduate", "Undergraduate"), ("graduate", "Graduate"), ("professional", "Working Professional"), ("other", "Other")], default="other", max_length=20)),
                ("school_name", models.CharField(blank=True, max_length=255)),
                ("learning_goals", models.TextField(blank=True)),
                ("preferred_learning_mode", models.CharField(choices=[("online", "Online"), ("offline", "In-Person"), ("both", "Online & In-Person")], default="online", max_length=10)),
                ("city", models.CharField(blank=True, db_index=True, max_length=100)),
                ("state", models.CharField(blank=True, max_length=100)),
                ("country", models.CharField(blank=True, default="India", max_length=100)),
                ("latitude", models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
                ("longitude", models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
                ("total_sessions_completed", models.PositiveIntegerField(default=0)),
                ("total_hours_learned", models.DecimalField(decimal_places=2, default=0, max_digits=8)),
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="student_profile", to="users.user")),
            ],
            options={"db_table": "student_profiles"},
        ),
        migrations.CreateModel(
            name="StudentSubjectInterest",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("current_level", models.CharField(choices=[("beginner", "Beginner"), ("intermediate", "Intermediate"), ("advanced", "Advanced"), ("all_levels", "All Levels")], default="beginner", max_length=20)),
                ("student", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="subject_interests", to="students.studentprofile")),
                ("subject", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="interested_student_links", to="tutors.subject")),
            ],
            options={"db_table": "student_subject_interests"},
        ),
        migrations.AddField(
            model_name="studentprofile",
            name="preferred_subjects",
            field=models.ManyToManyField(related_name="interested_students", through="students.StudentSubjectInterest", to="tutors.subject"),
        ),
        migrations.AddConstraint(
            model_name="studentsubjectinterest",
            constraint=models.UniqueConstraint(fields=("student", "subject"), name="unique_student_subject_interest"),
        ),
        migrations.AddIndex(
            model_name="studentprofile",
            index=models.Index(fields=["grade_level"], name="student_grade_level_idx"),
        ),
        migrations.AddIndex(
            model_name="studentprofile",
            index=models.Index(fields=["city"], name="student_city_idx"),
        ),
    ]
