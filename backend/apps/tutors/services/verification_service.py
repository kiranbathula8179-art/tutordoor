from django.utils import timezone

from apps.core.exceptions import ApplicationError
from apps.tutors.models import DocumentReviewStatus, VerificationStatus
from apps.tutors.repositories.tutor_repository import TutorProfileRepository
from apps.tutors.repositories.verification_repository import VerificationRepository
from apps.tutors.tasks import notify_tutor_verification_result_task

REQUIRED_DOCUMENT_TYPES = {"government_id", "degree_certificate"}


class VerificationService:
    """
    Handles the tutor onboarding verification pipeline: document submission,
    admin review, and final approve/reject decisions that unlock the ability
    to accept bookings.
    """

    def __init__(
        self,
        verification_repository: VerificationRepository = None,
        tutor_repository: TutorProfileRepository = None,
    ):
        self.verification_repository = verification_repository or VerificationRepository()
        self.tutor_repository = tutor_repository or TutorProfileRepository()

    def submit_document(self, tutor_profile, *, document_type: str, file):
        document = self.verification_repository.create(tutor_profile, document_type=document_type, file=file)

        submitted_types = set(
            self.verification_repository.list_for_tutor(tutor_profile).values_list("document_type", flat=True)
        )
        if REQUIRED_DOCUMENT_TYPES.issubset(submitted_types):
            self.tutor_repository.update(tutor_profile, verification_status=VerificationStatus.PENDING)

        return document

    def list_pending_reviews(self):
        return self.verification_repository.list_pending()

    def review_document(self, document, *, reviewer, approve: bool, notes: str = ""):
        status = DocumentReviewStatus.APPROVED if approve else DocumentReviewStatus.REJECTED
        return self.verification_repository.review(document, status=status, reviewer=reviewer, notes=notes)

    def approve_tutor(self, tutor_profile, *, reviewer):
        if tutor_profile.verification_status == "verified":
            raise ApplicationError("This tutor is already verified.")

        self.tutor_repository.update(
            tutor_profile,
            verification_status=VerificationStatus.VERIFIED,
            verified_at=timezone.now(),
            verified_by=reviewer,
            rejection_reason="",
        )
        notify_tutor_verification_result_task.delay(user_id=str(tutor_profile.user_id), approved=True, reason="")
        return tutor_profile

    def reject_tutor(self, tutor_profile, *, reviewer, reason: str):
        self.tutor_repository.update(
            tutor_profile,
            verification_status=VerificationStatus.REJECTED,
            verified_by=reviewer,
            rejection_reason=reason,
        )
        notify_tutor_verification_result_task.delay(
            user_id=str(tutor_profile.user_id), approved=False, reason=reason
        )
        return tutor_profile
