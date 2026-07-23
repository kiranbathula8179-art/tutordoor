from django.db import models

from apps.core.models import BaseModel
from apps.tutors.models import ExpertiseLevel, Subject
from apps.users.models import User


class GradeLevel(models.TextChoices):
    PRIMARY = "primary", "Primary School (1-5)"
    MIDDLE = "middle", "Middle School (6-8)"
    SECONDARY = "secondary", "Secondary School (9-10)"
    SENIOR_SECONDARY = "senior_secondary", "Senior Secondary (11-12)"
    UNDERGRADUATE = "undergraduate", "Undergraduate"
    GRADUATE = "graduate", "Graduate"
    PROFESSIONAL = "professional", "Working Professional"
    OTHER = "other", "Other"


class LearningMode(models.TextChoices):
    ONLINE = "online", "Online"
    OFFLINE = "offline", "In-Person"
    BOTH = "both", "Online & In-Person"


class StudentProfile(BaseModel):
    """Extends User with student-specific learning data."""

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="student_profile")

    date_of_birth = models.DateField(null=True, blank=True)
    grade_level = models.CharField(max_length=20, default=GradeLevel.OTHER)
    school_name = models.CharField(max_length=255, blank=True)
    learning_goals = models.TextField(blank=True)
    preferred_learning_mode = models.CharField(max_length=10, choices=LearningMode.choices, default=LearningMode.ONLINE)

    city = models.CharField(max_length=100, blank=True, db_index=True)
    state = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True, default="India")
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    preferred_subjects = models.ManyToManyField(
        Subject, through="StudentSubjectInterest", related_name="interested_students"
    )

    total_sessions_completed = models.PositiveIntegerField(default=0)
    total_hours_learned = models.DecimalField(max_digits=8, decimal_places=2, default=0)

    class Meta:
        db_table = "student_profiles"
        indexes = [models.Index(fields=["grade_level"]), models.Index(fields=["city"])]

    def __str__(self):
        return f"StudentProfile<{self.user.email}>"


class StudentSubjectInterest(BaseModel):
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name="subject_interests")
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name="interested_student_links")
    current_level = models.CharField(max_length=20, default=ExpertiseLevel.BEGINNER)

    class Meta:
        db_table = "student_subject_interests"
        constraints = [
            models.UniqueConstraint(fields=["student", "subject"], name="unique_student_subject_interest")
        ]

    def __str__(self):
        return f"{self.student} interested in {self.subject}"
