import type { TeamCategoryFields } from "@/types/team-collaboration";

/** Trạng thái chạy kịch bản */
export type InviteJoinGroupCampaignRunStatus = 0 | 1 | 2 | 3 | 4 | null;

export type InviteJoinGroupType = "friend" | "phone_number" | "uids";

/** Trạng thái từng dòng kết quả */
export type InviteJoinGroupResultStatus = 0 | 1 | 2 | 3 | 4 | 5;

export interface InviteJoinGroupCampaign extends TeamCategoryFields {
  id: number;
  name: string;
  status: InviteJoinGroupCampaignRunStatus;
  friend_count?: number;
  start_time?: string | null;
  delay_time?: number;
  number_count?: number;
  type?: InviteJoinGroupType;
  account?: number;
  group?: number;
  group_link?: string;
  friend?: number[];
  phone_numbers?: string | string[] | null;
  uids?: string[];
  from_time?: string | null;
  to_time?: string | null;
}

export interface InviteJoinGroupCampaignFormPayload {
  id_category: number | null;
  name: string;
  id_account: number;
  group_link?: string;
  id_group: number | string | null;
  type: InviteJoinGroupType;
  id_friends?: number[];
  phone_numbers?: string[];
  uids?: string[];
  delay_time: number;
  number_count: number;
  from_time: string | null;
  to_time: string | null;
}

export interface InviteJoinGroupCampaignResult {
  id: number;
  account: number;
  group_link?: string;
  group_name?: string;
  phone_number?: string;
  friend_name?: string;
  friend_avt?: string;
  status: InviteJoinGroupResultStatus;
  status_message?: string;
  created_at?: string;
}

export interface InviteJoinGroupCampaignStatistics {
  invite_group_success?: number;
  invite_group_failure?: number;
  total?: number;
  success?: number;
  failed?: number;
  [key: string]: number | undefined;
}

export interface InviteJoinGroupFailedPhonesResponse {
  phone_numbers_failed?: string[];
}