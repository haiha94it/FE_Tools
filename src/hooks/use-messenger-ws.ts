"use client";

import { takeFailedPendingComposerSend } from "@/hooks/use-messenger-send";
import { toast } from "@/lib/toast";
import {
  filterMessageDetailsForAccount,
  groupConversationsByAccount,
  prepareConversationsFromGlobalUpdate,
  resolveAccountActivityTsFromGlobalUpdate,
} from "@/lib/zalo-messenger-utils";
import { useZaloMessengerStore } from "@/stores/use-zalo-messenger-store";
import { useWebSocketStore } from "@/stores/use-websocket-store";
import type {
  MessageAckPayload,
  MessengerConversation,
  NewGlobalUpdatePayload,
  RawZaloMessage,
  VoiceCallResultPayload,
  WsActionMessagePayload,
} from "@/types/zalo-messenger";
import type { WsMessagePayload } from "@/types/websocket";
import { useEffect, useRef } from "react";

/** Gộp storm WS — 1 lần mergeAccountActivity / ~150ms */
const ACCOUNT_ACTIVITY_THROTTLE_MS = 150;

type PendingAccountActivity = {
  ts: number | null;
  hasUnread?: boolean;
};

const WS_ACTION_FAILURE_HINT: Record<string, string> = {
  "send-reaction-to-group": "Không gửi được cảm xúc.",
  "send-reaction-to-uid": "Không gửi được cảm xúc.",
  "send-sticker": "Không gửi được sticker.",
  "block-friend": "Không thực hiện được thao tác chặn.",
  "voice-call": "Không gọi được Zalo.",
  "start-voice-call": "Không gọi được Zalo.",
  "make-call": "Không gọi được Zalo.",
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

function messageAckError(payload: MessageAckPayload): string {
  if (typeof payload.message === "string" && payload.message.trim()) {
    return payload.message;
  }
  if (typeof payload.error === "string" && payload.error.trim()) {
    return payload.error;
  }
  const result = payload.result;
  if (result && typeof result === "object") {
    const message = (result as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return "Không gửi được tin nhắn.";
}

function isVoiceCallResult(
  payload: WsMessagePayload,
): payload is VoiceCallResultPayload & WsMessagePayload {
  return payload.type === "voice_call_result";
}

function isWsActionMessage(
  payload: WsMessagePayload,
): payload is WsActionMessagePayload & WsMessagePayload {
  return payload.type === "message" && typeof payload.command === "string";
}

/** Nhận realtime chat, scope theo nick và dọn subscription/timer khi unmount. */
export function useMessengerWs() {
  const subscribe = useWebSocketStore((s) => s.subscribe);
  const pendingActivityRef = useRef<Map<number, PendingAccountActivity>>(
    new Map(),
  );
  const activityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Subscribe một lần — đọc state mới nhất qua getState(), tránh re-subscribe khi store đổi
  useEffect(() => {
    const flushAccountActivity = () => {
      activityTimerRef.current = null;
      const pending = pendingActivityRef.current;
      if (!pending.size) return;
      pendingActivityRef.current = new Map();
      const { mergeAccountActivity } = useZaloMessengerStore.getState();
      for (const [accountId, patch] of pending) {
        mergeAccountActivity(accountId, {
          ts: patch.ts,
          hasUnread: patch.hasUnread,
        });
      }
    };

    const scheduleAccountActivity = (
      accountId: number,
      patch: PendingAccountActivity,
    ) => {
      const prev = pendingActivityRef.current.get(accountId);
      const patchIsNewer =
        patch.ts != null && (prev?.ts == null || patch.ts > prev.ts);
      const sameActivity =
        patch.ts != null && prev?.ts != null && patch.ts === prev.ts;
      const nextTs = patchIsNewer
        ? patch.ts
        : (prev?.ts ?? patch.ts ?? null);
      let hasUnread = prev?.hasUnread;
      if (!prev || patchIsNewer || prev.ts == null) {
        hasUnread = patch.hasUnread;
      } else if (sameActivity && patch.hasUnread !== undefined) {
        // Cùng activity: mark-read xảy ra sau inbound nên false phải thắng frame true trễ.
        hasUnread =
          prev.hasUnread === false || patch.hasUnread === false
            ? false
            : patch.hasUnread;
      }
      pendingActivityRef.current.set(accountId, {
        ts: nextTs,
        hasUnread,
      });
      if (activityTimerRef.current != null) return;
      activityTimerRef.current = setTimeout(
        flushAccountActivity,
        ACCOUNT_ACTIVITY_THROTTLE_MS,
      );
    };

    const unsubscribe = subscribe((payload) => {
      const {
        mergeConversations,
        appendLiveMessages,
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

        // Bump activity + re-sort nick (throttle) — không REST / không switchAccount
        if (wsAccountId != null) {
          const activityTs = resolveAccountActivityTsFromGlobalUpdate({
            message_details: messageDetails,
            conversations,
            account: payload.account,
          });
          scheduleAccountActivity(wsAccountId, {
            ts: activityTs ?? Date.now(),
            hasUnread: Boolean(payload.account?.status),
          });
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

      if (isMessageAck(payload)) {
        if (payload.success !== false || !payload.clientMsgId) return;
        const pending = takeFailedPendingComposerSend(payload.clientMsgId);
        if (!pending) return;

        const store = useZaloMessengerStore.getState();
        const canRestore =
          pending.composerText != null &&
          store.selectedAccountId === pending.accountId &&
          store.activeConversationId === pending.conversationId &&
          !store.composerText.trim() &&
          store.attachmentDrafts.length === 0 &&
          store.quoteMessage == null;
        if (canRestore) {
          useZaloMessengerStore.setState({
            composerText: pending.composerText ?? "",
            quoteMessage: pending.quoteMessage,
          });
        }
        toast.error(
          `${messageAckError(payload)}${
            canRestore ? " Nội dung đã được khôi phục để gửi lại." : ""
          }`,
        );
        return;
      }

      if (isVoiceCallResult(payload)) {
        const store = useZaloMessengerStore.getState();
        store.setVoiceCallPending(false);
        try {
          delete (window as unknown as { __careVoiceCallToken?: string })
            .__careVoiceCallToken;
        } catch {
          /* ignore */
        }
        const callType = (Number(payload.call_type ?? 0) === 1 ? 1 : 0) as 0 | 1;
        const msg =
          (typeof payload.message === "string" && payload.message.trim()) ||
          (payload.success
            ? callType === 1
              ? "Đã kết nối gọi video Zalo."
              : "Đã kết nối gọi Zalo."
            : "Không gọi được Zalo.");
        if (payload.success) {
          const media = (
            payload as {
              media?: {
                mediaReady?: boolean;
                callId?: number | string;
                note?: string;
                holdMaxSeconds?: number;
              };
            }
          ).media;
          const friend = store.activeConversation?.friend as
            | { name?: string; display_name?: string }
            | undefined;
          const peerName =
            friend?.display_name ||
            friend?.name ||
            store.activeConversation?.name ||
            "Cuộc gọi";
          store.setActiveCall({
            callType,
            peerName: String(peerName),
            mediaReady: Boolean(media?.mediaReady),
            callId:
              media?.callId ??
              (payload.result as { data?: { callId?: number } } | undefined)?.data
                ?.callId,
            startedAt: Date.now(),
            conversationId:
              payload.id_conversation ?? store.activeConversationId ?? undefined,
            note:
              media?.note ||
              "Đang giữ reo máy trên server. Người nhận hãy nhấc máy. Bấm đỏ để cúp. Audio 2 chiều ZRTC vẫn experimental.",
          });
          toast.success(
            "Đã gửi tín hiệu gọi. Người nhận thường chỉ thấy cuộc gọi nhỡ (giới hạn API web).",
          );
        } else {
          store.setActiveCall(null);
          toast.error(msg);
        }
        return;
      }

      if (payload.type === "voice_call_hangup_result") {
        useZaloMessengerStore.getState().setActiveCall(null);
        useZaloMessengerStore.getState().setVoiceCallPending(false);
        if (payload.success === false) {
          toast.error(
            typeof payload.message === "string"
              ? payload.message
              : "Không kết thúc được cuộc gọi.",
          );
        }
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

    return () => {
      unsubscribe();
      if (activityTimerRef.current != null) {
        clearTimeout(activityTimerRef.current);
        activityTimerRef.current = null;
      }
      pendingActivityRef.current.clear();
    };
  }, [subscribe]);
}
