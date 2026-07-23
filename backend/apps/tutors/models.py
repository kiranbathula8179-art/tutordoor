from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from apps.core.models import BaseModel
from apps.users.models import User


class SubjectCategory(BaseModel):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=110, unique=True)
    icon = models.CharField(max_length=50, blank=True, help_text="Icon identifier for frontend (e.g. lucide name).")
    display_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = "subject_categories"
        ordering = ["display_order", "name"]
        verbose_name_plural = "Subject Categories"

    def __str__(self):
        return self.name


class Subject(BaseModel):
    category = models.ForeignKey(SubjectCategory, on_delete=models.PROTECT, related_name="subjects")
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=140, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "subjects"
        ordering = ["name"]
        indexes = [models.Index(fields=["category", "is_active"])]

    def __str__(self):
        return self.name


class VerificationStatus(models.TextChoices):
    NOT_SUBMITTED = "not_submitted", "Not Submitted"
    PENDING = "pending", "Pending Review"
    VERIFIED = "verified", "Verified"
    REJECTED = "rejected", "Rejected"


class TeachingMode(models.TextChoices):
    ONLINE = "online", "Online"
    OFFLINE = "offline", "In-Person"
    BOTH = "both", "Online & In-Person"


class TutorProfile(BaseModel):
    """Extends User with tutor-specific data. One-to-one, keeps User model lean."""

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="tutor_profile")

    headline = models.CharField(max_length=150, blank=True, help_text="e.g. 'IIT Alumnus | Physics & Math Expert'")
    bio = models.TextField(blank=True)
    education = models.CharField(max_length=255, blank=True)
    experience_years = models.PositiveSmallIntegerField(default=0)

    hourly_rate = models.DecimalField(max_digits=8, decimal_places=2, validators=[MinValueValidator(0)])
    currency = models.CharField(max_length=3, default="INR")

    teaching_mode = models.CharField(max_length=10, choices=TeachingMode.choices, default=TeachingMode.ONLINE)
    languages = models.JSONField(default=list, blank=True, help_text="List of language codes/names spoken.")

    intro_video_url = models.URLField(blank=True)

    address = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100, blank=True, db_index=True)
    state = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True, default="India")
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    travel_radius_km = models.PositiveSmallIntegerField(default=10, help_text="Max travel distance for in-person classes.")

    verification_status = models.CharField(
        max_length=20, choices=VerificationStatus.choices, default=VerificationStatus.NOT_SUBMITTED, db_index=True
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    verified_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name="tutors_verified"
    )
    rejection_reason = models.TextField(blank=True)

    rating_average = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    rating_count = models.PositiveIntegerField(default=0)
    total_sessions_completed = models.PositiveIntegerField(default=0)
    response_time_minutes = models.PositiveIntegerField(default=60)

    is_featured = models.BooleanField(default=False)
    is_accepting_students = models.BooleanField(default=True)

    subjects = models.ManyToManyField(Subject, through="TutorSubject", related_name="tutors")

    class Meta:
        db_table = "tutor_profiles"
        indexes = [
            models.Index(fields=["verification_status", "is_accepting_students"]),
            models.Index(fields=["city"]),
            models.Index(fields=["rating_average"]),
        ]

    def __str__(self):
        return f"TutorProfile<{self.user.email}>"

    @property
    def is_verified(self):
        return self.verification_status == VerificationStatus.VERIFIED


class ExpertiseLevel(models.TextChoices):
    BEGINNER = "beginner", "Beginner"
    INTERMEDIATE = "intermediate", "Intermediate"
    ADVANCED = "advanced", "Advanced"
    ALL_LEVELS = "all_levels", "All Levels"


class TutorSubject(BaseModel):
    tutor = models.ForeignKey(TutorProfile, on_delete=models.CASCADE, related_name="tutor_subjects")
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name="tutor_subjects")
    expertise_level = models.CharField(max_length=20, default=ExpertiseLevel.ALL_LEVELS)
    years_experience = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = "tutor_subjects"
        constraints = [
            models.UniqueConstraint(fields=["tutor", "subject"], name="unique_tutor_subject")
        ]

    def __str__(self):
        return f"{self.tutor} - {self.subject}"


class DocumentType(models.TextChoices):
    GOVERNMENT_ID = "government_id", "Government ID"
    DEGREE_CERTIFICATE = "degree_certificate", "Degree Certificate"
    EXPERIENCE_LETTER = "experience_letter", "Experience Letter"
    POLICE_VERIFICATION = "police_verification", "Police Verification"
    ADDRESS_PROOF = "address_proof", "Address Proof"


class DocumentReviewStatus(models.TextChoices):
    PENDING = "pending", "Pending Review"
    APPROVED = "approved", "Approved"
    REJECTED = "rejected", "Rejected"


class VerificationDocument(BaseModel):
    tutor = models.ForeignKey(TutorProfile, on_delete=models.CASCADE, related_name="verification_documents")
    document_type = models.CharField(max_length=30)
    file = models.FileField(upload_to="verification_documents/%Y/%m/")
    status = models.CharField(max_length=20, choices=DocumentReviewStatus.choices, default=DocumentReviewStatus.PENDING)
    admin_notes = models.TextField(blank=True)
    reviewed_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name="documents_reviewed"
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "tutor_verification_documents"
        indexes = [models.Index(fields=["tutor", "status"])]


class WeeklyAvailability(BaseModel):
    """Recurring weekly availability slot, e.g. every Monday 4pm-8pm."""

    DAY_CHOICES = [
        (0, "Monday"), (1, "Tuesday"), (2, "Wednesday"), (3, "Thursday"),
        (4, "Friday"), (5, "Saturday"), (6, "Sunday"),
    ]

    tutor = models.ForeignKey(TutorProfile, on_delete=models.CASCADE, related_name="weekly_availability")
    day_of_week = models.PositiveSmallIntegerField(choices=DAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "tutor_weekly_availability"
        ordering = ["day_of_week", "start_time"]
        constraints = [
            models.CheckConstraint(check=models.Q(end_time__gt=models.F("start_time")), name="availability_end_after_start")
        ]
        indexes = [models.Index(fields=["tutor", "day_of_week", "is_active"])]


class AvailabilityException(BaseModel):
    """One-off override for a specific date: either blocks a normally-available day, or opens an extra slot."""

    tutor = models.ForeignKey(TutorProfile, on_delete=models.CASCADE, related_name="availability_exceptions")
    date = models.DateField(db_index=True)
    is_available = models.BooleanField(default=False, help_text="False = blocked/leave day. True = extra one-off slot.")
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    reason = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = "tutor_availability_exceptions"
        constraints = [
            models.UniqueConstraint(
                fields=["tutor", "date", "start_time"], name="unique_tutor_date_exception"
            )
        ]
        indexes = [models.Index(fields=["tutor", "date"])]
