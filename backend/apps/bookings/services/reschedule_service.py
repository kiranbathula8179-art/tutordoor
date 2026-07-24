from django.db import IntegrityError, transaction
from django.utils import timezone

from apps.bookings.models import BookingStatus, RescheduleStatus
from apps.bookings.repositories.booking_repository import BookingRepository
from apps.bookings.repositories.reschedule_repository import RescheduleRepository
from apps.bookings.tasks import notify_booking_event_task
from apps.core.exceptions import ApplicationError, ConflictError, PermissionDeniedError
from apps.tutors.services.availability_service import AvailabilityService


class RescheduleService:
    def __init__(
        self,
        reschedule_repository: RescheduleRepository = None,
        booking_repository: BookingRepository = None,
        availability_service: AvailabilityService = None,
    ):
        self.reschedule_repository = reschedule_repository or RescheduleRepository()
        self.booking_repository = booking_repository or BookingRepository()
        self.availability_service = availability_service or AvailabilityService()

    def request_reschedule(self, booking, *, requested_by, proposed_start_time, proposed_end_time, reason: str = ""):
        if requested_by.id not in (booking.student.user_id, booking.tutor.user_id):
            raise PermissionDeniedError("You are not a participant in this booking.")
        if booking.status != BookingStatus.CONFIRMED:
            raise ApplicationError("Only confirmed bookings can be rescheduled.")
        if proposed_end_time <= proposed_start_time:
            raise ApplicationError("End time must be after start time.")
        if proposed_start_time <= timezone.now():
            raise ApplicationError("Proposed time must be in the future.")

        self.reschedule_repository.close_pending_for_booking(booking)
        return self.reschedule_repository.create(
            booking=booking,
            requested_by=requested_by,
            proposed_start_time=proposed_start_time,
            proposed_end_time=proposed_end_time,
            reason=reason,
        )

    @transaction.atomic
    def respond(self, reschedule_request, *, responder, accept: bool):
        booking = reschedule_request.booking

        if responder.id not in (booking.student.user_id, booking.tutor.user_id):
            raise PermissionDeniedError("You are not a participant in this booking.")
        if reschedule_request.requested_by_id == responder.id:
            raise ApplicationError("You cannot respond to your own reschedule request.")
        if reschedule_request.status != RescheduleStatus.PENDING:
            raise ApplicationError("This reschedule request has already been resolved.")

        if not accept:
            self.reschedule_repository.update(
                reschedule_request,
                status=RescheduleStatus.REJECTED,
                responded_by=responder,
                responded_at=timezone.now(),
            )
            return reschedule_request

        if not self.availability_service.is_within_available_window(
            booking.tutor, reschedule_request.proposed_start_time, reschedule_request.proposed_end_time
        ):
            raise ApplicationError("The proposed time is outside the tutor's available hours.")

        if self.booking_repository.has_overlapping_active_booking(
            booking.tutor,
            reschedule_request.proposed_start_time,
            reschedule_request.proposed_end_time,
            exclude_booking_id=booking.id,
        ):
            raise ConflictError("The proposed time now conflicts with another booking.")

        try:
            self.booking_repository.update(
                booking,
                start_time=reschedule_request.proposed_start_time,
                end_time=reschedule_request.proposed_end_time,
            )
        except IntegrityError as exc:
            raise ConflictError("The proposed time now conflicts with another booking.") from exc

        self.reschedule_repository.update(
            reschedule_request, status=RescheduleStatus.ACCEPTED, responded_by=responder, responded_at=timezone.now()
        )
        self.booking_repository.record_status_change(
            booking, from_status=booking.status, to_status=booking.status, changed_by=responder,
            reason=f"Rescheduled to {reschedule_request.proposed_start_time.isoformat()}",
        )
        notify_booking_event_task.delay(str(booking.id), "rescheduled")
        return reschedule_request

    def withdraw(self, reschedule_request, *, requested_by):
        if reschedule_request.requested_by_id != requested_by.id:
            raise PermissionDeniedError("Only the requester can withdraw this reschedule request.")
        if reschedule_request.status != RescheduleStatus.PENDING:
            raise ApplicationError("This reschedule request has already been resolved.")
        return self.reschedule_repository.update(reschedule_request, status=RescheduleStatus.WITHDRAWN)
