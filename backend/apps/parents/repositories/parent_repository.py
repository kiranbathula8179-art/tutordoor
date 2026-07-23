from typing import Optional

from apps.parents.models import LinkStatus, ParentProfile, ParentStudentLink


class ParentProfileRepository:
    model = ParentProfile

    def get_by_user(self, user) -> Optional[ParentProfile]:
        return self.model.objects.filter(user=user).select_related("user").first()

    def create(self, user, **fields) -> ParentProfile:
        return self.model.objects.create(user=user, **fields)

    def update(self, profile: ParentProfile, **fields) -> ParentProfile:
        for key, value in fields.items():
            setattr(profile, key, value)
        profile.save(update_fields=list(fields.keys()) + ["updated_at"])
        return profile


class ParentStudentLinkRepository:
    model = ParentStudentLink

    def create(self, parent, student, **fields) -> ParentStudentLink:
        return self.model.objects.create(parent=parent, student=student, **fields)

    def get_by_token(self, token: str) -> Optional[ParentStudentLink]:
        return self.model.objects.filter(confirmation_token=token, status=LinkStatus.PENDING).first()

    def list_active_children(self, parent: ParentProfile):
        return self.model.objects.filter(parent=parent, status=LinkStatus.ACTIVE).select_related(
            "student__user"
        )

    def list_active_parents(self, student):
        return self.model.objects.filter(student=student, status=LinkStatus.ACTIVE).select_related(
            "parent__user"
        )

    def exists_link(self, parent, student) -> bool:
        return self.model.objects.filter(parent=parent, student=student).exists()

    def get(self, parent, student) -> Optional[ParentStudentLink]:
        return self.model.objects.filter(parent=parent, student=student).first()

    def revoke(self, link: ParentStudentLink) -> ParentStudentLink:
        link.status = LinkStatus.REVOKED
        link.save(update_fields=["status", "updated_at"])
        return link
