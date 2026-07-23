from decimal import ROUND_HALF_UP, Decimal

from django.utils import timezone

from apps.core.exceptions import ApplicationError, ConflictError, PermissionDeniedError
from apps.reviews.repositories.review_repository import CourseReviewRepository, TutorReviewRepository
from apps.tutors.repositories.tutor_repository import TutorProfileRepository


class TutorReviewService:
    def __init__(
        self,
        review_repository: TutorReviewRepository = None,
        tutor_repository: TutorProfileRepository = None,
    ):
        self.review_repository = review_repository or TutorReviewRepository()
        self.tutor_repository = tutor_repository or TutorProfileRepository()

    def submit_review(self, booking, student, *, rating: int, comment: str = ""):
        if booking.student_id != student.id:
            raise PermissionDeniedError("You can only review your own bookings.")
        if booking.status != "completed":
            raise ApplicationError("You can only review a session after it has been completed.")
        if self.review_repository.get_by_booking(booking):
            raise ConflictError("You have already reviewed this session.")

        review = self.review_repository.create(
            booking=booking, student=student, tutor=booking.tutor, rating=rating, comment=comment
        )
        self._recompute_tutor_rating(booking.tutor)
        return review

    def add_response(self, review, *, tutor_user, response: str):
        if review.tutor.user_id != tutor_user.id:
            raise PermissionDeniedError("You can only respond to your own reviews.")
        return self.review_repository.update(review, tutor_response=response, tutor_response_at=timezone.now())

    def flag(self, review, *, reason: str):
        updated = self.review_repository.update(review, is_flagged=True, flagged_reason=reason)
        self._recompute_tutor_rating(review.tutor)
        return updated

    def unflag(self, review):
        updated = self.review_repository.update(review, is_flagged=False, flagged_reason="")
        self._recompute_tutor_rating(review.tutor)
        return updated

    def _recompute_tutor_rating(self, tutor):
        average, count = self.review_repository.average_and_count_for_tutor(tutor)
        rounded = Decimal(str(average)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP) if average else Decimal("0")
        self.tutor_repository.update_rating(tutor, rounded, count)


class CourseReviewService:
    def __init__(
        self,
        review_repository: CourseReviewRepository = None,
        course_repository=None,
    ):
        from apps.courses.repositories.course_repository import CourseRepository

        self.review_repository = review_repository or CourseReviewRepository()
        self.course_repository = course_repository or CourseRepository()

    def submit_review(self, enrollment, student, *, rating: int, comment: str = ""):
        if enrollment.student_id != student.id:
            raise PermissionDeniedError("You can only review your own enrollments.")
        if enrollment.status not in ("active", "completed"):
            raise ApplicationError("You can only review a course you are or were enrolled in.")
        if self.review_repository.get_by_enrollment(enrollment):
            raise ConflictError("You have already reviewed this course.")

        review = self.review_repository.create(
            enrollment=enrollment, student=student, course=enrollment.course, rating=rating, comment=comment
        )
        self._recompute_course_rating(enrollment.course)
        return review

    def add_response(self, review, *, tutor_user, response: str):
        if review.course.tutor.user_id != tutor_user.id:
            raise PermissionDeniedError("You can only respond to reviews on your own courses.")
        return self.review_repository.update(review, tutor_response=response, tutor_response_at=timezone.now())

    def flag(self, review, *, reason: str):
        updated = self.review_repository.update(review, is_flagged=True, flagged_reason=reason)
        self._recompute_course_rating(review.course)
        return updated

    def _recompute_course_rating(self, course):
        average, count = self.review_repository.average_and_count_for_course(course)
        rounded = Decimal(str(average)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP) if average else Decimal("0")
        self.course_repository.update_rating(course, rounded, count)
