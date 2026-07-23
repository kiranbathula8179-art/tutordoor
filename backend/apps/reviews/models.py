from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from apps.bookings.models import Booking
from apps.core.models import BaseModel
from apps.courses.models import Course, CourseEnrollment
from apps.students.models import StudentProfile
from apps.tutors.models import TutorProfile


class TutorReview(BaseModel):
    """One review per completed booking — enforced by the OneToOne relation."""

    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name="review")
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name="tutor_reviews_written")
    tutor = models.ForeignKey(TutorProfile, on_delete=models.CASCADE, related_name="reviews")

    rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(blank=True)

    tutor_response = models.TextField(blank=True)
    tutor_response_at = models.DateTimeField(null=True, blank=True)

    is_flagged = models.BooleanField(default=False)
    flagged_reason = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = "tutor_reviews"
        indexes = [models.Index(fields=["tutor", "is_flagged"])]

    def __str__(self):
        return f"{self.rating}\u2605 review for {self.tutor}"


class CourseReview(BaseModel):
    """One review per course enrollment."""

    enrollment = models.OneToOneField(CourseEnrollment, on_delete=models.CASCADE, related_name="review")
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name="course_reviews_written")
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="reviews")

    rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(blank=True)

    tutor_response = models.TextField(blank=True)
    tutor_response_at = models.DateTimeField(null=True, blank=True)

    is_flagged = models.BooleanField(default=False)
    flagged_reason = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = "course_reviews"
        indexes = [models.Index(fields=["course", "is_flagged"])]

    def __str__(self):
        return f"{self.rating}\u2605 review for {self.course}"
