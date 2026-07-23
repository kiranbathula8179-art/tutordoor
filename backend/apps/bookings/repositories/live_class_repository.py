from typing import Optional

from django.utils import timezone

from apps.bookings.models import LiveClassSession, SessionAttendance


class LiveClassRepository:
    model = LiveClassSession

    def create_for_booking(self, booking) -> LiveClassSession:
        return self.model.objects.create(booking=booking)

    def get_by_booking(self, booking) -> Optional[LiveClassSession]:
        return self.model.objects.filter(booking=booking).first()

    def get_by_room_id(self, room_id) -> Optional[LiveClassSession]:
        return self.model.objects.select_related("booking").filter(room_id=room_id).first()

    def update(self, session: LiveClassSession, **fields) -> LiveClassSession:
        for key, value in fields.items():
            setattr(session, key, value)
        session.save(update_fields=list(fields.keys()) + ["updated_at"])
        return session


class AttendanceRepository:
    model = SessionAttendance

    def record_join(self, session, user, role: str) -> SessionAttendance:
        open_record = self.model.objects.filter(session=session, user=user, left_at__isnull=True).first()
        if open_record:
            return open_record
        return self.model.objects.create(session=session, user=user, role=role, joined_at=timezone.now())

    def record_leave(self, session, user) -> Optional[SessionAttendance]:
        record = self.model.objects.filter(session=session, user=user, left_at__isnull=True).order_by("-joined_at").first()
        if not record:
            return None
        record.left_at = timezone.now()
        record.duration_seconds = int((record.left_at - record.joined_at).total_seconds())
        record.save(update_fields=["left_at", "duration_seconds", "updated_at"])
        return record

    def list_for_session(self, session):
        return self.model.objects.filter(session=session).select_related("user").order_by("joined_at")
