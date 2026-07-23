import uuid

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("users", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Conversation",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("related_booking_id", models.UUIDField(blank=True, null=True)),
                ("related_course_id", models.UUIDField(blank=True, null=True)),
                ("is_active", models.BooleanField(default=True)),
            ],
            options={"db_table": "conversations"},
        ),
        migrations.CreateModel(
            name="ConversationParticipant",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("last_read_at", models.DateTimeField(blank=True, null=True)),
                ("is_muted", models.BooleanField(default=False)),
                ("conversation", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="participant_links", to="chat.conversation")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="conversation_links", to="users.user")),
            ],
            options={"db_table": "conversation_participants"},
        ),
        migrations.AddField(
            model_name="conversation",
            name="participants",
            field=models.ManyToManyField(related_name="conversations", through="chat.ConversationParticipant", to="users.user"),
        ),
        migrations.CreateModel(
            name="Message",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("message_type", models.CharField(choices=[("text", "Text"), ("image", "Image"), ("file", "File"), ("system", "System")], default="text", max_length=10)),
                ("content", models.TextField(blank=True)),
                ("attachment", models.FileField(blank=True, null=True, upload_to="chat_attachments/%Y/%m/")),
                ("is_edited", models.BooleanField(default=False)),
                ("edited_at", models.DateTimeField(blank=True, null=True)),
                ("conversation", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="messages", to="chat.conversation")),
                ("sender", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="messages_sent", to="users.user")),
            ],
            options={"db_table": "messages", "ordering": ["created_at"]},
        ),
        migrations.AddConstraint(
            model_name="conversationparticipant",
            constraint=models.UniqueConstraint(fields=("conversation", "user"), name="unique_conversation_participant"),
        ),
        migrations.AddIndex(
            model_name="conversation",
            index=models.Index(fields=["related_booking_id"], name="conversation_booking_idx"),
        ),
        migrations.AddIndex(
            model_name="conversation",
            index=models.Index(fields=["related_course_id"], name="conversation_course_idx"),
        ),
        migrations.AddIndex(
            model_name="conversationparticipant",
            index=models.Index(fields=["user"], name="conv_participant_user_idx"),
        ),
        migrations.AddIndex(
            model_name="message",
            index=models.Index(fields=["conversation", "created_at"], name="message_conversation_created_idx"),
        ),
    ]
