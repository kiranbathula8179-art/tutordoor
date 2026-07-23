from django.conf import settings
from django.utils import timezone

from apps.bookings.models import LiveClassStatus
from apps.bookings.repositories.live_class_repository import AttendanceRepository, LiveClassRepository
from apps.core.exceptions import ApplicationError


class LiveClassService:
    def __init__(
        self,
        live_class_repository: LiveClassRepository = None,
        attendance_repository: AttendanceRepository = None,
    ):
        self.live_class_repository = live_class_repository or LiveClassRepository()
        self.attendance_repository = attendance_repository or AttendanceRepository()

    def provision_session(self, booking):
        """Called once a booking becomes CONFIRMED — creates the video room ahead of time."""
        existing = self.live_class_repository.get_by_booking(booking)
        if existing:
            return existing
        return self.live_class_repository.create_for_booking(booking)

    def get_join_details(self, booking, user):
        session = self.live_class_repository.get_by_booking(booking)
        if not session:
            raise ApplicationError("This session does not have a live class room yet.")

        if user.id not in (booking.student.user_id, booking.tutor.user_id):
            raise ApplicationError("You are not a participant in this session.")

        if session.status == LiveClassStatus.SCHEDULED:
            self.live_class_repository.update(session, status=LiveClassStatus.LIVE, started_at=timezone.now())

        role = "student" if user.id == booking.student.user_id else "tutor"
        self.attendance_repository.record_join(session, user, role)

        return {
            "provider": session.provider,
            "room_name": session.room_name,
            "jitsi_domain": settings.JITSI_DOMAIN,
            "join_url": f"https://{settings.JITSI_DOMAIN}/{session.room_name}",
            "display_name": user.get_full_name(),
        }

    def leave_session(self, booking, user):
        session = self.live_class_repository.get_by_booking(booking)
        if not session:
            return None
        return self.attendance_repository.record_leave(session, user)

    def end_session(self, booking):
        session = self.live_class_repository.get_by_booking(booking)
        if session and session.status != LiveClassStatus.ENDED:
            self.live_class_repository.update(session, status=LiveClassStatus.ENDED, ended_at=timezone.now())
        return session

    def get_attendance(self, booking):
        session = self.live_class_repository.get_by_booking(booking)
        if not session:
            return []
        return self.attendance_repository.list_for_session(session)
