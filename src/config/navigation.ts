export type NavSubItem = {
  name: string;
  path: string;
  /** Nếu set — chỉ hiển thị với quyền tương ứng (vd. chỉ admin) */
  roles?: NavRole[];
};

export type NavIconKey =
  | "grid"
  | "chat"
  | "user"
  | "group"
  | "calendar"
  | "table"
  | "list"
  | "page"
  | "chart"
  | "box"
  | "plugin";

export type NavIconTone =
  | "brand"
  | "success"
  | "warning"
  | "info"
  | "neutral"
  | "purple"
  | "error";

export type NavRole = "admin" | "saler" | "sale_manager";

export type NavItemConfig = {
  name: string;
  icon: NavIconKey;
  iconTone?: NavIconTone;
  path?: string;
  subItems?: NavSubItem[];
  /** Chỉ hiển thị khi user có một trong các quyền này */
  roles?: NavRole[];
  /** Chỉ manager có employee_limit > 0 */
  managerOnly?: boolean;
  /** Ẩn với nhân viên (NV) */
  hideForEmployee?: boolean;
  /** Tạm ẩn khỏi sidebar (route vẫn tồn tại nếu truy cập trực tiếp) */
  hidden?: boolean;
};

/**
 * Menu sidebar — chỉ hiển thị module đang dùng.
 * Thêm mục mới khi tích hợp tính năng Zalo.
 */
export const mainNavItems: NavItemConfig[] = [
  { name: "Trang thông tin", path: "/me", icon: "user", iconTone: "brand" },
  {
    name: "Quản lý tài khoản",
    path: "/zalo-accounts",
    icon: "group",
    iconTone: "success",
  },
  {
    name: "Tin nhắn",
    path: "/zalo-messages",
    icon: "chat",
    iconTone: "success",
  },
  {
    name: "Cửa hàng",
    path: "/shop",
    icon: "box",
    iconTone: "warning",
    /** Chỉ admin (is_admin / is_superuser) thấy menu */
    roles: ["admin"],
  },
  {
    name: "Tài nguyên",
    path: "/resource",
    icon: "box",
    iconTone: "info",
    hideForEmployee: true,
  },
  {
    name: "Hướng dẫn",
    path: "/guides",
    icon: "page",
    iconTone: "neutral",
    hideForEmployee: true,
  },
  {
    name: "Quản lý nhân viên",
    path: "/team/employees",
    icon: "group",
    iconTone: "info",
    managerOnly: true,
  },
  {
    name: "Chiến dịch",
    icon: "plugin",
    iconTone: "purple",
    subItems: [
      { name: "Đăng video", path: "/zalo-campaigns/post-video" },
      { name: "Tham gia nhóm", path: "/zalo-campaigns/join-group" },
      { name: "Mời bạn bè tham gia nhóm", path: "/zalo-campaigns/invite-join-group" },
      {
        name: "Mời SĐT tham gia nhóm",
        path: "/zalo-campaigns/phone-number-invite-group",
      },
      { name: "Nhắn tin bạn bè", path: "/zalo-campaigns/send-mes-fr" },
      {
        name: "Nhắn tin / Kết bạn SĐT",
        path: "/zalo-campaigns/send-mess-number-phone",
      },
      { name: "Nhắn tin vào nhóm", path: "/zalo-campaigns/send-mes-group" },
      {
        name: "Tương tác nhóm đã tham gia",
        path: "/zalo-campaigns/send-mess-member-gr",
      },
      {
        name: "Chúc mừng sinh nhật",
        path: "/zalo-campaigns/messenger-birthday",
      },
      {
        name: "Thông báo chiến dịch",
        path: "/zalo-campaigns/campaign-notification",
      },
    ],
  },
  {
    name: "Admin",
    icon: "list",
    iconTone: "error",
    roles: ["admin", "saler", "sale_manager"],
    subItems: [
      { name: "Quản lý người dùng", path: "/admin/users" },
      { name: "Cài đặt hệ thống", path: "/admin/settings", roles: ["admin"] },
    ],
  },
];

export const otherNavItems: NavItemConfig[] = [];