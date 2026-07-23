from django.utils import timezone

from apps.core.exceptions import ApplicationError, ConflictError, PermissionDeniedError
from apps.courses.models import EnrollmentStatus
from apps.courses.repositories.course_repository import EnrollmentRepository


class EnrollmentService:
    def __init__(self, enrollment_repository: EnrollmentRepository = None):
        self.enrollment_repository = enrollment_repository or EnrollmentRepository()

    def enroll(self, course, student):
        if course.status != "published":
            raise ApplicationError("This course is not currently open for enrollment.")

        existing = self.enrollment_repository.get(course, student)
        if existing and existing.status in (EnrollmentStatus.ACTIVE, EnrollmentStatus.PENDING_PAYMENT):
            raise ConflictError("You are already enrolled in this course.")

        if course.seats_available <= 0:
            raise ConflictError("This course is full.")

        enrollment = self.enrollment_repository.enroll(course, student)

        if course.price == 0:
            enrollment = self.enrollment_repository.update(enrollment, status=EnrollmentStatus.ACTIVE)

        return enrollment

    def confirm_after_payment(self, enrollment):
        if enrollment.status != EnrollmentStatus.PENDING_PAYMENT:
            raise ApplicationError("Only enrollments pending payment can be confirmed this way.")
        return self.enrollment_repository.update(enrollment, status=EnrollmentStatus.ACTIVE)

    def drop(self, enrollment, *, by_user):
        if by_user.id != enrollment.student.user_id and not by_user.is_superuser:
            raise PermissionDeniedError("You are not authorized to drop this enrollment.")
        return self.enrollment_repository.update(enrollment, status=EnrollmentStatus.DROPPED)

    def mark_completed(self, enrollment):
        return self.enrollment_repository.update(
            enrollment, status=EnrollmentStatus.COMPLETED, completed_at=timezone.now()
        )
