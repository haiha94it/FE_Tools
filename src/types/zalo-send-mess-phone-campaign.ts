export type SendMessPhoneCampaignRunStatus = 0 | 1 | 2 | 3 | 4 | null;

export type SendMessPhoneResultStatus = 0 | 1 | 2 | 3 | 4 | 5;

export type SendMessPhoneContentType = "" | "image" | "video" | "album";

export interface SendMessPhoneCampaign {
  id: number;
  name: string;
  phone_numbers_count?: number;
  start_time?: string | null;
  status: SendMessPhoneCampaignRunStatus;
  accounts?: number[];
}

export interface SendMessPhoneCampaignDetail {
  id: number;
  name: string;
  phone_numbers: string[];
  contents: string[];
  images: string[];
  delay_time: number;
  number_count: number;
  divide: boolean;
  split_attachment: boolean;
  accounts: number[];
  type: SendMessPhoneContentType;
  video?: number;
  album?: number;
  from_time?: string | null;
  to_time?: string | null;
  status: SendMessPhoneCampaignRunStatus;
}

export interface SendMessPhoneCampaignFormPayload {
  id_category: number | null;
  name: string;
  phone_numbers: string[];
  type: SendMessPhoneContentType;
  id_album?: number;
  id_video?: number;
  contents: string[];
  images: string[];
  delay_time: number;
  number_count: number;
  divide: boolean;
  split_attachment: boolean;
  id_accounts: number[];
  from_time: string | null;
  to_time: string | null;
}

export interface SendMessPhoneCampaignResult {
  id: number;
  created_at: string;
  account: number;
  name: string;
  phone_number?: string;
  content: string;
  images?: string[];
  thumb_url?: string;
  status: SendMessPhoneResultStatus;
  status_message?: string;
}

export interface SendMessPhoneCampaignStatistics {
  mess_phone_number_success?: number;
  mess_phone_number_failure?: number;
  account_count?: number;
  total_account?: number;
  account_excluded_count?: number;
  total?: number;
  success?: number;
  failed?: number;
  [key: string]: number | undefined;
}