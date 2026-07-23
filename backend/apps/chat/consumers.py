import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer

from apps.chat.serializers import MessageSerializer


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.conversation_id = self.scope["url_route"]["kwargs"]["conversation_id"]
        self.group_name = f"chat_{self.conversation_id}"
        user = self.scope.get("user")

        if not user or not user.is_authenticated:
            await self.close(code=4001)
            return

        is_participant = await self._is_participant(user)
        if not is_participant:
            await self.close(code=4003)
            return

        self.user = user
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        try:
            payload = json.loads(text_data or "{}")
        except json.JSONDecodeError:
            return

        action = payload.get("action")

        if action == "send_message":
            await self._handle_send_message(payload)
        elif action == "typing":
            await self.channel_layer.group_send(
                self.group_name,
                {"type": "typing_indicator", "user_id": str(self.user.id), "is_typing": bool(payload.get("is_typing"))},
            )
        elif action == "mark_read":
            await self._handle_mark_read()

    async def _handle_send_message(self, payload):
        content = payload.get("content", "")
        if not content.strip():
            return

        message = await self._persist_message(content)
        message_data = await database_sync_to_async(lambda: MessageSerializer(message).data)()

        await self.channel_layer.group_send(self.group_name, {"type": "chat_message", "message": message_data})

    async def _handle_mark_read(self):
        await self._mark_read()
        await self.channel_layer.group_send(
            self.group_name, {"type": "read_receipt", "user_id": str(self.user.id)}
        )

    # ---------------------------------------------------------------- group event handlers
    async def chat_message(self, event):
        await self.send(text_data=json.dumps({"type": "message", "message": event["message"]}))

    async def typing_indicator(self, event):
        if event["user_id"] == str(self.user.id):
            return  # don't echo back to the sender
        await self.send(text_data=json.dumps({"type": "typing", "user_id": event["user_id"], "is_typing": event["is_typing"]}))

    async def read_receipt(self, event):
        await self.send(text_data=json.dumps({"type": "read_receipt", "user_id": event["user_id"]}))

    # ---------------------------------------------------------------- DB helpers
    @database_sync_to_async
    def _is_participant(self, user) -> bool:
        from apps.chat.repositories.chat_repository import ConversationRepository

        repository = ConversationRepository()
        conversation = repository.get_by_id(self.conversation_id)
        return bool(conversation and repository.is_participant(conversation, user))

    @database_sync_to_async
    def _persist_message(self, content: str):
        from apps.chat.repositories.chat_repository import ConversationRepository
        from apps.chat.services.message_service import MessageService

        conversation = ConversationRepository().get_by_id(self.conversation_id)
        return MessageService().send_message(conversation, self.user, content=content)

    @database_sync_to_async
    def _mark_read(self):
        from apps.chat.repositories.chat_repository import ConversationRepository
        from apps.chat.services.conversation_service import ConversationService

        conversation = ConversationRepository().get_by_id(self.conversation_id)
        ConversationService().mark_read(conversation, self.user)
