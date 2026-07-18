"use client";

import { toast } from "@/lib/toast";
import {
  filterMessageDetailsForAccount,
  groupConversationsByAccount,
  prepareConversationsFromGlobalUpdate,
} from "@/lib/zalo-messenger-utils";
import { useZaloMessengerStore } from "@/stores/use-zalo-messenger-store";
import { useWebSocketStore } from "@/stores/use-websocket-store";
import type {
  MessageAckPayload,
  MessengerConversation,
  NewGlobalUpdatePayload,
  RawZaloMessage,
  WsActionMessagePayload,
} from "@/types/zalo-messenger";
import type { WsMessagePayload } from "@/types/websocket";
import { useEffect } from "react";

const WS_ACTION_FAILURE_HINT: Record<string, string> = {
  "send-reaction-to-group": "Không gửi được cảm xúc.",
  "send-reaction-to-uid": "Không gửi được cảm xúc.",
  "send-sticker": "Không gửi được sticker.",
  "block-friend": "Không thực hiện được thao tác chặn.",
};

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

function isWsActionMessage(
  payload: WsMessagePayload,
): payload is WsActionMessagePayload & WsMessagePayload {
  return payload.type === "message" && typeof payload.command === "string";
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
        resetConversationUnread,
        selectedAccountId,
        activeConversation,
        activeConversationId,
        accounts,
      } = useZaloMessengerStore.getState();

      if (isNewGlobalUpdate(payload)) {
        const conversations = (payload.conversations ??
          []) as MessengerConversation[];
        const messageDetails = (payload.message_details ??
          []) as RawZaloMessage[];
        const wsAccountId =
          payload.account?.id != null ? Number(payload.account.id) : null;

        // 1 socket nhiều nick — merge từng bucket theo account, bỏ item thiếu owner
        if (conversations.length) {
          const prepared = prepareConversationsFromGlobalUpdate(
            conversations,
            messageDetails,
            {
              activeConversationId:
                wsAccountId != null &&
                selectedAccountId != null &&
                wsAccountId === selectedAccountId
                  ? (activeConversation?.id ?? null)
                  : null,
            },
          );
          const byAccount = groupConversationsByAccount(
            prepared,
            wsAccountId,
          );
          for (const [ownerId, list] of byAccount) {
            mergeConversations(list, ownerId);
          }
        }

        // Chỉ append bubble khi frame thuộc nick đang xem + tin khớp open chat
        if (
          messageDetails.length &&
          wsAccountId != null &&
          selectedAccountId != null &&
          wsAccountId === selectedAccountId
        ) {
          const account = accounts.find((a) => a.id === wsAccountId);
          const openForAccount =
            activeConversation != null &&
            (activeConversation.account == null ||
              Number(activeConversation.account) === wsAccountId)
              ? activeConversation
              : null;
          const forAccount = filterMessageDetailsForAccount(
            messageDetails,
            wsAccountId,
          );
          if (forAccount.length && openForAccount) {
            appendLiveMessages(
              wsAccountId,
              openForAccount,
              account?.uid,
              forAccount,
            );
          }
        }

        if (wsAccountId != null) {
          mergeAccountBadge(wsAccountId, Boolean(payload.account?.status));
        }

        if (
          wsAccountId != null &&
          selectedAccountId != null &&
          wsAccountId === selectedAccountId &&
          activeConversationId
        ) {
          const { conversations: currentList } =
            useZaloMessengerStore.getState();
          const openConversation = currentList.find(
            (item) =>
              item.id === activeConversationId &&
              Number(item.account) === wsAccountId,
          );
          if (openConversation?.new_message) {
            resetConversationUnread(wsAccountId, activeConversationId);
          }
        }
        return;
      }

      if (isMessageAck(payload) && payload.clientMsgId) {
        handleMessageAck(payload.clientMsgId, payload.success !== false);
        return;
      }

      if (isWsActionMessage(payload) && payload.success === false) {
        const zaloErrorCode = payload.result?.error_code;
        const command = payload.command ?? "";

        if (
          zaloErrorCode === 114 &&
          command.includes("send-reaction")
        ) {
          toast.error(
            "Zalo từ chối cảm xúc (114). Kiểm tra group.uid, msgId và cliMsgId từ tin nhắn gốc.",
          );
          return;
        }

        const hint =
          WS_ACTION_FAILURE_HINT[command] ?? "Thao tác chat thất bại.";
        toast.error(hint);
      }
    });
  }, [subscribe]);
}