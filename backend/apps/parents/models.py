import secrets

from django.db import models
from django.utils import timezone

from apps.core.models import BaseModel
from apps.students.models import StudentProfile
from apps.users.models import User


class ParentProfile(BaseModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="parent_profile")
    occupation = models.CharField(max_length=150, blank=True)
    city = models.CharField(max_length=100, blank=True)
    preferred_contact_method = models.CharField(
        max_length=20,
        choices=[("email", "Email"), ("sms", "SMS"), ("whatsapp", "WhatsApp")],
        default="email",
    )
    receives_progress_reports = models.BooleanField(default=True)

    class Meta:
        db_table = "parent_profiles"

    def __str__(self):
        return f"ParentProfile<{self.user.email}>"


class RelationshipType(models.TextChoices):
    FATHER = "father", "Father"
    MOTHER = "mother", "Mother"
    GUARDIAN = "guardian", "Guardian"
    OTHER = "other", "Other"


class LinkStatus(models.TextChoices):
    PENDING = "pending", "Pending Confirmation"
    ACTIVE = "active", "Active"
    REVOKED = "revoked", "Revoked"


class ParentStudentLink(BaseModel):
    """
    Links a parent account to one or more student accounts. Requires the
    student (or the inviting parent, for minors below account age) to
    confirm via a token before the link becomes ACTIVE and unlocks
    booking/payment/progress visibility for the parent.
    """

    parent = models.ForeignKey(ParentProfile, on_delete=models.CASCADE, related_name="student_links")
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name="parent_links")
    relationship = models.CharField(max_length=20, default=RelationshipType.GUARDIAN)
    status = models.CharField(max_length=20, choices=LinkStatus.choices, default=LinkStatus.PENDING)

    can_manage_bookings = models.BooleanField(default=True)
    can_manage_payments = models.BooleanField(default=True)
    can_view_progress = models.BooleanField(default=True)

    confirmation_token = models.CharField(max_length=64, blank=True, db_index=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "parent_student_links"
        constraints = [
            models.UniqueConstraint(fields=["parent", "student"], name="unique_parent_student_link")
        ]
        indexes = [models.Index(fields=["student", "status"])]

    def __str__(self):
        return f"{self.parent} -> {self.student} ({self.status})"

    def generate_confirmation_token(self):
        self.confirmation_token = secrets.token_urlsafe(32)
        self.save(update_fields=["confirmation_token", "updated_at"])
        return self.confirmation_token

    def confirm(self):
        self.status = LinkStatus.ACTIVE
        self.confirmed_at = timezone.now()
        self.confirmation_token = ""
        self.save(update_fields=["status", "confirmed_at", "confirmation_token", "updated_at"])
