import { trimToString } from "@/lib/zalo-messenger-utils";
import type { DisplayMessage } from "@/types/zalo-messenger";

export interface ZaloReactionOption {
  id: number;
  emoji: string;
  alt: string;
  label: string;
}

export const ZALO_REACTION_OPTIONS: ZaloReactionOption[] = [
  { id: 0, emoji: "👍", alt: "/-strong", label: "Thích" },
  { id: 1, emoji: "❤️", alt: "/-heart", label: "Yêu thích" },
  { id: 2, emoji: "😂", alt: ":>", label: "Haha" },
  { id: 3, emoji: "😮", alt: ":o", label: "Wow" },
  { id: 4, emoji: "😢", alt: ":-((", label: "Buồn" },
  { id: 5, emoji: "😡", alt: ":-h", label: "Phẫn nộ" },
];

const REACTION_BY_ALT = Object.fromEntries(
  ZALO_REACTION_OPTIONS.map((item) => [item.alt, item]),
) as Record<string, ZaloReactionOption>;

function parseReactionPayload(
  content?: string | Record<string, unknown>,
): Record<string, unknown> | null {
  if (!content) return null;
  if (typeof content !== "string") return content;
  try {
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    try {
      const fixed = content
        .replace(/([{,])\s*'([^']+?)'\s*:/g, '$1"$2":')
        .replace(/:\s*'([^']*?)'/g, ': "$1"');
      return JSON.parse(fixed) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}

export interface ReactionTargetIds {
  /** gMsgID — msgId tin gốc (ưu tiên) */
  targetMsgIds: string[];
  /** cMsgID — cliMsgId tin gốc (fallback) */
  targetCliMsgIds: string[];
}

/** Parse rMsg[] → target msgId + cliMsgId của tin gốc */
export function extractReactionTargetIds(
  content?: string | Record<string, unknown>,
): ReactionTargetIds {
  const parsed = parseReactionPayload(content);
  const rMsg = parsed?.rMsg;
  if (!Array.isArray(rMsg) || rMsg.length === 0) {
    return { targetMsgIds: [], targetCliMsgIds: [] };
  }

  const targetMsgIds: string[] = [];
  const targetCliMsgIds: string[] = [];

  for (const entry of rMsg) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    const g = row.gMsgID ?? row.gMsgId;
    const c = row.cMsgID ?? row.cMsgId;
    if (g != null && g !== "") targetMsgIds.push(String(g));
    if (c != null && c !== "") targetCliMsgIds.push(String(c));
  }

  return { targetMsgIds, targetCliMsgIds };
}

/** @deprecated Dùng extractReactionTargetIds — giữ để tương thích */
export function extractReactionTargetId(content?: string): string | null {
  const { targetMsgIds, targetCliMsgIds } = extractReactionTargetIds(content);
  return targetMsgIds[0] ?? targetCliMsgIds[0] ?? null;
}

export function parseReactionContent(
  content?: string,
): ZaloReactionOption | null {
  const parsed = parseReactionPayload(content);
  if (!parsed) return null;

  if (typeof parsed.rIcon === "string") {
    const byAlt = REACTION_BY_ALT[parsed.rIcon];
    if (byAlt) return byAlt;
  }

  if (typeof parsed.rType === "number") {
    return getReactionById(parsed.rType) ?? null;
  }

  return null;
}

export function getReactionById(id: number): ZaloReactionOption | undefined {
  return ZALO_REACTION_OPTIONS.find((item) => item.id === id);
}

export function getReactionByAlt(alt: string): ZaloReactionOption | undefined {
  return REACTION_BY_ALT[alt];
}

/** Shortcode emoticon Zalo trong tin webchat — dài trước để không cắt nhầm */
const EMOTICON_ALTS_SORTED = [...ZALO_REACTION_OPTIONS]
  .map((item) => item.alt)
  .sort((a, b) => b.length - a.length);

/**
 * Tin chỉ là 1 emoticon Zalo (vd. `/-strong`) — hiển thị icon lớn.
 */
export function isStandaloneZaloEmoticon(text: string): boolean {
  const t = text.trim();
  return Boolean(t && REACTION_BY_ALT[t]);
}

