export interface ZaloAccountProxy {
  id?: number;
  proxy?: string;
  host?: string;
  port?: string | number;
  username?: string | null;
  password?: string | null;
  status?: boolean;
}

export interface ZaloAccount {
  id: number;
  avatar?: string | null;
  name?: string | null;
  /** Cookie webSession — dùng cho Zalo Video Creator API */
  webSession?: string | null;
  phone_number?: string | null;
  note?: string | null;
  checkpoint?: boolean;
  is_chatbot?: boolean;
  is_chatbot_reaction_enabled?: boolean;
  chatbot_disabled_friend_uids?: string[];
  disable_message?: boolean;
  proxy?: ZaloAccountProxy | null;
}

export interface ZaloAccountsListResponse {
  results?: ZaloAccount[];
  count?: number;
}

export interface EditZaloAccountPayload {
  id: number;
  note?: string;
  id_proxy?: number | string;
  password?: string;
}

export interface ZaloAccountCheckTaskResponse {
  id_task?: string | number;
  status?: string;
}

export interface ZaloAccountCheckResultItem {
  id: number;
  status: boolean;
}

export interface ZaloAccountCheckResultResponse {
  /** Trạng thái task từ /check-account/result */
  task_status?: string;
  /** Legacy — một số response cũ dùng `status` */
  status?: string;
  message?: string;
  error?: string;
  result?: ZaloAccountCheckResultItem[];
}

export interface ToggleChatbotPayload {
  id_account: number;
  is_chatbot: boolean;
  is_chatbot_reaction_enabled?: boolean;
}

export interface ToggleMessageListenerAllPayload {
  all: true;
  disable_message: boolean;
}

export interface ToggleMessageListenerAccountPayload {
  id_account: number;
  disable_message: boolean;
}

export type ToggleMessageListenerPayload =
  | ToggleMessageListenerAllPayload
  | ToggleMessageListenerAccountPayload;

export interface ZaloAccountGroup {
  id: number;
  uid: string;
  name: string;
  avt?: string;
  total_member?: string | number;
  link_group?: string;
  is_joined?: boolean;
  is_blocked_chat?: boolean;
  is_miss_data_notification?: boolean;
  miss_data_notification_config_id?: number;
}

export interface ZaloGroupMember {
  id: number;
  friend: {
    id: number;
    uid: string;
    name: string;
    avatar?: string | null;
    avt?: string | null;
    phone_number?: string | null;
  };
  is_admin?: boolean;
  is_creator?: boolean;
}