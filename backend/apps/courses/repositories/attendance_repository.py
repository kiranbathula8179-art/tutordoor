from typing import Optional

from apps.courses.models import CourseAttendance


class AttendanceRepository:
    model = CourseAttendance

    def get_or_create(self, session, student) -> CourseAttendance:
        record, _ = self.model.objects.get_or_create(session=session, student=student)
        return record

    def get(self, session, student) -> Optional[CourseAttendance]:
        return self.model.objects.filter(session=session, student=student).first()

    def update(self, record: CourseAttendance, **fields) -> CourseAttendance:
        for key, value in fields.items():
            setattr(record, key, value)
        record.save(update_fields=list(fields.keys()) + ["updated_at"])
        return record

    def list_for_session(self, session):
        return self.model.objects.filter(session=session).select_related("student__user")

    def count_present_for_student(self, student, course) -> int:
        return self.model.objects.filter(
            student=student, session__course=course, status__in=["present", "late"]
        ).count()

    def count_total_sessions_for_course(self, course) -> int:
        return self.model.objects.filter(session__course=course).values("session").distinct().count()
