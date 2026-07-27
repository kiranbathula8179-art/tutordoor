import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Check, CheckCheck, MessageCircle, SendHorizonal, WifiOff } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionLoader } from "@/components/ui/Spinner";
import { getMessages, listConversations, markConversationRead, sendMessageHttp } from "@/features/chat/api";
import { useChatSocket } from "@/features/chat/use-chat-socket";
import { EASE_OUT } from "@/lib/motion/tokens";
import { prefersReducedMotion } from "@/lib/motion/quality";
import { cn, formatDateTime, formatTime, getErrorMessage } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import type { Conversation, Message, User } from "@/types";

/**
 * Chat — "presence is light" (DESIGN_V2.md §rollout 7).
 *
 * Every v1 behavior is preserved verbatim: the ?c= URL contract, socket-first
 * send with HTTP fallback, cache-dedupe append, mark-read on open and on
 * incoming, typing timers (4s peer reset / 1.5s self stop), Enter-to-send,
 * and the NATIVE-scroll message pane this design system explicitly protects.
 *
 * What's new is light, and one honest activation: the socket always emitted
 * read_receipt — v1 never listened. Now a session-scoped "Seen" state turns
 * my messages' check cyan when the counterpart's live receipt covers them.
 * No per-message read data exists server-side, so nothing beyond the live
 * signal is claimed: on reload, checks return to "sent". Truthful receipts.
 */

function otherParticipant(conversation: Conversation, me: User | null): User | undefined {
  return conversation.participants.find((participant) => participant.id !== me?.id) ?? conversation.participants[0];
}

