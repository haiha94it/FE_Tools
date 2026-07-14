import type { TeamCategoryFields } from "@/types/team-collaboration";

export type BirthdayContentType = "" | "image" | "video" | "album";

export type BirthdayResultStatus = 0 | 1 | 2 | 3 | 4 | 5;

export interface BirthdayCampaign extends TeamCategoryFields {
  id?: number;
  name?: string;
  type?: BirthdayContentType;
  contents?: string[];
  images?: string[];
  account?: number[];
  video?: number;
  album?: number;
  active?: boolean;
}

export interface BirthdayCampaignFormPayload {
  id_category: number | null;
  name: string;
  type: BirthdayContentType;
  id_album?: number | null;
  id_video?: number | null;
  contents: string[];
  images: string[];
  id_accounts: number[];
}

export interface BirthdayCampaignResult {
  id: number;
  created_at: string;
  account?: number;
  account_number?: string;
  name?: string;
  friend_avt?: string;
  content?: string;
  images?: string[];
  image?: string;
  thumb_url?: string;
  status?: BirthdayResultStatus;
  status_message?: string;
}

export interface BirthdayMediaItem {
  id: number;
  name?: string;
  name_video?: string;
}