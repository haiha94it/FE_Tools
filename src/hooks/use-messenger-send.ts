"use client";

import { buildShareWsPayload } from "@/lib/zalo-messenger-share-utils";
import { isValidVietnamesePhone } from "@/lib/zalo-messenger-create-group-utils";
import { generateClientMsgId } from "@/lib/zalo-messenger-utils";
import {
  buildReactionWsPayload,
  buildStickerWsPayload,
  serializeSendMessagePayload,
  serializeWsChatCommand,
} from "@/lib/zalo-messenger-ws";
import { toast } from "@/lib/toast";
import { useZaloMessengerStore } from "@/stores/use-zalo-messenger-store";
import { useWebSocketStore } from "@/stores/use-websocket-store";
import type {
  DisplayMessage,
  MessengerConversation,
  MessengerMentionInfo,
  MessengerStickerItem,
  SendMessagePayload,
} from "@/types/zalo-messenger";
import { useCallback } from "react";

function wsSendPayload(
  wsSend: (payload: Record<string, unknown> | string) => boolean,
  payload: SendMessagePayload | Record<string, unknown>,
) {
  const serialized =
    "chat_type" in payload && typeof payload === "object"
      ? serializeSendMessagePayload(payload as SendMessagePayload)
      : serializeWsChatCommand(payload as Record<string, unknown>);
  return wsSend(serialized);
}

