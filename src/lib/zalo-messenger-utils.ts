import { normalizeConversationFriend } from "@/lib/zalo-messenger-friend-utils";
import { getGroupMemberDisplay } from "@/lib/zalo-contacts-utils";
import type { ZaloGroupMember } from "@/types/zalo-contacts";
import type {
  DisplayMessage,
  MessengerAccount,
  MessengerConversation,
  RawZaloMessage,
} from "@/types/zalo-messenger";

export function generateClientMsgId(): string {
  return `cli_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

export function trimToString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value).trim();
  }
  return "";
}

export function normalizeTimestampMs(ts?: number | string | null): number {
  const value = Number(ts);
  if (!Number.isFinite(value) || value <= 0) return 0;
  if (value >= 1_000_000_000_000) return value;
  if (value >= 1_000_000_000) return value * 1000;
  return value;
}

export function parseZaloUpdatedTimeMs(
  updatedTime?: string | number | null,
): number {
  if (updatedTime == null || updatedTime === "") return 0;
  if (typeof updatedTime === "number") return normalizeTimestampMs(updatedTime);

  const trimmed = String(updatedTime).trim();
  if (!trimmed) return 0;
  if (/^\d+$/.test(trimmed)) return normalizeTimestampMs(trimmed);

  const parsed = Date.parse(trimmed);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatMessageTime(ts?: number | string): string {
  const ms = normalizeTimestampMs(ts);
  if (!ms) return "";
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatMessageDetailTime(ts?: number | string): string {
  const ms = normalizeTimestampMs(ts);
  if (!ms) return "—";
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function formatConversationTime(
  conversation: Pick<MessengerConversation, "updated_time">,
): string {
  return formatMessageTime(parseZaloUpdatedTimeMs(conversation.updated_time));
}

export function formatDateDivider(ts?: number | string): string {
  const ms = normalizeTimestampMs(ts);
  if (!ms) return "";
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === now.toDateString()) return "Hôm nay";
  if (date.toDateString() === yesterday.toDateString()) return "Hôm qua";
  return date.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

export function sortConversations(
  list: MessengerConversation[],
): MessengerConversation[] {
  return [...list].sort((a, b) => {
    if (a.pinning !== b.pinning) {
      return (b.pinning ? 1 : 0) - (a.pinning ? 1 : 0);
    }
    const timeDiff =
      parseZaloUpdatedTimeMs(b.updated_time) -
      parseZaloUpdatedTimeMs(a.updated_time);
    if (timeDiff !== 0) return timeDiff;
    return b.id - a.id;
  });
}

/** Gộp hội thoại theo activity; mark-read thắng frame unread cùng mốc đến trễ. */
export function mergeConversationRecords(
  base: MessengerConversation,
  patch: MessengerConversation,
): MessengerConversation {
  const merged: MessengerConversation = { ...base, ...patch };
  const baseTime = parseZaloUpdatedTimeMs(base.updated_time);
  const patchTime = parseZaloUpdatedTimeMs(patch.updated_time);
  if (baseTime > patchTime) {
    merged.updated_time = base.updated_time;
    merged.new_message = base.new_message;
  } else if (
    baseTime === patchTime &&
    base.new_message === false &&
    patch.new_message === true
  ) {
    merged.new_message = false;
  }
  if (
    base.category_message?.length &&
    (patch.category_message == null || patch.category_message.length === 0)
  ) {
    merged.category_message = base.category_message;
  }
  normalizeConversationFriend(merged);
  return merged;
}

export function dedupeConversations(
  conversations: MessengerConversation[],
): MessengerConversation[] {
  const byId = new Map<number, MessengerConversation>();
  for (const conversation of conversations) {
    if (!Number.isFinite(conversation.id)) continue;
    const existing = byId.get(conversation.id);
    if (!existing) {
      normalizeConversationFriend(conversation);
    }
    byId.set(
      conversation.id,
      existing
        ? mergeConversationRecords(existing, conversation)
        : conversation,
    );
  }
  return sortConversations(Array.from(byId.values()));
}

/**
 * Gắn/lọc conversation theo nick sở hữu update.
 * WS room = 1 user nhiều nick — không merge frame của nick B vào list nick A.
 * (docs/fe_integration_notes.md — ghost “Hội thoại #id”)
 */
export function resolveConversationOwnerAccountId(
  conversation: Pick<MessengerConversation, "account">,
  fallbackAccountId?: number | null,
): number | null {
  if (conversation.account != null && Number.isFinite(Number(conversation.account))) {
    return Number(conversation.account);
  }
  if (fallbackAccountId != null && Number.isFinite(Number(fallbackAccountId))) {
    return Number(fallbackAccountId);
  }
  return null;
}

/** Chỉ giữ conv thuộc `accountId`; item thiếu account → gán fallback nếu có */
export function scopeConversationsToAccount(
  conversations: MessengerConversation[],
  accountId: number | null | undefined,
): MessengerConversation[] {
  if (accountId == null || !Number.isFinite(Number(accountId))) {
    return [];
  }
  const owner = Number(accountId);
  return conversations
    .filter((item) => {
      if (item.account == null) return true;
      return Number(item.account) === owner;
    })
    .map((item) => ({
      ...item,
      account: item.account != null ? Number(item.account) : owner,
    }));
}

/** Nhóm WS conversations theo nick — bỏ item không xác định được account */
export function groupConversationsByAccount(
  conversations: MessengerConversation[],
  fallbackAccountId?: number | null,
): Map<number, MessengerConversation[]> {
  const map = new Map<number, MessengerConversation[]>();
  for (const item of conversations) {
    const owner = resolveConversationOwnerAccountId(item, fallbackAccountId);
    if (owner == null) continue;
    const bucket = map.get(owner) ?? [];
    bucket.push({ ...item, account: owner });
    map.set(owner, bucket);
  }
  return map;
}

/**
 * Tin WS theo nick:
 * - có `id_account` → bắt buộc khớp
 * - không có → giữ (caller đã scope theo badge account; open-chat filter ở store)
 */
export function filterMessageDetailsForAccount(
  messages: RawZaloMessage[],
  accountId: number | null | undefined,
): RawZaloMessage[] {
  if (accountId == null || !Number.isFinite(Number(accountId))) return [];
  const owner = Number(accountId);
  return messages.filter((msg) => {
    const rawAccount = (msg as { id_account?: unknown }).id_account;
    if (rawAccount != null && rawAccount !== "") {
      return Number(rawAccount) === owner;
    }
    return true;
  });
}

/** Chuẩn hóa conversations + message_details từ WS new_global_update */
export function prepareConversationsFromGlobalUpdate(
  conversations: MessengerConversation[],
  messageDetails: RawZaloMessage[],
  options?: { activeConversationId?: number | null },
): MessengerConversation[] {
  const latestByConv = new Map<number, RawZaloMessage>();
  for (const msg of messageDetails) {
    const convId =
      msg.conversation_id != null ? Number(msg.conversation_id) : NaN;
    if (!Number.isFinite(convId)) continue;
    const existing = latestByConv.get(convId);
    const msgTs = normalizeTimestampMs(msg.ts);
    const existingTs = existing ? normalizeTimestampMs(existing.ts) : 0;
    if (!existing || msgTs >= existingTs) {
      latestByConv.set(convId, msg);
    }
  }

  if (!latestByConv.size) return conversations;

  return conversations.map((conversation) => {
    normalizeConversationFriend(conversation);
    const latest = latestByConv.get(conversation.id);
    if (!latest) return conversation;

    const msgTs = normalizeTimestampMs(latest.ts);
    const convTs = parseZaloUpdatedTimeMs(conversation.updated_time);
    const updatedTime =
      msgTs > convTs ? latest.ts : conversation.updated_time;

    const isIncoming = String(latest.uidFrom || "") !== "0";
    const isActive = options?.activeConversationId === conversation.id;
    const newMessage =
      isIncoming && !isActive ? true : conversation.new_message;

    return {
      ...conversation,
      updated_time: updatedTime ?? conversation.updated_time,
      new_message: newMessage,
    };
  });
}

export function filterActiveMessengerAccounts(
  accounts: MessengerAccount[],
): MessengerAccount[] {
  return accounts.filter((item) => item.checkpoint === false);
}

/**
 * Sort nick messenger: pin → activity (updated_time) DESC → id DESC.
 * Dùng chung F5 (`fetchAccounts`) và realtime WS (`mergeAccountActivity`).
 * docs/fe_messenger_account_sort.md
 */
export function sortMessengerAccounts(
  accounts: MessengerAccount[],
): MessengerAccount[] {
  return filterActiveMessengerAccounts(accounts).sort((a, b) => {
    if (a.pinning && !b.pinning) return -1;
    if (!a.pinning && b.pinning) return 1;
    const timeA = parseZaloUpdatedTimeMs(a.updated_time);
    const timeB = parseZaloUpdatedTimeMs(b.updated_time);
    if (timeB !== timeA) return timeB - timeA;
    return Number(b.id) - Number(a.id);
  });
}

/** Max ms từ updated_time hiện tại và activity mới (WS). */
export function maxMessengerAccountActivityTime(
  current?: string | number | null,
  incoming?: string | number | null,
): string | number | null {
  const cur = parseZaloUpdatedTimeMs(current);
  const next = parseZaloUpdatedTimeMs(incoming);
  if (!cur && !next) return current ?? incoming ?? null;
  if (next >= cur) {
    if (incoming != null && incoming !== "") return incoming;
    return next;
  }
  return current ?? null;
}

/**
 * Lấy ts activity từ frame new_global_update.
 * Lấy max từ message, conversation và account để ordering badge ổn định.
 */
export function resolveAccountActivityTsFromGlobalUpdate(payload: {
  message_details?: Array<{ ts?: string | number | null }> | null;
  conversations?: Array<{ updated_time?: string | number | null }> | null;
  account?: { updated_time?: string | number | null } | null;
}): number | null {
  let maxTs = 0;

  for (const msg of payload.message_details ?? []) {
    const ts = normalizeTimestampMs(msg.ts);
    if (ts > maxTs) maxTs = ts;
  }
  for (const conv of payload.conversations ?? []) {
    const ts = parseZaloUpdatedTimeMs(conv.updated_time);
    if (ts > maxTs) maxTs = ts;
  }
  const accountTs = parseZaloUpdatedTimeMs(payload.account?.updated_time);
  if (accountTs > maxTs) maxTs = accountTs;

  return maxTs > 0 ? maxTs : null;
}

export function getConversationTitle(
  conversation: MessengerConversation | null | undefined,
): string {
  if (!conversation) return "Hội thoại";
  // name || friend?.name || group?.name || friend?.uid — tránh chỉ #id khi payload thiếu enrich
  const name = conversation.name?.trim();
  if (name) return name;
  const friendName = conversation.friend?.name?.trim();
  if (friendName) return friendName;
  const groupName = conversation.group?.name?.trim();
  if (groupName) return groupName;
  const friendUid = conversation.friend?.uid?.trim();
  if (friendUid) return friendUid;
  return `Hội thoại #${conversation.id}`;
}

