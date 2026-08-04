export interface PaginatedResponse<T> {
  results?: T[];
  count?: number;
  next?: string | null;
  previous?: string | null;
}

/**
 * gender từ BE (FriendModel):
 * - 0 = Nam
 * - 1 = Nữ
 * (một số payload legacy có thể là string)
 */
export type ZaloFriendGender = 0 | 1 | number | string | null;

export interface ZaloFriendItem {
  id: number;
  name?: string | null;
  alias_name?: string | null;
  gender?: ZaloFriendGender;
  sdob?: string | null;
  uid?: string | null;
  avatar?: string | null;
  avt?: string | null;
}

export interface ZaloGroupItem {
  id: number;
  name?: string | null;
  avatar?: string | null;
  avt?: string | null;
  total_member?: number | null;
  link_group?: string | null;
}

export interface ZaloFriendRecommendItem {
  id?: number;
  name?: string | null;
  zaloName?: string | null;
  uid?: string | null;
  userId?: string | null;
  avatar?: string | null;
  type?: "friend_request" | "suggest" | string;
}

export interface ZaloSentFriendRequestItem {
  id?: number;
  name?: string | null;
  uid?: string | null;
  avatar?: string | null;
  /** 0 = Nam, 1 = Nữ (BE FriendModel) */
  gender?: ZaloFriendGender;
}

export interface ZaloGroupLinkItem {
  name?: string | null;
  avatar?: string | null;
  avt?: string | null;
  link_group?: string | null;
  total_member?: number | null;
}

export interface ZaloLabelCategory {
  id: number;
  name?: string | null;
  color?: string | null;
  friend_ids?: number[];
  group_ids?: number[];
}

export interface ScanTaskResponse {
  id_task?: string | number;
  task_status?: string;
  status?: string;
  result?: unknown;
  message?: string;
  error?: string;
  data?: unknown;
}

export interface ZaloGroupMemberFriend {
  id: number | null;
  uid: string;
  name: string;
  alias_name?: string | null;
  avatar?: string | null;
  avt?: string | null;
  phone_number?: string | null;
  /** 0 none · 1 friend · 2 outgoing · 3 incoming */
  relation_status?: 0 | 1 | 2 | 3 | number;
  is_friend?: boolean;
}

export interface ZaloGroupMember {
  id: number;
  friend?: ZaloGroupMemberFriend | null;
  is_admin?: boolean;
  is_creator?: boolean;
}

export interface GroupMemberTaskResponse extends ScanTaskResponse {
  data?: ZaloGroupMember[];
  result?: ZaloGroupMember[] | unknown;
  total_member?: string | number;
  group_name?: string;
}

export type ContactsTab = "friends" | "groups";

export type FriendModal =
  | "scan"
  | "label"
  | "recommend"
  | "sent-requests"
  | null;

export type GroupModal = "scan" | "label" | "get-link" | null;