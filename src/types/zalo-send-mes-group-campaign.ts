export type SendMesGroupCampaignRunStatus = 0 | 1 | 2 | 3 | 4 | null;

export type SendMesGroupResultStatus = 0 | 1 | 2 | 3 | 4 | 5;

export type SendMesGroupContentType = "" | "image" | "video" | "album";

export interface SendMesGroupCampaign {
  id: number;
  name: string;
  group_count?: number;
  start_time?: string | null;
  status: SendMesGroupCampaignRunStatus;
  account?: number;
}

export interface SendMesGroupCampaignDetail {
  id: number;
  name: string;
  contents: string[];
  images: string[];
  delay_time: number;
  number_count: number;
  group: number[];
  account?: number;
  type: SendMesGroupContentType;
  video?: number;
  album?: number;
  from_time?: string | null;
  to_time?: string | null;
  loop: boolean;
  tag_all: boolean;
  status: SendMesGroupCampaignRunStatus;
}

export interface SendMesGroupCampaignFormPayload {
  id_category: number | null;
  name: string;
  type: SendMesGroupContentType;
  id_album?: number;
  id_video?: number;
  contents: string[];
  images: string[];
  delay_time: number;
  number_count: number;
  id_groups: number[];
  id_account: number;
  from_time: string | null;
  to_time: string | null;
  loop: boolean;
  tag_all: boolean;
}

export interface SendMesGroupCampaignResult {
  id: number;
  created_at: string;
  account: number;
  name: string;
  content: string;
  images?: string[];
  thumb_url?: string;
  status: SendMesGroupResultStatus;
  status_message?: string;
}

export interface SendMesGroupCampaignStatistics {
  mess_group_success?: number;
  mess_group_failure?: number;
  total?: number;
  success?: number;
  failed?: number;
  [key: string]: number | undefined;
}