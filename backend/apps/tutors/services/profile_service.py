from apps.core.exceptions import ApplicationError, ConflictError
from apps.tutors.repositories.tutor_repository import SubjectRepository, TutorProfileRepository
from apps.users.models import UserRole


class TutorProfileService:
    def __init__(
        self,
        tutor_repository: TutorProfileRepository = None,
        subject_repository: SubjectRepository = None,
    ):
        self.tutor_repository = tutor_repository or TutorProfileRepository()
        self.subject_repository = subject_repository or SubjectRepository()

    def create_profile(self, user, **fields):
        if user.role != UserRole.TUTOR:
            raise ApplicationError("Only users registered with the tutor role can create a tutor profile.")
        if self.tutor_repository.get_by_user(user):
            raise ConflictError("A tutor profile already exists for this user.")

        subject_entries = fields.pop("subjects", [])
        profile = self.tutor_repository.create(user=user, **fields)

        if subject_entries:
            self._validate_subjects_exist(subject_entries)
            self.tutor_repository.set_subjects(profile, subject_entries)

        return profile

    def update_profile(self, profile, **fields):
        subject_entries = fields.pop("subjects", None)
        updated = self.tutor_repository.update(profile, **fields) if fields else profile

        if subject_entries is not None:
            self._validate_subjects_exist(subject_entries)
            self.tutor_repository.set_subjects(updated, subject_entries)

        return updated

    def _validate_subjects_exist(self, subject_entries: list[dict]):
        for entry in subject_entries:
            if not self.subject_repository.get_subject(entry["subject_id"]):
                raise ApplicationError(f"Subject {entry['subject_id']} does not exist.")