export function getConversationAvatar(
  conversation: MessengerConversation | null | undefined,
): string | null {
  if (!conversation) return null;
  return (
    conversation.avatar ||
    conversation.group?.avt ||
    conversation.friend?.avatar ||
    null
  );
}

export function isGroupConversation(
  conversation:
    | Pick<MessengerConversation, "conversation_type" | "group" | "friend">
    | MessengerConversation
    | null
    | undefined,
): boolean {
  return (
    conversation?.conversation_type === "group" ||
    Boolean(conversation?.group?.id)
  );
}

/** Subtitle header chat — không hiển thị trạng thái WS khi đã kết nối */
export function getConversationSubtitle(
  conversation: MessengerConversation,
  wsConnected = true,
): string {
  const parts: string[] = [];

  if (isGroupConversation(conversation)) {
    parts.push("Nhóm Zalo");
  } else {
    const phone = conversation.friend?.phone_number?.trim();
    if (phone) parts.push(phone);
  }

  const note = conversation.note?.trim();
  if (note) parts.push(note);

  if (!wsConnected) parts.push("Đang kết nối lại...");

  return parts.join(" · ");
}

export function getAccountLabel(
  account: Pick<MessengerAccount, "id" | "name" | "user_name"> | null,
): string {
  if (!account) return "Tài khoản Zalo";
  return (
    account.name?.trim() ||
    account.user_name?.trim() ||
    `Tài khoản #${account.id}`
  );
}

