import { isReactionOnlyMessage } from "@/lib/zalo-messenger-reactions";
import type {
  DisplayMessage,
  MessengerGroupMediaItem,
  MessengerGroupLayoutMeta,
  RawZaloMessage,
} from "@/types/zalo-messenger";
import {
  getMessageText,
  normalizeMessageList,
  normalizeTimestampMs,
  trimToString,
} from "@/lib/zalo-messenger-utils";

/** Tin nhắc hẹn / gợi ý hệ thống — căn giữa khung chat (giống Zalo) */
export function isCenteredChatMessage(message: DisplayMessage): boolean {
  if (message.msgType === "chat.ecard") return true;
  const action = message.attachments?.[0]?.action;
  return action === "ecard" || action === "system";
}

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

function parseContentParams(params: unknown): Record<string, unknown> | null {
  if (params == null || params === "") return null;
  if (typeof params === "object" && !Array.isArray(params)) {
    return params as Record<string, unknown>;
  }
  if (typeof params === "string") {
    try {
      const parsed = JSON.parse(params) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return null;
    }
  }
  return null;
}

function readRichTextFromContent(content: unknown): string {
  if (typeof content === "string") return trimToString(content);
  const record = readContentRecord(content);
  if (!record) return "";
  return (
    trimToString(record.text) ||
    trimToString(record.message) ||
    trimToString(record.body) ||
    trimToString(record.title) ||
    trimToString(record.description)
  );
}

function readWebchatText(content: unknown): string {
  return readRichTextFromContent(content);
}

function parseExtraDataRecord(raw: RawZaloMessage): Record<string, unknown> | null {
  const extra = raw.extraData;
  if (!extra) return null;
  if (typeof extra === "object" && !Array.isArray(extra)) {
    return extra as Record<string, unknown>;
  }
  if (typeof extra !== "string") return null;
  try {
    const parsed = JSON.parse(extra) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return null;
  }
  return null;
}

function extractGroupLayoutMeta(
  raw: RawZaloMessage,
  content: unknown,
): MessengerGroupLayoutMeta | undefined {
  const record = readContentRecord(content);
  const params = parseContentParams(record?.params);
  const extra = parseExtraDataRecord(raw);
  const extraGroup = extra?.groupMediaMsg as
    | { groupLayoutId?: string | number }
    | undefined;

  const rawGroupLayoutId =
    params?.group_layout_id ?? extraGroup?.groupLayoutId ?? null;
  if (
    rawGroupLayoutId == null ||
    rawGroupLayoutId === "" ||
    typeof rawGroupLayoutId === "object"
  ) {
    return undefined;
  }
  const groupLayoutId = rawGroupLayoutId as string | number;

  const isGroupLayout =
    params?.is_group_layout === 1 ||
    params?.is_group_layout === true ||
    params?.is_group_layout === "1" ||
    extraGroup?.groupLayoutId != null;

  if (!isGroupLayout) return undefined;

  const duration = Number(params?.duration);
  return {
    groupLayoutId,
    idInGroup: Number(params?.id_in_group ?? 0),
    totalItems: Number(params?.total_item_in_group ?? 1),
    durationMs: Number.isFinite(duration) && duration > 0 ? duration : undefined,
  };
}

function getMessageIdentity(message: DisplayMessage): string {
  return String(message.msgId ?? message.cliMsgId ?? message.id ?? "");
}

function buildGroupMediaItem(message: DisplayMessage): MessengerGroupMediaItem {
  const attachment = message.attachments?.[0];
  const layout = message._groupLayout;
  return {
    idInGroup: layout?.idInGroup ?? 0,
    msgType: message.msgType ?? "",
    href: attachment?.href,
    thumb: attachment?.thumb,
    durationMs: attachment?.durationMs ?? layout?.durationMs,
    msgId: message.msgId,
  };
}

