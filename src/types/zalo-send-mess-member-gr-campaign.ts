export type SendMessMemberGrCampaignRunStatus = 0 | 1 | 2 | 3 | 4 | null;

export type SendMessMemberGrResultStatus = 0 | 1 | 2 | 3 | 4 | 5;

export type SendMessMemberGrContentType = "" | "image" | "video" | "album";

export interface SendMessMemberGrCampaign {
  id: number;
  name: string;
  list_uid_count?: number;
  start_time?: string | null;
  status: SendMessMemberGrCampaignRunStatus;
  account?: number;
}

export interface SendMessMemberGrCampaignDetail {
  id: number;
  name: string;
  contents: string[];
  images: string[];
  delay_time: number;
  number_count: number;
  group: number;
  list_uid: string[];
  account?: number;
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

export interface SendMessMemberGrCampaignFormPayload {
  id_category: number | null;
  name: string;
  type: SendMessMemberGrContentType;
  id_album?: number;
  id_video?: number;
  contents: string[];
  images: string[];
  delay_time: number;
  number_count: number;
  id_account: number;
  id_group: number;
  uids: string[];
  add_friend: boolean;
  send_message: boolean;
  split_attachment: boolean;
  first_messages: string[];
  from_time: string | null;
  to_time: string | null;
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