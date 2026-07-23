import datetime

import pytest
from django.utils import timezone

from apps.bookings.models import BookingStatus, BookingType, PaymentStatus
from apps.bookings.services.booking_service import BookingService
from apps.bookings.tests.factories import BookingFactory
from apps.core.exceptions import ApplicationError, ConflictError
from apps.students.tests.factories import StudentProfileFactory
from apps.tutors.models import WeeklyAvailability
from apps.tutors.tests.factories import TutorProfileFactory

pytestmark = pytest.mark.django_db


def _next_weekday_at(weekday: int, hour: int, minute: int = 0):
    """Returns an aware datetime for the next upcoming occurrence of `weekday` (0=Monday) at the given time."""
    now = timezone.localtime()
    days_ahead = (weekday - now.weekday()) % 7
    days_ahead = days_ahead or 7  # always strictly in the future
    target_date = now.date() + datetime.timedelta(days=days_ahead)
    naive = datetime.datetime.combine(target_date, datetime.time(hour, minute))
    return timezone.make_aware(naive)


@pytest.fixture
def bookable_tutor():
    tutor = TutorProfileFactory(hourly_rate=600, teaching_mode="online")
    WeeklyAvailability.objects.create(
        tutor=tutor, day_of_week=0, start_time=datetime.time(9, 0), end_time=datetime.time(12, 0)
    )
    return tutor


class TestCreateBooking:
    def test_create_regular_booking_succeeds_within_availability(self, bookable_tutor):
        student = StudentProfileFactory()
        start = _next_weekday_at(0, 9)
        end = start + datetime.timedelta(hours=1)

        booking = BookingService().create_booking(
            student=student, tutor=bookable_tutor, booked_by=student.user, start_time=start, end_time=end
        )

        assert booking.status == BookingStatus.PENDING_PAYMENT
        assert booking.payment_status == PaymentStatus.PENDING
        assert booking.price == 600  # 1 hour at 600/hr

    def test_create_demo_booking_is_free_and_auto_confirmed(self, bookable_tutor):
        student = StudentProfileFactory()
        start = _next_weekday_at(0, 10)
        end = start + datetime.timedelta(hours=1)

        booking = BookingService().create_booking(
            student=student, tutor=bookable_tutor, booked_by=student.user,
            start_time=start, end_time=end, booking_type=BookingType.DEMO,
        )

        assert booking.status == BookingStatus.CONFIRMED
        assert booking.price == 0
        assert hasattr(booking, "live_class_session")

    def test_second_demo_booking_with_same_tutor_is_rejected(self, bookable_tutor):
        student = StudentProfileFactory()
        start = _next_weekday_at(0, 9)

        service = BookingService()
        service.create_booking(
            student=student, tutor=bookable_tutor, booked_by=student.user,
            start_time=start, end_time=start + datetime.timedelta(hours=1), booking_type=BookingType.DEMO,
        )

        with pytest.raises(ConflictError):
            service.create_booking(
                student=student, tutor=bookable_tutor, booked_by=student.user,
                start_time=start + datetime.timedelta(hours=1),
                end_time=start + datetime.timedelta(hours=2),
                booking_type=BookingType.DEMO,
            )

    def test_booking_outside_availability_is_rejected(self, bookable_tutor):
        student = StudentProfileFactory()
        start = _next_weekday_at(0, 20)  # 8pm — outside the 9-12 window

        with pytest.raises(ApplicationError):
            BookingService().create_booking(
                student=student, tutor=bookable_tutor, booked_by=student.user,
                start_time=start, end_time=start + datetime.timedelta(hours=1),
            )

    def test_overlapping_booking_is_rejected(self, bookable_tutor):
        student_one = StudentProfileFactory()
        student_two = StudentProfileFactory()
        start = _next_weekday_at(0, 9)

        service = BookingService()
        service.create_booking(
            student=student_one, tutor=bookable_tutor, booked_by=student_one.user,
            start_time=start, end_time=start + datetime.timedelta(hours=1),
        )

        with pytest.raises(ConflictError):
            service.create_booking(
                student=student_two, tutor=bookable_tutor, booked_by=student_two.user,
                start_time=start + datetime.timedelta(minutes=30),
                end_time=start + datetime.timedelta(minutes=90),
            )

    def test_unverified_tutor_cannot_be_booked(self):
        tutor = TutorProfileFactory(verification_status="pending")
        student = StudentProfileFactory()
        start = _next_weekday_at(0, 9)

        with pytest.raises(ApplicationError):
            BookingService().create_booking(
                student=student, tutor=tutor, booked_by=student.user,
                start_time=start, end_time=start + datetime.timedelta(hours=1),
            )


class TestCancelAndCompleteBooking:
    def test_cancel_booking_by_student_marks_cancelled(self):
        booking = BookingFactory()
        updated = BookingService().cancel_booking(booking, by_user=booking.student.user, reason="Schedule conflict")

        assert updated.status == "cancelled"
        assert updated.cancellation_reason == "Schedule conflict"

    def test_cancel_booking_by_non_participant_raises(self):
        booking = BookingFactory()
        other_student = StudentProfileFactory()

        from apps.core.exceptions import PermissionDeniedError

        with pytest.raises(PermissionDeniedError):
            BookingService().cancel_booking(booking, by_user=other_student.user, reason="N/A")

    def test_complete_booking_updates_counters(self):
        booking = BookingFactory(
            start_time=timezone.now() - datetime.timedelta(hours=2),
            end_time=timezone.now() - datetime.timedelta(hours=1),
        )
        tutor_sessions_before = booking.tutor.total_sessions_completed
        student_hours_before = booking.student.total_hours_learned

        BookingService().complete_booking(booking)

        booking.tutor.refresh_from_db()
        booking.student.refresh_from_db()
        assert booking.tutor.total_sessions_completed == tutor_sessions_before + 1
        assert booking.student.total_hours_learned == student_hours_before + 1