/** Gộp ảnh/video cùng group_layout_id thành một album */
export function mergeGroupMediaMessages(
  messages: DisplayMessage[],
): DisplayMessage[] {
  const groups = new Map<string, DisplayMessage[]>();

  for (const message of messages) {
    const layout = message._groupLayout;
    if (!layout?.groupLayoutId) continue;
    const key = `${message.uidFrom ?? ""}:${layout.groupLayoutId}`;
    const bucket = groups.get(key) ?? [];
    bucket.push(message);
    groups.set(key, bucket);
  }

  const mergedByKey = new Map<string, DisplayMessage>();
  const hiddenIds = new Set<string>();

  for (const [key, members] of groups) {
    if (members.length < 2) continue;

    const sorted = [...members].sort(
      (a, b) =>
        (a._groupLayout?.idInGroup ?? 0) - (b._groupLayout?.idInGroup ?? 0),
    );
    const totalItems =
      sorted[0]._groupLayout?.totalItems ?? sorted.length;
    const anchor = sorted.reduce((current, candidate) =>
      normalizeTimestampMs(current.ts) <= normalizeTimestampMs(candidate.ts)
        ? current
        : candidate,
    );

    mergedByKey.set(key, {
      ...anchor,
      msgType: "group.media",
      groupMedia: {
        groupLayoutId: sorted[0]._groupLayout!.groupLayoutId,
        totalItems,
        items: sorted.map(buildGroupMediaItem),
      },
      attachments: [{ action: "group-media" }],
      _groupLayout: undefined,
    });

    for (const member of sorted) {
      const id = getMessageIdentity(member);
      if (id) hiddenIds.add(id);
    }
  }

  const emitted = new Set<string>();
  const result: DisplayMessage[] = [];

  for (const message of messages) {
    const id = getMessageIdentity(message);
    if (id && hiddenIds.has(id)) {
      const layout = message._groupLayout;
      if (!layout?.groupLayoutId) {
        result.push(message);
        continue;
      }
      const key = `${message.uidFrom ?? ""}:${layout.groupLayoutId}`;
      if (emitted.has(key)) continue;
      const merged = mergedByKey.get(key);
      if (!merged) {
        result.push(message);
        continue;
      }
      emitted.add(key);
      result.push(merged);
      continue;
    }
    result.push(message);
  }

  return result;
}

