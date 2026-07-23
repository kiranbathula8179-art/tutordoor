from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.exceptions import ApplicationError, ResourceNotFoundError
from apps.core.pagination import StandardResultsSetPagination
from apps.chat.repositories.chat_repository import ConversationRepository
from apps.chat.serializers import (
    ConversationSerializer,
    MessageSerializer,
    SendMessageSerializer,
    StartConversationSerializer,
)
from apps.chat.services.conversation_service import ConversationService
from apps.chat.services.message_service import MessageService
from apps.users.repositories.user_repository import UserRepository


class MyConversationsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        conversations = ConversationService().list_for_user(request.user)
        return Response({"success": True, "results": ConversationSerializer(conversations, many=True).data})

    def post(self, request):
        serializer = StartConversationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        recipient = UserRepository().get_by_id(data["recipient_id"])
        if not recipient:
            raise ApplicationError("Recipient not found.")
        if recipient.id == request.user.id:
            raise ApplicationError("You cannot start a conversation with yourself.")

        conversation = ConversationService().get_or_create_direct(
            request.user, recipient,
            related_booking_id=data.get("related_booking_id"),
            related_course_id=data.get("related_course_id"),
        )
        return Response(
            {"success": True, "conversation": ConversationSerializer(conversation).data}, status=status.HTTP_201_CREATED
        )


class ConversationMessagesView(APIView):
    """History endpoint — real-time delivery of new messages happens over the /ws/chat/<id>/ websocket."""

    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get(self, request, conversation_id):
        conversation = ConversationRepository().get_by_id(conversation_id)
        if not conversation:
            raise ResourceNotFoundError("Conversation not found.")

        ConversationService().assert_participant(conversation, request.user)
        messages = MessageService().get_history(conversation)

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(messages, request)
        return paginator.get_paginated_response(MessageSerializer(page, many=True).data)

    def post(self, request, conversation_id):
        """Fallback HTTP send (e.g. for clients not connected to the websocket, or file uploads)."""
        conversation = ConversationRepository().get_by_id(conversation_id)
        if not conversation:
            raise ResourceNotFoundError("Conversation not found.")

        serializer = SendMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        message_type = "file" if serializer.validated_data.get("attachment") else "text"
        message = MessageService().send_message(
            conversation, request.user, message_type=message_type, **serializer.validated_data
        )
        return Response({"success": True, "message": MessageSerializer(message).data}, status=status.HTTP_201_CREATED)


class MarkConversationReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, conversation_id):
        conversation = ConversationRepository().get_by_id(conversation_id)
        if not conversation:
            raise ResourceNotFoundError("Conversation not found.")

        ConversationService().mark_read(conversation, request.user)
        return Response({"success": True, "message": "Conversation marked as read."})
