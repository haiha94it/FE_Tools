import { CARE_API_BASE_URL } from "@/config/api";
import { getMessageText, trimToString } from "@/lib/zalo-messenger-utils";
import type {
  DisplayMessage,
  MessengerAttachmentDraft,
  MessengerChatType,
  MessengerMentionInfo,
} from "@/types/zalo-messenger";
import { isMentionAllText } from "@/lib/zalo-messenger-mention-utils";

const IMAGE_ATTACHMENT_PATTERN =
  /\.(jpg|jpeg|png|gif|webp|bmp|heic|heif)(\?|$)/i;
const VIDEO_ATTACHMENT_PATTERN =
  /\.(mp4|mov|avi|mkv|webm|m4v|3gp)(\?|$)/i;

export function buildQuoteDetails(
  quoteMessage: DisplayMessage,
  accountUid?: string | null,
): Record<string, unknown> {
  const cliMsgId = quoteMessage.cliMsgId ?? quoteMessage.clientMsgId;
  const msgId = quoteMessage.msgId;
  return {
    uidFrom:
      quoteMessage.uidFrom === "0" ? accountUid : quoteMessage.uidFrom,
    qmsgId: msgId,
    cliMsgId,
    msgId,
    ts: quoteMessage.ts,
    text_message: getMessageText(quoteMessage),
  };
}

export function resolveChatType(options: {
  hasQuote: boolean;
  text: string;
  mentionInfo: MessengerMentionInfo[];
  isFile?: boolean;
}): MessengerChatType {
  if (options.hasQuote) return "quote";
  if (isMentionAllText(options.text)) return "mention-all";
  if (options.mentionInfo.length > 0) return "mentions";
  if (options.isFile) return "send-file";
  return "send-message";
}

export function isImageAttachmentLink(link: string, fileName?: string): boolean {
  const target = `${link} ${fileName ?? ""}`;
  return IMAGE_ATTACHMENT_PATTERN.test(target);
}

export function isVideoAttachmentLink(link: string, fileName?: string): boolean {
  const target = `${link} ${fileName ?? ""}`;
  return VIDEO_ATTACHMENT_PATTERN.test(target);
}

export function isImageAttachmentDraft(
  draft: Pick<MessengerAttachmentDraft, "link" | "name" | "isImage">,
): boolean {
  if (draft.isImage) return true;
  return (
    isImageAttachmentLink(draft.link, draft.name) ||
    isImageAttachmentLink(draft.name)
  );
}

export function isVideoAttachmentDraft(
  draft: Pick<MessengerAttachmentDraft, "link" | "name" | "isImage" | "isVideo">,
): boolean {
  if (draft.isImage) return false;
  if (draft.isVideo) return true;
  return (
    isVideoAttachmentLink(draft.link, draft.name) ||
    isVideoAttachmentLink(draft.name)
  );
}

export function parseUploadedFileLink(data: unknown): string | null {
  if (typeof data === "string" && data.trim()) {
    return data.trim();
  }

  const record = Array.isArray(data) ? data[0] : data;
  if (!record || typeof record !== "object") return null;

  const body = record as Record<string, unknown>;
  const nested =
    body.data && typeof body.data === "object"
      ? (body.data as Record<string, unknown>)
      : null;

  const link =
    body.file ??
    body.url ??
    body.image ??
    body.link ??
    nested?.file ??
    nested?.url ??
    nested?.image ??
    nested?.link;

  return typeof link === "string" && link.trim() ? link.trim() : null;
}

export function resolveAttachmentPreviewUrl(link?: string | null): string {
  if (!link) return "";
  if (
    link.startsWith("http://") ||
    link.startsWith("https://") ||
    link.startsWith("blob:")
  ) {
    return link;
  }
  const base = CARE_API_BASE_URL.replace(/\/$/, "");
  return `${base}/${link.replace(/^\//, "")}`;
}

export function resolveAttachmentChatType(options: {
  draft: MessengerAttachmentDraft;
  hasQuote: boolean;
}): MessengerChatType {
  if (options.hasQuote) return "quote";
  if (isImageAttachmentDraft(options.draft)) return "send-message";
  if (isVideoAttachmentDraft(options.draft)) return "send-video";
  return "send-file";
}

export function detectAttachmentKind(
  file: File,
  link: string,
): Pick<MessengerAttachmentDraft, "isImage" | "isVideo"> {
  const isImage =
    file.type.startsWith("image/") ||
    isImageAttachmentLink(link, file.name);
  if (isImage) return { isImage: true, isVideo: false };
  const isVideo =
    file.type.startsWith("video/") ||
    isVideoAttachmentLink(link, file.name);
  return { isImage: false, isVideo };
}

export function getQuotePreviewText(message: DisplayMessage): string {
  const text = getMessageText(message);
  if (text) return text;
  if (message.msgType === "group.media") {
    const count =
      message.groupMedia?.totalItems ??
      message.groupMedia?.items.length ??
      0;
    return count > 1 ? `Album (${count} mục)` : "Album";
  }
  if (message.msgType === "chat.photo") return "Ảnh";
  if (message.msgType === "chat.video.msg") return "Video";
  if (message.msgType === "chat.voice") return "Tin thoại";
  if (message.msgType === "chat.sticker") return "Sticker";
  if (message.msgType === "chat.gif") return "GIF";
  if (message.msgType === "chat.location.new") {
    return message.attachments?.[0]?.title || "Vị trí";
  }
  if (message.msgType === "chat.ecard") {
    return message.attachments?.[0]?.title || "Nhắc hẹn";
  }
  if (message.msgType === "chat.recommended") {
    const att = message.attachments?.[0];
    if (att?.action === "calltime") {
      const head = att.callHeadline || att.title || "Cuộc gọi";
      const sec = att.callDurationSec ?? 0;
      if (sec > 0) {
        const m = Math.floor(sec / 60);
        const r = sec % 60;
        return `${head} · ${m}:${String(r).padStart(2, "0")}`;
      }
      return head;
    }
    return att?.title ? `Danh thiếp: ${att.title}` : "Danh thiếp";
  }
  if (message.msgType === "share.file") {
    const att = message.attachments?.[0];
    if (att?.fileKind === "video") return "Video";
    return att?.title || "Tệp đính kèm";
  }
  return "Tin nhắn";
}

export function getQuoteOwnerLabel(
  message: DisplayMessage,
  accountName?: string | null,
): string {
  if (message.uidFrom === "0") {
    return accountName?.trim() || "Bạn";
  }
  return trimToString(message.quote?.[0]?.fromD) || "Người gửi";
}
