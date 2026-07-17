import type { TeamCategoryFields } from "@/types/team-collaboration";

/** Trạng thái chạy kịch bản */
export type PhoneInviteGroupCampaignRunStatus = 0 | 1 | 2 | 3 | 4 | null;

/** Trạng thái từng dòng kết quả */
export type PhoneInviteGroupResultStatus = 0 | 1 | 2 | 3 | 4;

export interface PhoneInviteGroupCampaign extends TeamCategoryFields {
  id: number;
  name: string;
  status: PhoneInviteGroupCampaignRunStatus;
  phone_numbers_count?: number;
  start_time?: string | null;
  delay_time?: number;
  number_count?: number;
  accounts?: number[];
  account?: number;
  /** Legacy — BE resolve từ group_invite; FE không gửi khi create */
  group_link?: string;
  group_invite?: string;
  phone_numbers?: string | string[] | null;
  from_time?: string | null;
  to_time?: string | null;
}

/**
 * Body create/update — chỉ `group_invite` (name|avt), không `group_link`.
 * Update: PUT .../category/{id}/
 */
export interface PhoneInviteGroupCampaignFormPayload {
  id_category: number | null;
  name: string;
  delay_time: number;
  number_count: number;
  id_accounts: number[];
  /** `name|avt` — avatar rỗng OK: "Tên nhóm|" */
  group_invite: string;
  phone_numbers: string[];
  from_time: string | null;
  to_time: string | null;
}

export interface PhoneInviteGroupCampaignResult {
  id: number;
  account: number;
  group_link?: string;
  group_name?: string;
  phone_number?: string;
  friend_name?: string;
  friend_avt?: string;
  status: PhoneInviteGroupResultStatus;
  status_message?: string;
  created_at?: string;
}

export interface PhoneInviteGroupCampaignStatistics {
  invite_group_success?: number;
  invite_group_failure?: number;
  account_count?: number;
  total_account?: number;
  account_excluded_count?: number;
  total?: number;
  success?: number;
  failed?: number;
  [key: string]: number | undefined;
}

/**
 * Item từ POST .../category/all-group/ — GroupDetail (sau fix BE).
 * `group_invite` = `${name}|${avt}`
 */
export interface PhoneInviteGroupItem {
  id?: number;
  uid?: string;
  name: string;
  /** Avatar URL — field chính từ GroupDetail */
  avt?: string;
  /** Alias legacy nếu BE còn trả `avatar` */
  avatar?: string;
  link_group?: string;
  total_member?: number;
  is_joined?: boolean;
  is_blocked_chat?: boolean;
}
