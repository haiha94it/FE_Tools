/** Types for portable support_chatbot BE API */

export type SupportImageSendMode = "all";

export interface SupportFaqImage {
  id: number;
  media_id?: number;
  url?: string | null;
  uploaded_at?: string;
}

export interface SupportFaq {
  id: number;
  question: string;
  answer?: string | null;
  image_send_mode?: SupportImageSendMode | string;
  is_active?: boolean;
  images?: SupportFaqImage[];
  has_embedding?: boolean;
  created_by?: number | null;
  updated_by?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface SupportMedia {
  id: number;
  url?: string | null;
  created_at?: string;
  uploaded_by?: number | null;
}

export interface SupportAskResult {
  message?: string;
  answer?: string | string[] | null;
  image_urls?: string[];
  faq_id?: number | null;
  matched_question?: string | null;
  miss_data?: boolean;
}

export interface SupportEditor {
  id: number;
  user_id: number;
  username?: string | null;
  granted_by_id?: number | null;
  created_at?: string;
}

export interface SupportFaqCreatePayload {
  question: string;
  answer?: string;
  is_active?: boolean;
  media_ids?: number[];
}

export type SupportFaqUpdatePayload = Partial<SupportFaqCreatePayload>;

export interface SupportChatMessage {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: string;
  imageUrls?: string[];
  matchedQuestion?: string | null;
  faqId?: number | null;
  missData?: boolean;
}

export interface SupportRoleOption {
  key: string;
  label: string;
}

export interface SupportEligibleUser {
  id: number;
  username: string;
  fullname?: string;
  roles: SupportRoleOption[];
  is_editor?: boolean;
  /** Admin/superuser — luôn manage FAQ, không bắt buộc editor row */
  always_can_manage?: boolean;
}

export interface SupportMissQuery {
  id: number;
  question: string;
  user?: number | null;
  username?: string | null;
  hit_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface SupportMissConvertPayload {
  answer: string;
  is_active?: boolean;
  media_ids?: number[];
}

