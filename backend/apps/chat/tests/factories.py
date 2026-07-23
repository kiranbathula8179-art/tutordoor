import factory
from factory.django import DjangoModelFactory

from apps.chat.models import Conversation, ConversationParticipant
from apps.users.tests.factories import UserFactory


class ConversationFactory(DjangoModelFactory):
    class Meta:
        model = Conversation

    @factory.post_generation
    def participants(self, create, extracted, **kwargs):
        if not create:
            return
        users = extracted or [UserFactory(), UserFactory()]
        for user in users:
            ConversationParticipant.objects.get_or_create(conversation=self, user=user)
