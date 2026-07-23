import pytest

from apps.core.exceptions import ApplicationError, ConflictError
from apps.institutes.models import InstituteTutorStatus, VerificationStatus
from apps.institutes.services.profile_service import InstituteProfileService
from apps.institutes.services.roster_service import InstituteRosterService
from apps.institutes.tests.factories import InstituteProfileFactory, InstituteUserFactory
from apps.students.tests.factories import StudentProfileFactory
from apps.tutors.tests.factories import TutorProfileFactory
from apps.users.tests.factories import UserFactory

pytestmark = pytest.mark.django_db


class TestInstituteProfileService:
    def test_create_profile_defaults_to_pending(self):
        user = InstituteUserFactory()
        profile = InstituteProfileService().create_profile(user, institute_name="Elite Coaching Center")
        assert profile.verification_status == VerificationStatus.PENDING

    def test_approve_sets_verified_and_reviewer(self):
        admin = UserFactory(role="admin")
        profile = InstituteProfileFactory(verification_status=VerificationStatus.PENDING)

        updated = InstituteProfileService().approve(profile, reviewer=admin)
        assert updated.verification_status == VerificationStatus.VERIFIED
        assert updated.verified_by == admin

    def test_approve_twice_raises(self):
        admin = UserFactory(role="admin")
        profile = InstituteProfileFactory(verification_status=VerificationStatus.VERIFIED)
        with pytest.raises(ApplicationError):
            InstituteProfileService().approve(profile, reviewer=admin)


class TestInstituteRosterService:
    def test_invite_tutor_creates_pending_link(self):
        institute = InstituteProfileFactory()
        tutor = TutorProfileFactory()

        link = InstituteRosterService().invite_tutor(institute, tutor, role_title="Faculty")
        assert link.status == InstituteTutorStatus.PENDING

    def test_invite_same_tutor_twice_raises_conflict(self):
        institute = InstituteProfileFactory()
        tutor = TutorProfileFactory()

        service = InstituteRosterService()
        service.invite_tutor(institute, tutor)
        with pytest.raises(ConflictError):
            service.invite_tutor(institute, tutor)

    def test_tutor_accepting_invite_activates_link(self):
        institute = InstituteProfileFactory()
        tutor = TutorProfileFactory()

        service = InstituteRosterService()
        service.invite_tutor(institute, tutor)
        link = service.respond_to_invite(institute, tutor, accept=True)

        assert link.status == InstituteTutorStatus.ACTIVE
        assert link.joined_at is not None

    def test_enroll_student_and_prevent_duplicates(self):
        institute = InstituteProfileFactory()
        student = StudentProfileFactory()

        service = InstituteRosterService()
        service.enroll_student(institute, student)
        with pytest.raises(ConflictError):
            service.enroll_student(institute, student)
