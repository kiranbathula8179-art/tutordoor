from typing import Optional

from apps.chat.models import Conversation, ConversationParticipant, Message


class ConversationRepository:
    model = Conversation

    def create(self, participants: list, **fields) -> Conversation:
        conversation = self.model.objects.create(**fields)
        ConversationParticipant.objects.bulk_create(
            [ConversationParticipant(conversation=conversation, user=user) for user in participants]
        )
        return conversation

    def get_by_id(self, conversation_id) -> Optional[Conversation]:
        return self.model.objects.filter(id=conversation_id).first()

    def find_direct_conversation(self, user_a, user_b) -> Optional[Conversation]:
        """Finds an existing 1:1 conversation between exactly these two users, if any."""
        candidates = self.model.objects.filter(participants=user_a).filter(participants=user_b)
        for conversation in candidates:
            if conversation.participants.count() == 2:
                return conversation
        return None

    def list_for_user(self, user):
        return self.model.objects.filter(participants=user, is_active=True).order_by("-updated_at")

    def is_participant(self, conversation, user) -> bool:
        return ConversationParticipant.objects.filter(conversation=conversation, user=user).exists()

    def get_participant_link(self, conversation, user) -> Optional[ConversationParticipant]:
        return ConversationParticipant.objects.filter(conversation=conversation, user=user).first()

    def other_participants(self, conversation, excluding_user):
        return conversation.participants.exclude(id=excluding_user.id)

    def touch(self, conversation: Conversation):
        from django.utils import timezone

        conversation.updated_at = timezone.now()
        conversation.save(update_fields=["updated_at"])


class MessageRepository:
    model = Message

    def create(self, **fields) -> Message:
        return self.model.objects.create(**fields)

    def list_for_conversation(self, conversation, since=None):
        qs = self.model.objects.filter(conversation=conversation).select_related("sender")
        if since:
            qs = qs.filter(created_at__gt=since)
        return qs

    def unread_count(self, conversation, user, last_read_at):
        qs = self.model.objects.filter(conversation=conversation).exclude(sender=user)
        if last_read_at:
            qs = qs.filter(created_at__gt=last_read_at)
        return qs.count()
