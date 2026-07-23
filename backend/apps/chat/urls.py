from django.urls import path

from apps.chat import views

app_name = "chat"

urlpatterns = [
    path("conversations/", views.MyConversationsView.as_view(), name="conversations"),
    path("conversations/<uuid:conversation_id>/messages/", views.ConversationMessagesView.as_view(), name="messages"),
    path("conversations/<uuid:conversation_id>/read/", views.MarkConversationReadView.as_view(), name="mark_read"),
]
