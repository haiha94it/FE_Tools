import { isReactionOnlyMessage } from "@/lib/zalo-messenger-reactions";
import type { DisplayMessage, RawZaloMessage } from "@/types/zalo-messenger";
import {
  getMessageText,
  normalizeMessageList,
  trimToString,
} from "@/lib/zalo-messenger-utils";

export function shouldHideMessageText(text: string): boolean {
  return (
    text.includes(
      "Chỉ trưởng/phó nhóm được gửi tin nhắn vào nhóm, bạn có quyền xem và thả cảm",
    ) || text.includes("msginfo.actionlist")
  );
}

function readContentRecord(content: unknown): Record<string, unknown> | null {
  if (!content) return null;
  if (typeof content === "string") {
    const trimmed = content.trim();
    if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return null;
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return null;
    }
    return null;
  }
  if (typeof content !== "object") return null;
  return content as Record<string, unknown>;
}

/** URL ảnh sticker Zalo từ eid (id / id_sticker trong payload WS) */
export function buildZaloStickerImageUrl(
  stickerId: string | number | null | undefined,
  size = 130,
): string | null {
  if (stickerId == null || stickerId === "") return null;
  return `https://zalo-api.zadn.vn/api/emoticon/sticker/webpc?eid=${encodeURIComponent(String(stickerId))}&size=${size}`;
}

export function resolveStickerImageUrl(message: DisplayMessage): string | null {
  const attachment = message.attachments?.[0];
  const fromAttachment =
    trimToString(attachment?.href) || trimToString(attachment?.thumb);
  if (fromAttachment) return fromAttachment;

  const sticker = message.sticker?.[0];
  if (!sticker) return null;

  const stickerRecord = sticker as {
    id?: string | number;
    id_sticker?: string | number;
  };
  return buildZaloStickerImageUrl(
    stickerRecord.id ?? stickerRecord.id_sticker,
  );
}

function readWebchatText(content: unknown): string {
  if (typeof content === "string") return trimToString(content);
  const record = readContentRecord(content);
  if (!record) return "";
  return trimToString(record.text ?? record.message ?? record.body);
}

/** Raw Zalo → shape hiển thị UI */
export function normalizeIncomingMessage(raw: RawZaloMessage): DisplayMessage {
  const base: DisplayMessage = {
    msgId: raw.msgId,
    cliMsgId: raw.cliMsgId,
    msgType: raw.msgType,
    uidFrom: raw.uidFrom,
    idTo: raw.idTo,
    ts: raw.ts,
    conversation_id: raw.conversation_id,
    text_message: [],
    sent_by: raw.sent_by ?? undefined,
  };

  const msgType = raw.msgType ?? "webchat";
  const content = raw.content;

  switch (msgType) {
    case "webchat":
      return {
        ...base,
        text_message: readWebchatText(content)
          ? [{ text: readWebchatText(content) }]
          : [],
        quote: Array.isArray(raw.quote)
          ? (raw.quote as DisplayMessage["quote"])
          : undefined,
      };

    case "chat.photo": {
      const record = readContentRecord(content);
      const href = trimToString(record?.href);
      const thumb = trimToString(record?.thumb) || href;
      const title = trimToString(record?.title);
      return {
        ...base,
        attachments: href || thumb ? [{ href, thumb, title }] : [],
        text_message: title ? [{ text: title }] : [],
      };
    }

    case "chat.video.msg": {
      const record = readContentRecord(content);
      const href = trimToString(record?.href);
      const thumb = trimToString(record?.thumb) || href;
      return {
        ...base,
        attachments: href || thumb ? [{ href, thumb, action: "video" }] : [],
      };
    }

    case "chat.sticker": {
      const record = readContentRecord(content);
      const stickerId =
        record?.id ?? record?.id_sticker ?? record?.stickerId;
      const catId = record?.catId ?? record?.cat_id;
      const href =
        trimToString(record?.href) ||
        trimToString(record?.url) ||
        trimToString(record?.thumb) ||
        buildZaloStickerImageUrl(stickerId as string | number | undefined) ||
        "";
      return {
        ...base,
        sticker:
          stickerId != null
            ? [
                {
                  id: stickerId as string | number,
                  catId: catId as string | number | undefined,
                },
              ]
            : [],
        attachments: href ? [{ href, thumb: href }] : [],
      };
    }

    case "share.file": {
      const record = readContentRecord(content);
      const href = trimToString(record?.href);
      const title = trimToString(record?.title) || "Tệp đính kèm";
      return {
        ...base,
        attachments: href ? [{ href, title, action: "file" }] : [],
        text_message: [{ text: title }],
      };
    }

    case "chat.voice": {
      const record = readContentRecord(content);
      const href =
        trimToString(record?.url) || trimToString(record?.href);
      return {
        ...base,
        attachments: href ? [{ href, action: "voice" }] : [],
        text_message: [{ text: "Tin thoại" }],
      };
    }

    case "chat.reaction": {
      const reactionContent =
        typeof content === "string"
          ? content
          : JSON.stringify(content ?? "");
      return {
        ...base,
        reaction: [{ content: reactionContent }],
      };
    }

    case "chat.undo":
      return {
        ...base,
        undo: [
          {
            content:
              typeof content === "string"
                ? content
                : JSON.stringify(content ?? ""),
          },
        ],
      };

    default: {
      const text = readWebchatText(content);
      if (text) {
        return { ...base, text_message: [{ text }] };
      }
      const record = readContentRecord(content);
      const href = trimToString(record?.href);
      if (href) {
        return {
          ...base,
          attachments: [{ href, thumb: trimToString(record?.thumb) || href }],
        };
      }
      return base;
    }
  }
}

export function normalizeIncomingMessages(
  rawList: RawZaloMessage[],
): DisplayMessage[] {
  return normalizeMessageList(rawList.map(normalizeIncomingMessage));
}

export function hasVisibleContent(message: DisplayMessage): boolean {
  if (message._optimistic) return true;
  if (getMessageText(message)) return true;
  if (
    message.attachments?.some(
      (att) => att.href || att.thumb || att.action,
    )
  ) {
    return true;
  }
  if (message.sticker?.length) return true;
  if (message.quote?.length) return true;

  const visualTypes = new Set([
    "chat.photo",
    "chat.video.msg",
    "chat.sticker",
    "chat.voice",
    "share.file",
  ]);
  if (message.msgType && visualTypes.has(message.msgType)) return true;
  return false;
}

export function filterDisplayMessages(
  messages: DisplayMessage[],
): DisplayMessage[] {
  const undoIds = new Set<string>();
  for (const message of messages) {
    if (message.msgType !== "chat.undo") continue;
    const content = message.undo?.[0]?.content;
    if (!content) continue;
    try {
      const parsed = JSON.parse(String(content).replace(/'/g, '"')) as {
        globalMsgId?: string | number;
        cliMsgId?: string;
      };
      if (parsed.globalMsgId != null) undoIds.add(String(parsed.globalMsgId));
      if (parsed.cliMsgId) undoIds.add(parsed.cliMsgId);
    } catch {
      // ignore malformed undo
    }
  }

  return messages.filter((message) => {
    if (message.msgType === "chat.undo") return false;
    if (isReactionOnlyMessage(message)) return false;
    const text = getMessageText(message);
    if (text && shouldHideMessageText(text)) return false;
    const keys = [
      message.msgId,
      message.cliMsgId,
      message.id != null ? String(message.id) : null,
    ].filter(Boolean) as string[];
    if (keys.some((key) => undoIds.has(key))) return false;
    return hasVisibleContent(message);
  });
}