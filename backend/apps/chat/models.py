from django.db import models

from apps.core.models import BaseModel
from apps.users.models import User


class Conversation(BaseModel):
    """
    A chat thread between two or more users. Optionally scoped to a Booking
    or Course (lightweight polymorphic link, same pattern as the payments
    app) so the UI can show "this chat is about your session with X".
    """

    participants = models.ManyToManyField(User, through="ConversationParticipant", related_name="conversations")
    related_booking_id = models.UUIDField(null=True, blank=True)
    related_course_id = models.UUIDField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "conversations"
        indexes = [
            models.Index(fields=["related_booking_id"]),
            models.Index(fields=["related_course_id"]),
        ]

    def __str__(self):
        return f"Conversation<{self.id}>"


class ConversationParticipant(BaseModel):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name="participant_links")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="conversation_links")
    last_read_at = models.DateTimeField(null=True, blank=True)
    is_muted = models.BooleanField(default=False)

    class Meta:
        db_table = "conversation_participants"
        constraints = [
            models.UniqueConstraint(fields=["conversation", "user"], name="unique_conversation_participant")
        ]
        indexes = [models.Index(fields=["user"])]


class MessageType(models.TextChoices):
    TEXT = "text", "Text"
    IMAGE = "image", "Image"
    FILE = "file", "File"
    SYSTEM = "system", "System"


class Message(BaseModel):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="messages_sent")
    message_type = models.CharField(max_length=10, choices=MessageType.choices, default=MessageType.TEXT)
    content = models.TextField(blank=True)
    attachment = models.FileField(upload_to="chat_attachments/%Y/%m/", null=True, blank=True)
    is_edited = models.BooleanField(default=False)
    edited_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "messages"
        ordering = ["created_at"]
        indexes = [models.Index(fields=["conversation", "created_at"])]

    def __str__(self):
        return f"Message<{self.sender_id} in {self.conversation_id}>"
