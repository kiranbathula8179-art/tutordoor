import logging

from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

logger = logging.getLogger("tutordoor")


@shared_task
def auto_complete_past_bookings_task():
    """Runs every 5 minutes (see CELERY_BEAT_SCHEDULE): flips confirmed bookings whose
    end_time has passed to COMPLETED and updates tutor/student session counters."""
    from apps.bookings.services.booking_service import BookingService

    service = BookingService()
    due_bookings = service.booking_repository.list_due_for_auto_complete()
    completed_count = 0
    for booking in due_bookings:
        service.complete_booking(booking)
        completed_count += 1
    if completed_count:
        logger.info("Auto-completed %d bookings.", completed_count)
    return completed_count


@shared_task
def expire_stale_pending_payment_bookings_task():
    """Cancels bookings stuck in PENDING_PAYMENT for too long, freeing the tutor's slot."""
    from apps.bookings.services.booking_service import BookingService

    service = BookingService()
    stale = service.booking_repository.list_stale_pending_payment(older_than_minutes=30)
    expired_count = 0
    for booking in stale:
        service.expire_unpaid_booking(booking)
        expired_count += 1
    if expired_count:
        logger.info("Expired %d stale pending-payment bookings.", expired_count)
    return expired_count


@shared_task
def send_upcoming_booking_reminders_task():
    """Sends a reminder email ~60 minutes before a confirmed session starts."""
    from apps.bookings.services.booking_service import BookingService

    service = BookingService()
    upcoming = service.booking_repository.list_upcoming_within(minutes_from=55, minutes_to=65)
    for booking in upcoming:
        send_booking_reminder_email_task.delay(str(booking.id))
    return upcoming.count()


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def send_booking_reminder_email_task(self, booking_id: str):
    from apps.bookings.repositories.booking_repository import BookingRepository

    booking = BookingRepository().get_by_id(booking_id)
    if not booking:
        return

    try:
        for recipient, name in (
            (booking.student.user.email, booking.student.user.first_name),
            (booking.tutor.user.email, booking.tutor.user.first_name),
        ):
            send_mail(
                subject="Your TutorDoor session starts in about an hour",
                message=(
                    f"Hi {name}, your session is scheduled for "
                    f"{timezone.localtime(booking.start_time).strftime('%I:%M %p, %d %b %Y')}. "
                    "Log in to TutorDoor to join the live class."
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[recipient],
                fail_silently=False,
            )
    except Exception as exc:  # noqa: BLE001
        logger.exception("Failed to send booking reminder for booking %s", booking_id)
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def notify_booking_event_task(self, booking_id: str, event: str):
    """
    Generic booking lifecycle notifier (created/confirmed/cancelled/rescheduled).
    Kept generic so the notifications app can later subscribe to richer channels
    (SMS/WhatsApp/push) without the bookings app needing to know about them.
    """
    from apps.bookings.repositories.booking_repository import BookingRepository

    booking = BookingRepository().get_by_id(booking_id)
    if not booking:
        return

    subject_map = {
        "created": "Your TutorDoor booking request was received",
        "confirmed": "Your TutorDoor session is confirmed",
        "cancelled": "Your TutorDoor session was cancelled",
        "rescheduled": "Your TutorDoor session was rescheduled",
    }
    subject = subject_map.get(event, "TutorDoor booking update")

    try:
        for recipient in (booking.student.user.email, booking.tutor.user.email):
            send_mail(
                subject=subject,
                message=(
                    f"Session with subject '{booking.subject.name if booking.subject else 'General'}' "
                    f"on {timezone.localtime(booking.start_time).strftime('%d %b %Y, %I:%M %p')} — status: "
                    f"{booking.get_status_display()}."
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[recipient],
                fail_silently=False,
            )
    except Exception as exc:  # noqa: BLE001
        logger.exception("Failed to send booking event notification for booking %s", booking_id)
        raise self.retry(exc=exc)
