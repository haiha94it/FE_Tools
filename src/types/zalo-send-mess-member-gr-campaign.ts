import type { TeamCategoryFields } from "@/types/team-collaboration";

export type SendMessMemberGrCampaignRunStatus = 0 | 1 | 2 | 3 | 4 | null;

export type SendMessMemberGrResultStatus = 0 | 1 | 2 | 3 | 4 | 5;

export type SendMessMemberGrContentType = "" | "image" | "video" | "album";

/** Chia TV cho nick | mọi nick × mọi TV */
export type SendMessMemberGrAssignMode = "distribute" | "all";

export interface SendMessMemberGrCampaign extends TeamCategoryFields {
  id: number;
  name: string;
  /** Số TV = len(list_member_global) — field mới */
  member_count?: number;
  /** @deprecated BE cũ — fallback khi chưa có member_count */
  list_uid_count?: number;
  start_time?: string | null;
  status: SendMessMemberGrCampaignRunStatus;
  account?: number;
  accounts?: number[];
  assign_mode?: SendMessMemberGrAssignMode;
  group_global_id?: string;
}

export interface SendMessMemberGrCampaignDetail {
  id: number;
  name: string;
  contents: string[];
  images: string[];
  delay_time: number;
  number_count: number;
  /** Multi-nick */
  accounts?: number[];
  /** @deprecated 1 nick cũ */
  account?: number;
  group_global_id?: string;
  list_member_global?: string[];
  assign_mode?: SendMessMemberGrAssignMode;
  /** @deprecated BE cũ */
  group?: number;
  /** @deprecated BE cũ */
  list_uid?: string[];
  type: SendMessMemberGrContentType;
  video?: number;
  album?: number;
  from_time?: string | null;
  to_time?: string | null;
  add_friend: boolean;
  send_message: boolean;
  split_attachment: boolean;
  first_messages: string[];
  status: SendMessMemberGrCampaignRunStatus;
}

/** Payload đầy đủ khi tạo / sửa kịch bản không đang chạy */
export interface SendMessMemberGrCampaignFormPayload {
  id_category: number | null;
  name: string;
  type: SendMessMemberGrContentType | null;
  id_album?: number | null;
  id_video?: number | null;
  contents: string[];
  images: string[];
  delay_time: number;
  number_count: number;
  id_accounts: number[];
  group_global_id: string;
  member_global_ids: string[];
  assign_mode: SendMessMemberGrAssignMode;
  add_friend: boolean;
  send_message: boolean;
  first_messages: string[];
  from_time: string | null;
  to_time: string | null;
}

/**
 * Khi status===1: BE chỉ nhận tin/media.
 * Không gửi id_accounts / group_global_id / member_global_ids / assign_mode (CATEGORY_RUNNING).
 */
export interface SendMessMemberGrRunningContentPayload {
  id_category: number;
  type: SendMessMemberGrContentType | null;
  id_album?: number | null;
  id_video?: number | null;
  contents: string[];
  images: string[];
  first_messages: string[];
}

export type SendMessMemberGrSavePayload =
  | SendMessMemberGrCampaignFormPayload
  | SendMessMemberGrRunningContentPayload;

/** TV từ POST .../mess-member-group/category/members/ */
export interface SendMessMemberGrGroupMember {
  member_global_id: string;
  name: string;
  avatar?: string;
  is_admin?: boolean;
  is_creator?: boolean;
  accounts_ready?: number[];
  accounts_missing_friend?: number[];
}

export interface SendMessMemberGrCampaignResult {
  id: number;
  created_at: string;
  account: number;
  name: string;
  content?: string;
  first_message?: string;
  images?: string[];
  thumb_url?: string;
  image?: string;
  status_send_message?: SendMessMemberGrResultStatus;
  status_send_message_message?: string;
  status_add_friend?: SendMessMemberGrResultStatus;
  status_add_friend_message?: string;
  status_find_info_message?: string;
}

export interface SendMessMemberGrCampaignStatistics {
  send_message_success?: number;
  send_message_failure?: number;
  add_friend_success?: number;
  add_friend_failure?: number;
  total?: number;
  success?: number;
  failed?: number;
  [key: string]: number | undefined;
}

export interface SendMessMemberGrResultsFilter {
  id_account?: number | null;
  start_time?: string | null;
  end_time?: string | null;
}
