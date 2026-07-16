import { generateClientMsgId } from "@/lib/zalo-messenger-utils";
import type {
  DisplayMessage,
  MessengerConversation,
  MessengerStickerItem,
  SendMessagePayload,
} from "@/types/zalo-messenger";

/** Chuẩn hóa payload WS — BE nhận `type` (alias `command` / `chat_type`) */
export function serializeWsChatCommand(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const commandType =
    (payload.type as string | undefined) ??
    (payload.chat_type as string | undefined) ??
    (payload.command as string | undefined);

  if (!commandType) return payload;

  const { chat_type: _chatType, command: _command, ...rest } = payload;
  return { type: commandType, ...rest };
}

export function serializeSendMessagePayload(
  payload: SendMessagePayload,
): Record<string, unknown> {
  return serializeWsChatCommand(payload as unknown as Record<string, unknown>);
}

export function buildStickerWsPayload(options: {
  accountId: number;
  conversationId: number;
  sticker: MessengerStickerItem;
}): Record<string, unknown> {
  return {
    type: "send-sticker",
    id_account: options.accountId,
    id_conversation: options.conversationId,
    requestId: generateClientMsgId(),
    sticker_data: {
      id_sticker: options.sticker.id,
      catId: options.sticker.catId,
      type: 1,
    },
  };
}

/** Zalo ID lớn — bắt buộc string để tránh mất precision khi JSON.stringify */
function toZaloIdString(value: string | number | undefined | null): string {
  if (value == null || value === "") return "";
  return String(value).trim();
}

export type ReactionWsBuildResult =
  | { ok: true; payload: Record<string, unknown> }
  | { ok: false; reason: string };

/**
 * Reaction nhóm: `grid` = conversation.group.uid (Zalo groupId).
 * Không dùng globalId / PK DB. msgId/cliMsgId từ raw message — không clientMsgId optimistic.
 */
export function buildReactionWsPayload(options: {
  accountId: number;
  conversation: MessengerConversation;
  message: DisplayMessage;
  reactionId: number;
}): ReactionWsBuildResult {
  const { accountId, conversation, message, reactionId } = options;

  if (!Number.isInteger(reactionId) || reactionId < 0 || reactionId > 5) {
    return { ok: false, reason: "Cảm xúc không hợp lệ." };
  }

  if (message._optimistic) {
    return {
      ok: false,
      reason: "Chờ tin nhắn gửi xong rồi mới thả cảm xúc.",
    };
  }

  const msgId = toZaloIdString(message.msgId);
  const cliMsgId = toZaloIdString(message.cliMsgId);

  if (!msgId || !cliMsgId) {
    return {
      ok: false,
      reason: "Không xác định được tin nhắn đích (msgId/cliMsgId).",
    };
  }

  const requestId = generateClientMsgId();
  const isGroup = Boolean(conversation.group?.id);

  if (isGroup) {
    const grid = toZaloIdString(conversation.group?.uid);
    if (!grid) {
      return {
        ok: false,
        reason: "Thiếu group.uid — không gửi được cảm xúc nhóm.",
      };
    }

    return {
      ok: true,
      payload: {
        type: "send-reaction-to-group",
        id_account: accountId,
        requestId,
        grid,
        msgId,
        cliMsgId,
        reaction: reactionId,
      },
    };
  }

  const idTo =
    message.idTo && message.idTo !== "0"
      ? toZaloIdString(message.idTo)
      : toZaloIdString(conversation.friend?.uid);

  if (!idTo) {
    return {
      ok: false,
      reason: "Thiếu friend.uid — không gửi được cảm xúc.",
    };
  }

  return {
    ok: true,
    payload: {
      type: "send-reaction-to-uid",
      id_account: accountId,
      requestId,
      idTo,
      msgId,
      cliMsgId,
      reaction: reactionId,
    },
  };
}

export function buildResetUnreadWsPayload(options: {
  accountId: number;
  conversationId: number;
}): Record<string, unknown> {
  return {
    type: "reset-unread-count",
    id_account: options.accountId,
    id_conversation: options.conversationId,
  };
}