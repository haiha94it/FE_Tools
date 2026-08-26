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

export type NavRole = "admin";

export type NavSubItem = {
  name: string;
  path: string;
  roles?: NavRole[];
};

export type NavItemConfig = {
  name: string;
  icon: NavIconKey;
  iconTone?: NavIconTone;
  path?: string;
  subItems?: NavSubItem[];
  roles?: NavRole[];
  hidden?: boolean;
};

/** Menu admin — Công Cụ Nghề */
export const mainNavItems: NavItemConfig[] = [
  {
    name: "Tổng quan",
    path: "/dashboard",
    icon: "grid",
    iconTone: "brand",
    roles: ["admin"],
  },
  {
    name: "Bản quyền & Đơn hàng",
    path: "/licensing",
    icon: "box",
    iconTone: "brand",
    roles: ["admin"],
  },
  {
    name: "Cổng Đại lý",
    path: "/agency-portal",
    icon: "group",
    iconTone: "purple",
    roles: ["admin"],
  },
  {
    name: "Người dùng",
    path: "/users",
    icon: "user",
    iconTone: "info",
    roles: ["admin"],
  },
  {
    name: "Cài đặt",
    path: "/settings",
    icon: "plugin",
    iconTone: "neutral",
    roles: ["admin"],
  },
];

export const otherNavItems: NavItemConfig[] = [];
