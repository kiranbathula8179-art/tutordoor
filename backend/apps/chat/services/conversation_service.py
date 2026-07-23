from django.utils import timezone

from apps.core.exceptions import PermissionDeniedError
from apps.chat.repositories.chat_repository import ConversationRepository


class ConversationService:
    def __init__(self, conversation_repository: ConversationRepository = None):
        self.conversation_repository = conversation_repository or ConversationRepository()

    def get_or_create_direct(self, user_a, user_b, *, related_booking_id=None, related_course_id=None):
        existing = self.conversation_repository.find_direct_conversation(user_a, user_b)
        if existing:
            return existing
        return self.conversation_repository.create(
            participants=[user_a, user_b],
            related_booking_id=related_booking_id,
            related_course_id=related_course_id,
        )

    def list_for_user(self, user):
        return self.conversation_repository.list_for_user(user)

    def assert_participant(self, conversation, user):
        if not self.conversation_repository.is_participant(conversation, user):
            raise PermissionDeniedError("You are not a participant in this conversation.")

    def mark_read(self, conversation, user):
        self.assert_participant(conversation, user)
        link = self.conversation_repository.get_participant_link(conversation, user)
        link.last_read_at = timezone.now()
        link.save(update_fields=["last_read_at", "updated_at"])
        return link