export function useMessengerSend(options?: {
  accountUid?: string | null;
}) {
  const wsStatus = useWebSocketStore((s) => s.status);
  const wsSend = useWebSocketStore((s) => s.send);

  const selectedAccountId = useZaloMessengerStore((s) => s.selectedAccountId);
  const activeConversationId = useZaloMessengerStore((s) => s.activeConversationId);
  const activeConversation = useZaloMessengerStore((s) => s.activeConversation);
  const composerText = useZaloMessengerStore((s) => s.composerText);
  const attachmentDrafts = useZaloMessengerStore((s) => s.attachmentDrafts);
  const uploadingAttachment = useZaloMessengerStore((s) => s.uploadingAttachment);

  const buildOutboundPayloads = useZaloMessengerStore(
    (s) => s.buildOutboundPayloads,
  );
  const clearComposer = useZaloMessengerStore((s) => s.clearComposer);
  const resetConversationUnread = useZaloMessengerStore(
    (s) => s.resetConversationUnread,
  );

  const send = useCallback((mentionInfo: MessengerMentionInfo[] = []) => {
    if (!selectedAccountId || !activeConversationId) return false;
    if (uploadingAttachment) {
      toast.error("Đang tải file đính kèm. Vui lòng đợi xong rồi gửi.");
      return false;
    }

    const text = composerText.trim();
    if (!text && attachmentDrafts.length === 0) return false;

    if (wsStatus !== "connected") {
      toast.error("Chưa kết nối WebSocket. Vui lòng thử lại sau giây lát.");
      return false;
    }

    const payloads = buildOutboundPayloads(
      selectedAccountId,
      activeConversationId,
      {
        mentionInfo,
        accountUid: options?.accountUid,
      },
    );

    if (!payloads.length) return false;

    if (activeConversation?.new_message) {
      resetConversationUnread(selectedAccountId, activeConversationId);
    }

    for (const payload of payloads) {
      const sent = wsSendPayload(wsSend, payload);
      if (!sent) {
        toast.error("Không gửi được tin nhắn. Kiểm tra kết nối mạng.");
        return false;
      }
    }

    clearComposer();
    return true;
  }, [
    activeConversation,
    activeConversationId,
    attachmentDrafts.length,
    buildOutboundPayloads,
    clearComposer,
    composerText,
    resetConversationUnread,
    options?.accountUid,
    selectedAccountId,
    uploadingAttachment,
    wsSend,
    wsStatus,
  ]);

  const sendSticker = useCallback(
    (sticker: MessengerStickerItem) => {
      if (!selectedAccountId || !activeConversationId) return false;
      if (wsStatus !== "connected") {
        toast.error("Chưa kết nối WebSocket.");
        return false;
      }

      const sent = wsSend(
        buildStickerWsPayload({
          accountId: selectedAccountId,
          conversationId: activeConversationId,
          sticker,
        }),
      );
      if (!sent) toast.error("Không gửi được sticker.");
      return sent;
    },
    [activeConversationId, selectedAccountId, wsSend, wsStatus],
  );

  const sendReaction = useCallback(
    (message: DisplayMessage, reactionId: number) => {
      if (!activeConversation || !selectedAccountId) return false;
      if (wsStatus !== "connected") {
        toast.error("Chưa kết nối WebSocket.");
        return false;
      }

      const built = buildReactionWsPayload({
        accountId: selectedAccountId,
        conversation: activeConversation,
        message,
        reactionId,
      });
      if (!built.ok) {
        toast.error(built.reason);
        return false;
      }

      const sent = wsSend(built.payload);
      if (!sent) toast.error("Không gửi được cảm xúc.");
      return sent;
    },
    [activeConversation, selectedAccountId, wsSend, wsStatus],
  );

  const shareMessage = useCallback(
    (
      message: DisplayMessage,
      targets: MessengerConversation[],
      accompanyText = "",
    ) => {
      if (!selectedAccountId) return false;
      if (wsStatus !== "connected") {
        toast.error("Chưa kết nối WebSocket.");
        return false;
      }

      let sentCount = 0;
      for (const target of targets) {
        const payload = buildShareWsPayload(
          message,
          target.id,
          options?.accountUid,
        );
        if (!payload) continue;

        const sent = wsSend(
          serializeWsChatCommand({
            ...payload,
            id_account: selectedAccountId,
            clientMsgId: generateClientMsgId(),
          }),
        );
        if (sent) sentCount += 1;

        if (accompanyText.trim()) {
          wsSendPayload(wsSend, {
            id_account: selectedAccountId,
            id_conversation: target.id,
            message: accompanyText.trim(),
            chat_type: "send-message",
            clientMsgId: generateClientMsgId(),
            attachment: null,
            message_details: null,
            phone_number: null,
          });
        }
      }

      if (!sentCount) {
        toast.error("Không chia sẻ được tin nhắn này.");
        return false;
      }

      toast.success("Đã chia sẻ tin nhắn.");
      return true;
    },
    [options?.accountUid, selectedAccountId, wsSend, wsStatus],
  );

  const sendStrangerPhone = useCallback(
    (
      accountId: number,
      payload: { phone: string; text: string; imageLink: string | null },
    ) => {
      if (wsStatus !== "connected") {
        toast.error("Chưa kết nối WebSocket.");
        return false;
      }
      if (!isValidVietnamesePhone(payload.phone)) {
        toast.error("Số điện thoại không hợp lệ.");
        return false;
      }

      const base = {
        id_account: accountId,
        chat_type: "send-message-phone" as const,
        phone_number: payload.phone,
        message_details: null,
        ...(activeConversationId ? { id_conversation: activeConversationId } : {}),
      };

      let sent = false;
      if (payload.text.trim()) {
        sent = wsSendPayload(wsSend, {
          ...base,
          message: payload.text.trim(),
          attachment: null,
          clientMsgId: generateClientMsgId(),
        });
      }
      if (payload.imageLink) {
        sent =
          wsSendPayload(wsSend, {
            ...base,
            message: "",
            attachment: payload.imageLink,
            clientMsgId: generateClientMsgId(),
          }) || sent;
      }

      if (!sent) {
        toast.error("Không gửi được tin nhắn.");
        return false;
      }

      toast.success("Đã gửi tin nhắn.");
      return true;
    },
    [activeConversationId, wsSend, wsStatus],
  );

  return {
    send,
    sendSticker,
    sendReaction,
    shareMessage,
    sendStrangerPhone,
    canSend: wsStatus === "connected" && !uploadingAttachment,
  };
}