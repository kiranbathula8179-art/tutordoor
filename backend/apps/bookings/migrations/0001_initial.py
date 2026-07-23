import uuid

import django.db.models.deletion
from django.contrib.postgres.constraints import ExclusionConstraint
from django.contrib.postgres.operations import BtreeGistExtension
from django.db import migrations, models
from django.db.models import F, Func, Q


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("users", "0001_initial"),
        ("students", "0001_initial"),
        ("tutors", "0001_initial"),
        ("institutes", "0001_initial"),
    ]

    operations = [
        # Required for the ExclusionConstraint below: allows a GiST index to
        # enforce equality (=) on a plain UUID column alongside a range overlap (&&).
        BtreeGistExtension(),
        migrations.CreateModel(
            name="Booking",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("booking_type", models.CharField(choices=[("demo", "Demo Class"), ("regular", "Regular Session"), ("institute_class", "Institute Class")], default="regular", max_length=20)),
                ("mode", models.CharField(choices=[("online", "Online"), ("offline", "In-Person")], default="online", max_length=10)),
                ("status", models.CharField(choices=[("pending_payment", "Pending Payment"), ("confirmed", "Confirmed"), ("in_progress", "In Progress"), ("completed", "Completed"), ("cancelled", "Cancelled"), ("no_show", "No Show")], db_index=True, default="pending_payment", max_length=20)),
                ("start_time", models.DateTimeField(db_index=True)),
                ("end_time", models.DateTimeField()),
                ("price", models.DecimalField(decimal_places=2, default=0, max_digits=8)),
                ("currency", models.CharField(default="INR", max_length=3)),
                ("payment_status", models.CharField(choices=[("not_required", "Not Required"), ("pending", "Pending"), ("paid", "Paid"), ("refunded", "Refunded"), ("partially_refunded", "Partially Refunded")], default="not_required", max_length=20)),
                ("location", models.CharField(blank=True, max_length=255)),
                ("student_notes", models.TextField(blank=True)),
                ("tutor_notes", models.TextField(blank=True)),
                ("cancellation_reason", models.TextField(blank=True)),
                ("cancelled_at", models.DateTimeField(blank=True, null=True)),
                ("is_late_cancellation", models.BooleanField(default=False)),
                ("completed_at", models.DateTimeField(blank=True, null=True)),
                ("booked_by", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="bookings_made", to="users.user")),
                ("cancelled_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="bookings_cancelled", to="users.user")),
                ("institute", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="bookings", to="institutes.instituteprofile")),
                ("student", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="bookings", to="students.studentprofile")),
                ("subject", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="bookings", to="tutors.subject")),
                ("tutor", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="bookings", to="tutors.tutorprofile")),
            ],
            options={"db_table": "bookings"},
        ),
        migrations.CreateModel(
            name="BookingStatusHistory",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("from_status", models.CharField(blank=True, max_length=20)),
                ("to_status", models.CharField(max_length=20)),
                ("reason", models.TextField(blank=True)),
                ("booking", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="status_history", to="bookings.booking")),
                ("changed_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="+", to="users.user")),
            ],
            options={"db_table": "booking_status_history", "ordering": ["created_at"]},
        ),
        migrations.CreateModel(
            name="RescheduleRequest",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("proposed_start_time", models.DateTimeField()),
                ("proposed_end_time", models.DateTimeField()),
                ("reason", models.TextField(blank=True)),
                ("status", models.CharField(choices=[("pending", "Pending Response"), ("accepted", "Accepted"), ("rejected", "Rejected"), ("withdrawn", "Withdrawn")], default="pending", max_length=20)),
                ("responded_at", models.DateTimeField(blank=True, null=True)),
                ("booking", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="reschedule_requests", to="bookings.booking")),
                ("requested_by", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="reschedule_requests_made", to="users.user")),
                ("responded_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="+", to="users.user")),
            ],
            options={"db_table": "booking_reschedule_requests"},
        ),
        migrations.CreateModel(
            name="LiveClassSession",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("room_id", models.UUIDField(default=uuid.uuid4, editable=False, unique=True)),
                ("provider", models.CharField(default="jitsi", max_length=20)),
                ("status", models.CharField(choices=[("scheduled", "Scheduled"), ("live", "Live"), ("ended", "Ended")], default="scheduled", max_length=20)),
                ("started_at", models.DateTimeField(blank=True, null=True)),
                ("ended_at", models.DateTimeField(blank=True, null=True)),
                ("recording_url", models.URLField(blank=True)),
                ("booking", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="live_class_session", to="bookings.booking")),
            ],
            options={"db_table": "live_class_sessions"},
        ),
        migrations.CreateModel(
            name="SessionAttendance",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("role", models.CharField(choices=[("student", "Student"), ("tutor", "Tutor")], max_length=10)),
                ("joined_at", models.DateTimeField()),
                ("left_at", models.DateTimeField(blank=True, null=True)),
                ("duration_seconds", models.PositiveIntegerField(default=0)),
                ("session", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="attendance_records", to="bookings.liveclasssession")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="session_attendance_records", to="users.user")),
            ],
            options={"db_table": "session_attendance"},
        ),
        migrations.AddConstraint(
            model_name="booking",
            constraint=models.CheckConstraint(check=Q(end_time__gt=F("start_time")), name="booking_end_after_start"),
        ),
        migrations.AddConstraint(
            model_name="booking",
            constraint=ExclusionConstraint(
                name="prevent_overlapping_tutor_bookings",
                expressions=[
                    (F("tutor"), "="),
                    (Func(F("start_time"), F("end_time"), function="tstzrange"), "&&"),
                ],
                condition=Q(status__in=["pending_payment", "confirmed", "in_progress"]),
            ),
        ),
        migrations.AddIndex(
            model_name="booking",
            index=models.Index(fields=["tutor", "start_time"], name="booking_tutor_start_idx"),
        ),
        migrations.AddIndex(
            model_name="booking",
            index=models.Index(fields=["student", "start_time"], name="booking_student_start_idx"),
        ),
        migrations.AddIndex(
            model_name="booking",
            index=models.Index(fields=["status"], name="booking_status_idx"),
        ),
        migrations.AddIndex(
            model_name="bookingstatushistory",
            index=models.Index(fields=["booking"], name="booking_history_booking_idx"),
        ),
        migrations.AddIndex(
            model_name="reschedulerequest",
            index=models.Index(fields=["booking", "status"], name="reschedule_booking_status_idx"),
        ),
        migrations.AddIndex(
            model_name="sessionattendance",
            index=models.Index(fields=["session", "user"], name="attendance_session_user_idx"),
        ),
    ]
