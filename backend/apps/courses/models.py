import uuid

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils.text import slugify

from apps.core.models import BaseModel
from apps.institutes.models import InstituteProfile
from apps.students.models import StudentProfile
from apps.tutors.models import ExpertiseLevel, Subject, TeachingMode, TutorProfile
from apps.users.models import User


class CourseStatus(models.TextChoices):
    DRAFT = "draft", "Draft"
    PUBLISHED = "published", "Published"
    ARCHIVED = "archived", "Archived"


class Course(BaseModel):
    """A structured, multi-session program — distinct from an ad-hoc 1:1 Booking."""

    tutor = models.ForeignKey(TutorProfile, on_delete=models.CASCADE, related_name="courses")
    institute = models.ForeignKey(
        InstituteProfile, on_delete=models.SET_NULL, null=True, blank=True, related_name="courses"
    )
    subject = models.ForeignKey(Subject, on_delete=models.PROTECT, related_name="courses")
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name="courses_created")

    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    description = models.TextField(blank=True)
    thumbnail = models.ImageField(upload_to="course_thumbnails/%Y/%m/", null=True, blank=True)

    level = models.CharField(max_length=20, default=ExpertiseLevel.ALL_LEVELS)
    mode = models.CharField(max_length=10, choices=TeachingMode.choices, default=TeachingMode.ONLINE)

    total_sessions = models.PositiveSmallIntegerField(validators=[MinValueValidator(1)])
    duration_weeks = models.PositiveSmallIntegerField(default=1)
    max_students = models.PositiveSmallIntegerField(default=1, validators=[MinValueValidator(1)])

    price = models.DecimalField(max_digits=9, decimal_places=2, validators=[MinValueValidator(0)])
    currency = models.CharField(max_length=3, default="INR")

    status = models.CharField(max_length=20, choices=CourseStatus.choices, default=CourseStatus.DRAFT, db_index=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)

    rating_average = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    rating_count = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "courses"
        indexes = [
            models.Index(fields=["status", "subject"]),
            models.Index(fields=["tutor", "status"]),
        ]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title)[:200]
            slug = base_slug
            counter = 1
            while Course.all_objects.filter(slug=slug).exclude(pk=self.pk).exists():
                counter += 1
                slug = f"{base_slug}-{counter}"
            self.slug = slug
        super().save(*args, **kwargs)

    @property
    def enrolled_count(self):
        return self.enrollments.filter(status__in=["active", "pending_payment"]).count()

    @property
    def seats_available(self):
        return max(self.max_students - self.enrolled_count, 0)


class CourseSessionStatus(models.TextChoices):
    SCHEDULED = "scheduled", "Scheduled"
    LIVE = "live", "Live"
    COMPLETED = "completed", "Completed"
    CANCELLED = "cancelled", "Cancelled"


class CourseSession(BaseModel):
    """One scheduled meeting within a Course (session 1 of N, 2 of N, ...)."""

    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="sessions")
    session_number = models.PositiveSmallIntegerField()
    title = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)

    scheduled_start = models.DateTimeField()
    scheduled_end = models.DateTimeField()
    status = models.CharField(max_length=20, choices=CourseSessionStatus.choices, default=CourseSessionStatus.SCHEDULED)

    room_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    started_at = models.DateTimeField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    recording_url = models.URLField(blank=True)

    class Meta:
        db_table = "course_sessions"
        ordering = ["session_number"]
        constraints = [
            models.UniqueConstraint(fields=["course", "session_number"], name="unique_course_session_number")
        ]
        indexes = [models.Index(fields=["course", "scheduled_start"])]

    def __str__(self):
        return f"{self.course.title} - Session {self.session_number}"

    @property
    def room_name(self) -> str:
        return f"tutordoor-course-{self.room_id.hex}"


class EnrollmentStatus(models.TextChoices):
    PENDING_PAYMENT = "pending_payment", "Pending Payment"
    ACTIVE = "active", "Active"
    COMPLETED = "completed", "Completed"
    DROPPED = "dropped", "Dropped"


class CourseEnrollment(BaseModel):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="enrollments")
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name="course_enrollments")
    status = models.CharField(max_length=20, choices=EnrollmentStatus.choices, default=EnrollmentStatus.PENDING_PAYMENT)
    progress_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    enrolled_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "course_enrollments"
        constraints = [models.UniqueConstraint(fields=["course", "student"], name="unique_course_enrollment")]
        indexes = [models.Index(fields=["course", "status"])]


class Assignment(BaseModel):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="assignments")
    session = models.ForeignKey(
        CourseSession, on_delete=models.SET_NULL, null=True, blank=True, related_name="assignments"
    )
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name="assignments_created")

    title = models.CharField(max_length=200)
    instructions = models.TextField(blank=True)
    attachment = models.FileField(upload_to="assignment_attachments/%Y/%m/", null=True, blank=True)
    max_score = models.PositiveSmallIntegerField(default=100)
    due_at = models.DateTimeField()

    class Meta:
        db_table = "assignments"
        indexes = [models.Index(fields=["course", "due_at"])]

    def __str__(self):
        return self.title


class SubmissionStatus(models.TextChoices):
    SUBMITTED = "submitted", "Submitted"
    LATE = "late", "Submitted Late"
    GRADED = "graded", "Graded"


class AssignmentSubmission(BaseModel):
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name="submissions")
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name="assignment_submissions")

    text_answer = models.TextField(blank=True)
    attachment = models.FileField(upload_to="submission_attachments/%Y/%m/", null=True, blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)

    status = models.CharField(max_length=20, choices=SubmissionStatus.choices, default=SubmissionStatus.SUBMITTED)
    score = models.PositiveSmallIntegerField(null=True, blank=True, validators=[MaxValueValidator(1000)])
    feedback = models.TextField(blank=True)
    graded_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name="submissions_graded"
    )
    graded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "assignment_submissions"
        constraints = [
            models.UniqueConstraint(fields=["assignment", "student"], name="unique_assignment_submission")
        ]
        indexes = [models.Index(fields=["assignment", "status"])]


class AttendanceStatus(models.TextChoices):
    PRESENT = "present", "Present"
    ABSENT = "absent", "Absent"
    LATE = "late", "Late"
    EXCUSED = "excused", "Excused"


class CourseAttendance(BaseModel):
    session = models.ForeignKey(CourseSession, on_delete=models.CASCADE, related_name="attendance_records")
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name="course_attendance_records")
    status = models.CharField(max_length=20, choices=AttendanceStatus.choices, default=AttendanceStatus.ABSENT)
    joined_at = models.DateTimeField(null=True, blank=True)
    left_at = models.DateTimeField(null=True, blank=True)
    marked_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")

    class Meta:
        db_table = "course_attendance"
        constraints = [
            models.UniqueConstraint(fields=["session", "student"], name="unique_session_student_attendance")
        ]
        indexes = [models.Index(fields=["session", "status"])]
