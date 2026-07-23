import datetime

import pytest
from django.utils import timezone

from apps.bookings.tests.factories import BookingFactory
from apps.core.exceptions import ApplicationError, ConflictError, PermissionDeniedError
from apps.courses.services.enrollment_service import EnrollmentService
from apps.courses.tests.factories import CourseFactory
from apps.reviews.services.review_service import CourseReviewService, TutorReviewService
from apps.students.tests.factories import StudentProfileFactory

pytestmark = pytest.mark.django_db


class TestTutorReviewService:
    def test_review_requires_completed_booking(self):
        booking = BookingFactory(status="confirmed")
        with pytest.raises(ApplicationError):
            TutorReviewService().submit_review(booking, booking.student, rating=5)

    def test_review_updates_tutor_rating_average(self):
        booking = BookingFactory(
            status="completed",
            start_time=timezone.now() - datetime.timedelta(hours=2),
            end_time=timezone.now() - datetime.timedelta(hours=1),
        )
        TutorReviewService().submit_review(booking, booking.student, rating=4, comment="Great session!")

        booking.tutor.refresh_from_db()
        assert booking.tutor.rating_average == 4
        assert booking.tutor.rating_count == 1

    def test_cannot_review_same_booking_twice(self):
        booking = BookingFactory(status="completed")
        service = TutorReviewService()
        service.submit_review(booking, booking.student, rating=5)

        with pytest.raises(ConflictError):
            service.submit_review(booking, booking.student, rating=3)

    def test_only_the_booking_student_can_review(self):
        booking = BookingFactory(status="completed")
        other_student = StudentProfileFactory()

        with pytest.raises(PermissionDeniedError):
            TutorReviewService().submit_review(booking, other_student, rating=5)

    def test_tutor_can_respond_to_review(self):
        booking = BookingFactory(status="completed")
        service = TutorReviewService()
        review = service.submit_review(booking, booking.student, rating=5, comment="Loved it")

        updated = service.add_response(review, tutor_user=booking.tutor.user, response="Thank you!")
        assert updated.tutor_response == "Thank you!"
        assert updated.tutor_response_at is not None

    def test_flagging_a_review_excludes_it_from_rating(self):
        booking_one = BookingFactory(status="completed")
        tutor = booking_one.tutor
        booking_two = BookingFactory(tutor=tutor, status="completed")

        service = TutorReviewService()
        service.submit_review(booking_one, booking_one.student, rating=5)
        bad_review = service.submit_review(booking_two, booking_two.student, rating=1)

        service.flag(bad_review, reason="Spam")

        tutor.refresh_from_db()
        assert tutor.rating_count == 1
        assert tutor.rating_average == 5


class TestCourseReviewService:
    def test_review_requires_active_or_completed_enrollment(self):
        course = CourseFactory(price=0)
        student = StudentProfileFactory()
        enrollment = EnrollmentService().enroll(course, student)
        enrollment.status = "dropped"
        enrollment.save(update_fields=["status"])

        with pytest.raises(ApplicationError):
            CourseReviewService().submit_review(enrollment, student, rating=4)

    def test_review_updates_course_rating(self):
        course = CourseFactory(price=0)
        student = StudentProfileFactory()
        enrollment = EnrollmentService().enroll(course, student)

        CourseReviewService().submit_review(enrollment, student, rating=5, comment="Excellent course")

        course.refresh_from_db()
        assert course.rating_average == 5
        assert course.rating_count == 1
