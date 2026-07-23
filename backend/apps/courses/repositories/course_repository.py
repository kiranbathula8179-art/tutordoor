from typing import Optional

from apps.courses.models import Course, CourseEnrollment, CourseSession, EnrollmentStatus


class CourseRepository:
    model = Course

    def get_by_id(self, course_id) -> Optional[Course]:
        return self.model.objects.select_related("tutor__user", "subject", "institute").filter(id=course_id).first()

    def get_by_slug(self, slug: str) -> Optional[Course]:
        return self.model.objects.select_related("tutor__user", "subject").filter(slug=slug).first()

    def create(self, **fields) -> Course:
        return self.model.objects.create(**fields)

    def update(self, course: Course, **fields) -> Course:
        for key, value in fields.items():
            setattr(course, key, value)
        course.save(update_fields=list(fields.keys()) + ["updated_at"])
        return course

    def list_published(self, *, subject_id=None, tutor_id=None, level=None, mode=None):
        qs = self.model.objects.filter(status="published").select_related("tutor__user", "subject")
        if subject_id:
            qs = qs.filter(subject_id=subject_id)
        if tutor_id:
            qs = qs.filter(tutor_id=tutor_id)
        if level:
            qs = qs.filter(level=level)
        if mode:
            qs = qs.filter(mode__in=[mode, "both"])
        return qs.order_by("-created_at")

    def list_for_tutor(self, tutor, status=None):
        qs = self.model.objects.filter(tutor=tutor)
        if status:
            qs = qs.filter(status=status)
        return qs.order_by("-created_at")

    def update_rating(self, course: Course, new_average, new_count: int):
        course.rating_average = new_average
        course.rating_count = new_count
        course.save(update_fields=["rating_average", "rating_count", "updated_at"])


class CourseSessionRepository:
    model = CourseSession

    def bulk_create(self, sessions: list[CourseSession]):
        return self.model.objects.bulk_create(sessions)

    def list_for_course(self, course):
        return self.model.objects.filter(course=course).order_by("session_number")

    def get_by_id(self, session_id) -> Optional[CourseSession]:
        return self.model.objects.select_related("course").filter(id=session_id).first()

    def get_by_room_id(self, room_id) -> Optional[CourseSession]:
        return self.model.objects.select_related("course").filter(room_id=room_id).first()

    def update(self, session: CourseSession, **fields) -> CourseSession:
        for key, value in fields.items():
            setattr(session, key, value)
        session.save(update_fields=list(fields.keys()) + ["updated_at"])
        return session

    def list_due_for_auto_complete(self):
        from django.utils import timezone

        return self.model.objects.filter(status__in=["scheduled", "live"], scheduled_end__lt=timezone.now())


class EnrollmentRepository:
    model = CourseEnrollment

    def enroll(self, course, student) -> CourseEnrollment:
        return self.model.objects.create(course=course, student=student)

    def get(self, course, student) -> Optional[CourseEnrollment]:
        return self.model.objects.filter(course=course, student=student).first()

    def get_by_id(self, enrollment_id) -> Optional[CourseEnrollment]:
        return self.model.objects.select_related("student__user", "course__tutor").filter(id=enrollment_id).first()

    def get_active(self, course, student) -> Optional[CourseEnrollment]:
        return self.model.objects.filter(course=course, student=student, status=EnrollmentStatus.ACTIVE).first()

    def list_for_course(self, course, status=None):
        qs = self.model.objects.filter(course=course).select_related("student__user")
        if status:
            qs = qs.filter(status=status)
        return qs

    def list_for_student(self, student, status=None):
        qs = self.model.objects.filter(student=student).select_related("course__tutor__user", "course__subject")
        if status:
            qs = qs.filter(status=status)
        return qs

    def update(self, enrollment: CourseEnrollment, **fields) -> CourseEnrollment:
        for key, value in fields.items():
            setattr(enrollment, key, value)
        enrollment.save(update_fields=list(fields.keys()) + ["updated_at"])
        return enrollment
