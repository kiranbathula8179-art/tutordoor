from apps.core.exceptions import ApplicationError
from apps.courses.models import Course, CourseSession
from apps.courses.repositories.course_repository import CourseRepository, CourseSessionRepository


class CourseService:
    def __init__(
        self,
        course_repository: CourseRepository = None,
        session_repository: CourseSessionRepository = None,
    ):
        self.course_repository = course_repository or CourseRepository()
        self.session_repository = session_repository or CourseSessionRepository()

    def create_course(self, *, tutor, created_by, session_schedule: list[dict] = None, **fields):
        total_sessions = fields.get("total_sessions")
        if session_schedule and len(session_schedule) != total_sessions:
            raise ApplicationError("The number of scheduled sessions must match total_sessions.")

        course = self.course_repository.create(tutor=tutor, created_by=created_by, **fields)

        if session_schedule:
            self._create_sessions(course, session_schedule)

        return course

    def _create_sessions(self, course: Course, session_schedule: list[dict]):
        sessions = [
            CourseSession(
                course=course,
                session_number=index + 1,
                title=entry.get("title", f"Session {index + 1}"),
                scheduled_start=entry["scheduled_start"],
                scheduled_end=entry["scheduled_end"],
            )
            for index, entry in enumerate(session_schedule)
        ]
        self.session_repository.bulk_create(sessions)

    def add_sessions(self, course: Course, session_schedule: list[dict]):
        existing_count = self.session_repository.list_for_course(course).count()
        sessions = [
            CourseSession(
                course=course,
                session_number=existing_count + index + 1,
                title=entry.get("title", f"Session {existing_count + index + 1}"),
                scheduled_start=entry["scheduled_start"],
                scheduled_end=entry["scheduled_end"],
            )
            for index, entry in enumerate(session_schedule)
        ]
        return self.session_repository.bulk_create(sessions)

    def publish(self, course: Course):
        if self.session_repository.list_for_course(course).count() == 0:
            raise ApplicationError("Add at least one scheduled session before publishing this course.")
        return self.course_repository.update(course, status="published")

    def archive(self, course: Course):
        return self.course_repository.update(course, status="archived")

    def update_course(self, course: Course, **fields):
        return self.course_repository.update(course, **fields)
