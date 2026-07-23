import { useCallback, useEffect, useRef, useState } from "react";

import { env } from "@/lib/env";
import { useAuthStore } from "@/store/auth-store";
import type { Message } from "@/types";

interface ChatSocketHandlers {
  onMessage?: (message: Message) => void;
  onTyping?: (userId: string, isTyping: boolean) => void;
  onReadReceipt?: (userId: string) => void;
}

type IncomingEvent =
  | { type: "message"; message: Message }
  | { type: "typing"; user_id: string; is_typing: boolean }
  | { type: "read_receipt"; user_id: string };

/**
 * Manages one websocket connection per active conversation.
 *
 * Auth matches apps.core.middleware_ws.JWTAuthMiddleware on the backend:
 * the access JWT rides in a `?token=` query param, because browsers can't
 * set Authorization headers on a websocket handshake. The server closes
 * with 4001 (unauthenticated) or 4003 (not a participant) — neither is
 * retried. Network-level drops reconnect with capped exponential backoff.
 */
export function useChatSocket(conversationId: string | null, handlers: ChatSocketHandlers) {
  const accessToken = useAuthStore((state) => state.tokens?.access);
  const socketRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Keep the latest handlers without re-triggering the connection effect.
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!conversationId || !accessToken) return;

    let cancelled = false;
    let retryCount = 0;
    let retryTimer: ReturnType<typeof setTimeout>;

    const connect = () => {
      const socket = new WebSocket(`${env.wsBaseUrl}/ws/chat/${conversationId}/?token=${accessToken}`);
      socketRef.current = socket;

      socket.onopen = () => {
        retryCount = 0;
        setIsConnected(true);
      };

      socket.onmessage = (event) => {
        let payload: IncomingEvent;
        try {
          payload = JSON.parse(event.data);
        } catch {
          return;
        }
        if (payload.type === "message") handlersRef.current.onMessage?.(payload.message);
        else if (payload.type === "typing") handlersRef.current.onTyping?.(payload.user_id, payload.is_typing);
        else if (payload.type === "read_receipt") handlersRef.current.onReadReceipt?.(payload.user_id);
      };

      socket.onclose = (event) => {
        setIsConnected(false);
        const isAuthClose = event.code === 4001 || event.code === 4003;
        if (!cancelled && !isAuthClose && retryCount < 5) {
          retryCount += 1;
          retryTimer = setTimeout(connect, Math.min(1000 * 2 ** retryCount, 10_000));
        }
      };
    };

    connect();

    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
      socketRef.current?.close();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [conversationId, accessToken]);

  const sendRaw = useCallback((payload: Record<string, unknown>): boolean => {
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(payload));
      return true;
    }
    return false;
  }, []);

  return {
    isConnected,
    /** Returns false when the socket isn't open — caller should fall back to HTTP. */
    sendMessage: useCallback((content: string) => sendRaw({ action: "send_message", content }), [sendRaw]),
    sendTyping: useCallback((isTyping: boolean) => sendRaw({ action: "typing", is_typing: isTyping }), [sendRaw]),
    markRead: useCallback(() => sendRaw({ action: "mark_read" }), [sendRaw]),
  };
}
