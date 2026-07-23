from django.utils import timezone

from apps.tutors.models import VerificationDocument


class VerificationRepository:
    model = VerificationDocument

    def list_for_tutor(self, tutor):
        return self.model.objects.filter(tutor=tutor).order_by("-created_at")

    def create(self, tutor, **fields) -> VerificationDocument:
        return self.model.objects.create(tutor=tutor, **fields)

    def list_pending(self):
        return self.model.objects.filter(status="pending").select_related("tutor__user").order_by("created_at")

    def review(self, document: VerificationDocument, *, status: str, reviewer, notes: str = "") -> VerificationDocument:
        document.status = status
        document.reviewed_by = reviewer
        document.reviewed_at = timezone.now()
        document.admin_notes = notes
        document.save(update_fields=["status", "reviewed_by", "reviewed_at", "admin_notes", "updated_at"])
        return document
