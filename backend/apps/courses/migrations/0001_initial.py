import uuid

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("users", "0001_initial"),
        ("students", "0001_initial"),
        ("tutors", "0001_initial"),
        ("institutes", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Course",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("title", models.CharField(max_length=200)),
                ("slug", models.SlugField(blank=True, max_length=220, unique=True)),
                ("description", models.TextField(blank=True)),
                ("thumbnail", models.ImageField(blank=True, null=True, upload_to="course_thumbnails/%Y/%m/")),
                ("level", models.CharField(choices=[("beginner", "Beginner"), ("intermediate", "Intermediate"), ("advanced", "Advanced"), ("all_levels", "All Levels")], default="all_levels", max_length=20)),
                ("mode", models.CharField(choices=[("online", "Online"), ("offline", "In-Person"), ("both", "Online & In-Person")], default="online", max_length=10)),
                ("total_sessions", models.PositiveSmallIntegerField()),
                ("duration_weeks", models.PositiveSmallIntegerField(default=1)),
                ("max_students", models.PositiveSmallIntegerField(default=1)),
                ("price", models.DecimalField(decimal_places=2, max_digits=9)),
                ("currency", models.CharField(default="INR", max_length=3)),
                ("status", models.CharField(choices=[("draft", "Draft"), ("published", "Published"), ("archived", "Archived")], db_index=True, default="draft", max_length=20)),
                ("start_date", models.DateField(blank=True, null=True)),
                ("end_date", models.DateField(blank=True, null=True)),
                ("rating_average", models.DecimalField(decimal_places=2, default=0, max_digits=3)),
                ("rating_count", models.PositiveIntegerField(default=0)),
                ("created_by", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="courses_created", to="users.user")),
                ("institute", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="courses", to="institutes.instituteprofile")),
                ("subject", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="courses", to="tutors.subject")),
                ("tutor", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="courses", to="tutors.tutorprofile")),
            ],
            options={"db_table": "courses"},
        ),
        migrations.CreateModel(
            name="CourseSession",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("session_number", models.PositiveSmallIntegerField()),
                ("title", models.CharField(blank=True, max_length=200)),
                ("description", models.TextField(blank=True)),
                ("scheduled_start", models.DateTimeField()),
                ("scheduled_end", models.DateTimeField()),
                ("status", models.CharField(choices=[("scheduled", "Scheduled"), ("live", "Live"), ("completed", "Completed"), ("cancelled", "Cancelled")], default="scheduled", max_length=20)),
                ("room_id", models.UUIDField(default=uuid.uuid4, editable=False, unique=True)),
                ("started_at", models.DateTimeField(blank=True, null=True)),
                ("ended_at", models.DateTimeField(blank=True, null=True)),
                ("recording_url", models.URLField(blank=True)),
                ("course", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="sessions", to="courses.course")),
            ],
            options={"db_table": "course_sessions", "ordering": ["session_number"]},
        ),
        migrations.CreateModel(
            name="CourseEnrollment",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("status", models.CharField(choices=[("pending_payment", "Pending Payment"), ("active", "Active"), ("completed", "Completed"), ("dropped", "Dropped")], default="pending_payment", max_length=20)),
                ("progress_percent", models.DecimalField(decimal_places=2, default=0, max_digits=5)),
                ("enrolled_at", models.DateTimeField(auto_now_add=True)),
                ("completed_at", models.DateTimeField(blank=True, null=True)),
                ("course", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="enrollments", to="courses.course")),
                ("student", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="course_enrollments", to="students.studentprofile")),
            ],
            options={"db_table": "course_enrollments"},
        ),
        migrations.CreateModel(
            name="Assignment",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("title", models.CharField(max_length=200)),
                ("instructions", models.TextField(blank=True)),
                ("attachment", models.FileField(blank=True, null=True, upload_to="assignment_attachments/%Y/%m/")),
                ("max_score", models.PositiveSmallIntegerField(default=100)),
                ("due_at", models.DateTimeField()),
                ("course", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="assignments", to="courses.course")),
                ("created_by", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="assignments_created", to="users.user")),
                ("session", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="assignments", to="courses.coursesession")),
            ],
            options={"db_table": "assignments"},
        ),
        migrations.CreateModel(
            name="AssignmentSubmission",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("text_answer", models.TextField(blank=True)),
                ("attachment", models.FileField(blank=True, null=True, upload_to="submission_attachments/%Y/%m/")),
                ("submitted_at", models.DateTimeField(auto_now_add=True)),
                ("status", models.CharField(choices=[("submitted", "Submitted"), ("late", "Submitted Late"), ("graded", "Graded")], default="submitted", max_length=20)),
                ("score", models.PositiveSmallIntegerField(blank=True, null=True)),
                ("feedback", models.TextField(blank=True)),
                ("graded_at", models.DateTimeField(blank=True, null=True)),
                ("assignment", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="submissions", to="courses.assignment")),
                ("graded_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="submissions_graded", to="users.user")),
                ("student", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="assignment_submissions", to="students.studentprofile")),
            ],
            options={"db_table": "assignment_submissions"},
        ),
        migrations.CreateModel(
            name="CourseAttendance",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("status", models.CharField(choices=[("present", "Present"), ("absent", "Absent"), ("late", "Late"), ("excused", "Excused")], default="absent", max_length=20)),
                ("joined_at", models.DateTimeField(blank=True, null=True)),
                ("left_at", models.DateTimeField(blank=True, null=True)),
                ("marked_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="+", to="users.user")),
                ("session", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="attendance_records", to="courses.coursesession")),
                ("student", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="course_attendance_records", to="students.studentprofile")),
            ],
            options={"db_table": "course_attendance"},
        ),
        migrations.AddConstraint(
            model_name="coursesession",
            constraint=models.UniqueConstraint(fields=("course", "session_number"), name="unique_course_session_number"),
        ),
        migrations.AddConstraint(
            model_name="courseenrollment",
            constraint=models.UniqueConstraint(fields=("course", "student"), name="unique_course_enrollment"),
        ),
        migrations.AddConstraint(
            model_name="assignmentsubmission",
            constraint=models.UniqueConstraint(fields=("assignment", "student"), name="unique_assignment_submission"),
        ),
        migrations.AddConstraint(
            model_name="courseattendance",
            constraint=models.UniqueConstraint(fields=("session", "student"), name="unique_session_student_attendance"),
        ),
        migrations.AddIndex(
            model_name="course",
            index=models.Index(fields=["status", "subject"], name="course_status_subject_idx"),
        ),
        migrations.AddIndex(
            model_name="course",
            index=models.Index(fields=["tutor", "status"], name="course_tutor_status_idx"),
        ),
        migrations.AddIndex(
            model_name="coursesession",
            index=models.Index(fields=["course", "scheduled_start"], name="course_session_start_idx"),
        ),
        migrations.AddIndex(
            model_name="courseenrollment",
            index=models.Index(fields=["course", "status"], name="enrollment_course_status_idx"),
        ),
        migrations.AddIndex(
            model_name="assignment",
            index=models.Index(fields=["course", "due_at"], name="assignment_course_due_idx"),
        ),
        migrations.AddIndex(
            model_name="assignmentsubmission",
            index=models.Index(fields=["assignment", "status"], name="submission_assignment_status_idx"),
        ),
        migrations.AddIndex(
            model_name="courseattendance",
            index=models.Index(fields=["session", "status"], name="attendance_session_status_idx"),
        ),
    ]