export function resolveStandaloneZaloEmoticon(
  text: string,
): ZaloReactionOption | null {
  const t = text.trim();
  return (t && REACTION_BY_ALT[t]) || null;
}

export type ZaloEmoticonTextPart =
  | { type: "text"; value: string }
  | { type: "emoticon"; value: string; option: ZaloReactionOption };

/**
 * Tách text webchat thành đoạn text + emoticon (`/-strong`, `/-heart`, …).
 */
export function splitZaloEmoticonText(text: string): ZaloEmoticonTextPart[] {
  if (!text) return [];
  const parts: ZaloEmoticonTextPart[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    let earliest = -1;
    let matchedAlt = "";
    for (const alt of EMOTICON_ALTS_SORTED) {
      const idx = remaining.indexOf(alt);
      if (idx === -1) continue;
      if (earliest === -1 || idx < earliest) {
        earliest = idx;
        matchedAlt = alt;
      } else if (idx === earliest && alt.length > matchedAlt.length) {
        matchedAlt = alt;
      }
    }
    if (earliest === -1 || !matchedAlt) {
      parts.push({ type: "text", value: remaining });
      break;
    }
    if (earliest > 0) {
      parts.push({ type: "text", value: remaining.slice(0, earliest) });
    }
    const option = REACTION_BY_ALT[matchedAlt];
    if (option) {
      parts.push({ type: "emoticon", value: matchedAlt, option });
    } else {
      parts.push({ type: "text", value: matchedAlt });
    }
    remaining = remaining.slice(earliest + matchedAlt.length);
  }
  return parts;
}

export function isReactionOnlyMessage(message: DisplayMessage): boolean {
  if (message.msgType === "chat.reaction") return true;
  return (
    (message.reaction?.length ?? 0) > 0 &&
    !trimToString(message.text_message?.map((t) => t.text).join(""))
  );
}

function pushReactionToMap(
  map: Map<string, DisplayMessage[]>,
  key: string,
  message: DisplayMessage,
) {
  if (!key) return;
  const bucket = map.get(key) ?? [];
  if (!bucket.includes(message)) bucket.push(message);
  map.set(key, bucket);
}

/**
 * Index reaction theo target tin gốc.
 * Key: gMsgID (msgId) và cMsgID (cliMsgId) — lookup bằng cả hai.
 */
export function groupReactionsByCliMsgId(messages: DisplayMessage[]) {
  const map = new Map<string, DisplayMessage[]>();
  for (const message of messages) {
    if (!message.reaction?.length) continue;
    for (const reaction of message.reaction) {
      const { targetMsgIds, targetCliMsgIds } = extractReactionTargetIds(
        reaction.content,
      );
      for (const id of targetMsgIds) pushReactionToMap(map, id, message);
      for (const id of targetCliMsgIds) pushReactionToMap(map, id, message);
    }
  }
  return map;
}

function getMessageReactionLookupKeys(message: DisplayMessage): string[] {
  const keys = [message.msgId, message.cliMsgId, message.clientMsgId]
    .filter((value) => value != null && value !== "")
    .map((value) => String(value));
  return [...new Set(keys)];
}

export function getMessageReactions(
  message: DisplayMessage,
  reactionMap: Map<string, DisplayMessage[]>,
): DisplayMessage[] {
  const seen = new Set<DisplayMessage>();
  const result: DisplayMessage[] = [];
  for (const key of getMessageReactionLookupKeys(message)) {
    const direct = reactionMap.get(key);
    if (!direct?.length) continue;
    for (const item of direct) {
      if (seen.has(item)) continue;
      seen.add(item);
      result.push(item);
    }
  }
  return result;
}

export function getUniqueReactionEmojis(
  reactionMessages: DisplayMessage[],
): string[] {
  const emojis: string[] = [];
  for (const item of reactionMessages) {
    const meta = parseReactionContent(item.reaction?.[0]?.content);
    const emoji = meta?.emoji ?? "👍";
    if (!emojis.includes(emoji)) emojis.push(emoji);
  }
  return emojis;
}
