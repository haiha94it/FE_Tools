export interface PaginatedResponse<T> {
  results?: T[];
  count?: number;
  next?: string | null;
  previous?: string | null;
}

export interface ZaloFriendItem {
  id: number;
  name?: string | null;
  alias_name?: string | null;
  gender?: string | null;
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
  id: number;
  uid: string;
  name: string;
  avatar?: string | null;
  avt?: string | null;
  phone_number?: string | null;
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