function parseRecommendedMeta(description: unknown): {
  phone: string;
  qrCodeUrl: string;
} {
  const raw = trimToString(description);
  if (!raw.startsWith("{")) return { phone: "", qrCodeUrl: "" };
  try {
    const record = JSON.parse(raw) as Record<string, unknown>;
    return {
      phone: trimToString(record.phone),
      qrCodeUrl: trimToString(record.qrCodeUrl),
    };
  } catch {
    return { phone: "", qrCodeUrl: "" };
  }
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
    case "webchat": {
      const text = readWebchatText(content);
      const record = readContentRecord(content);
      const isSystemTip =
        trimToString(record?.action) === "msginfo.actionlist";
      return {
        ...base,
        text_message: text ? [{ text }] : [],
        attachments:
          isSystemTip && text
            ? [
                {
                  action: "system",
                  title: text,
                  thumb: trimToString(record?.iconUrl),
                },
              ]
            : undefined,
        quote: Array.isArray(raw.quote)
          ? (raw.quote as DisplayMessage["quote"])
          : undefined,
      };
    }

    case "chat.photo": {
      const record = readContentRecord(content);
      const href = trimToString(record?.href);
      const thumb = trimToString(record?.thumb) || href;
      const title = trimToString(record?.title);
      const groupLayout = extractGroupLayoutMeta(raw, content);
      return {
        ...base,
        attachments: href || thumb ? [{ href, thumb, title }] : [],
        text_message: title ? [{ text: title }] : [],
        _groupLayout: groupLayout,
      };
    }

    case "chat.video.msg": {
      const record = readContentRecord(content);
      const params = parseContentParams(record?.params);
      const href = trimToString(record?.href);
      const thumb = trimToString(record?.thumb) || href;
      const duration = Number(params?.duration);
      const durationMs =
        Number.isFinite(duration) && duration > 0 ? duration : undefined;
      const groupLayout = extractGroupLayoutMeta(raw, content);
      return {
        ...base,
        attachments:
          href || thumb
            ? [{ href, thumb, action: "video", durationMs }]
            : [],
        _groupLayout: groupLayout,
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

    case "chat.gif": {
      const record = readContentRecord(content);
      const href = trimToString(record?.href);
      const thumb = trimToString(record?.thumb) || href;
      return {
        ...base,
        attachments:
          href || thumb ? [{ href: href || thumb, thumb, action: "gif" }] : [],
      };
    }

    case "chat.location.new": {
      const record = readContentRecord(content);
      const params = parseContentParams(record?.params);
      const title =
        trimToString(record?.description) || "Vị trí đã chia sẻ";
      const lat = trimToString(params?.latitude);
      const lng = trimToString(params?.longitude);
      return {
        ...base,
        attachments: [
          {
            action: "location",
            title,
            description: lat && lng ? `${lat},${lng}` : undefined,
          },
        ],
        text_message: [{ text: title }],
      };
    }

    case "chat.ecard": {
      const record = readContentRecord(content);
      const title = trimToString(record?.title);
      const description = trimToString(record?.description);
      const thumb =
        trimToString(record?.thumb) || trimToString(record?.href);
      return {
        ...base,
        attachments: [{ action: "ecard", title, description, thumb }],
        text_message: title
          ? [{ text: title }]
          : description
            ? [{ text: description }]
            : [],
      };
    }

    case "chat.recommended": {
      const record = readContentRecord(content);
      const title = trimToString(record?.title);
      const thumb = trimToString(record?.thumb);
      const href = trimToString(record?.href);
      const meta = parseRecommendedMeta(record?.description);
      return {
        ...base,
        attachments: [
          {
            action: "recommended",
            title,
            thumb,
            href,
            description: meta.phone,
          },
        ],
        text_message: title ? [{ text: `Danh thiếp: ${title}` }] : [],
      };
    }

    case "share.file": {
      const record = readContentRecord(content);
      const href = trimToString(record?.href);
      const thumb = trimToString(record?.thumb);
      const title = trimToString(record?.title) || "Tệp đính kèm";
      return {
        ...base,
        attachments: href
          ? [{ href, thumb: thumb || undefined, title, action: "file" }]
          : [],
        text_message: thumb ? [] : [{ text: title }],
      };
    }

    case "chat.voice": {
      const record = readContentRecord(content);
      const params = parseContentParams(record?.params);
      const href =
        trimToString(params?.m4a) ||
        trimToString(record?.url) ||
        trimToString(record?.href);
      const durationMs = Number(params?.duration) || undefined;
      return {
        ...base,
        attachments: href
          ? [{ href, action: "voice", durationMs }]
          : [],
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
      const text = readRichTextFromContent(content);
      if (text) {
        return { ...base, text_message: [{ text }] };
      }
      const record = readContentRecord(content);
      const href = trimToString(record?.href);
      const thumb = trimToString(record?.thumb) || href;
      if (href || thumb) {
        return {
          ...base,
          attachments: [{ href: href || thumb, thumb }],
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

/** Nhãn loại tin thân thiện — không hiển thị mã kỹ thuật (webchat, msgId…) */
export function getMessageKindLabel(message: DisplayMessage): string {
  const attachment = message.attachments?.[0];
  const action = attachment?.action;

  if (message.msgType === "group.media" || action === "group-media") {
    return "Album ảnh/video";
  }
  if (message.msgType === "chat.sticker" || message.sticker?.length) {
    return "Sticker";
  }
  if (message.msgType === "chat.gif" || action === "gif") return "GIF";
  if (message.msgType === "chat.photo") return "Ảnh";
  if (message.msgType === "chat.video.msg" || action === "video") return "Video";
  if (message.msgType === "chat.voice" || action === "voice") return "Tin thoại";
  if (message.msgType === "share.file" || action === "file") return "Tệp đính kèm";
  if (message.msgType === "chat.location.new" || action === "location") {
    return "Vị trí";
  }
  if (message.msgType === "chat.ecard" || action === "ecard") return "Nhắc hẹn";
  if (message.msgType === "chat.recommended" || action === "recommended") {
    return "Danh thiếp";
  }
  if (action === "system") return "Thông báo hệ thống";
  if (attachment?.thumb || attachment?.href) return "Ảnh / media";
  if (getMessageText(message)) return "Văn bản";
  return "Tin nhắn";
}

/** Tóm tắt nội dung hiển thị trong dialog chi tiết */
export function getMessagePreviewSummary(message: DisplayMessage): string {
  const text = getMessageText(message);
  if (text) return text;

  const attachment = message.attachments?.[0];
  const kind = getMessageKindLabel(message);

  if (message.groupMedia?.items.length) {
    const count =
      message.groupMedia.totalItems || message.groupMedia.items.length;
    return `Album gồm ${count} ảnh/video`;
  }
  if (attachment?.title?.trim()) return attachment.title.trim();
  if (attachment?.description?.trim() && kind === "Vị trí") {
    return attachment.description.trim();
  }
  if (kind === "Tệp đính kèm" && attachment?.title) {
    return attachment.title;
  }
  return kind;
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
    "chat.gif",
    "chat.location.new",
    "chat.ecard",
    "chat.recommended",
    "share.file",
    "group.media",
  ]);
  if (message.msgType && visualTypes.has(message.msgType)) return true;
  if (message.groupMedia?.items.length) return true;
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

  const filtered = messages.filter((message) => {
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

  return mergeGroupMediaMessages(filtered);
}