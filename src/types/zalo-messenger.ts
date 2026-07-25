import type { SentByPayload } from "@/types/team-collaboration";

/** Tài khoản Zalo dùng cho messenger — GET /api/account/?scope=messenger */
export interface MessengerAccount {
  id: number;
  avatar?: string | null;
  name?: string | null;
  new_message?: boolean;
  uid?: string | null;
  updated_time?: string | number | null;
  user_name?: string | null;
  pinning?: boolean;
  checkpoint?: boolean;
  /** Nick bật chatbot — header chat 1-1 hiện switch theo bạn */
  is_chatbot?: boolean;
  chatbot_disabled_friend_uids?: string[];
}

export interface MessengerFriend {
  id: number;
  uid?: string | null;
  globalId?: string | null;
  name?: string | null;
  avatar?: string | null;
  gender?: string;
  phone_number?: string;
  /** SSOT từ BE — 0 none · 1 bạn · 2 đã gửi · 3 nhận lời mời */
  relation_status?: 0 | 1 | 2 | 3;
  is_friend?: boolean;
  is_waiting?: boolean;
  is_request_sent?: boolean;
}

export interface MessengerGroup {
  id: number;
  uid?: string | null;
  globalId?: string | null;
  name?: string | null;
  avt?: string | null;
}

export type MessengerConversationType = "friend" | "group";

export interface MessengerCategoryLabel {
  id: number;
  name?: string | null;
  color?: string | null;
}

/** GlobalConversationModel.id — dùng cho mọi API/WS */
export interface MessengerConversation {
  id: number;
  account: number;
  conversation_type?: MessengerConversationType;
  name?: string | null;
  avatar?: string | null;
  updated_time?: string | number | null;
  new_message?: boolean;
  pinning?: boolean;
  note?: string | null;
  friend?: MessengerFriend | null;
  group?: MessengerGroup | null;
  category_message?: Array<MessengerCategoryLabel | number>;
}

export interface MessengerConversationPosition {
  id: number;
  global_conversation_id: number;
  position: number;
  current_page: number;
  total_pages: number;
  page_size: number;
  total_conversations: number;
}

export interface MessengerPaginatedLinks {
  next?: string | null;
  previous?: string | null;
}

export interface MessengerConversationPage {
  results: MessengerConversation[];
  links?: MessengerPaginatedLinks;
  count?: number;
  total_pages?: number;
}

/** Raw Zalo payload từ API/WS */
export interface RawZaloMessage {
  msgId?: string;
  msgType?: string;
  uidFrom?: string;
  idTo?: string;
  content?: unknown;
  ts?: number | string;
  cliMsgId?: string;
  quote?: unknown;
  mention?: unknown[];
  actionId?: string;
  conversation_id?: number;
  sent_by?: SentByPayload | null;
  [key: string]: unknown;
}

export interface MessengerMessageAttachment {
  href?: string;
  thumb?: string;
  title?: string;
  action?: string;
  description?: string;
  /** Thời lượng voice/video (ms) */
  durationMs?: number;
  /** share.file — phần mở rộng từ content.params */
  fileExt?: string;
  fileSizeBytes?: number;
  /** share.file — video / image / file (CDN Zalo thường trả attachment download) */
  fileKind?: "video" | "image" | "file";
  /** Link CDN — mở sẽ tải file, không stream inline */
  downloadOnly?: boolean;
}

/** Một ô trong album ảnh/video Zalo (group_layout_id) */
export interface MessengerGroupMediaItem {
  idInGroup: number;
  msgType: string;
  href?: string;
  thumb?: string;
  durationMs?: number;
  msgId?: string;
}

export interface MessengerGroupMedia {
  groupLayoutId: string | number;
  totalItems: number;
  items: MessengerGroupMediaItem[];
}

/** Metadata group layout từ content.params / extraData */
export interface MessengerGroupLayoutMeta {
  groupLayoutId: string | number;
  idInGroup: number;
  totalItems: number;
  durationMs?: number;
}

export interface MessengerMessageQuote {
  id?: string | number;
  ownerId?: string;
  msg?: string;
  attach?: string;
  fromD?: string | null;
  cliMsgId?: string;
  globalMsgId?: string;
}