export function belongsToOpenChat(
  msg: RawZaloMessage | DisplayMessage,
  openConv: MessengerConversation | null,
  accountUid?: string | null,
  accountId?: number | null,
): boolean {
  if (!openConv) return false;

  /** conversation_id chỉ unique trong một nick — bắt buộc khớp account */
  if (
    accountId != null &&
    openConv.account != null &&
    Number(openConv.account) !== Number(accountId)
  ) {
    return false;
  }

  const convId = msg.conversation_id;
  if (convId != null && openConv.id != null) {
    return Number(convId) === Number(openConv.id);
  }

  const uidFrom = String(msg.uidFrom || "");
  const idTo = String(msg.idTo || "");

  if (openConv?.conversation_type === "friend" || openConv?.friend) {
    const peerUid = openConv.friend?.uid;
    return (
      uidFrom === peerUid ||
      (uidFrom === "0" && idTo === peerUid) ||
      (uidFrom === accountUid && idTo === peerUid)
    );
  }

  if (openConv?.conversation_type === "group" || openConv?.group) {
    return idTo === openConv.group?.uid;
  }

  return false;
}

export function extractNextPage(
  links?: { next?: string | null } | null,
): number | null {
  const next = links?.next;
  if (!next || next === "null") return null;

  const trimmed = String(next).trim();
  if (/^\d+$/.test(trimmed)) return Number(trimmed);

  const match = trimmed.match(/[?&]page=(\d+)/i);
  return match ? Number(match[1]) : null;
}

