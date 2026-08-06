import { env } from "@/config/env";
import { buildCampaignApiPaths } from "@/lib/campaign-api-paths";

/** Base URL API chính */
export const API_BASE_URL = env.NEXT_PUBLIC_API_URL;

/** Base URL Care — Zalo messenger, tài khoản, nhóm */
export const CARE_API_BASE_URL = env.NEXT_PUBLIC_CARE_API_URL;

/** Auth — đồng bộ ZaloCN (login/logout/refresh). /accounts dùng token login, không login-care */
/** Team collaboration — manager gán nick + quyền chiến dịch cho nhân viên */
export const API_TEAM = {
  EMPLOYEE_ACCOUNT_ASSIGNMENTS: "/api/users/employee-account-assignments",
  EMPLOYEE_ACCOUNT_ASSIGNMENTS_SET: "/api/users/employee-account-assignments/set",
  MY_ACCOUNT_ASSIGNMENTS: "/api/users/my-account-assignments",
  EMPLOYEE_CAMPAIGN_PERMISSIONS: "/api/users/employee-campaign-permissions",
  EMPLOYEE_CAMPAIGN_PERMISSIONS_SET: "/api/users/employee-campaign-permissions/set",
  MY_CAMPAIGN_PERMISSIONS: "/api/users/my-campaign-permissions",
  /** Danh sách NV của manager đăng nhập */
  GET_EMPLOYEES: "/api/users/get-employees",
  CREATE_EMPLOYEE: "/api/users/create-employee",
  EDIT_EMPLOYEE: "/api/users/edit-employee",
  DELETE_EMPLOYEE: "/api/users/delete-employee",
  ACTIVE_EMPLOYEE: "/api/users/active-employee",
} as const;

export const TEAM_EMPLOYEES_BASE = "/team/employees";

export const API_AUTH = {
  LOGIN: "/api/users/login",
  /** Dự phòng — ZaloCN /accounts không dùng; chỉ khi module cần token Care riêng */
  LOGIN_CARE: "/api/auth/login-care",
  REFRESH: "/api/token/refresh/",
  LOGOUT: "/api/users/logout",
  ME: "/api/users/me",
  REGISTER: "/api/register/create",
  /** Kích hoạt tài khoản qua link email — GET ?token= */
  ACTIVATE: "/api/register/activate",
  REGISTER_RESULT: "/api/register/result",
  RESET_PASSWORD: "/api/users/reset-password/create",
  ACCEPT_TERMS: "/api/users/accept-terms",
} as const;

/** Popup / thông báo hệ thống */
export const API_POPUP = {
  REGISTER: "/api/popup/register/get",
  REGISTER_EDIT: "/api/popup/register/create-or-edit",
  DECREE: "/api/popup/decree/get",
  DECREE_EDIT: "/api/popup/decree/create-or-edit",
  TERM: "/api/popup/term/get",
  TERM_EDIT: "/api/popup/term/create-or-edit",
  ALERT: "/api/popup/alert/get",
  ALERT_EDIT: "/api/popup/alert/create-or-edit",
  ALERT_DELETE: "/api/popup/alert/delete",
  EXPIRATION: "/api/popup/expiration/get",
  EXPIRATION_EDIT: "/api/popup/expiration/create-or-edit",
  LOGO: "/api/popup/logo/get",
  LOGO_EDIT: "/api/popup/logo/create-or-edit",
  COMMUNITY: "/api/popup/community/get",
  COMMUNITY_EDIT: "/api/popup/community/create-or-edit",
} as const;

export const ADMIN_SETTINGS_BASE = "/admin/settings";

/** Care token refresh */
export const API_CARE_AUTH = {
  REFRESH: "/api/token/refresh/",
} as const;

/** Proxy Zalo — backend chính */
export const API_ZALO_PROXY = {
  LIST: "/api/proxy/",
  ADD: "/api/proxy/add",
  EDIT: "/api/proxy/edit",
  DELETE: "/api/proxy/delete",
  CHECK: "/api/proxy/check",
  CHECK_RESULT: "/api/proxy/check/result",
} as const;

