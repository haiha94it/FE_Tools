import type { MessengerFriend } from "@/types/zalo-messenger";

/** Derive is_friend / is_waiting / is_request_sent từ relation_status (contract §4) */
export function normalizeMessengerFriend(
  friend: MessengerFriend | null | undefined,
): MessengerFriend | null | undefined {
  if (!friend) return friend;
  const status = friend.relation_status;
  if (status == null) return friend;
  return {
    ...friend,
    is_friend: status === 1,
    is_waiting: status === 2 || status === 3,
    is_request_sent: status === 2,
  };
}

export function normalizeConversationFriend(
  conversation: { friend?: MessengerFriend | null },
): void {
  if (conversation.friend) {
    conversation.friend = normalizeMessengerFriend(conversation.friend) ?? null;
  }
}

export type ChatFriendActionKind =
  | "incoming_request"
  | "add_friend"
  | "recall_request"
  | "unfriend";

export interface ChatFriendActionState {
  kind: ChatFriendActionKind;
  label: string;
}

export function resolveChatFriendUid(
  friend: MessengerFriend | null | undefined,
): string {
  return friend?.uid?.trim() || friend?.globalId?.trim() || "";
}

/**
 * Trạng thái quan hệ 1-1 trong header chat — đồng bộ logic ZaloCN HeaderInChat.
 * Dựa trên friend.is_friend / is_waiting / is_request_sent từ API conversation detail.
 */
export function resolveChatFriendAction(
  friend: MessengerFriend | null | undefined,
): ChatFriendActionState | null {
  if (!friend) return null;

  const isFriend = Boolean(friend.is_friend);
  const isWaiting = Boolean(friend.is_waiting);
  const isRequestSent = Boolean(friend.is_request_sent);

  if (isFriend && !isWaiting) {
    return { kind: "unfriend", label: "Huỷ kết bạn" };
  }

  if (!isFriend && isWaiting && isRequestSent) {
    return { kind: "recall_request", label: "Thu hồi lời mời" };
  }

  if (!isFriend && !isWaiting) {
    return { kind: "add_friend", label: "Kết bạn" };
  }

  if (isWaiting && !isRequestSent) {
    return { kind: "incoming_request", label: "Lời mời kết bạn" };
  }

  return null;
}

export function canShowChatFriendActions(
  friend: MessengerFriend | null | undefined,
): boolean {
  return resolveChatFriendAction(friend) != null;
}