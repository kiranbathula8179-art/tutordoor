import uuid

from django.contrib.postgres.constraints import ExclusionConstraint
from django.contrib.postgres.fields import RangeOperators
from django.db import models
from django.db.models import F, Func, Q

from apps.core.models import BaseModel
from apps.institutes.models import InstituteProfile
from apps.students.models import StudentProfile
from apps.tutors.models import Subject, TutorProfile
from apps.users.models import User


class BookingType(models.TextChoices):
    DEMO = "demo", "Demo Class"
    REGULAR = "regular", "Regular Session"
    INSTITUTE_CLASS = "institute_class", "Institute Class"


class BookingMode(models.TextChoices):
    ONLINE = "online", "Online"
    OFFLINE = "offline", "In-Person"


class BookingStatus(models.TextChoices):
    PENDING_PAYMENT = "pending_payment", "Pending Payment"
    CONFIRMED = "confirmed", "Confirmed"
    IN_PROGRESS = "in_progress", "In Progress"
    COMPLETED = "completed", "Completed"
    CANCELLED = "cancelled", "Cancelled"
    NO_SHOW = "no_show", "No Show"


ACTIVE_BOOKING_STATUSES = [
    BookingStatus.PENDING_PAYMENT,
    BookingStatus.CONFIRMED,
    BookingStatus.IN_PROGRESS,
]


class PaymentStatus(models.TextChoices):
    NOT_REQUIRED = "not_required", "Not Required"
    PENDING = "pending", "Pending"
    PAID = "paid", "Paid"
    REFUNDED = "refunded", "Refunded"
    PARTIALLY_REFUNDED = "partially_refunded", "Partially Refunded"


class Booking(BaseModel):
    """
    Central transactional record of a tutoring session. A Postgres exclusion
    constraint (see Meta.constraints) guarantees at the database level that
    a tutor can never end up with two overlapping active bookings, even
    under concurrent requests — the service layer's availability check is
    the fast path, the DB constraint is the correctness guarantee.
    """

    student = models.ForeignKey(StudentProfile, on_delete=models.PROTECT, related_name="bookings")
    tutor = models.ForeignKey(TutorProfile, on_delete=models.PROTECT, related_name="bookings")
    subject = models.ForeignKey(Subject, on_delete=models.SET_NULL, null=True, blank=True, related_name="bookings")
    institute = models.ForeignKey(
        InstituteProfile, on_delete=models.SET_NULL, null=True, blank=True, related_name="bookings"
    )

    booking_type = models.CharField(max_length=20, choices=BookingType.choices, default=BookingType.REGULAR)
    mode = models.CharField(max_length=10, choices=BookingMode.choices, default=BookingMode.ONLINE)
    status = models.CharField(max_length=20, choices=BookingStatus.choices, default=BookingStatus.PENDING_PAYMENT, db_index=True)

    start_time = models.DateTimeField(db_index=True)
    end_time = models.DateTimeField()

    price = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    currency = models.CharField(max_length=3, default="INR")
    payment_status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.NOT_REQUIRED)

    location = models.CharField(max_length=255, blank=True, help_text="Required for in-person bookings.")

    booked_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name="bookings_made")
    student_notes = models.TextField(blank=True)
    tutor_notes = models.TextField(blank=True, help_text="Private prep notes, visible only to the tutor.")

    cancelled_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="bookings_cancelled")
    cancellation_reason = models.TextField(blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    is_late_cancellation = models.BooleanField(default=False)

    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "bookings"
        indexes = [
            models.Index(fields=["tutor", "start_time"]),
            models.Index(fields=["student", "start_time"]),
            models.Index(fields=["status"]),
        ]
        constraints = [
            models.CheckConstraint(check=Q(end_time__gt=F("start_time")), name="booking_end_after_start"),
            ExclusionConstraint(
                name="prevent_overlapping_tutor_bookings",
                expressions=[
                    (F("tutor"), RangeOperators.EQUAL),
                    (Func(F("start_time"), F("end_time"), function="tstzrange"), RangeOperators.OVERLAPS),
                ],
                condition=Q(status__in=[s.value for s in ACTIVE_BOOKING_STATUSES]),
            ),
        ]

    def __str__(self):
        return f"Booking<{self.tutor_id} x {self.student_id} @ {self.start_time}>"

    @property
    def is_demo(self):
        return self.booking_type == BookingType.DEMO

    @property
    def duration_minutes(self) -> int:
        return int((self.end_time - self.start_time).total_seconds() // 60)


class BookingStatusHistory(BaseModel):
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name="status_history")
    from_status = models.CharField(max_length=20, blank=True)
    to_status = models.CharField(max_length=20)
    changed_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    reason = models.TextField(blank=True)

    class Meta:
        db_table = "booking_status_history"
        ordering = ["created_at"]


class RescheduleStatus(models.TextChoices):
    PENDING = "pending", "Pending Response"
    ACCEPTED = "accepted", "Accepted"
    REJECTED = "rejected", "Rejected"
    WITHDRAWN = "withdrawn", "Withdrawn"


class RescheduleRequest(BaseModel):
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name="reschedule_requests")
    requested_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="reschedule_requests_made")
    proposed_start_time = models.DateTimeField()
    proposed_end_time = models.DateTimeField()
    reason = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=RescheduleStatus.choices, default=RescheduleStatus.PENDING)
    responded_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    responded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "booking_reschedule_requests"
        indexes = [models.Index(fields=["booking", "status"])]


class LiveClassStatus(models.TextChoices):
    SCHEDULED = "scheduled", "Scheduled"
    LIVE = "live", "Live"
    ENDED = "ended", "Ended"


class LiveClassSession(BaseModel):
    """
    A video-conferencing room bound 1:1 to a confirmed booking. Uses Jitsi
    Meet (self-hostable, no per-minute billing) so the platform isn't
    dependent on a paid video API to function at launch.
    """

    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name="live_class_session")
    room_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    provider = models.CharField(max_length=20, default="jitsi")
    status = models.CharField(max_length=20, choices=LiveClassStatus.choices, default=LiveClassStatus.SCHEDULED)
    started_at = models.DateTimeField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    recording_url = models.URLField(blank=True)

    class Meta:
        db_table = "live_class_sessions"

    @property
    def room_name(self) -> str:
        return f"tutordoor-{self.room_id.hex}"


class AttendanceRole(models.TextChoices):
    STUDENT = "student", "Student"
    TUTOR = "tutor", "Tutor"


class SessionAttendance(BaseModel):
    session = models.ForeignKey(LiveClassSession, on_delete=models.CASCADE, related_name="attendance_records")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="session_attendance_records")
    role = models.CharField(max_length=10, choices=AttendanceRole.choices)
    joined_at = models.DateTimeField()
    left_at = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "session_attendance"
        indexes = [models.Index(fields=["session", "user"])]
