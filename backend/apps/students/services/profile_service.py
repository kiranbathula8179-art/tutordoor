from apps.core.exceptions import ApplicationError, ConflictError
from apps.students.repositories.student_repository import StudentProfileRepository
from apps.users.models import UserRole


class StudentProfileService:
    def __init__(self, student_repository: StudentProfileRepository = None):
        self.student_repository = student_repository or StudentProfileRepository()

    def create_profile(self, user, **fields):
        if user.role != UserRole.STUDENT:
            raise ApplicationError("Only users registered with the student role can create a student profile.")
        if self.student_repository.get_by_user(user):
            raise ConflictError("A student profile already exists for this user.")

        subject_entries = fields.pop("preferred_subjects", [])
        profile = self.student_repository.create(user=user, **fields)

        if subject_entries:
            self.student_repository.set_subject_interests(profile, subject_entries)

        return profile

    def update_profile(self, profile, **fields):
        subject_entries = fields.pop("preferred_subjects", None)
        updated = self.student_repository.update(profile, **fields) if fields else profile

        if subject_entries is not None:
            self.student_repository.set_subject_interests(updated, subject_entries)

        return updated
