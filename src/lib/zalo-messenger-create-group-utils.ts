import type { ZaloFriendItem } from "@/types/zalo-contacts";

export const CREATE_GROUP_MIN_MEMBERS = 2;
export const CREATE_GROUP_POLL_INTERVAL_MS = 3000;
export const CREATE_GROUP_MAX_POLL_ATTEMPTS = 40;
export const CREATE_GROUP_SEARCH_DEBOUNCE_MS = 300;
export const CREATE_GROUP_SCROLL_BOTTOM_THRESHOLD_PX = 8;

const CREATE_GROUP_EXCLUDED_FRIEND_IDS = new Set([340023256]);
const CREATE_GROUP_EXCLUDED_FRIEND_NAMES = new Set(["cloud của tôi"]);

export function getFriendDisplayName(
  friend: Pick<ZaloFriendItem, "id" | "name" | "uid">,
): string {
  return friend.name?.trim() || friend.uid || `Bạn #${friend.id}`;
}

export function isSelectableFriendForCreateGroup(
  friend: Pick<ZaloFriendItem, "id" | "name" | "uid">,
): boolean {
  if (CREATE_GROUP_EXCLUDED_FRIEND_IDS.has(friend.id)) return false;
  const label = getFriendDisplayName(friend).trim().toLowerCase();
  if (CREATE_GROUP_EXCLUDED_FRIEND_NAMES.has(label)) return false;
  return Boolean(friend.uid);
}

export function filterFriendsForCreateGroup(
  friends: ZaloFriendItem[],
): ZaloFriendItem[] {
  return friends.filter(isSelectableFriendForCreateGroup);
}

export function validateCreateGroupInput(
  name: string,
  memberUids: string[],
): string | null {
  if (!name.trim()) return "Vui lòng nhập tên nhóm.";
  if (memberUids.length < CREATE_GROUP_MIN_MEMBERS) {
    return "Vui lòng chọn ít nhất 2 bạn bè để tạo nhóm.";
  }
  return null;
}

export function hasMoreFriendPages(next: string | null | undefined): boolean {
  return Boolean(next);
}

export function isFriendListNearBottom(
  scrollTop: number,
  clientHeight: number,
  scrollHeight: number,
  threshold = CREATE_GROUP_SCROLL_BOTTOM_THRESHOLD_PX,
): boolean {
  return scrollTop + clientHeight + threshold >= scrollHeight;
}

export function shouldLoadMoreFriendsOnScroll(
  scrollTop: number,
  clientHeight: number,
  scrollHeight: number,
  options: {
    hasMore: boolean;
    isLoadingMore: boolean;
    userHasScrolled: boolean;
    allowLoadAtBottom: boolean;
  },
): boolean {
  if (!options.hasMore || options.isLoadingMore || !options.allowLoadAtBottom) {
    return false;
  }
  if (!options.userHasScrolled) return false;
  return isFriendListNearBottom(scrollTop, clientHeight, scrollHeight);
}

export function isValidVietnamesePhone(phone: string): boolean {
  const normalized = phone.replace(/[\s.-]/g, "");
  return /^(0|\+84)(3|5|7|8|9)\d{8}$/.test(normalized);
}