export function hasMorePages(links?: { next?: string | null } | null): boolean {
  return extractNextPage(links) !== null;
}

function messageDedupeKeys(message: DisplayMessage): string[] {
  const keys: string[] = [];
  if (message.msgId) keys.push(`msg:${message.msgId}`);
  const cliMsgId = message.clientMsgId ?? message.cliMsgId;
  if (cliMsgId) keys.push(`cli:${cliMsgId}`);
  if (message.id != null) {
    keys.push(`id:${message.id}`);
  }
  if (!keys.length) keys.push(`fallback:${message.ts}-${getMessageText(message)}`);
  return keys;
}

export function getMessageText(message: DisplayMessage): string {
  const chunks =
    message.text_message
      ?.map((item) => trimToString(item?.text))
      .filter(Boolean) ?? [];
  return chunks.join("\n");
}

export function isOwnMessage(message: DisplayMessage): boolean {
  return message.uidFrom === "0";
}

function findGroupMemberByUid(
  members: ZaloGroupMember[],
  uid: string,
): ZaloGroupMember | undefined {
  return members.find(
    (item) =>
      String(item.friend?.uid) === uid ||
      String(item.friend?.id) === uid ||
      String(item.id) === uid,
  );
}

export function resolveSenderName(
  message: DisplayMessage,
  members: ZaloGroupMember[],
): string | null {
  if (isOwnMessage(message)) return null;
  const uid = trimToString(message.uidFrom);
  if (!uid || uid === "0") return null;

  const member = findGroupMemberByUid(members, uid);
  if (member) return getGroupMemberDisplay(member).name;
  return "Thành viên";
}

export function resolveSenderAvatar(
  message: DisplayMessage,
  members: ZaloGroupMember[],
): string | null {
  if (isOwnMessage(message)) return null;
  const uid = trimToString(message.uidFrom);
  if (!uid || uid === "0") return null;

  const member = findGroupMemberByUid(members, uid);
  return member ? getGroupMemberDisplay(member).avatar : null;
}

/**
 * Dedupe theo mọi msgId/cliMsgId hợp lệ; bản đến sau thắng.
 * `sent_by: null` là overwrite có chủ đích để không giữ actor của nick khác.
 */
export function dedupeMessages(messages: DisplayMessage[]): DisplayMessage[] {
  const result: DisplayMessage[] = [];
  const indexByKey = new Map<string, number>();

  for (const message of messages) {
    const keys = messageDedupeKeys(message);
    const existingIndex = keys
      .map((key) => indexByKey.get(key))
      .find((index): index is number => index !== undefined);

    if (existingIndex === undefined) {
      const index = result.push(message) - 1;
      for (const key of keys) indexByKey.set(key, index);
      continue;
    }

    const previous = result[existingIndex];
    const merged = { ...previous, ...message };
    result[existingIndex] = merged;
    for (const key of new Set([
      ...messageDedupeKeys(previous),
      ...messageDedupeKeys(merged),
    ])) {
      indexByKey.set(key, existingIndex);
    }
  }

  return result;
}

export function sortMessagesChronologically(
  messages: DisplayMessage[],
): DisplayMessage[] {
  return [...messages].sort((a, b) => {
    const diff = normalizeTimestampMs(a.ts) - normalizeTimestampMs(b.ts);
    if (diff !== 0) return diff;
    const aId = String(a.id ?? a.clientMsgId ?? a.cliMsgId ?? "");
    const bId = String(b.id ?? b.clientMsgId ?? b.cliMsgId ?? "");
    return aId.localeCompare(bId);
  });
}

export function normalizeMessageList(
  messages: DisplayMessage[],
): DisplayMessage[] {
  return sortMessagesChronologically(dedupeMessages(messages));
}

export function shouldShowDateDivider(
  message: DisplayMessage,
  previousMessage?: DisplayMessage,
): boolean {
  const currentMs = normalizeTimestampMs(message.ts);
  if (!currentMs) return false;
  const previousMs = normalizeTimestampMs(previousMessage?.ts);
  if (!previousMs) return true;
  return (
    new Date(currentMs).toDateString() !==
    new Date(previousMs).toDateString()
  );
}

export function isCompactMessageGroup(
  message: DisplayMessage,
  previousMessage?: DisplayMessage,
): boolean {
  if (!previousMessage) return false;
  if (message.uidFrom !== previousMessage.uidFrom) return false;
  const currentMs = normalizeTimestampMs(message.ts);
  const previousMs = normalizeTimestampMs(previousMessage?.ts);
  if (!currentMs || !previousMs) return false;
  return currentMs - previousMs <= 300_000;
}
