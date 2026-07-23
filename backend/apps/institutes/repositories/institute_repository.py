from typing import Optional

from apps.institutes.models import InstituteProfile, InstituteStudentEnrollment, InstituteTutor, InstituteTutorStatus


class InstituteProfileRepository:
    model = InstituteProfile

    def get_by_user(self, user) -> Optional[InstituteProfile]:
        return self.model.objects.filter(user=user).select_related("user").first()

    def get_by_id(self, institute_id) -> Optional[InstituteProfile]:
        return self.model.objects.filter(id=institute_id).select_related("user").first()

    def create(self, user, **fields) -> InstituteProfile:
        return self.model.objects.create(user=user, **fields)

    def update(self, profile: InstituteProfile, **fields) -> InstituteProfile:
        for key, value in fields.items():
            setattr(profile, key, value)
        profile.save(update_fields=list(fields.keys()) + ["updated_at"])
        return profile

    def list_verified(self):
        return self.model.objects.filter(verification_status="verified").order_by("-rating_average")


class InstituteTutorRepository:
    model = InstituteTutor

    def add_tutor(self, institute, tutor, **fields) -> InstituteTutor:
        return self.model.objects.create(institute=institute, tutor=tutor, **fields)

    def list_for_institute(self, institute, status=None):
        qs = self.model.objects.filter(institute=institute).select_related("tutor__user")
        if status:
            qs = qs.filter(status=status)
        return qs

    def list_for_tutor(self, tutor, status=None):
        qs = self.model.objects.filter(tutor=tutor).select_related("institute__user")
        if status:
            qs = qs.filter(status=status)
        return qs.order_by("-created_at")

    def get(self, institute, tutor) -> Optional[InstituteTutor]:
        return self.model.objects.filter(institute=institute, tutor=tutor).first()

    def set_status(self, link: InstituteTutor, status: str) -> InstituteTutor:
        link.status = status
        if status == InstituteTutorStatus.ACTIVE and not link.joined_at:
            from django.utils import timezone

            link.joined_at = timezone.now()
        link.save(update_fields=["status", "joined_at", "updated_at"])
        return link


class InstituteEnrollmentRepository:
    model = InstituteStudentEnrollment

    def enroll(self, institute, student, **fields) -> InstituteStudentEnrollment:
        return self.model.objects.create(institute=institute, student=student, **fields)

    def list_for_institute(self, institute, status=None):
        qs = self.model.objects.filter(institute=institute).select_related("student__user")
        if status:
            qs = qs.filter(status=status)
        return qs

    def get(self, institute, student) -> Optional[InstituteStudentEnrollment]:
        return self.model.objects.filter(institute=institute, student=student).first()
