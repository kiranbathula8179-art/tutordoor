import uuid

import django.core.validators
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("students", "0001_initial"),
        ("tutors", "0001_initial"),
        ("bookings", "0001_initial"),
        ("courses", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="TutorReview",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("rating", models.PositiveSmallIntegerField(validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(5)])),
                ("comment", models.TextField(blank=True)),
                ("tutor_response", models.TextField(blank=True)),
                ("tutor_response_at", models.DateTimeField(blank=True, null=True)),
                ("is_flagged", models.BooleanField(default=False)),
                ("flagged_reason", models.CharField(blank=True, max_length=255)),
                ("booking", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="review", to="bookings.booking")),
                ("student", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="tutor_reviews_written", to="students.studentprofile")),
                ("tutor", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="reviews", to="tutors.tutorprofile")),
            ],
            options={"db_table": "tutor_reviews"},
        ),
        migrations.CreateModel(
            name="CourseReview",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("rating", models.PositiveSmallIntegerField(validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(5)])),
                ("comment", models.TextField(blank=True)),
                ("tutor_response", models.TextField(blank=True)),
                ("tutor_response_at", models.DateTimeField(blank=True, null=True)),
                ("is_flagged", models.BooleanField(default=False)),
                ("flagged_reason", models.CharField(blank=True, max_length=255)),
                ("course", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="reviews", to="courses.course")),
                ("enrollment", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="review", to="courses.courseenrollment")),
                ("student", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="course_reviews_written", to="students.studentprofile")),
            ],
            options={"db_table": "course_reviews"},
        ),
        migrations.AddIndex(
            model_name="tutorreview",
            index=models.Index(fields=["tutor", "is_flagged"], name="tutor_review_tutor_flag_idx"),
        ),
        migrations.AddIndex(
            model_name="coursereview",
            index=models.Index(fields=["course", "is_flagged"], name="course_review_course_flag_idx"),
        ),
    ]
