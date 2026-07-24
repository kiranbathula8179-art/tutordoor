from django.utils import timezone

from apps.core.exceptions import ApplicationError, ConflictError
from apps.institutes.models import VerificationStatus
from apps.institutes.repositories.institute_repository import InstituteProfileRepository
from apps.institutes.tasks import notify_institute_verification_result_task
from apps.users.models import UserRole


class InstituteProfileService:
    def __init__(self, institute_repository: InstituteProfileRepository = None):
        self.institute_repository = institute_repository or InstituteProfileRepository()

    def create_profile(self, user, **fields):
        if user.role != UserRole.INSTITUTE_ADMIN:
            raise ApplicationError(
                "Only users registered with the institute_admin role can create an institute profile."
            )
        if self.institute_repository.get_by_user(user):
            raise ConflictError("An institute profile already exists for this user.")
        return self.institute_repository.create(user=user, verification_status=VerificationStatus.PENDING, **fields)

    def update_profile(self, profile, **fields):
        return self.institute_repository.update(profile, **fields)

    def approve(self, profile, *, reviewer):
        if profile.verification_status == VerificationStatus.VERIFIED:
            raise ApplicationError("This institute is already verified.")
        self.institute_repository.update(
            profile,
            verification_status=VerificationStatus.VERIFIED,
            verified_at=timezone.now(),
            verified_by=reviewer,
            rejection_reason="",
        )
        notify_institute_verification_result_task.delay(user_id=str(profile.user_id), approved=True, reason="")
        return profile

    def reject(self, profile, *, reviewer, reason: str):
        self.institute_repository.update(
            profile,
            verification_status=VerificationStatus.REJECTED,
            verified_by=reviewer,
            rejection_reason=reason,
        )
        notify_institute_verification_result_task.delay(user_id=str(profile.user_id), approved=False, reason=reason)
        return profile
