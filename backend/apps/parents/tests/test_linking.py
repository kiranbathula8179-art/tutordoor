import pytest

from apps.core.exceptions import ApplicationError, ConflictError
from apps.parents.models import LinkStatus
from apps.parents.services.parent_service import ParentStudentLinkService
from apps.parents.tests.factories import ParentProfileFactory
from apps.students.tests.factories import StudentProfileFactory
from apps.users.models import UserRole
from apps.users.tests.factories import UserFactory

pytestmark = pytest.mark.django_db


class TestParentStudentLinkService:
    def test_invite_student_creates_pending_link(self):
        parent = ParentProfileFactory()
        student_user = UserFactory(role=UserRole.STUDENT, email="child@tutordoor.test")
        StudentProfileFactory(user=student_user)

        link = ParentStudentLinkService().invite_student(
            parent, student_email="child@tutordoor.test", relationship="mother"
        )

        assert link.status == LinkStatus.PENDING
        assert link.confirmation_token

    def test_invite_nonexistent_student_raises(self):
        parent = ParentProfileFactory()
        with pytest.raises(ApplicationError):
            ParentStudentLinkService().invite_student(
                parent, student_email="ghost@tutordoor.test", relationship="father"
            )

    def test_invite_same_student_twice_raises_conflict(self):
        parent = ParentProfileFactory()
        student_user = UserFactory(role=UserRole.STUDENT, email="child2@tutordoor.test")
        StudentProfileFactory(user=student_user)

        service = ParentStudentLinkService()
        service.invite_student(parent, student_email="child2@tutordoor.test", relationship="father")

        with pytest.raises(ConflictError):
            service.invite_student(parent, student_email="child2@tutordoor.test", relationship="father")

    def test_confirm_link_activates_it(self):
        parent = ParentProfileFactory()
        student_user = UserFactory(role=UserRole.STUDENT, email="child3@tutordoor.test")
        StudentProfileFactory(user=student_user)

        service = ParentStudentLinkService()
        link = service.invite_student(parent, student_email="child3@tutordoor.test", relationship="guardian")

        confirmed = service.confirm_link(link.confirmation_token)
        assert confirmed.status == LinkStatus.ACTIVE
        assert confirmed.confirmed_at is not None
