/** Payload đăng video lên kênh Zalo */
export interface PostZaloVideoPayload {
  id_account: number;
  thumbnail: string;
  video: string;
  caption: string;
  publish_time: string;
}

export interface ZaloVideoUploadResponse {
  file: string;
}

export interface ZaloVideoTaskResultData {
  status?: boolean;
  error?: string;
  messenger?: string;
  message?: string;
  path?: string;
  /** Mô tả/title TikTok (download-video) — FE đổ caption */
  title?: string;
  caption?: string;
  link?: string;
}

/** Payload `result` trong envelope task mới */
export interface ZaloVideoTaskInnerResult {
  success?: boolean;
  message?: string;
  error_type?: string;
  status?: boolean;
  error?: string;
  messenger?: string;
  path?: string;
  title?: string;
  caption?: string;
  link?: string;
}

export interface ZaloVideoTaskResultResponse {
  /** Envelope mới */
  task_status?: string;
  /** Legacy */
  status?: string;
  data?: ZaloVideoTaskResultData;
  result?: ZaloVideoTaskInnerResult | ZaloVideoTaskResultData;
  error?: string;
  message?: string;
}

export interface DownloadZaloVideoPayload {
  link: string;
}

export interface ZaloChannelDailyStats {
  views?: number;
  likes?: number;
  shares?: number;
  comments?: number;
}

export interface ZaloChannelGeneralStats {
  start?: string;
  end?: string;
  views?: number;
  likes?: number;
  shares?: number;
  comments?: number;
  followers?: number;
}

export interface ZaloChannelInfo {
  id?: number;
  channel_id?: string | number;
  name?: string;
  avatar?: string;
  bio?: string;
  display_name?: string;
  videos?: number;
  followers?: number;
  likes?: number;
  channel_daily?: ZaloChannelDailyStats;
  channel_general?: ZaloChannelGeneralStats;
}

export type RenewGeneralType = "seven_day" | "fourteen_day" | "thirty_day";

export interface VideoThumbnailItem {
  time: number;
  thumb: string;
}

export interface DataFbAccount {
  id: number;
  name?: string | null;
  avatar?: string | null;
  checkpoint?: boolean;
  webSession?: string | null;
  proxy?: { proxy?: string } | null;
}

export type VideoCreatorTab =
  | "analytics"
  | "video-post"
  | "video-manager"
  | "comment-manager"
  | "playlist-manager"
  | "channel"
  | "category"
  | "infor";

export interface ZaloPublicVideoItem {
  id: string | number;
  thumbnail?: string;
  description?: string;
  title?: string;
  /** HLS signed URL (m3u8) — list + analytics */
  streamUrl?: string;
  stream_url?: string;
  views?: number;
  likes?: number;
  comments?: number;
  lock_comment?: boolean;
  isPinned?: boolean;
  is_pinned?: boolean;
  pinned?: boolean;
  isContactEnabled?: boolean;
  is_contact_enabled?: boolean;
  contactEnabled?: boolean;
  /** Unix s/ms — giờ hẹn đăng (scheduled-list thường publishedTime) */
  publishedTime?: number;
  published_time?: number;
  publishTime?: number;
  publish_time?: number;
  publicTime?: number;
  public_time?: number;
  scheduleTime?: number;
  schedule_time?: number;
  scheduledTime?: number;
  scheduled_time?: number;
  created_time?: number;
  createdTime?: number;
  status?: string;
}

export interface ZaloPublicVideoListResponse {
  count?: number;
  results?: ZaloPublicVideoItem[];
  next?: string | null;
  previous?: string | null;
}

export interface ZaloCommentOwnerInfo {
  avatar?: string;
  name?: string;
}

export interface ZaloCommentOwner {
  info?: ZaloCommentOwnerInfo;
}

export interface ZaloCommentVideoRef {
  id?: string | number;
  thumbnail?: string;
  /** Mô tả / title — deep-link từ comment-manager */
  description?: string;
  title?: string;
}

export interface ZaloCommentParent {
  owner?: ZaloCommentOwner;
  content?: string;
  isRepliedByAuthor?: boolean;
  createdTime?: number;
  created_time?: number;
}

export interface ZaloPublicCommentItem {
  id: string | number;
  content?: string;
  video?: ZaloCommentVideoRef;
  parent?: ZaloCommentParent;
  owner?: ZaloCommentOwner;
  is_pinned?: boolean;
  isPinned?: boolean;
  isLikedByAuthor?: boolean;
  isRepliedByAuthor?: boolean;
  /** Unix seconds (Zalo) */
  createdTime?: number;
  created_time?: number;
  time?: number;
  timestamp?: number;
  likeCount?: number;
  totalLike?: number;
  likes?: number;
  replyCount?: number;
  totalReply?: number;
  stats?: { likes?: number; replies?: number };
}

/** Cursor load-more Zalo comments/list */
export interface ZaloCommentListCursor {
  prevCmtId: string;
  prevVidId?: string | null;
  lastIndex: number;
}

export interface ZaloPublicCommentListResponse {
  count?: number;
  results?: ZaloPublicCommentItem[];
  hasMore?: boolean;
  nextCursor?: ZaloCommentListCursor | null;
  next?: string | null;
  previous?: string | null;
}

export interface ZaloPlaylistItem {
  id: string | number;
  title?: string;
  videosTotal?: number;
  privacy?: number;
  createdTime?: number;
}

export interface ZaloPlaylistListResponse {
  count?: number;
  results?: ZaloPlaylistItem[];
}

export interface ZaloPlaylistVideoItem extends ZaloPublicVideoItem {
  privacy?: number;
  shares?: number;
  lock_comment?: boolean;
}

export interface ZaloPageInfoData {
  name?: string;
  description?: string;
  thumbnail?: string;
  showed?: boolean;
}

export interface ZaloPageInfoResponse {
  error?: number | string;
  msg?: string;
  data?: ZaloPageInfoData;
}

export interface ZaloStoreProductItem {
  id: string | number;
  name?: string;
  link?: string;
  thumbnails?: string[];
  createdTime?: number;
  privacy?: number;
  processing?: boolean;
  hasRejected?: boolean;
  openedOutApp?: string;
}

export interface ZaloLabelCtaProduct {
  thumbnail?: string;
  id?: string | number;
}

export interface ZaloLabelCta {
  ctaType?: string;
  customText?: number;
  products?: ZaloLabelCtaProduct[];
}

export interface ZaloCategoryVideoItem {
  id: string | number;
  thumbnail?: string;
  description?: string;
  labelCtas?: ZaloLabelCta[];
}

export interface ZaloChannelPhoneStatus {
  status?: boolean;
}