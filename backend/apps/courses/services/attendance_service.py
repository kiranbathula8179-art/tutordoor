from django.utils import timezone

from apps.core.exceptions import ApplicationError, PermissionDeniedError
from apps.courses.models import AttendanceStatus, CourseSessionStatus
from apps.courses.repositories.attendance_repository import AttendanceRepository
from apps.courses.repositories.course_repository import EnrollmentRepository


class AttendanceService:
    def __init__(
        self,
        attendance_repository: AttendanceRepository = None,
        enrollment_repository: EnrollmentRepository = None,
    ):
        self.attendance_repository = attendance_repository or AttendanceRepository()
        self.enrollment_repository = enrollment_repository or EnrollmentRepository()

    def mark_attendance(self, session, student, *, status: str, marked_by):
        record = self.attendance_repository.get_or_create(session, student)
        return self.attendance_repository.update(record, status=status, marked_by=marked_by)

    def record_join(self, session, user, student_profile):
        enrollment = self.enrollment_repository.get_active(session.course, student_profile)
        if not enrollment:
            raise PermissionDeniedError("You are not enrolled in this course.")

        if session.status == CourseSessionStatus.SCHEDULED:
            session.status = CourseSessionStatus.LIVE
            session.started_at = timezone.now()
            session.save(update_fields=["status", "started_at", "updated_at"])

        record = self.attendance_repository.get_or_create(session, student_profile)
        return self.attendance_repository.update(
            record, status=AttendanceStatus.PRESENT, joined_at=record.joined_at or timezone.now()
        )

    def record_leave(self, session, student_profile):
        record = self.attendance_repository.get(session, student_profile)
        if not record:
            raise ApplicationError("No attendance record found for this student in this session.")
        return self.attendance_repository.update(record, left_at=timezone.now())

    def list_for_session(self, session):
        return self.attendance_repository.list_for_session(session)
