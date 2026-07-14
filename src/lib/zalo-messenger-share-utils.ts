import { getMessageText } from "@/lib/zalo-messenger-utils";
import { resolveStickerImageUrl } from "@/lib/zalo-messenger-message-utils";
import type { DisplayMessage } from "@/types/zalo-messenger";

export function buildShareWsPayload(
  message: DisplayMessage,
  targetConversationId: number,
  accountUid?: string | null,
): Record<string, unknown> | null {
  const text = getMessageText(message);
  const attachment = message.attachments?.[0];

  if (text && !attachment) {
    return {
      id_conversation: targetConversationId,
      message: text,
      attachment: null,
      chat_type: "send-message",
      message_details: null,
      phone_number: null,
    };
  }

  if (!attachment) return null;

  if (message.msgType === "chat.photo") {
    const href = attachment.href || attachment.thumb;
    if (!href) return null;
    return {
      id_conversation: targetConversationId,
      message: "",
      attachment: null,
      chat_type: "share-photo",
      message_details: {
        uidFrom: message.uidFrom === "0" ? accountUid : message.uidFrom,
        qmsgId: message.msgId,
        cliMsgId: message.cliMsgId,
        ts: message.ts,
        text_message: "",
      },
      share_info: {
        oriUrl: href,
        title: attachment.title || "",
        thumb: href,
        width: "1234",
        height: "1234",
      },
      phone_number: null,
    };
  }

  if (message.msgType === "chat.video.msg" || attachment.action === "video") {
    const href = attachment.href || attachment.thumb;
    if (!href) return null;
    return {
      id_conversation: targetConversationId,
      message: "",
      chat_type: "share-video",
      share_info: {
        url: href,
        thumb: attachment.thumb || href,
      },
      phone_number: null,
    };
  }

  if (message.msgType === "share.file" || attachment.action === "file") {
    const href = attachment.href;
    if (!href) return null;
    return {
      id_conversation: targetConversationId,
      message: "",
      chat_type: "share-file",
      share_info: {
        url: href,
        fileName: attachment.title || "Tệp đính kèm",
      },
      phone_number: null,
    };
  }

  if (message.msgType === "chat.sticker") {
    const sticker = message.sticker?.[0];
    const stickerUrl = resolveStickerImageUrl(message);
    if (!sticker || !stickerUrl) return null;
    return {
      id_conversation: targetConversationId,
      message: "",
      chat_type: "share-photo",
      share_info: {
        oriUrl: stickerUrl,
        title: "",
        thumb: stickerUrl,
        width: "130",
        height: "130",
      },
      sticker_data: {
        id_sticker: sticker.id,
        catId: sticker.catId,
      },
      phone_number: null,
    };
  }

  return null;
}

export function canShareMessage(message: DisplayMessage): boolean {
  if (getMessageText(message)) return true;
  if (message.attachments?.some((item) => item.href || item.thumb)) return true;
  if (message.msgType === "chat.sticker") return true;
  return false;
}