import pytest

from apps.core.exceptions import ApplicationError, ConflictError
from apps.tutors.models import VerificationStatus
from apps.tutors.services.profile_service import TutorProfileService
from apps.tutors.services.verification_service import VerificationService
from apps.tutors.tests.factories import SubjectFactory, TutorProfileFactory
from apps.users.tests.factories import TutorUserFactory, UserFactory

pytestmark = pytest.mark.django_db


class TestTutorProfileService:
    def test_create_profile_succeeds_for_tutor_role(self):
        user = TutorUserFactory()
        subject = SubjectFactory()

        profile = TutorProfileService().create_profile(
            user,
            hourly_rate=600,
            currency="INR",
            teaching_mode="online",
            subjects=[{"subject_id": subject.id, "expertise_level": "advanced", "years_experience": 5}],
        )

        assert profile.user == user
        assert profile.tutor_subjects.count() == 1

    def test_create_profile_rejects_non_tutor_role(self):
        user = UserFactory()  # default role=student
        with pytest.raises(ApplicationError):
            TutorProfileService().create_profile(user, hourly_rate=500)

    def test_create_profile_rejects_duplicate(self):
        user = TutorUserFactory()
        TutorProfileService().create_profile(user, hourly_rate=500)
        with pytest.raises(ConflictError):
            TutorProfileService().create_profile(user, hourly_rate=500)


class TestVerificationService:
    def test_approve_tutor_updates_status(self):
        admin = UserFactory(role="admin", is_staff=True, is_superuser=True)
        profile = TutorProfileFactory(verification_status=VerificationStatus.PENDING)

        updated = VerificationService().approve_tutor(profile, reviewer=admin)

        assert updated.verification_status == VerificationStatus.VERIFIED
        assert updated.verified_by == admin
        assert updated.verified_at is not None

    def test_approve_already_verified_tutor_raises(self):
        admin = UserFactory(role="admin")
        profile = TutorProfileFactory(verification_status=VerificationStatus.VERIFIED)

        with pytest.raises(ApplicationError):
            VerificationService().approve_tutor(profile, reviewer=admin)

    def test_reject_tutor_stores_reason(self):
        admin = UserFactory(role="admin")
        profile = TutorProfileFactory(verification_status=VerificationStatus.PENDING)

        updated = VerificationService().reject_tutor(profile, reviewer=admin, reason="Blurry ID document.")

        assert updated.verification_status == VerificationStatus.REJECTED
        assert updated.rejection_reason == "Blurry ID document."
