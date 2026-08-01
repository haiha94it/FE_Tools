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

/** Chuẩn hóa quote API/WS dạng object hoặc array về danh sách dùng chung trên UI. */
function normalizeMessageQuote(quote: unknown): DisplayMessage["quote"] {
  if (Array.isArray(quote)) {
    return quote.filter(
      (item): item is NonNullable<DisplayMessage["quote"]>[number] =>
        Boolean(item) && typeof item === "object" && !Array.isArray(item),
    );
  }
  if (quote && typeof quote === "object") {
    return [quote as NonNullable<DisplayMessage["quote"]>[number]];
  }
  return undefined;
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

const VIDEO_FILE_EXTENSIONS = new Set([
  "mp4",
  "mov",
  "avi",
  "mkv",
  "webm",
  "m4v",
  "3gp",
]);

const IMAGE_FILE_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "bmp",
  "heic",
  "heif",
]);

function extractNameExtension(value?: string | null): string {
  if (!value) return "";
  const clean = value.split("?")[0]?.split("#")[0] ?? "";
  const dot = clean.lastIndexOf(".");
  if (dot < 0 || dot === clean.length - 1) return "";
  return clean.slice(dot + 1).toLowerCase();
}

/** share.file — suy loại media từ params.fileExt / tên file / URL */
export function inferShareFileMediaKind(options: {
  href?: string;
  title?: string;
  fileExt?: string;
}): "video" | "image" | "file" {
  const ext = (
    trimToString(options.fileExt).toLowerCase() ||
    extractNameExtension(options.title) ||
    extractNameExtension(options.href)
  );
  if (VIDEO_FILE_EXTENSIONS.has(ext)) return "video";
  if (IMAGE_FILE_EXTENSIONS.has(ext)) return "image";
  return "file";
}

