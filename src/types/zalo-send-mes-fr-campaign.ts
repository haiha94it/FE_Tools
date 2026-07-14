export type SendMesFrCampaignRunStatus = 0 | 1 | 2 | 3 | 4 | null;

export type SendMesFrResultStatus = 0 | 1 | 2 | 3 | 4 | 5;

export type SendMesFrContentType = "" | "image" | "video" | "album";

export interface SendMesFrCampaign {
  id: number;
  name: string;
  friend_count?: number;
  start_time?: string | null;
  status: SendMesFrCampaignRunStatus;
  account?: number;
  accounts?: number[];
  friend?: number[];
}

export interface SendMesFrCampaignDetail {
  id: number;
  name: string;
  contents: string[];
  images: string[];
  delay_time: number;
  number_count: number;
  friend: number[];
  account?: number;
  type: SendMesFrContentType;
  video?: number;
  album?: number;
  from_time?: string | null;
  to_time?: string | null;
  status: SendMesFrCampaignRunStatus;
}

export interface SendMesFrCampaignFormPayload {
  id_category: number | null;
  name: string;
  type: SendMesFrContentType;
  id_album?: number;
  id_video?: number;
  contents: string[];
  images: string[];
  delay_time: number;
  number_count: number;
  id_friends: number[];
  id_account: number;
  from_time: string | null;
  to_time: string | null;
}

export interface SendMesFrCampaignResult {
  id: number;
  created_at: string;
  account: number;
  name: string;
  content: string;
  images?: string[];
  thumb_url?: string;
  status: SendMesFrResultStatus;
  status_message?: string;
}

export interface SendMesFrCampaignStatistics {
  mess_friend_success?: number;
  mess_friend_failure?: number;
  total?: number;
  success?: number;
  failed?: number;
  [key: string]: number | undefined;
}