from django.conf import settings

from apps.core.exceptions import ApplicationError, ConflictError
from apps.parents.repositories.parent_repository import ParentProfileRepository, ParentStudentLinkRepository
from apps.parents.tasks import send_parent_link_invite_task
from apps.students.repositories.student_repository import StudentProfileRepository
from apps.users.models import UserRole


class ParentProfileService:
    def __init__(self, parent_repository: ParentProfileRepository = None):
        self.parent_repository = parent_repository or ParentProfileRepository()

    def create_profile(self, user, **fields):
        if user.role != UserRole.PARENT:
            raise ApplicationError("Only users registered with the parent role can create a parent profile.")
        if self.parent_repository.get_by_user(user):
            raise ConflictError("A parent profile already exists for this user.")
        return self.parent_repository.create(user=user, **fields)

    def update_profile(self, profile, **fields):
        return self.parent_repository.update(profile, **fields)


class ParentStudentLinkService:
    def __init__(
        self,
        link_repository: ParentStudentLinkRepository = None,
        student_repository: StudentProfileRepository = None,
    ):
        self.link_repository = link_repository or ParentStudentLinkRepository()
        self.student_repository = student_repository or StudentProfileRepository()

    def invite_student(self, parent_profile, *, student_email: str, relationship: str):
        student_user_profile = self._find_student_by_email(student_email)

        if self.link_repository.exists_link(parent_profile, student_user_profile):
            raise ConflictError("This student is already linked to your account.")

        link = self.link_repository.create(parent_profile, student_user_profile, relationship=relationship)
        token = link.generate_confirmation_token()

        confirmation_link = f"{settings.FRONTEND_URL}/parent-link/confirm?token={token}"
        send_parent_link_invite_task.delay(
            student_email=student_user_profile.user.email,
            parent_name=parent_profile.user.get_full_name(),
            confirmation_link=confirmation_link,
        )
        return link

    def _find_student_by_email(self, email: str):
        from apps.users.repositories.user_repository import UserRepository

        user = UserRepository().get_by_email(email)
        if not user or user.role != UserRole.STUDENT:
            raise ApplicationError("No student account found with that email address.")

        profile = self.student_repository.get_by_user(user)
        if not profile:
            raise ApplicationError("This student has not completed their profile yet.")
        return profile

    def confirm_link(self, token: str):
        link = self.link_repository.get_by_token(token)
        if not link:
            raise ApplicationError("Invalid or already-confirmed invitation link.")
        link.confirm()
        return link

    def revoke_link(self, parent_profile, student_profile):
        link = self.link_repository.get(parent_profile, student_profile)
        if not link:
            raise ApplicationError("No link exists between this parent and student.")
        return self.link_repository.revoke(link)

    def list_children(self, parent_profile):
        return self.link_repository.list_active_children(parent_profile)

    def list_parents(self, student_profile):
        return self.link_repository.list_active_parents(student_profile)
