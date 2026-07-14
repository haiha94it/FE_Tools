import type { TeamCategoryFields } from "@/types/team-collaboration";

/** Trạng thái chạy kịch bản — đồng bộ ZaloCN statusRunTools */
export type AddFriendCampaignRunStatus = 0 | 1 | 2 | 3 | null;

/** Trạng thái từng dòng kết quả */
export type AddFriendResultStatus = 0 | 1 | 2 | 3 | 4;

export interface AddFriendCampaign extends TeamCategoryFields {
  id: number;
  name: string;
  status: AddFriendCampaignRunStatus;
  phone_number_count?: number;
  start_time?: string | null;
  delay_time?: number;
  number_count?: number;
  divide?: boolean;
  first_messages?: string[] | null;
  phone_numbers?: string[] | null;
  accounts?: number[] | null;
  from_time?: string | null;
  to_time?: string | null;
}

export interface AddFriendCampaignFormPayload {
  id_category: number | null;
  name: string;
  phone_numbers: string[];
  first_messages: string[];
  delay_time: number;
  number_count: number;
  divide: boolean;
  id_accounts: number[];
  from_time: string | null;
  to_time: string | null;
}

export interface AddFriendCampaignResult {
  id: number;
  account: number;
  phone_number?: string;
  name?: string;
  message?: string;
  avt?: string;
  image?: string;
  status: AddFriendResultStatus;
  status_message?: string;
  created_at?: string;
}

export interface AddFriendCampaignStatistics {
  total?: number;
  success?: number;
  failed?: number;
  unknown?: number;
  restricted?: number;
  blocked?: number;
  [key: string]: number | undefined;
}

export interface AddFriendFailedPhonesResponse {
  phone_numbers_failed?: string[];
}