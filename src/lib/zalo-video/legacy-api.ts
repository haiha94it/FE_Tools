import { API_BASE_URL, API_AUTH, API_ZALO_ACCOUNT } from "@/config/api";

/** Tương thích `API_CHANNEL_VIDEO` ZaloCN — giữ nguyên tên key */
export const API_CHANNEL_VIDEO = {
  API_LOGIN_CHANNEL: "/api/channel/login",
  API_LOGIN_CHANNEL_RESULTS: "/api/channel/login/result",
  API_INFOR_CHANNEL: "/api/channel/info",
  API_RENEW_INFOR: "/api/channel/renew",
  API_RENEW_INFOR_RS: "/api/channel/renew/result",
  API_RENEW_GENERAL: "/api/channel/renew-general",
  API_RENEW_GENERAL_RS: "/api/channel/renew-general/result",
  API_GET_PHONE_CHANNEL: "/api/channel/phone",
  API_GET_PHONE_CHANNEL_RS: "/api/channel/phone/result",
  API_ADD_PHONE_CHANNEL: "/api/channel/phone/add",
  API_ADD_PHONE_CHANNEL_RS: "/api/channel/phone/add/result",
  API_CONFIRM_PHONE_CHANNEL: "/api/channel/phone/confirm",
  API_CONFIRM_PHONE_CHANNEL_RS: "/api/channel/phone/confirm/result",
  API_DELETE_PHONE_CHANNEL: "/api/channel/phone/delete",
  API_DELETE_PHONE_CHANNEL_RS: "/api/channel/phone/delete/result",
  API_POST_VIDEO_CHANNEL: "/api/channel/video/post",
  API_POST_VIDEO_CHANNEL_RS: "/api/channel/video/post/result",
  API_UPLOAD_FILE_VIDEO: "/api/upload/zalo-video",
  API_GET_VIDEO_CHANNEL: "/api/channel/video",
  API_RENEW_LIST_VIDEO: "/api/channel/video/renew",
  API_RENEW_LIST_VIDEO_RS: "/api/channel/video/renew/result",
  API_PIN_VIDEO: "/api/channel/video/pin",
  API_PIN_VIDEO_RS: "/api/channel/video/pin/result",
  API_LOCK_COMMENT: "/api/channel/video/lock_comment",
  API_LOCK_COMMENT_RS: "/api/channel/video/lock_comment/result",
  API_REMOVE_VIDEO: "/api/channel/video/remove",
  API_REMOVE_VIDEO_RS: "/api/channel/video/remove/result",
  API_GET_COMMENT_CHANNEL: "/api/channel/comment",
  API_POST_COMMENT_CHANNEL: "/api/channel/comment/post",
  API_POST_COMMENT_CHANNEL_RS: "/api/channel/comment/post/result",
  API_REPLY_COMMENT_CHANNEL: "/api/channel/comment/reply",
  API_REPLY_COMMENT_CHANNEL_RS: "/api/channel/comment/reply/result",
  API_LIKE_COMMENT_CHANNEL: "/api/channel/comment/like",
  API_LIKE_COMMENT_CHANNEL_RS: "/api/channel/comment/like/result",
  API_RENEW_COMMENT: "/api/channel/comment/renew",
  API_RENEW_COMMENT_RS: "/api/channel/comment/renew/result",
  API_UPDATE_SETTING_PHONE_CHANNEL: "/api/channel/update-settings",
  API_UPDATE_SETTING_PHONE_CHANNEL_RS: "/api/channel/update-settings/result",
  API_DOWLOAD_VIDEO_CHANNEL: "/api/channel/download-video",
  API_DOWLOAD_VIDEO_CHANNEL_RS: "/api/channel/download-video/result",
  API_INSTRUCTIONS_VIDEO_CHANNEL: "/api/popup/instructions/create-or-edit",
  API_GET_INSTRUCTIONS_CHANNEL: "/api/popup/instructions/get",
  API_DECREE_GET: "/api/popup/decree/get",
  API_DECREE_CREATE: "/api/popup/decree/create-or-edit",
  API_PIN_COMMENT: "/api/channel/comment/pin",
  API_PIN_COMMENT_RS: "/api/channel/comment/pin/result",
  API_DELETE_COMMENT: "/api/channel/comment/delete",
  API_DELETE_COMMENT_RS: "/api/channel/comment/delete/result",
} as const;

export const API_URL = API_BASE_URL;

export const API_ROUTES = {
  GET_ACC_FB: API_ZALO_ACCOUNT.ACCOUNTS,
  GET_INFO_UERS: API_AUTH.ME,
  LOGIN_API: API_AUTH.LOGIN,
} as const;

export const VIDEO_CREATOR_BASE = "/zalo-campaigns/post-video";