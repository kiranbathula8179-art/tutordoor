import { apiClient } from "@/lib/api-client";
import type { Conversation, Message, PaginatedResponse } from "@/types";

export async function listConversations(): Promise<Conversation[]> {
  const { data } = await apiClient.get<{ results: Conversation[] }>("/chat/conversations/");
  return data.results;
}

export async function startConversation(payload: {
  recipient_id: string;
  related_booking_id?: string;
  related_course_id?: string;
}): Promise<Conversation> {
  const { data } = await apiClient.post<{ conversation: Conversation }>("/chat/conversations/", payload);
  return data.conversation;
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const { data } = await apiClient.get<PaginatedResponse<Message>>(
    `/chat/conversations/${conversationId}/messages/`,
    { params: { page_size: 100 } }
  );
  return data.results;
}

/** HTTP fallback for sending — used when the websocket isn't connected. */
export async function sendMessageHttp(conversationId: string, content: string): Promise<Message> {
  const { data } = await apiClient.post<{ message: Message }>(
    `/chat/conversations/${conversationId}/messages/`,
    { content }
  );
  return data.message;
}

export async function markConversationRead(conversationId: string): Promise<void> {
  await apiClient.post(`/chat/conversations/${conversationId}/read/`);
}
