from apps.core.exceptions import ApplicationError, ConflictError
from apps.institutes.models import InstituteEnrollmentStatus, InstituteTutorStatus
from apps.institutes.repositories.institute_repository import (
    InstituteEnrollmentRepository,
    InstituteTutorRepository,
)


class InstituteRosterService:
    """Manages which tutors teach under an institute and which students are enrolled in it."""

    def __init__(
        self,
        tutor_link_repository: InstituteTutorRepository = None,
        enrollment_repository: InstituteEnrollmentRepository = None,
    ):
        self.tutor_link_repository = tutor_link_repository or InstituteTutorRepository()
        self.enrollment_repository = enrollment_repository or InstituteEnrollmentRepository()

    def invite_tutor(self, institute, tutor_profile, *, role_title: str = ""):
        if self.tutor_link_repository.get(institute, tutor_profile):
            raise ConflictError("This tutor is already linked to your institute.")
        return self.tutor_link_repository.add_tutor(institute, tutor_profile, role_title=role_title)

    def respond_to_invite(self, institute, tutor_profile, *, accept: bool):
        link = self.tutor_link_repository.get(institute, tutor_profile)
        if not link:
            raise ApplicationError("No pending invitation found.")
        new_status = InstituteTutorStatus.ACTIVE if accept else InstituteTutorStatus.REMOVED
        return self.tutor_link_repository.set_status(link, new_status)

    def remove_tutor(self, institute, tutor_profile):
        link = self.tutor_link_repository.get(institute, tutor_profile)
        if not link:
            raise ApplicationError("This tutor is not linked to your institute.")
        return self.tutor_link_repository.set_status(link, InstituteTutorStatus.REMOVED)

    def list_tutors(self, institute, status=None):
        return self.tutor_link_repository.list_for_institute(institute, status=status)

    def enroll_student(self, institute, student_profile):
        if self.enrollment_repository.get(institute, student_profile):
            raise ConflictError("This student is already enrolled at your institute.")
        return self.enrollment_repository.enroll(institute, student_profile)

    def withdraw_student(self, institute, student_profile):
        enrollment = self.enrollment_repository.get(institute, student_profile)
        if not enrollment:
            raise ApplicationError("This student is not enrolled at your institute.")
        enrollment.status = InstituteEnrollmentStatus.WITHDRAWN
        enrollment.save(update_fields=["status", "updated_at"])
        return enrollment

    def list_students(self, institute, status=None):
        return self.enrollment_repository.list_for_institute(institute, status=status)
