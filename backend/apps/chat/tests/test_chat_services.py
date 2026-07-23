import pytest

from apps.core.exceptions import ApplicationError, PermissionDeniedError
from apps.chat.services.conversation_service import ConversationService
from apps.chat.services.message_service import MessageService
from apps.chat.tests.factories import ConversationFactory
from apps.users.tests.factories import UserFactory

pytestmark = pytest.mark.django_db


class TestConversationService:
    def test_get_or_create_direct_returns_same_conversation_on_repeat_calls(self):
        user_a = UserFactory()
        user_b = UserFactory()
        service = ConversationService()

        first = service.get_or_create_direct(user_a, user_b)
        second = service.get_or_create_direct(user_b, user_a)

        assert first.id == second.id

    def test_non_participant_cannot_mark_read(self):
        conversation = ConversationFactory()
        outsider = UserFactory()

        with pytest.raises(PermissionDeniedError):
            ConversationService().mark_read(conversation, outsider)


class TestMessageService:
    def test_participant_can_send_message(self):
        user_a = UserFactory()
        user_b = UserFactory()
        conversation = ConversationFactory(participants=[user_a, user_b])

        message = MessageService().send_message(conversation, user_a, content="Hey there!")
        assert message.content == "Hey there!"
        assert message.sender == user_a

    def test_non_participant_cannot_send_message(self):
        conversation = ConversationFactory()
        outsider = UserFactory()

        with pytest.raises(ApplicationError):
            MessageService().send_message(conversation, outsider, content="Sneaky message")

    def test_empty_message_without_attachment_raises(self):
        user_a = UserFactory()
        user_b = UserFactory()
        conversation = ConversationFactory(participants=[user_a, user_b])

        with pytest.raises(ApplicationError):
            MessageService().send_message(conversation, user_a, content="")

    def test_get_history_returns_messages_in_order(self):
        user_a = UserFactory()
        user_b = UserFactory()
        conversation = ConversationFactory(participants=[user_a, user_b])
        service = MessageService()

        service.send_message(conversation, user_a, content="First")
        service.send_message(conversation, user_b, content="Second")

        history = list(service.get_history(conversation))
        assert [m.content for m in history] == ["First", "Second"]
