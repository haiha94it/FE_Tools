/** Module Chatbot Zalo — đồng bộ design doc + MANAGE_CN ChatSystem */

export type TrainingImageSendMode = "all" | "random_one" | "random";
export type ReminderImageSendMode = "ALL" | "RANDOM";

export interface CategoryNotificationAction {
  account_id: number | string | null;
  target_type: "group" | "uid" | "friend";
  target_id?: string;
  target_uid?: string;
  target_label?: string;
  message: string;
  disable_reminder_chatbot?: boolean;
  mention?: {
    all?: boolean;
    uids?: string[];
  };
}

export interface ChatbotCategory {
  id: number;
  chatbot?: number;
  chatbot_id?: number;
  name: string;
  color?: string | null;
  description?: string | null;
  is_active?: boolean;
  disable_friend_chatbot?: boolean;
  disable_reminder_chatbot?: boolean;
  notification_actions?: CategoryNotificationAction[];
  created_at?: string;
  updated_at?: string;
}

export interface TrainingImage {
  id: number;
  media?: number;
  url?: string;
  file?: string;
  uploaded_at?: string;
  created_at?: string;
}

export interface TrainingDataItem {
  id: number;
  chatbot?: number;
  category?: ChatbotCategory | null;
  category_id?: number | null;
  question: string;
  answer?: string | null;
  image_send_mode?: TrainingImageSendMode | string;
  images?: TrainingImage[];
  training_images?: Array<number | string>;
  is_auto_harvested?: boolean;
  lead_context?: string | null;
  action_tag?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ChatbotInstance {
  id: number;
  user?: number;
  name: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  zalo_accounts?: string[];
  zalo_account_keys?: string[];
  categories?: ChatbotCategory[];
  training_data?: Array<{ id: number } | TrainingDataItem>;
  special_case_configs?: SpecialCaseConfig[];
  miss_data_notification_actions?: CategoryNotificationAction[];
}

export interface ChatbotListResponse {
  count?: number;
  max_chatbots?: number;
  results?: ChatbotInstance[];
}

export interface ChatbotCopyResponse {
  success?: boolean;
  new_chatbot_id?: number;
  new_chatbot_name?: string;
  copied_categories?: number;
  copied_training_data?: number;
  copied_images?: number;
  message?: string;
  id?: number;
}

export interface CreateChatbotPayload {
  name: string;
  is_active?: boolean;
}

export interface UpdateChatbotPayload {
  name?: string;
  is_active?: boolean;
  miss_data_notification_actions?: CategoryNotificationAction[];
}

export interface AssignChatbotAccountsPayload {
  zalo_account_keys: string[];
}

export interface CreateTrainingDataPayload {
  chatbot_id: number;
  question: string;
  answer?: string;
  category_id?: number | null;
  image_send_mode?: TrainingImageSendMode;
  image_ids?: number[];
  training_images?: number[];
}

export interface UpdateTrainingDataPayload {
  question?: string;
  answer?: string;
  category_id?: number | null;
  image_send_mode?: TrainingImageSendMode;
  image_ids?: number[];
  training_images?: number[];
}

export interface TrainingImagesListResponse {
  success?: boolean;
  max_upload?: number;
  count?: number;
  results?: TrainingImage[];
}

export interface CreateCategoryPayload {
  chatbot_id: number;
  name: string;
  color?: string;
  description?: string;
  is_active?: boolean;
  notification_actions?: CategoryNotificationAction[];
  disable_friend_chatbot?: boolean;
  disable_reminder_chatbot?: boolean;
}

export interface UpdateCategoryPayload {
  name?: string;
  color?: string;
  description?: string;
  is_active?: boolean;
  notification_actions?: CategoryNotificationAction[];
  disable_friend_chatbot?: boolean;
  disable_reminder_chatbot?: boolean;
}

export interface SpecialCaseType {
  value: string;
  label: string;
  description?: string;
  supports_keywords?: boolean;
}

export interface SpecialCaseConfig {
  id: number;
  chatbot: number;
  case_type: string;
  case_type_display?: string;
  is_active: boolean;
  auto_reply: string;
  keywords: string[];
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface SpecialCaseConfigPayload {
  chatbot_id?: number;
  chatbot?: number;
  case_type: string;
  is_active: boolean;
  auto_reply: string;
  keywords: string[];
  metadata?: Record<string, unknown>;
}

export interface ChatbotPlaceholder {
  placeholder: string;
  description: string;
  supported_platforms?: Array<"zalo" | "fb_messenger">;
}

export interface ReminderGlobalConfig {
  id?: number;
  chatbot?: number;
  is_active: boolean;
  is_loop_enabled: boolean;
  start_time: string;
  end_time: string;
  excluded_category_ids?: number[];
  excluded_categories?: number[];
  excluded_special_case_ids?: number[];
  excluded_special_cases?: number[];
  created_at?: string;
  updated_at?: string;
}

export interface ReminderMessageData {
  id: number;
  config?: number;
  message_text: string;
  created_at?: string;
}

export interface ReminderImageData {
  id: number;
  config?: number;
  media: number;
  url?: string;
  uploaded_at?: string;
}

export interface ReminderTimeConfig {
  id: number;
  chatbot?: number;
  delay_minutes: number;
  is_active: boolean;
  image_send_mode: ReminderImageSendMode;
  is_exclude_enabled: boolean;
  messages?: string[];
  images?: number[];
  messages_data?: ReminderMessageData[];
  images_data?: ReminderImageData[];
  created_at?: string;
  updated_at?: string;
}

export interface ReminderTimeConfigPayload {
  chatbot_id?: number;
  chatbot?: number;
  delay_minutes: number;
  is_active: boolean;
  image_send_mode: ReminderImageSendMode;
  is_exclude_enabled: boolean;
  messages: string[];
  images: number[];
}

export interface ReminderTimeConfigsResponse {
  count?: number;
  max_time_configs?: number;
  max_messages_per_config?: number;
  max_images_per_config?: number;
  results?: ReminderTimeConfig[];
}

export type ChatbotDetailTab =
  | "training"
  | "categories"
  | "images"
  | "special-cases"
  | "reminders"
  | "settings";

export const CHATBOT_MAX_INSTANCES = 10;
export const CHATBOT_MAX_IMAGES = 200;
export const CHATBOT_MAX_IMAGE_SIZE_MB = 10;
export const CHATBOT_MAX_KEYWORDS = 300;
export const CHATBOT_MAX_KEYWORD_LENGTH = 50;
export const CHATBOT_MAX_TIME_CONFIGS = 10;
export const CHATBOT_MAX_REMINDER_MESSAGES = 10;
export const CHATBOT_MAX_REMINDER_IMAGES = 5;
export const TRAINING_QUESTION_MAX_LENGTH = 500;
export const TRAINING_ANSWER_MAX_LENGTH = 4000;
