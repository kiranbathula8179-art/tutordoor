from rest_framework import serializers

from apps.chat.models import Conversation, Message
from apps.users.serializers import UserSerializer


class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)

    class Meta:
        model = Message
        fields = (
            "id", "conversation", "sender", "message_type", "content", "attachment",
            "is_edited", "edited_at", "created_at",
        )
        read_only_fields = fields


class ConversationSerializer(serializers.ModelSerializer):
    participants = UserSerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = (
            "id", "participants", "related_booking_id", "related_course_id",
            "is_active", "last_message", "updated_at", "created_at",
        )
        read_only_fields = fields

    def get_last_message(self, obj):
        last = obj.messages.order_by("-created_at").first()
        return MessageSerializer(last).data if last else None


class StartConversationSerializer(serializers.Serializer):
    recipient_id = serializers.UUIDField()
    related_booking_id = serializers.UUIDField(required=False, allow_null=True)
    related_course_id = serializers.UUIDField(required=False, allow_null=True)


class SendMessageSerializer(serializers.Serializer):
    content = serializers.CharField(required=False, allow_blank=True, default="")
    attachment = serializers.FileField(required=False, allow_null=True)
