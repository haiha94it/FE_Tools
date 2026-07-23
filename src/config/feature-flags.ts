/**
 * Feature flags FE — bật/tắt UI tạm khi BE gỡ hoặc chưa sẵn sàng.
 * Đổi true khi cần hiện lại.
 */

/**
 * Link nhóm Zalo + thành viên link (get-link, show-member-link, invite type uids).
 * BE đã gỡ — tạm ẩn toàn FE.
 */
export const SHOW_GROUP_LINK_FEATURES = false;

/**
 * Chiến dịch / quyền "Spam link nhóm" (spam_link_group).
 * Tạm ẩn menu + quyền NV. Bật true khi cần hiện lại.
 */
export const SHOW_SPAM_LINK_GROUP_FEATURES = false;

/**
 * Type mời SĐT trong invite-join-group (1 nick).
 * Tắt: mời SĐT chỉ dùng /phone-number-invite-group (nhiều nick).
 */
export const SHOW_INVITE_JOIN_GROUP_PHONE_TYPE = false;
