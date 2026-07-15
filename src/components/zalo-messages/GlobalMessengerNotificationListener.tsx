"use client";

import {
  clearMessengerTabAlert,
  isOnZaloMessagesPage,
  notifyZaloConversationActivity,
  notifyZaloIncomingMessage,
  registerMessengerNavigator,
  registerMessengerPathnameGetter,
} from "@/lib/messenger-global-notifications";
import { requestMessengerDesktopPermission } from "@/lib/messenger-browser-tab-notification";
import { useAuthStore } from "@/stores/use-auth-store";
import { useWebSocketStore } from "@/stores/use-websocket-store";
import { useZaloMessengerStore } from "@/stores/use-zalo-messenger-store";
import type {
  MessengerConversation,
  NewGlobalUpdatePayload,
  RawZaloMessage,
} from "@/types/zalo-messenger";
import type { WsMessagePayload } from "@/types/websocket";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

function isNewGlobalUpdate(
  payload: WsMessagePayload,
): payload is NewGlobalUpdatePayload & WsMessagePayload {
  return payload.type === "new_global_update";
}

function resolveConversation(
  conversationId: number,
  lookup: Map<number, MessengerConversation>,
  wsAccountId: number | null,
): MessengerConversation | undefined {
  const fromPayload = lookup.get(conversationId);
  if (fromPayload) return fromPayload;

  if (wsAccountId == null) return undefined;

  const state = useZaloMessengerStore.getState();
  const cached = state.conversationCache[wsAccountId]?.conversations;
  const fromCache = cached?.find((item) => item.id === conversationId);
  if (fromCache) return fromCache;

  if (state.selectedAccountId !== wsAccountId) return undefined;

  return state.conversations.find((item) => item.id === conversationId);
}

/** WS listener global — toast/tab alert khi có tin nhắn Zalo mới */
export default function GlobalMessengerNotificationListener() {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const subscribe = useWebSocketStore((s) => s.subscribe);

  useEffect(() => {
    registerMessengerPathnameGetter(() => pathname);
    registerMessengerNavigator((href) => {
      clearMessengerTabAlert();
      router.push(href);
    });
  }, [pathname, router]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    requestMessengerDesktopPermission();

    const maybeClear = () => {
      if (
        isOnZaloMessagesPage(pathname) &&
        typeof document !== "undefined" &&
        !document.hidden
      ) {
        clearMessengerTabAlert();
      }
    };

    maybeClear();
    document.addEventListener("visibilitychange", maybeClear);
    window.addEventListener("focus", maybeClear);
    return () => {
      document.removeEventListener("visibilitychange", maybeClear);
      window.removeEventListener("focus", maybeClear);
    };
  }, [isAuthenticated, pathname]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    return subscribe((payload) => {
      if (!isNewGlobalUpdate(payload)) return;

      const conversations = (payload.conversations ??
        []) as MessengerConversation[];
      const messageDetails = (payload.message_details ?? []) as RawZaloMessage[];
      const wsAccountId =
        payload.account?.id != null ? Number(payload.account.id) : null;
      const lookup = new Map<number, MessengerConversation>();
      for (const conversation of conversations) {
        lookup.set(conversation.id, conversation);
      }

      if (messageDetails.length) {
        for (const raw of messageDetails) {
          const convId =
            raw.conversation_id != null ? Number(raw.conversation_id) : NaN;
          const conversation = Number.isFinite(convId)
            ? resolveConversation(convId, lookup, wsAccountId)
            : undefined;
          notifyZaloIncomingMessage(raw, conversation);
        }
        return;
      }

      for (const conversation of conversations) {
        if (conversation.new_message) {
          notifyZaloConversationActivity(conversation);
        }
      }
    });
  }, [isAuthenticated, subscribe]);

  return null;
}