export interface DisplayMessage {
  id?: string | number;
  msgId?: string;
  cliMsgId?: string;
  clientMsgId?: string;
  msgType?: string;
  uidFrom?: string;
  idTo?: string;
  ts?: number | string;
  conversation_id?: number;
  text_message?: Array<{ text?: unknown }>;
  attachments?: MessengerMessageAttachment[];
  sticker?: Array<{ id?: string | number; catId?: string | number }>;
  quote?: MessengerMessageQuote[];
  reaction?: Array<{ content?: string }>;
  undo?: Array<{ content?: string }>;
  /** WS/API chat.undo — giữ bubble, UI “đã thu hồi” (không xóa tin gốc) */
  recalled?: boolean;
  _optimistic?: boolean;
  _status?: "sending" | "sent" | "failed";
  _retryData?: SendMessagePayload;
  /** Người gửi thực tế — outbound team audit (CARE 2 §4) */
  sent_by?: SentByPayload | null;
  /** Album ảnh/video gộp theo group_layout_id */
  groupMedia?: MessengerGroupMedia;
  /** Metadata thô — dùng khi gộp album lúc render */
  _groupLayout?: MessengerGroupLayoutMeta;
}

export interface MessengerMessagePage {
  results: RawZaloMessage[];
  links?: MessengerPaginatedLinks;
  count?: number;
  next?: string | null;
  previous?: string | null;
}

export interface MessengerAccountWsBadge {
  id: number;
  uid?: string;
  globalId?: string;
  status: boolean;
}

export interface NewGlobalUpdatePayload {
  type: "new_global_update";
  conversations?: MessengerConversation[];
  message_details?: RawZaloMessage[];
  account?: MessengerAccountWsBadge | null;
}

export interface MessageAckPayload {
  type: "message_ack";
  clientMsgId?: string;
  id_conversation?: number;
  status?: string;
  success?: boolean;
  result?: unknown;
}

/** Response WS cho reaction / sticker / forward / block — `type: message` */
export interface WsActionMessagePayload {
  type: "message";
  command?: string;
  success?: boolean;
  status?: string;
  requestId?: string;
  id_conversation?: number;
  result?: {
    success?: boolean;
    error_code?: number;
    message?: string;
  };
  error?: string;
}

export type MessengerConversationFilter = "all" | "unread" | "friend" | "group";

export type MessengerMobilePanel = "accounts" | "conversations" | "chat";

export type MessengerChatType =
  | "send-message"
  | "send-file"
  | "quote"
  | "share-photo"
  | "share-video"
  | "share-file"
  | "share-link"
  | "share-product"
  | "mention-all"
  | "mentions"
  | "send-sticker"
  | "forward-video"
  | "forward-album"
  | "send-message-phone"
  | "send-message-uid"
  | "send-reaction-to-group"
  | "send-reaction-to-uid"
  | "block-friend"
  | "reset-unread-count";

/** Poll /api/group/create/result — BE trả task_status + result (không phải status + data). */
export interface MessengerCreateGroupTaskResult {
  success?: boolean;
  message?: string;
  error_type?: string;
  groupId?: string | number;
  globalId?: string;
  name?: string;
  avt?: string;
  totalMember?: number;
  creatorId?: string;
  link_group?: string;
  id_conversation?: number;
}

export interface MessengerCreateGroupResult {
  /** legacy */
  status?: string;
  task_status?: string;
  message?: string;
  data?: { id_conversation?: number };
  result?: MessengerCreateGroupTaskResult;
}

export interface MessengerStickerItem {
  id: string | number;
  catId?: string | number;
  thumb?: string | null;
  url?: string | null;
  name?: string | null;
}

export interface MessengerMentionInfo {
  pos: number;
  len: number;
  uid: string;
  type: number;
}

export interface MessengerFastReply {
  id: number;
  account: number;
  title: string;
  content: string;
  image: string | null;
  command: string;
}

export const FAST_REPLY_CONTENT_MAX = 2200;

export interface FastReplyCreateBody {
  id_account: number;
  title: string;
  content?: string;
  image?: string;
  command?: string;
}

export interface FastReplyUpdateBody {
  title?: string;
  content?: string;
  image?: string;
  command?: string;
}

export interface FastReplyBulkDeleteBody {
  ids: number[];
}

export interface MessengerAttachmentDraft {
  link: string;
  name: string;
  isImage: boolean;
}

export interface SendMessagePayload {
  id_account: number;
  id_conversation?: number;
  message: string;
  chat_type: MessengerChatType;
  clientMsgId: string;
  attachment?: string | null;
  message_details?: Record<string, unknown> | null;
  mention_info?: MessengerMentionInfo[];
  file_name?: string;
  phone_number?: string | null;
}