/** Bạn bè Zalo */
export const API_ZALO_FRIEND = {
  LIST: "/api/friend/",
  /** Lấy avatar/chi tiết từ danh sách bạn bè (type=simple) — ZaloCN fetchs */
  FETCH_DETAILS: "/api/friend/fetchs",
  SCAN: "/api/friend/get",
  UNFRIEND: "/api/friend/unfriend",
  RECOMMEND_SCAN: "/api/friend/friend-recommend/get",
  RECOMMEND_ACCEPT: "/api/friend/friend-recommend/accept",
  RECOMMEND_REMOVE: "/api/friend/friend-recommend/remove",
  SENT_REQUEST_SCAN: "/api/friend/sent-request/get",
  SENT_REQUEST_SHOW: "/api/friend/sent-request/show",
  SENT_REQUEST_REMOVE: "/api/friend/sent-request/remove",
  ADD_FRIEND: "/api/friend/add-friend",
} as const;

/**
 * @deprecated Campaign add-friend đã gộp vào mess-phone-number (BE xóa route).
 * Giữ hằng số path FE cũ để grep; không gọi API.
 */
export const ADD_FRIEND_CAMPAIGN_BASE = "/zalo-campaigns/add-friend";

/** Chiến dịch tham gia nhóm — /api/campaign/join-group/category/ */
export const API_ZALO_JOIN_GROUP_CAMPAIGN = buildCampaignApiPaths("join-group");

export const JOIN_GROUP_CAMPAIGN_BASE = "/zalo-campaigns/join-group";

/** Chiến dịch mời bạn bè tham gia nhóm — /api/campaign/invite-group/category/ */
export const API_ZALO_INVITE_JOIN_GROUP_CAMPAIGN =
  buildCampaignApiPaths("invite-group");

export const INVITE_JOIN_GROUP_CAMPAIGN_BASE = "/zalo-campaigns/invite-join-group";

/** Chiến dịch mời SĐT tham gia nhóm — /api/campaign/invite-phone-group/category/ */
export const API_ZALO_PHONE_INVITE_GROUP_CAMPAIGN =
  buildCampaignApiPaths("invite-phone-group");

export const PHONE_INVITE_GROUP_CAMPAIGN_BASE =
  "/zalo-campaigns/phone-number-invite-group";

/**
 * Picker nhóm chung multi-nick (dùng chung spam/invite/mess-member).
 * POST body: { id_accounts, keyword? } — không gắn prefix campaign con.
 * Path cũ .../spam-link-group|invite-phone-group/.../all-group/ đã bị BE xóa.
 */
export const API_CAMPAIGN_ALL_GROUP = "/api/campaign/all-group/";

/** Chiến dịch nhắn tin bạn bè — /api/campaign/mess-friend/category/ */
export const API_ZALO_SEND_MES_FR_CAMPAIGN =
  buildCampaignApiPaths("mess-friend");

export const SEND_MES_FR_CAMPAIGN_BASE = "/zalo-campaigns/send-mes-fr";

/** Chiến dịch nhắn tin SĐT — /api/campaign/mess-phone-number/category/ */
export const API_ZALO_SEND_MESS_PHONE_CAMPAIGN =
  buildCampaignApiPaths("mess-phone-number");

export const SEND_MESS_PHONE_CAMPAIGN_BASE =
  "/zalo-campaigns/send-mess-number-phone";

/** Chiến dịch nhắn tin vào nhóm — /api/campaign/mess-group/category/ */
export const API_ZALO_SEND_MES_GROUP_CAMPAIGN =
  buildCampaignApiPaths("mess-group");

export const SEND_MES_GROUP_CAMPAIGN_BASE = "/zalo-campaigns/send-mes-group";

/** Chiến dịch tương tác thành viên nhóm — /api/campaign/mess-member-group/category/ */
export const API_ZALO_SEND_MESS_MEMBER_GR_CAMPAIGN =
  buildCampaignApiPaths("mess-member-group");

export const SEND_MESS_MEMBER_GR_CAMPAIGN_BASE =
  "/zalo-campaigns/send-mess-member-gr";

/** Media tin nhắn đã lưu — REST resource (BE bỏ path …/show). */
export const API_MESSAGE_MEDIA = {
  VIDEO: "/api/message/video",
  videoDetail: (pk: number | string) => `/api/message/video/${pk}`,
  ALBUM: "/api/message/album",
  albumDetail: (pk: number | string) => `/api/message/album/${pk}`,
} as const;