export function ChatPage() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeId = searchParams.get("c");
  const still = prefersReducedMotion();

  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: listConversations,
  });

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeId) ?? null,
    [conversations, activeId]
  );

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["chat-messages", activeId],
    queryFn: () => getMessages(activeId!),
    enabled: !!activeId,
  });

  const [typingUserId, setTypingUserId] = useState<string | null>(null);
  const typingResetTimer = useRef<ReturnType<typeof setTimeout>>();

  // Clear the pending typing-reset timer on unmount (audit finding LOW-1).
  useEffect(() => () => clearTimeout(typingResetTimer.current), []);

  /** Live "Seen" watermark: counterpart's most recent read_receipt this session. */
  const [seenUpTo, setSeenUpTo] = useState<number | null>(null);

  const appendMessage = (incoming: Message) => {
    queryClient.setQueryData<Message[]>(["chat-messages", incoming.conversation], (existing = []) => {
      if (existing.some((message) => message.id === incoming.id)) return existing;
      return [...existing, incoming];
    });
    queryClient.invalidateQueries({ queryKey: ["conversations"] });
  };

  const { isConnected, sendMessage, sendTyping, markRead } = useChatSocket(activeId, {
    onMessage: (message) => {
      appendMessage(message);
      if (message.sender.id !== user?.id) markRead();
    },
    onTyping: (userId, isTyping) => {
      setTypingUserId(isTyping ? userId : null);
      clearTimeout(typingResetTimer.current);
      if (isTyping) typingResetTimer.current = setTimeout(() => setTypingUserId(null), 4000);
    },
    onReadReceipt: (userId) => {
      if (userId !== user?.id) setSeenUpTo(Date.now());
    },
  });

  // Mark the thread read when it's opened; reset the seen watermark per thread.
  useEffect(() => {
    setSeenUpTo(null);
    if (!activeId) return;
    markConversationRead(activeId).catch(() => undefined);
  }, [activeId]);

  const httpSendMutation = useMutation({
    mutationFn: (content: string) => sendMessageHttp(activeId!, content),
    onSuccess: appendMessage,
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const handleSend = (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || !activeId) return;
    const sentViaSocket = sendMessage(trimmed);
    if (!sentViaSocket) httpSendMutation.mutate(trimmed);
  };

  const selectConversation = (conversationId: string) => {
    setSearchParams({ c: conversationId });
    setTypingUserId(null);
  };

  const counterpart = activeConversation ? otherParticipant(activeConversation, user) : undefined;
  const counterpartTyping = !!typingUserId && typingUserId !== user?.id;

  return (
    <div className="flex h-[calc(100vh-8.5rem)] overflow-hidden rounded-2xl border border-line bg-canvas shadow-soft">
      {/* ------------------------------------------------ Conversation list */}
      <aside
        className={cn(
          "w-full shrink-0 border-r border-line md:block md:w-80",
          activeId ? "hidden" : "block"
        )}
      >
        <div className="border-b border-line bg-gradient-to-r from-primary-subtle/60 to-transparent px-4 py-3.5">
          <h1 className="font-display text-lg font-bold text-navy">Messages</h1>
        </div>
        <div className="h-full overflow-y-auto pb-16">
          {conversationsLoading ? (
            <SectionLoader />
          ) : conversations.length === 0 ? (
            <EmptyState
              icon={MessageCircle}
              title="No conversations yet"
              description="Message a tutor from one of your bookings to start a thread."
              action={
                user?.role === "tutor" ? (
                  <Link to="/tutor/bookings">
                    <Button variant="outline" size="sm">
                      View your bookings
                    </Button>
                  </Link>
                ) : (
                  <Link to="/search">
                    <Button variant="outline" size="sm">
                      Find a tutor
                    </Button>
                  </Link>
                )
              }
            />
          ) : (
            conversations.map((conversation) => {
              const other = otherParticipant(conversation, user);
              const preview = conversation.last_message;
              const isActive = conversation.id === activeId;
              return (
                <button
                  key={conversation.id}
                  onClick={() => selectConversation(conversation.id)}
                  className={cn(
                    "relative flex w-full items-center gap-3 border-b border-line/60 px-4 py-3 text-left transition-colors hover:bg-surface",
                    isActive && "bg-primary-subtle/60"
                  )}
                >
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-primary"
                    />
                  )}
                  {other && (
                    <Avatar src={other.avatar} firstName={other.first_name} lastName={other.last_name} size="md" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-navy">{other?.full_name ?? "Conversation"}</p>
                    <p className="truncate text-xs text-slate-500">
                      {preview
                        ? `${preview.sender.id === user?.id ? "You: " : ""}${preview.content || "Attachment"}`
                        : "Say hello 👋"}
                    </p>
                  </div>
                  {preview && (
                    <span className="shrink-0 text-[0.65rem] text-slate-400">{formatTime(preview.created_at)}</span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* ------------------------------------------------ Active thread */}
      <section className={cn("min-w-0 flex-1 flex-col md:flex", activeId ? "flex" : "hidden")}>
        {!activeConversation ? (
          <div className="hidden flex-1 items-center justify-center md:flex">
            <div className="text-center">
              <MessageCircle className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-sm text-slate-500">Select a conversation to start chatting.</p>
            </div>
          </div>
        ) : (
          <>
            <header className="flex items-center gap-3 border-b border-line px-4 py-3">
              <button
                className="rounded-full p-1.5 text-slate-500 hover:bg-surface-3 hover:text-slate-700 md:hidden"
                onClick={() => setSearchParams({})}
                aria-label="Back to conversations"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              {counterpart && (
                <Avatar
                  src={counterpart.avatar}
                  firstName={counterpart.first_name}
                  lastName={counterpart.last_name}
                  size="sm"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-navy">{counterpart?.full_name}</p>
                <div className="h-4 text-xs text-slate-500">
                  {counterpartTyping ? <TypingDots still={still} /> : "\u00A0"}
                </div>
              </div>
              <ConnectionPulse isConnected={isConnected} still={still} />
            </header>

            <MessageThread
              conversationId={activeId}
              messages={messages}
              isLoading={messagesLoading}
              currentUserId={user?.id}
              seenUpTo={seenUpTo}
              still={still}
            />

            <MessageComposer onSend={handleSend} onTyping={sendTyping} isSending={httpSendMutation.isPending} />
          </>
        )}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Presence + typing as light
// ---------------------------------------------------------------------------

function ConnectionPulse({ isConnected, still }: { isConnected: boolean; still: boolean }) {
  if (!isConnected) {
    return (
      <span
        className="flex items-center gap-1.5 text-[0.65rem] text-slate-400"
        title="Offline — messages send over HTTP"
      >
        <WifiOff className="h-3.5 w-3.5" /> Offline
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-[0.65rem] font-medium text-success-dark" title="Real-time connection active">
      <span className="relative flex h-2 w-2">
        {!still && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-50" />}
        <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
      </span>
      Live
    </span>
  );
}

function TypingDots({ still }: { still: boolean }) {
  if (still) return <span>typing…</span>;
  return (
    <span className="flex items-center gap-1" aria-label="typing">
      {[0, 1, 2].map((index) => (
        <motion.span
          key={index}
          className="h-1.5 w-1.5 rounded-full bg-primary"
          animate={{ y: [0, -3, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 0.9, delay: index * 0.15, ease: "easeInOut" }}
        />
      ))}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Thread
// ---------------------------------------------------------------------------

function MessageThread({
  conversationId,
  messages,
  isLoading,
  currentUserId,
  seenUpTo,
  still,
}: {
  conversationId: string | null;
  messages: Message[];
  isLoading: boolean;
  currentUserId?: string;
  seenUpTo: number | null;
  still: boolean;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Arrival physics only for messages appended AFTER the initial load of a
  // thread — history must never cascade in.
  const initialCountRef = useRef<number | null>(null);
  useEffect(() => {
    initialCountRef.current = null;
  }, [conversationId]);
  useEffect(() => {
    if (!isLoading && initialCountRef.current === null) initialCountRef.current = messages.length;
  }, [isLoading, messages.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  if (isLoading) return <SectionLoader label="Loading messages..." />;

  const initialCount = initialCountRef.current ?? messages.length;

  return (
    <div className="flex-1 space-y-3 overflow-y-auto bg-gradient-to-b from-surface/40 to-transparent px-4 py-4">
      {messages.length === 0 && (
        <p className="py-10 text-center text-sm text-slate-500">No messages yet — start the conversation below.</p>
      )}
      {messages.map((message, index) => {
        const isMine = message.sender.id === currentUserId;
        const isNew = index >= initialCount;
        const isSeen = isMine && seenUpTo !== null && new Date(message.created_at).getTime() <= seenUpTo;
        return (
          <motion.div
            key={message.id}
            initial={isNew && !still ? { opacity: 0, y: 10, scale: 0.97 } : false}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.35, ease: EASE_OUT }}
            className={cn("flex", isMine ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm",
                isMine
                  ? "rounded-br-md bg-primary text-white"
                  : "rounded-bl-md bg-surface-3 text-navy"
              )}
            >
              {message.content && <p className="whitespace-pre-wrap break-words">{message.content}</p>}
              {message.attachment && (
                <a
                  href={message.attachment}
                  target="_blank"
                  rel="noreferrer"
                  className={cn("underline", isMine ? "text-blue-100" : "text-primary")}
                >
                  View attachment
                </a>
              )}
              <p
                className={cn(
                  "mt-1 flex items-center justify-end gap-1 text-[0.65rem]",
                  isMine ? "text-blue-100/80" : "text-slate-400"
                )}
                title={formatDateTime(message.created_at)}
              >
                {formatTime(message.created_at)}
                {isMine &&
                  (isSeen ? (
                    <CheckCheck className="h-3 w-3 text-white" aria-label="Seen" />
                  ) : (
                    <Check className="h-3 w-3 opacity-70" aria-label="Sent" />
                  ))}
              </p>
            </div>
          </motion.div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Composer
// ---------------------------------------------------------------------------

function MessageComposer({
  onSend,
  onTyping,
  isSending,
}: {
  onSend: (content: string) => void;
  onTyping: (isTyping: boolean) => void;
  isSending: boolean;
}) {
  const [draft, setDraft] = useState("");
  const typingStopTimer = useRef<ReturnType<typeof setTimeout>>();

  // Clear the pending typing-stop timer on unmount (audit finding LOW-1).
  useEffect(() => () => clearTimeout(typingStopTimer.current), []);

  const handleChange = (value: string) => {
    setDraft(value);
    onTyping(true);
    clearTimeout(typingStopTimer.current);
    typingStopTimer.current = setTimeout(() => onTyping(false), 1500);
  };

  const submit = () => {
    if (!draft.trim()) return;
    onSend(draft);
    setDraft("");
    onTyping(false);
  };

  return (
    <div className="flex items-end gap-2 border-t border-line p-3">
      <textarea
        value={draft}
        onChange={(event) => handleChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            submit();
          }
        }}
        rows={1}
        placeholder="Write a message... (Enter to send, Shift+Enter for a new line)"
        className="max-h-32 flex-1 resize-none rounded-xl border border-line bg-canvas px-4 py-2.5 text-sm text-navy placeholder:text-slate-400 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
      <button
          onClick={submit}
          disabled={!draft.trim() || isSending}
          aria-label="Send message"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-soft transition-all hover:bg-primary-dark hover:shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          <SendHorizonal className="h-4 w-4" />
        </button>
    </div>
  );
}
