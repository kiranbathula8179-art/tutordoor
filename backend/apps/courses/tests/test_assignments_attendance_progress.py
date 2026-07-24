import datetime

import pytest
from django.utils import timezone

from apps.core.exceptions import ApplicationError, ConflictError, PermissionDeniedError
from apps.courses.models import AttendanceStatus, CourseSession, SubmissionStatus
from apps.courses.services.assignment_service import AssignmentService
from apps.courses.services.attendance_service import AttendanceService
from apps.courses.services.enrollment_service import EnrollmentService
from apps.courses.services.progress_service import ProgressService
from apps.courses.tests.factories import AssignmentFactory, CourseFactory
from apps.students.tests.factories import StudentProfileFactory

pytestmark = pytest.mark.django_db


@pytest.fixture
def enrolled_student_and_course():
    course = CourseFactory(price=0, max_students=5)
    student = StudentProfileFactory()
    EnrollmentService().enroll(course, student)
    return course, student


class TestAssignmentService:
    def test_unenrolled_student_cannot_submit(self):
        assignment = AssignmentFactory()
        outsider = StudentProfileFactory()

        with pytest.raises(PermissionDeniedError):
            AssignmentService().submit(assignment, outsider, text_answer="my answer")

    def test_enrolled_student_can_submit(self, enrolled_student_and_course):
        course, student = enrolled_student_and_course
        assignment = AssignmentFactory(course=course)

        submission = AssignmentService().submit(assignment, student, text_answer="Here is my work.")
        assert submission.status == SubmissionStatus.SUBMITTED

    def test_duplicate_submission_raises(self, enrolled_student_and_course):
        course, student = enrolled_student_and_course
        assignment = AssignmentFactory(course=course)

        service = AssignmentService()
        service.submit(assignment, student, text_answer="First attempt")
        with pytest.raises(ConflictError):
            service.submit(assignment, student, text_answer="Second attempt")

    def test_late_submission_is_flagged(self, enrolled_student_and_course):
        course, student = enrolled_student_and_course
        assignment = AssignmentFactory(course=course, due_at=timezone.now() - datetime.timedelta(days=1))

        submission = AssignmentService().submit(assignment, student, text_answer="Late work")
        assert submission.status == SubmissionStatus.LATE

    def test_grading_beyond_max_score_raises(self, enrolled_student_and_course):
        course, student = enrolled_student_and_course
        assignment = AssignmentFactory(course=course, max_score=100)
        submission = AssignmentService().submit(assignment, student, text_answer="Work")

        with pytest.raises(ApplicationError):
            AssignmentService().grade(submission, graded_by=course.tutor.user, score=150)

    def test_grading_sets_status_and_score(self, enrolled_student_and_course):
        course, student = enrolled_student_and_course
        assignment = AssignmentFactory(course=course, max_score=100)
        submission = AssignmentService().submit(assignment, student, text_answer="Work")

        graded = AssignmentService().grade(submission, graded_by=course.tutor.user, score=85, feedback="Great job!")
        assert graded.status == SubmissionStatus.GRADED
        assert graded.score == 85


class TestAttendanceAndProgress:
    def test_mark_attendance_present(self, enrolled_student_and_course):
        course, student = enrolled_student_and_course
        session = CourseSession.objects.create(
            course=course, session_number=1,
            scheduled_start=timezone.now(), scheduled_end=timezone.now() + datetime.timedelta(hours=1),
        )

        record = AttendanceService().mark_attendance(
            session, student, status=AttendanceStatus.PRESENT, marked_by=course.tutor.user
        )
        assert record.status == AttendanceStatus.PRESENT

    def test_progress_report_combines_attendance_and_assignments(self, enrolled_student_and_course):
        course, student = enrolled_student_and_course
        session = CourseSession.objects.create(
            course=course, session_number=1,
            scheduled_start=timezone.now(), scheduled_end=timezone.now() + datetime.timedelta(hours=1),
        )
        AttendanceService().mark_attendance(
            session, student, status=AttendanceStatus.PRESENT, marked_by=course.tutor.user
        )

        assignment = AssignmentFactory(course=course)
        submission = AssignmentService().submit(assignment, student, text_answer="Done")
        AssignmentService().grade(submission, graded_by=course.tutor.user, score=90)

        report = ProgressService().get_report(course, student)
        assert report["attendance_rate_percent"] == 100
        assert report["assignment_completion_percent"] == 100
        assert report["overall_progress_percent"] == 100

    def test_progress_report_with_no_data_is_zero(self, enrolled_student_and_course):
        course, student = enrolled_student_and_course
        report = ProgressService().get_report(course, student)
        assert report["overall_progress_percent"] == 0