/** Chúc mừng sinh nhật — /api/campaign/mess-birthday/ (results không có {id}) */
const MESS_BIRTHDAY_PATHS = buildCampaignApiPaths("mess-birthday");
export const API_ZALO_BIRTHDAY_CAMPAIGN = {
  ...MESS_BIRTHDAY_PATHS,
  GET: MESS_BIRTHDAY_PATHS.LIST,
  RESULTS: "/api/campaign/mess-birthday/results/",
  RUN_NOW: "/api/campaign/mess-birthday/run-now/",
  /** List media — alias `API_MESSAGE_MEDIA` (không còn `/show`) */
  LIST_VIDEOS: API_MESSAGE_MEDIA.VIDEO,
  LIST_ALBUMS: API_MESSAGE_MEDIA.ALBUM,
} as const;

export const MESSENGER_BIRTHDAY_BASE = "/zalo-campaigns/messenger-birthday";

/** Thông báo chiến dịch qua Zalo — đồng bộ ZaloCN /phone-noti */
export const API_ZALO_CAMPAIGN_NOTIFICATION = {
  GET: "/api/campaign/campaign-notification",
  SETUP: "/api/campaign/campaign-notification/setup",
  RESULT: "/api/campaign/campaign-notification/result",
} as const;

/** Tài nguyên — đồng bộ ZaloCN /resource */
export const API_ZALO_RESOURCE = {
  LIST: "/api/popup/resource/get",
  CREATE_OR_EDIT: "/api/popup/resource/create-or-edit",
  DELETE: "/api/popup/resource/delete",
  PRODUCT_LIST: "/api/popup/product-app/get",
  PRODUCT_CREATE_OR_EDIT: "/api/popup/product-app/create-or-edit",
  PRODUCT_DELETE: "/api/popup/product-app/delete",
} as const;

export const RESOURCE_BASE = "/resource";

/** Hướng dẫn sử dụng — đồng bộ API ZaloCN /huongdan, route chuẩn /guides */
export const API_ZALO_GUIDE = {
  LIST: "/api/popup/tutorial/get",
  CREATE_OR_EDIT: "/api/popup/tutorial/create-or-edit",
  DELETE: "/api/popup/tutorial/delete",
} as const;

export const GUIDES_BASE = "/guides";

/** Quản lý người dùng — đồng bộ ZaloCN /sep */
export const API_ZALO_USER_ADMIN = {
  LIST: "/api/users/get-all-account",
  LIST_ACTIVATIONS: "/api/register/activations",
  EXPORT: "/api/users/get-all-account/export",
  CREATE: "/api/users/create-manager",
  EDIT: "/api/users/edit-manager",
  DELETE: "/api/users/delete-manager",
  LOCK: "/api/users/lock-account",
  UNBLOCK: "/api/users/unblock-account",
  ACTIVITY_LOGS: "/api/users/activity-logs",
  RESET_PASS_LIST: "/api/users/reset-password/get",
  RESET_PASS: "/api/users/reset-password/reset",
  RESET_PASS_DELETE: "/api/users/reset-password/delete",
  CHANGE_PASSWORD: "/api/users/change-password",
  ACTIVATE: "/api/register/activate",
} as const;

export const ADMIN_USERS_BASE = "/admin/users";

