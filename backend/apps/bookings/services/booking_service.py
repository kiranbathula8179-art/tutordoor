from decimal import ROUND_HALF_UP, Decimal

from django.conf import settings
from django.db import IntegrityError, transaction
from django.db.models import F
from django.utils import timezone

from apps.bookings.models import BookingMode, BookingStatus, BookingType, PaymentStatus
from apps.bookings.repositories.booking_repository import BookingRepository
from apps.bookings.services.live_class_service import LiveClassService
from apps.bookings.tasks import notify_booking_event_task
from apps.core.exceptions import ApplicationError, ConflictError, PermissionDeniedError
from apps.students.models import StudentProfile
from apps.tutors.models import TutorProfile
from apps.tutors.services.availability_service import AvailabilityService


class BookingService:
    def __init__(
        self,
        booking_repository: BookingRepository = None,
        availability_service: AvailabilityService = None,
        live_class_service: LiveClassService = None,
    ):
        self.booking_repository = booking_repository or BookingRepository()
        self.availability_service = availability_service or AvailabilityService()
        self.live_class_service = live_class_service or LiveClassService()

    # ---------------------------------------------------------------- create
    @transaction.atomic
    def create_booking(
        self,
        *,
        student: StudentProfile,
        tutor: TutorProfile,
        booked_by,
        start_time,
        end_time,
        booking_type: str = BookingType.REGULAR,
        mode: str = BookingMode.ONLINE,
        subject=None,
        institute=None,
        location: str = "",
        student_notes: str = "",
    ):
        self._validate_tutor_bookable(tutor)
        self._validate_mode(tutor, mode, location)
        self._validate_timing(start_time, end_time)

        if not self.availability_service.is_within_available_window(tutor, start_time, end_time):
            raise ApplicationError("The selected time is outside the tutor's available hours.")

        if self.booking_repository.has_overlapping_active_booking(tutor, start_time, end_time):
            raise ConflictError("This time slot was just booked by someone else. Please pick another slot.")

        is_demo = booking_type == BookingType.DEMO
        if is_demo:
            existing_demos = self.booking_repository.count_demo_bookings(student, tutor)
            if existing_demos >= settings.MAX_DEMO_BOOKINGS_PER_TUTOR:
                raise ConflictError("You have already used your free demo class with this tutor.")
            price = Decimal("0.00")
        else:
            price = self._compute_price(tutor, start_time, end_time)

        initial_status = BookingStatus.CONFIRMED if is_demo else BookingStatus.PENDING_PAYMENT
        initial_payment_status = PaymentStatus.NOT_REQUIRED if is_demo else PaymentStatus.PENDING

        try:
            booking = self.booking_repository.create(
                student=student,
                tutor=tutor,
                subject=subject,
                institute=institute,
                booking_type=booking_type,
                mode=mode,
                status=initial_status,
                start_time=start_time,
                end_time=end_time,
                price=price,
                payment_status=initial_payment_status,
                location=location,
                booked_by=booked_by,
                student_notes=student_notes,
            )
        except IntegrityError as exc:
            # Belt-and-suspenders: the Postgres exclusion constraint catches the
            # race-condition case that slipped past the has_overlapping check above.
            raise ConflictError("This time slot was just booked by someone else. Please pick another slot.") from exc

        self.booking_repository.record_status_change(
            booking, from_status="", to_status=booking.status, changed_by=booked_by
        )

        if booking.status == BookingStatus.CONFIRMED:
            self.live_class_service.provision_session(booking)

        notify_booking_event_task.delay(str(booking.id), "created")
        return booking

    def _validate_tutor_bookable(self, tutor: TutorProfile):
        if not tutor.is_verified:
            raise ApplicationError("This tutor is not yet verified and cannot accept bookings.")
        if not tutor.is_accepting_students:
            raise ApplicationError("This tutor is not currently accepting new bookings.")

    def _validate_mode(self, tutor: TutorProfile, mode: str, location: str):
        if tutor.teaching_mode != "both" and tutor.teaching_mode != mode:
            raise ApplicationError(f"This tutor only teaches in '{tutor.teaching_mode}' mode.")
        if mode == BookingMode.OFFLINE and not location:
            raise ApplicationError("A location is required for in-person bookings.")

    def _validate_timing(self, start_time, end_time):
        if end_time <= start_time:
            raise ApplicationError("End time must be after start time.")
        if start_time <= timezone.now():
            raise ApplicationError("Bookings must be scheduled in the future.")

    def _compute_price(self, tutor: TutorProfile, start_time, end_time) -> Decimal:
        duration_hours = Decimal((end_time - start_time).total_seconds()) / Decimal(3600)
        return (tutor.hourly_rate * duration_hours).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    # ---------------------------------------------------------------- payment integration hooks
    def confirm_after_payment(self, booking):
        if booking.status != BookingStatus.PENDING_PAYMENT:
            raise ApplicationError("Only bookings pending payment can be confirmed this way.")

        self.booking_repository.update(booking, status=BookingStatus.CONFIRMED, payment_status=PaymentStatus.PAID)
        self.booking_repository.record_status_change(
            booking,
            from_status=BookingStatus.PENDING_PAYMENT,
            to_status=BookingStatus.CONFIRMED,
            reason="Payment received",
        )
        self.live_class_service.provision_session(booking)
        notify_booking_event_task.delay(str(booking.id), "confirmed")
        return booking

    def expire_unpaid_booking(self, booking):
        self.booking_repository.update(
            booking,
            status=BookingStatus.CANCELLED,
            cancellation_reason="Payment was not completed in time.",
            cancelled_at=timezone.now(),
        )
        self.booking_repository.record_status_change(
            booking, from_status=BookingStatus.PENDING_PAYMENT, to_status=BookingStatus.CANCELLED,
            reason="Payment window expired",
        )
        return booking

    # ---------------------------------------------------------------- cancellation
    def cancel_booking(self, booking, *, by_user, reason: str = ""):
        if by_user.id not in (booking.student.user_id, booking.tutor.user_id) and not by_user.is_superuser:
            raise PermissionDeniedError("You are not authorized to cancel this booking.")

        if booking.status not in (BookingStatus.PENDING_PAYMENT, BookingStatus.CONFIRMED):
            raise ApplicationError(f"A booking with status '{booking.status}' cannot be cancelled.")

        hours_until_start = (booking.start_time - timezone.now()).total_seconds() / 3600
        is_late = hours_until_start < settings.MIN_CANCELLATION_NOTICE_HOURS

        previous_status = booking.status
        self.booking_repository.update(
            booking,
            status=BookingStatus.CANCELLED,
            cancelled_by=by_user,
            cancellation_reason=reason,
            cancelled_at=timezone.now(),
            is_late_cancellation=is_late,
        )
        self.booking_repository.record_status_change(
            booking, from_status=previous_status, to_status=BookingStatus.CANCELLED, changed_by=by_user, reason=reason
        )
        self.live_class_service.end_session(booking)
        notify_booking_event_task.delay(str(booking.id), "cancelled")
        return booking

    # ---------------------------------------------------------------- completion
    def complete_booking(self, booking):
        if booking.status not in (BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS):
            raise ApplicationError(f"A booking with status '{booking.status}' cannot be completed.")

        previous_status = booking.status
        self.booking_repository.update(booking, status=BookingStatus.COMPLETED, completed_at=timezone.now())
        self.booking_repository.record_status_change(
            booking, from_status=previous_status, to_status=BookingStatus.COMPLETED
        )
        self.live_class_service.end_session(booking)

        duration_hours = Decimal(booking.duration_minutes) / Decimal(60)
        TutorProfile.objects.filter(id=booking.tutor_id).update(
            total_sessions_completed=F("total_sessions_completed") + 1
        )
        StudentProfile.objects.filter(id=booking.student_id).update(
            total_sessions_completed=F("total_sessions_completed") + 1,
            total_hours_learned=F("total_hours_learned") + duration_hours,
        )

        if booking.payment_status == PaymentStatus.PAID:
            from apps.payments.services.payout_service import PayoutService

            PayoutService().credit_tutor_for_booking(booking)

        return booking

    def mark_no_show(self, booking, *, marked_by):
        if booking.status not in (BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS):
            raise ApplicationError(f"A booking with status '{booking.status}' cannot be marked as no-show.")

        previous_status = booking.status
        self.booking_repository.update(booking, status=BookingStatus.NO_SHOW)
        self.booking_repository.record_status_change(
            booking, from_status=previous_status, to_status=BookingStatus.NO_SHOW, changed_by=marked_by
        )
        return booking
