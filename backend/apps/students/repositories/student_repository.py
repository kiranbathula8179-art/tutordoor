from typing import Optional

from apps.students.models import StudentProfile, StudentSubjectInterest


class StudentProfileRepository:
    model = StudentProfile

    def get_by_user(self, user) -> Optional[StudentProfile]:
        return self.model.objects.filter(user=user).select_related("user").first()

    def get_by_id(self, student_id) -> Optional[StudentProfile]:
        return self.model.objects.filter(id=student_id).select_related("user").first()

    def create(self, user, **fields) -> StudentProfile:
        return self.model.objects.create(user=user, **fields)

    def update(self, profile: StudentProfile, **fields) -> StudentProfile:
        for key, value in fields.items():
            setattr(profile, key, value)
        profile.save(update_fields=list(fields.keys()) + ["updated_at"])
        return profile

    def set_subject_interests(self, profile: StudentProfile, entries: list[dict]) -> None:
        StudentSubjectInterest.objects.filter(student=profile).delete()
        StudentSubjectInterest.objects.bulk_create(
            [
                StudentSubjectInterest(
                    student=profile,
                    subject_id=entry["subject_id"],
                    current_level=entry.get("current_level", "beginner"),
                )
                for entry in entries
            ]
        )