/** Nhóm Zalo — đủ path quản trị nhóm (Care SettingGroups) */
export const API_ZALO_GROUP = {
  LIST: "/api/group/",
  /** Lấy avatar/chi tiết từ danh sách nhóm (type=simple) — ZaloCN fetchs */
  FETCH_DETAILS: "/api/group/fetchs",
  SHOW_MEMBER_LINK: "/api/group/show-member-link",
  SCAN: "/api/group/get",
  SCAN_RESULT: "/api/group/get/result",
  QUIT: "/api/group/quit",
  QUIT_RESULT: "/api/group/quit/result",
  GET_LINK: "/api/group/get/link",
  GET_LINK_RESULT: "/api/group/get/link/result",
  GET_MEMBER: "/api/group/get-member",
  GET_MEMBER_RESULT: "/api/group/get-member/result",
  GET_MEMBER_SHOW: "/api/group/get-member/show",
  CREATE: "/api/group/create",
  CREATE_RESULT: "/api/group/create/result",
  /** Sửa thông tin / quyền nhóm — giống Care */
  ADD_ADMIN: "/api/group/add-admin",
  ADD_ADMIN_RESULT: "/api/group/add-admin/result",
  REMOVE_ADMIN: "/api/group/remove-admin",
  REMOVE_ADMIN_RESULT: "/api/group/remove-admin/result",
  REMOVE_MEMBER: "/api/group/remove-member",
  REMOVE_MEMBER_RESULT: "/api/group/remove-member/result",
  INVITE_MEMBER: "/api/group/invite-member",
  INVITE_MEMBER_RESULT: "/api/group/invite-member/result",
  CHANGE_OWNER: "/api/group/change-owner",
  CHANGE_OWNER_RESULT: "/api/group/change-owner/result",
  CHANGE_NAME: "/api/group/change-name",
  CHANGE_NAME_RESULT: "/api/group/change-name/result",
  CHANGE_AVATAR: "/api/group/change-avatar",
  CHANGE_AVATAR_RESULT: "/api/group/change-avatar/result",
  GET_SETTING: "/api/group/get-group-setting",
  GET_SETTING_RESULT: "/api/group/get-group-setting/result",
  CHANGE_SETTING: "/api/group/change-group-setting",
  CHANGE_SETTING_RESULT: "/api/group/change-group-setting/result",
  LOCK_CHAT: "/api/group/lock-group-chat",
} as const;

/** Nhãn hội thoại — /api/message/category/ (§ fe_message_label_category.md) */
export const API_ZALO_LABEL = {
  LIST: "/api/message/category/",
  detail: (id: number | string) => `/api/message/category/${id}/`,
  members: (id: number | string) => `/api/message/category/${id}/members/`,
} as const;

/** Tài khoản Zalo — Care backend */
export const API_ZALO_ACCOUNT = {
  ACCOUNTS: "/api/account/",
  EDIT: "/api/account/edit",
  DELETE: "/api/account/delete",
  CHECK: "/api/account/check-account",
  CHECK_RESULT: "/api/account/check-account/result",
  TOGGLE_CHATBOT: "/api/account/toggle-chatbot",
  TOGGLE_MESSAGE_LISTENER: "/api/account/toggle-message-listener",
  CREATE_ACCOUNT_MANUAL: "/api/account/add",
  CREATE_ACCOUNT_MANUAL_RESULT: "/api/account/add/result",
  CHATBOT_DISABLED_FRIENDS: (accountId: number | string) =>
    `/api/account/${accountId}/chatbot-disabled-friends`,
} as const;

/** Zalo messenger — envelope API (contract 2026) */
export const API_ZALO_MESSENGER = {
  ACCOUNTS: "/api/account/",
  CONVERSATIONS: "/api/message/conversations",
  OPEN_CONVERSATION: "/api/message/conversations/open",
  GET_MESSAGES: "/api/message/get-message",
  NOTE: "/api/message/note",
  PIN_CONVERSATION: "/api/message/pin",
  PIN_ACCOUNT: "/api/message/pin/account",
  /** Tin nhắn nhanh — REST: GET list, POST create, PATCH/DELETE /{pk}, bulk DELETE */
  FAST_REPLY: "/api/message/fast-reply",
  UPLOAD_FILE: "/api/upload/file",
  STICKERS_SEARCH: "/api/message/stickers/search",
  STICKERS_SUGGEST: "/api/message/stickers/suggest",
  STICKERS_CATEGORY: "/api/message/stickers/category",
  STICKERS_DETAIL: "/api/message/stickers/detail",
  MARK_READ_ALL: "/api/message/mark-read",
} as const;

/** Upload chung */
export const API_UPLOAD = {
  FILE: "/api/upload/file",
  SERVER: "/api/upload/server",
} as const;

