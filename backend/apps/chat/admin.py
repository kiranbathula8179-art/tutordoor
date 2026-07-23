from django.contrib import admin

from apps.chat.models import Conversation, ConversationParticipant, Message


class ConversationParticipantInline(admin.TabularInline):
    model = ConversationParticipant
    extra = 0


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ("id", "is_active", "related_booking_id", "related_course_id", "updated_at")
    list_filter = ("is_active",)
    inlines = [ConversationParticipantInline]


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("conversation", "sender", "message_type", "created_at")
    list_filter = ("message_type",)
    search_fields = ("sender__email", "content")
