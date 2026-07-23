from apps.core.exceptions import ApplicationError
from apps.chat.models import MessageType
from apps.chat.repositories.chat_repository import ConversationRepository, MessageRepository


class MessageService:
    def __init__(
        self,
        message_repository: MessageRepository = None,
        conversation_repository: ConversationRepository = None,
    ):
        self.message_repository = message_repository or MessageRepository()
        self.conversation_repository = conversation_repository or ConversationRepository()

    def send_message(self, conversation, sender, *, content: str = "", attachment=None, message_type: str = MessageType.TEXT):
        if not self.conversation_repository.is_participant(conversation, sender):
            raise ApplicationError("You are not a participant in this conversation.")
        if not content and not attachment:
            raise ApplicationError("A message needs text content or an attachment.")

        message = self.message_repository.create(
            conversation=conversation, sender=sender, content=content, attachment=attachment, message_type=message_type
        )
        self.conversation_repository.touch(conversation)
        self._notify_other_participants(conversation, sender, message)
        return message

    def _notify_other_participants(self, conversation, sender, message):
        from apps.chat.tasks import notify_new_message_task

        for recipient in self.conversation_repository.other_participants(conversation, excluding_user=sender):
            notify_new_message_task.delay(str(recipient.id), str(sender.id), str(conversation.id), message.content[:100])

    def get_history(self, conversation, since=None):
        return self.message_repository.list_for_conversation(conversation, since=since)