export function formatFileSize(bytes?: number): string {
  if (bytes == null || !Number.isFinite(bytes) || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
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

/** 
 * Gộp ảnh/video cùng group_layout_id thành một album.
 * Phân tách các đợt gửi khác nhau dựa vào khoảng cách timestamp (ngưỡng 60 giây).
 */
export function mergeGroupMediaMessages(
  messages: DisplayMessage[],
): DisplayMessage[] {
  const groups = new Map<string, DisplayMessage[]>();
  const lastActiveGroup = new Map<string, { key: string; lastTs: number }>();
  const messageKeyMap = new Map<string, string>();
  let groupCounter = 0;

  for (const message of messages) {
    const layout = message._groupLayout;
    if (!layout?.groupLayoutId) continue;

    const baseKey = `${message.uidFrom ?? ""}:${layout.groupLayoutId}`;
    const ts = normalizeTimestampMs(message.ts);
    const lastActive = lastActiveGroup.get(baseKey);

    let key = baseKey;
    if (lastActive && Math.abs(ts - lastActive.lastTs) < 60000) {
      key = lastActive.key;
      lastActive.lastTs = ts;
    } else {
      groupCounter++;
      key = `${baseKey}:${groupCounter}`;
      lastActiveGroup.set(baseKey, { key, lastTs: ts });
    }

    const id = getMessageIdentity(message);
    if (id) {
      messageKeyMap.set(id, key);
    }

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
      const key = messageKeyMap.get(id);
      if (!key) {
        result.push(message);
        continue;
      }
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

/** duration Zalo calltime (giây) → "0:03" / "1:05" */
export function formatCallDurationSec(seconds: number): string {
  const s = Math.max(0, Math.floor(Number(seconds) || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

/**
 * Map action + params Zalo → nhãn log cuộc gọi (chỉ hiển thị).
 *
 * Samples quan sát:
 * - calltime + isCaller=1 → cuộc gọi đi (có duration)
 * - calltime + isCaller=0 → cuộc gọi đến (có duration)
 * - misscall + isCaller=0 + reason=2 → Bạn bị nhỡ
 * - misscall + isCaller=1 + reason=2 → Người nhận không nghe máy
 * - misscall + isCaller=1 + reason=3 → Bạn đã hủy
 * - misscall + isCaller=1 + reason=4 → Người nhận từ chối
 */
export function resolveZaloCallLogDisplay(input: {
  actionRaw: string;
  durationSec?: number;
  isCaller?: boolean;
  callType?: number;
  reason?: number;
  description?: string;
}): {
  status: string;
  headline: string;
  subline: string;
  isVideo: boolean;
  durationSec: number;
  isMiss: boolean;
} {
  const action = (input.actionRaw || "").toLowerCase();
  const isVideo = Number(input.callType) === 1;
  const isCaller = Boolean(input.isCaller);
  const dur =
    Number.isFinite(Number(input.durationSec)) && Number(input.durationSec) > 0
      ? Math.floor(Number(input.durationSec))
      : 0;
  const reason = Number(input.reason);
  const media = isVideo ? "video" : "thoại";
  const isCalltime =
    action.includes("calltime") || action.endsWith(".call");
  const isMisscall =
    action.includes("misscall") ||
    action.includes("missed") ||
    action.includes("reject") ||
    action.includes("cancel");

  // Cuộc gọi có trả lời
  if (isCalltime && !isMisscall) {
    if (isCaller) {
      return {
        status: "answered_out",
        headline: isVideo ? "Cuộc gọi video đi" : "Cuộc gọi đi",
        subline: dur > 0 ? `Thời lượng ${formatCallDurationSec(dur)}` : media,
        isVideo,
        durationSec: dur,
        isMiss: false,
      };
    }
    return {
      status: "answered_in",
      headline: isVideo ? "Cuộc gọi video đến" : "Cuộc gọi đến",
      subline: dur > 0 ? `Thời lượng ${formatCallDurationSec(dur)}` : media,
      isVideo,
      durationSec: dur,
      isMiss: false,
    };
  }

  // Miss / reject / cancel — theo reason + isCaller
  // reason (thực tế Zalo web, có thể mở rộng):
  // 2: không bắt / nhỡ · 3: caller hủy · 4: callee từ chối · 1/5: bận / lỗi
  if (!isCaller) {
    // Phía nhận
    if (reason === 4) {
      return {
        status: "declined_in",
        headline: "Bạn đã từ chối",
        subline: isVideo ? "Cuộc gọi video đến" : "Cuộc gọi đến",
        isVideo,
        durationSec: 0,
        isMiss: true,
      };
    }
    if (reason === 3) {
      // Caller hủy trước khi mình nhấc
      return {
        status: "cancelled_by_peer",
        headline: "Cuộc gọi bị hủy",
        subline: isVideo ? "Cuộc gọi video đến" : "Cuộc gọi đến",
        isVideo,
        durationSec: 0,
        isMiss: true,
      };
    }
    // reason 2 hoặc mặc định: bị nhỡ
    return {
      status: "missed_in",
      headline: "Bạn bị nhỡ",
      subline: isVideo ? "Cuộc gọi video đến" : "Cuộc gọi đến",
      isVideo,
      durationSec: 0,
      isMiss: true,
    };
  }

  // Phía gọi đi (isCaller)
  if (reason === 3) {
    return {
      status: "cancelled_out",
      headline: "Bạn đã hủy",
      subline: isVideo ? "Cuộc gọi video đi" : "Cuộc gọi đi",
      isVideo,
      durationSec: 0,
      isMiss: true,
    };
  }
  if (reason === 4) {
    return {
      status: "declined_out",
      headline: "Người nhận từ chối",
      subline: isVideo ? "Cuộc gọi video đi" : "Cuộc gọi đi",
      isVideo,
      durationSec: 0,
      isMiss: true,
    };
  }
  if (reason === 1 || reason === 5) {
    return {
      status: "busy",
      headline: reason === 5 ? "Cuộc gọi lỗi" : "Máy bận",
      subline: isVideo ? "Cuộc gọi video đi" : "Cuộc gọi đi",
      isVideo,
      durationSec: 0,
      isMiss: true,
    };
  }
  // reason 2 / default: không nghe máy
  return {
    status: "no_answer_out",
    headline: "Người nhận không nghe máy",
    subline: isVideo ? "Cuộc gọi video đi" : "Cuộc gọi đi",
    isVideo,
    durationSec: 0,
    isMiss: true,
  };
}

function convertJxlToJpg(url: string | undefined | null): string {
  if (!url) return "";
  if (url.includes(".jxl")) {
    return url.replace("/jxl/", "/jpg/").replace(".jxl", ".jpg");
  }
  return url;
}

/**
 * Chuẩn hóa một tin nhắn Zalo thô sang dữ liệu dùng để hiển thị trên UI.
 *
 * @param raw Tin nhắn thô nhận từ API hoặc WebSocket.
 * @returns Tin nhắn đã chuẩn hóa, gồm text và attachment phù hợp với từng msgType.
 */
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
    quote: normalizeMessageQuote(raw.quote),
    mentions: Array.isArray(raw.mentions)
      ? raw.mentions
      : Array.isArray(raw.mention)
        ? (raw.mention as DisplayMessage["mentions"])
        : undefined,
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
      };
    }

    case "chat.photo": {
      const record = readContentRecord(content);
      const href = convertJxlToJpg(trimToString(record?.href));
      const thumb = convertJxlToJpg(trimToString(record?.thumb)) || href;
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
      const thumb = convertJxlToJpg(trimToString(record?.thumb)) || href;
      const title = trimToString(record?.title);
      const description = trimToString(record?.description);
      const caption = title || description;
      const duration = Number(params?.duration);
      const durationMs =
        Number.isFinite(duration) && duration > 0 ? duration : undefined;
      const groupLayout = extractGroupLayoutMeta(raw, content);
      return {
        ...base,
        attachments:
          href || thumb
            ? [
                {
                  href,
                  thumb,
                  title,
                  description,
                  action: "video",
                  durationMs,
                },
              ]
            : [],
        text_message: caption ? [{ text: caption }] : [],
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
      const actionRaw = trimToString(record?.action);
      const title = trimToString(record?.title);
      const thumb = trimToString(record?.thumb);
      const href = trimToString(record?.href);
      const description = trimToString(record?.description);

      // Bubble cuộc gọi Zalo (typo "recommened.*") — chỉ hiển thị, không callback
      const actionLower = actionRaw.toLowerCase();
      const isCallBubble =
        actionLower.includes("calltime") ||
        actionLower.includes("misscall") ||
        actionLower.includes("missed") ||
        actionLower.includes("rejectcall") ||
        actionLower.includes("cancelcall") ||
        actionLower === "recommened.call" ||
        actionLower === "recommended.call";

      if (isCallBubble) {
        const params = parseContentParams(record?.params) || {};
        const durationSec = Number(params.duration);
        const callType = Number(params.calltype ?? params.callType ?? 0);
        const isCaller = Number(params.isCaller ?? 0) === 1;
        const reason = Number(params.reason);
        const resolved = resolveZaloCallLogDisplay({
          actionRaw,
          durationSec,
          isCaller,
          callType,
          reason: Number.isFinite(reason) ? reason : undefined,
          description,
        });
        return {
          ...base,
          attachments: [
            {
              action: "calltime",
              title: resolved.headline,
              description: resolved.subline,
              callDurationSec: resolved.durationSec,
              callType: resolved.isVideo ? 1 : 0,
              callIsCaller: isCaller,
              callStatus: resolved.status,
              callReason: Number.isFinite(reason) ? reason : undefined,
              callHeadline: resolved.headline,
              callSubline: resolved.subline,
            },
          ],
          text_message: [
            {
              text: resolved.durationSec > 0
                ? `${resolved.headline} · ${formatCallDurationSec(resolved.durationSec)}`
                : resolved.headline,
            },
          ],
        };
      }

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
      const params = parseContentParams(record?.params);
      const href = trimToString(record?.href);
      const thumb = trimToString(record?.thumb);
      const title = trimToString(record?.title) || "Tệp đính kèm";
      const fileExt = trimToString(params?.fileExt).toLowerCase();
      const rawSize = Number(params?.fileSize);
      const fileSizeBytes =
        Number.isFinite(rawSize) && rawSize > 0 ? rawSize : undefined;
      const fileKind = inferShareFileMediaKind({ href, title, fileExt });

      return {
        ...base,
        attachments: href
          ? [
              {
                href,
                thumb: thumb || undefined,
                title,
                action: "file",
                fileExt: fileExt || undefined,
                fileSizeBytes,
                fileKind,
                /** CDN dlfl — Content-Disposition attachment, không phát inline */
                downloadOnly: true,
              },
            ]
          : [],
        text_message: [],
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
  if (action === "file") {
    if (attachment?.fileKind === "video") return "Video";
    return "Tệp đính kèm";
  }
  if (message.msgType === "chat.location.new" || action === "location") {
    return "Vị trí";
  }
  if (message.msgType === "chat.ecard" || action === "ecard") return "Nhắc hẹn";
  if (action === "calltime") {
    return (
      attachment?.callHeadline ||
      (attachment?.callType === 1 ? "Cuộc gọi video" : "Cuộc gọi thoại")
    );
  }
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
  if (message.recalled) return true;
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

/**
 * Parse content của event chat.undo.
 * Target tin gốc = globalMsgId / cliMsgId — KHÔNG dùng msgId của frame undo.
 */
export function parseUndoTargets(content?: string | unknown): {
  globalMsgId: string | null;
  cliMsgId: string | null;
} | null {
  let raw: unknown = content;
  if (raw == null || raw === "") return null;

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    try {
      raw = JSON.parse(trimmed);
    } catch {
      try {
        raw = JSON.parse(trimmed.replace(/'/g, '"'));
      } catch {
        return null;
      }
    }
    // content bị stringify 2 lần
    if (typeof raw === "string") {
      try {
        raw = JSON.parse(raw);
      } catch {
        return null;
      }
    }
  }

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>;
  const globalRaw = record.globalMsgId ?? record.globalMsgID;
  const cliRaw = record.cliMsgId ?? record.cliMsgID;
  return {
    globalMsgId:
      globalRaw != null && globalRaw !== "" ? String(globalRaw) : null,
    cliMsgId: cliRaw != null && cliRaw !== "" ? String(cliRaw) : null,
  };
}

function messageMatchesUndoTarget(
  message: DisplayMessage,
  targetMsgIds: Set<string>,
  targetCliIds: Set<string>,
): boolean {
  if (message.msgId && targetMsgIds.has(String(message.msgId))) return true;
  if (message.cliMsgId && targetCliIds.has(String(message.cliMsgId))) {
    return true;
  }
  if (message.clientMsgId && targetCliIds.has(String(message.clientMsgId))) {
    return true;
  }
  return false;
}

/**
 * Timeline bubbles: loại chat.undo / reaction.
 * chat.undo → đánh dấu tin gốc `recalled` (giữ bubble), không xóa khỏi state.
 * (docs/fe_integration_notes.md)
 */
export function filterDisplayMessages(
  messages: DisplayMessage[],
): DisplayMessage[] {
  const targetMsgIds = new Set<string>();
  const targetCliIds = new Set<string>();

  for (const message of messages) {
    if (message.msgType !== "chat.undo") continue;
    const targets = parseUndoTargets(message.undo?.[0]?.content);
    if (!targets) continue;
    if (targets.globalMsgId) targetMsgIds.add(targets.globalMsgId);
    if (targets.cliMsgId) targetCliIds.add(targets.cliMsgId);
  }

  const filtered = messages
    .filter((message) => {
      if (message.msgType === "chat.undo") return false;
      if (isReactionOnlyMessage(message)) return false;
      const text = getMessageText(message);
      if (text && shouldHideMessageText(text)) return false;
      return hasVisibleContent(message) || message.recalled;
    })
    .map((message) => {
      if (message.recalled) return message;
      if (!messageMatchesUndoTarget(message, targetMsgIds, targetCliIds)) {
        return message;
      }
      return { ...message, recalled: true };
    });

  return mergeGroupMediaMessages(filtered);
}