/** Kênh Zalo Video — đồng bộ ZaloCN API_CHANNEL_VIDEO */
export const API_CHANNEL_VIDEO = {
  LOGIN: "/api/channel/login",
  LOGIN_RESULT: "/api/channel/login/result",
  INFO: "/api/channel/info",
  RENEW: "/api/channel/renew",
  RENEW_RESULT: "/api/channel/renew/result",
  RENEW_GENERAL: "/api/channel/renew-general",
  RENEW_GENERAL_RESULT: "/api/channel/renew-general/result",
  POST_VIDEO: "/api/channel/video/post",
  POST_VIDEO_RESULT: "/api/channel/video/post/result",
  UPLOAD_VIDEO: "/api/upload/zalo-video",
  DOWNLOAD_VIDEO: "/api/channel/download-video",
  DOWNLOAD_VIDEO_RESULT: "/api/channel/download-video/result",
  RENEW_VIDEOS: "/api/channel/video/renew",
  RENEW_VIDEOS_RESULT: "/api/channel/video/renew/result",
  RENEW_COMMENT: "/api/channel/comment/renew",
  RENEW_COMMENT_RESULT: "/api/channel/comment/renew/result",
  PHONE: "/api/channel/phone",
  PHONE_RESULT: "/api/channel/phone/result",
  PHONE_ADD: "/api/channel/phone/add",
  PHONE_ADD_RESULT: "/api/channel/phone/add/result",
  PHONE_DELETE: "/api/channel/phone/delete",
  PHONE_DELETE_RESULT: "/api/channel/phone/delete/result",
  UPDATE_SETTINGS: "/api/channel/update-settings",
  UPDATE_SETTINGS_RESULT: "/api/channel/update-settings/result",
  INSTRUCTIONS_GET: "/api/popup/instructions/get",
  INSTRUCTIONS_EDIT: "/api/popup/instructions/create-or-edit",
} as const;

export const VIDEO_CREATOR_BASE = "/zalo-campaigns/post-video";

/**
 * Đồng thuận xử lý tin nhắn Zalo — Carev2_BE consent.urls
 * Base: /api/consent/
 * ChotCare chỉ proxy API user; cấu hình và duyệt nằm tại Manage.
 */
export const API_CONSENT = {
  STATUS: "/api/consent/message-processing/status/",
  TERMS: "/api/consent/message-processing/terms/",
  PREVIEW: "/api/consent/message-processing/preview/",
  SIGN: "/api/consent/message-processing/sign/",
  PDF: "/api/consent/message-processing/pdf/",
} as const;

/** Shop (cửa hàng Care2; Care1: minishop) — cover, category, product, cart, order */
export const API_ZALO_SHOP = {
  CATEGORY: "/api/shop/category",
  CATEGORY_CREATE: "/api/shop/category/create-or-update",
  CATEGORY_DELETE: "/api/shop/category/delete",
  CATEGORY_ACTIVATE: "/api/shop/category/activate",
  CATEGORY_DEACTIVATE: "/api/shop/category/deactivate",
  COVER: "/api/shop/cover",
  COVER_CREATE: "/api/shop/cover/create-or-update",
  SAMPLE_LINK: "/api/shop/cover/sample_link",
  PRODUCT: "/api/shop/product",
  PRODUCT_CREATE: "/api/shop/product/create-or-update",
  PRODUCT_DELETE: "/api/shop/product/delete",
  PRODUCT_ACTIVATE: "/api/shop/product/activate",
  PRODUCT_DEACTIVATE: "/api/shop/product/deactivate",
  PRODUCT_COPY: "/api/shop/product/copy",
  CART: "/api/shop/cart",
  CART_ADD: "/api/shop/cart/add-to-cart",
  CART_UPDATE: "/api/shop/cart/update-quantity",
  ORDER: "/api/shop/order",
  ORDER_CREATE: "/api/shop/order/create",
  ORDER_CONFIRM: "/api/shop/order/confirm",
  ORDER_CANCEL: "/api/shop/order/cancel",
  ORDER_DELETE: "/api/shop/order/delete",
  ORDER_UPDATE: "/api/shop/order/update",
  ORDER_NOTIFICATION_ACCOUNT: "/api/shop/order/notification-account",
  ORDER_SUCCESS_MESSAGE: "/api/shop/order/order-successful-message",
  ORDER_CONFIRM_MESSAGE: "/api/shop/order/confirm-message",
  COUPON: "/api/shop/coupon",
  COUPON_CREATE: "/api/shop/coupon/create",
  COUPON_DELETE: "/api/shop/coupon/delete",
  CITY: "/api/shop/city",
  /** Import Vietnam_province_new.json → DB (auth) */
  CITY_LOAD: "/api/shop/city/load",
  WARD: "/api/shop/ward",
  DISTRICT: "/api/shop/district",
  DOMAIN: "/api/users/domain",
  DOMAIN_EDIT: "/api/users/domain/edit",
  LINK_QR_ZALO: "/api/shop/get-link-zalo",
  PRODUCT_REVIEW: "/api/shop/product-review/all",
} as const;

