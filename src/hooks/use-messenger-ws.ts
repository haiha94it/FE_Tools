"use client";

import { useZaloMessengerStore } from "@/stores/use-zalo-messenger-store";
import { useWebSocketStore } from "@/stores/use-websocket-store";
import type {
  MessageAckPayload,
  MessengerConversation,
  NewGlobalUpdatePayload,
  RawZaloMessage,
} from "@/types/zalo-messenger";
import type { WsMessagePayload } from "@/types/websocket";
import { useEffect } from "react";

function isNewGlobalUpdate(
  payload: WsMessagePayload,
): payload is NewGlobalUpdatePayload & WsMessagePayload {
  return payload.type === "new_global_update";
}

function isMessageAck(
  payload: WsMessagePayload,
): payload is MessageAckPayload & WsMessagePayload {
  return payload.type === "message_ack";
}

export function useMessengerWs() {
  const connect = useWebSocketStore((s) => s.connect);
  const subscribe = useWebSocketStore((s) => s.subscribe);

  useEffect(() => {
    connect();
  }, [connect]);

  // Subscribe một lần — đọc state mới nhất qua getState(), tránh re-subscribe khi store đổi
  useEffect(() => {
    return subscribe((payload) => {
      const {
        mergeConversations,
        mergeAccountBadge,
        appendLiveMessages,
        handleMessageAck,
        selectedAccountId,
        activeConversation,
        accounts,
      } = useZaloMessengerStore.getState();

      if (isNewGlobalUpdate(payload)) {
        const conversations = (payload.conversations ??
          []) as MessengerConversation[];
        const messageDetails = (payload.message_details ??
          []) as RawZaloMessage[];

        if (conversations.length) {
          mergeConversations(conversations);
        }

        if (messageDetails.length && selectedAccountId) {
          const account = accounts.find((a) => a.id === selectedAccountId);
          appendLiveMessages(
            selectedAccountId,
            activeConversation,
            account?.uid,
            messageDetails,
          );
        }

        if (payload.account?.id != null) {
          mergeAccountBadge(payload.account.id, Boolean(payload.account.status));
        }
        return;
      }

      if (isMessageAck(payload) && payload.clientMsgId) {
        handleMessageAck(payload.clientMsgId, payload.success !== false);
      }
    });
  }, [subscribe]);
}