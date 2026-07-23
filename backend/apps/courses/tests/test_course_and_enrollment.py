import datetime

import pytest
from django.utils import timezone

from apps.core.exceptions import ApplicationError, ConflictError
from apps.courses.models import EnrollmentStatus
from apps.courses.services.course_service import CourseService
from apps.courses.services.enrollment_service import EnrollmentService
from apps.courses.tests.factories import CourseFactory
from apps.students.tests.factories import StudentProfileFactory
from apps.tutors.tests.factories import SubjectFactory, TutorProfileFactory

pytestmark = pytest.mark.django_db


class TestCourseService:
    def test_create_course_with_matching_session_schedule(self):
        tutor = TutorProfileFactory()
        subject = SubjectFactory()
        start = timezone.now() + datetime.timedelta(days=1)

        course = CourseService().create_course(
            tutor=tutor,
            created_by=tutor.user,
            subject=subject,
            title="Intro to Calculus",
            total_sessions=2,
            price=1000,
            session_schedule=[
                {"scheduled_start": start, "scheduled_end": start + datetime.timedelta(hours=1)},
                {
                    "scheduled_start": start + datetime.timedelta(days=7),
                    "scheduled_end": start + datetime.timedelta(days=7, hours=1),
                },
            ],
        )

        assert course.sessions.count() == 2
        assert course.sessions.first().session_number == 1

    def test_create_course_with_mismatched_schedule_count_raises(self):
        tutor = TutorProfileFactory()
        subject = SubjectFactory()
        start = timezone.now() + datetime.timedelta(days=1)

        with pytest.raises(ApplicationError):
            CourseService().create_course(
                tutor=tutor,
                created_by=tutor.user,
                subject=subject,
                title="Mismatched Course",
                total_sessions=3,
                price=1000,
                session_schedule=[{"scheduled_start": start, "scheduled_end": start + datetime.timedelta(hours=1)}],
            )

    def test_publish_requires_at_least_one_session(self):
        tutor = TutorProfileFactory()
        subject = SubjectFactory()
        course = CourseService().create_course(
            tutor=tutor, created_by=tutor.user, subject=subject, title="Empty Course",
            total_sessions=1, price=500, status="draft",
        )
        with pytest.raises(ApplicationError):
            CourseService().publish(course)


class TestEnrollmentService:
    def test_enroll_in_free_course_is_immediately_active(self):
        course = CourseFactory(price=0, max_students=3)
        student = StudentProfileFactory()

        enrollment = EnrollmentService().enroll(course, student)
        assert enrollment.status == EnrollmentStatus.ACTIVE

    def test_enroll_in_paid_course_is_pending_payment(self):
        course = CourseFactory(price=1500, max_students=3)
        student = StudentProfileFactory()

        enrollment = EnrollmentService().enroll(course, student)
        assert enrollment.status == EnrollmentStatus.PENDING_PAYMENT

    def test_cannot_enroll_twice(self):
        course = CourseFactory(price=0, max_students=3)
        student = StudentProfileFactory()

        service = EnrollmentService()
        service.enroll(course, student)
        with pytest.raises(ConflictError):
            service.enroll(course, student)

    def test_cannot_enroll_when_course_full(self):
        course = CourseFactory(price=0, max_students=1)
        student_one = StudentProfileFactory()
        student_two = StudentProfileFactory()

        service = EnrollmentService()
        service.enroll(course, student_one)

        with pytest.raises(ConflictError):
            service.enroll(course, student_two)

    def test_cannot_enroll_in_unpublished_course(self):
        course = CourseFactory(price=0, status="draft")
        student = StudentProfileFactory()

        with pytest.raises(ApplicationError):
            EnrollmentService().enroll(course, student)