export const SHOP_ADMIN_BASE = "/shop";
export const STORE_PUBLIC_BASE = "/store";

/** Chatbot AI / kịch bản Zalo — đồng bộ MANAGE_CN API_CHATBOT */
export const API_CHATBOT = {
  CHATBOTS: "/api/chatbot/chatbots",
  CHATBOT_COPY: "/api/chatbot/chatbots/copy",
  CHATBOT_DETAIL: (id: number | string) => `/api/chatbot/chatbots/${id}`,
  CHATBOT_ASSIGNMENTS: (id: number | string) =>
    `/api/chatbot/chatbots/${id}/assignments`,
  CATEGORIES: "/api/chatbot/categories",
  CATEGORY_DETAIL: (id: number | string) => `/api/chatbot/categories/${id}`,
  TRAINING_DATA: "/api/chatbot/training-data",
  TRAINING_DATA_SYNC_EMBEDDINGS: "/api/chatbot/training-data/sync-embeddings",
  TRAINING_DATA_DETAIL: (id: number | string) =>
    `/api/chatbot/training-data/${id}`,
  TRAINING_DATA_EXPORT: "/api/chatbot/training-data/export",
  TRAINING_DATA_CLEAR: "/api/chatbot/training-data/clear",
  TRAINING_IMAGES: "/api/chatbot/training-images",
  TRAINING_IMAGE_DETAIL: (id: number | string) =>
    `/api/chatbot/training-images/${id}`,
  PLACEHOLDERS: "/api/chatbot/placeholders",
  SPECIAL_CASE_TYPES: "/api/chatbot/special-case-types",
  SPECIAL_CASE_CONFIGS: "/api/chatbot/special-case-configs",
  SPECIAL_CASE_CONFIG_DETAIL: (id: number | string) =>
    `/api/chatbot/special-case-configs/${id}`,
  REMINDER_GLOBAL: "/api/chatbot/reminders/global-configs",
  REMINDER_TIME_CONFIGS: "/api/chatbot/reminders/time-configs",
  REMINDER_TIME_CONFIG_DETAIL: (id: number | string) =>
    `/api/chatbot/reminders/time-configs/${id}`,
  REMINDER_COPY: "/api/chatbot/reminders/copy",
  TEST_MESSAGE: "/api/chatbot/test-message",
} as const;

export const CHATBOTS_BASE = "/chatbots";

/** Bot hỏi đáp CSKH — portable support_chatbot app */
export const API_SUPPORT_CHATBOT = {
  FAQS: "/api/support-chatbot/faqs",
  FAQ_BULK: "/api/support-chatbot/faqs/bulk",
  FAQ_DETAIL: (id: number | string) => `/api/support-chatbot/faqs/${id}`,
  FAQ_CLEAR: "/api/support-chatbot/faqs/clear",
  FAQ_EXPORT: "/api/support-chatbot/faqs/export",
  FAQ_SYNC: "/api/support-chatbot/faqs/sync-embeddings",
  MEDIA: "/api/support-chatbot/media",
  MEDIA_DETAIL: (id: number | string) => `/api/support-chatbot/media/${id}`,
  ASK: "/api/support-chatbot/ask",
  MISS_QUERIES: "/api/support-chatbot/miss-queries",
  MISS_QUERY_DETAIL: (id: number | string) =>
    `/api/support-chatbot/miss-queries/${id}`,
  EDITORS: "/api/support-chatbot/editors",
  EDITORS_ELIGIBLE: "/api/support-chatbot/editors/eligible",
  EDITOR_DETAIL: (userId: number | string) =>
    `/api/support-chatbot/editors/${userId}`,
} as const;

