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

export function extractReactionTargetId(content?: string): string | null {
  const parsed = parseReactionPayload(content);
  const rMsg = parsed?.rMsg;
  if (!Array.isArray(rMsg) || !rMsg[0]) return null;
  const target = (rMsg[0] as { cMsgID?: string | number }).cMsgID;
  return target != null ? String(target) : null;
}

export function parseReactionContent(
  content?: string,
): ZaloReactionOption | null {
  const parsed = parseReactionPayload(content);
  if (!parsed?.rIcon || typeof parsed.rIcon !== "string") return null;
  return REACTION_BY_ALT[parsed.rIcon] ?? null;
}

export function getReactionById(id: number): ZaloReactionOption | undefined {
  return ZALO_REACTION_OPTIONS.find((item) => item.id === id);
}

export function isReactionOnlyMessage(message: DisplayMessage): boolean {
  if (message.msgType === "chat.reaction") return true;
  return (message.reaction?.length ?? 0) > 0 && !trimToString(
    message.text_message?.map((t) => t.text).join(""),
  );
}

export function groupReactionsByCliMsgId(messages: DisplayMessage[]) {
  const map = new Map<string, DisplayMessage[]>();
  for (const message of messages) {
    if (!message.reaction?.length) continue;
    for (const reaction of message.reaction) {
      const key = extractReactionTargetId(reaction.content);
      if (!key) continue;
      const bucket = map.get(key) ?? [];
      if (!bucket.includes(message)) bucket.push(message);
      map.set(key, bucket);
    }
  }
  return map;
}

function getMessageReactionLookupKeys(message: DisplayMessage): string[] {
  const keys = [message.cliMsgId, message.clientMsgId, message.msgId]
    .filter((value) => value != null && value !== "")
    .map((value) => String(value));
  return [...new Set(keys)];
}

export function getMessageReactions(
  message: DisplayMessage,
  reactionMap: Map<string, DisplayMessage[]>,
): DisplayMessage[] {
  for (const key of getMessageReactionLookupKeys(message)) {
    const direct = reactionMap.get(key);
    if (direct?.length) return direct;
  }
  return [];
}

export function getUniqueReactionEmojis(
  reactionMessages: DisplayMessage[],
): string[] {
  const emojis: string[] = [];
  for (const item of reactionMessages) {
    const meta = parseReactionContent(item.reaction?.[0]?.content);
    if (meta && !emojis.includes(meta.emoji)) emojis.push(meta.emoji);
  }
  return emojis;
}