from decimal import Decimal

from apps.courses.repositories.assignment_repository import SubmissionRepository
from apps.courses.repositories.attendance_repository import AttendanceRepository
from apps.courses.repositories.course_repository import EnrollmentRepository


class ProgressService:
    """
    Computes a 0-100 progress score per (student, course) from two signals —
    attendance rate and assignment completion rate — weighted equally when
    both exist, and persists it onto the CourseEnrollment for fast reads on
    dashboards without recomputing on every page view.
    """

    def __init__(
        self,
        enrollment_repository: EnrollmentRepository = None,
        attendance_repository: AttendanceRepository = None,
        submission_repository: SubmissionRepository = None,
    ):
        self.enrollment_repository = enrollment_repository or EnrollmentRepository()
        self.attendance_repository = attendance_repository or AttendanceRepository()
        self.submission_repository = submission_repository or SubmissionRepository()

    def compute_and_save(self, enrollment):
        report = self.get_report(enrollment.course, enrollment.student)
        return self.enrollment_repository.update(enrollment, progress_percent=report["overall_progress_percent"])

    def get_report(self, course, student) -> dict:
        total_sessions = self.attendance_repository.count_total_sessions_for_course(course)
        attended_sessions = self.attendance_repository.count_present_for_student(student, course)
        attendance_rate = Decimal(attended_sessions) / Decimal(total_sessions) * 100 if total_sessions else None

        total_assignments = self.submission_repository.count_total_for_course(course)
        graded_assignments = self.submission_repository.count_graded_for_student(student, course)
        assignment_rate = (
            Decimal(graded_assignments) / Decimal(total_assignments) * 100 if total_assignments else None
        )

        if attendance_rate is not None and assignment_rate is not None:
            overall = (attendance_rate + assignment_rate) / 2
        elif attendance_rate is not None:
            overall = attendance_rate
        elif assignment_rate is not None:
            overall = assignment_rate
        else:
            overall = Decimal(0)

        return {
            "total_sessions": total_sessions,
            "attended_sessions": attended_sessions,
            "attendance_rate_percent": round(attendance_rate, 2) if attendance_rate is not None else None,
            "total_assignments": total_assignments,
            "graded_assignments": graded_assignments,
            "assignment_completion_percent": round(assignment_rate, 2) if assignment_rate is not None else None,
            "overall_progress_percent": round(overall, 2),
        }
