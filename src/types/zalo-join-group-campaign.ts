import type { TeamCategoryFields } from "@/types/team-collaboration";

/** Trạng thái chạy kịch bản — đồng bộ ZaloCN statusRunTools */
export type JoinGroupCampaignRunStatus = 0 | 1 | 2 | 3 | 4 | null;

/** Trạng thái từng dòng kết quả tham gia nhóm */
export type JoinGroupResultStatus = 0 | 1 | 2 | 3 | 4 | 5;

export interface JoinGroupCampaign extends TeamCategoryFields {
  id: number;
  name: string;
  status: JoinGroupCampaignRunStatus;
  list_group_count?: number;
  start_time?: string | null;
  delay_time?: number;
  number_count?: number;
  divide?: boolean;
  list_group?: string[] | null;
  accounts?: number[] | null;
  from_time?: string | null;
  to_time?: string | null;
}

export interface JoinGroupCampaignFormPayload {
  id_category: number | null;
  name: string;
  list_group: string[];
  delay_time: number;
  number_count: number;
  divide: boolean;
  id_accounts: number[];
  from_time: string | null;
  to_time: string | null;
}

export interface JoinGroupCampaignResult {
  id: number;
  account: number;
  link_group?: string;
  status: JoinGroupResultStatus;
  status_message?: string;
  created_at?: string;
}

export interface JoinGroupCampaignStatistics {
  join_group_success?: number;
  join_group_failure?: number;
  account_count?: number;
  total_account?: number;
  account_excluded_count?: number;
  total?: number;
  success?: number;
  failed?: number;
  restricted?: number;
  [key: string]: number | undefined;
}

export interface JoinGroupFailedLinksResponse {
  link_groups_failed?: string[];
}