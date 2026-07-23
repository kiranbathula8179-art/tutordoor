from django.db import models

from apps.core.models import BaseModel
from apps.students.models import StudentProfile
from apps.tutors.models import TutorProfile, VerificationStatus
from apps.users.models import User


class InstituteProfile(BaseModel):
    """Represents a coaching institute / school as an organizational tenant on the platform."""

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="institute_profile")

    institute_name = models.CharField(max_length=255)
    registration_number = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    logo = models.ImageField(upload_to="institute_logos/%Y/%m/", null=True, blank=True)
    website = models.URLField(blank=True)
    established_year = models.PositiveSmallIntegerField(null=True, blank=True)

    address = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100, blank=True, db_index=True)
    state = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True, default="India")
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    verification_status = models.CharField(
        max_length=20, choices=VerificationStatus.choices, default=VerificationStatus.NOT_SUBMITTED, db_index=True
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    verified_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name="institutes_verified"
    )
    rejection_reason = models.TextField(blank=True)

    rating_average = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    rating_count = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "institute_profiles"
        indexes = [models.Index(fields=["verification_status"]), models.Index(fields=["city"])]

    def __str__(self):
        return self.institute_name

    @property
    def is_verified(self):
        return self.verification_status == VerificationStatus.VERIFIED


class InstituteTutorStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    ACTIVE = "active", "Active"
    REMOVED = "removed", "Removed"


class InstituteTutor(BaseModel):
    """A tutor teaching under an institute's banner (separate from independent freelance tutoring)."""

    institute = models.ForeignKey(InstituteProfile, on_delete=models.CASCADE, related_name="tutor_links")
    tutor = models.ForeignKey(TutorProfile, on_delete=models.CASCADE, related_name="institute_links")
    role_title = models.CharField(max_length=100, blank=True, help_text="e.g. 'Senior Faculty - Physics'")
    status = models.CharField(max_length=20, choices=InstituteTutorStatus.choices, default=InstituteTutorStatus.PENDING)
    joined_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "institute_tutors"
        constraints = [models.UniqueConstraint(fields=["institute", "tutor"], name="unique_institute_tutor")]
        indexes = [models.Index(fields=["institute", "status"])]


class InstituteEnrollmentStatus(models.TextChoices):
    ACTIVE = "active", "Active"
    COMPLETED = "completed", "Completed"
    WITHDRAWN = "withdrawn", "Withdrawn"


class InstituteStudentEnrollment(BaseModel):
    institute = models.ForeignKey(InstituteProfile, on_delete=models.CASCADE, related_name="student_enrollments")
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name="institute_enrollments")
    status = models.CharField(max_length=20, choices=InstituteEnrollmentStatus.choices, default=InstituteEnrollmentStatus.ACTIVE)
    enrolled_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "institute_student_enrollments"
        constraints = [
            models.UniqueConstraint(fields=["institute", "student"], name="unique_institute_student_enrollment")
        ]
        indexes = [models.Index(fields=["institute", "status"])]
