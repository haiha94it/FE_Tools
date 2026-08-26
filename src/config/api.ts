import { env } from "@/config/env";

/** Base URL API chính */
export const API_BASE_URL = env.NEXT_PUBLIC_API_URL;

export const API_AUTH = {
  LOGIN: "/api/users/login",
  REFRESH: "/api/token/refresh/",
  LOGOUT: "/api/users/logout",
  ME: "/api/users/me",
  CHANGE_PASSWORD: "/api/users/change-password",
} as const;

export const API_CATALOG = {
  PROFESSIONS: "/api/catalog/professions/",
  TOOLS: "/api/catalog/tools/",
  TOOL_DETAIL: (slug: string) => `/api/catalog/tools/${slug}/`,
  TOOL_USAGE: (slug: string) => `/api/catalog/tools/${slug}/usage/`,
  SAVED: "/api/catalog/saved/",
  ADMIN_ANALYTICS: "/api/catalog/admin/analytics/overview/",
} as const;

export const API_SYSTEM = {
  GET: "/api/system/get",
  EDIT: "/api/system/edit",
  PUBLIC_UI_STATUS: "/api/system/public-ui-status/",
} as const;

export const API_USERS_ADMIN = {
  LIST: "/api/users/list",
  CREATE: "/api/users/create",
  LOCK: "/api/users/lock",
  UNLOCK: "/api/users/unlock",
} as const;

export const API_LICENSING_ADMIN = {
  CUSTOMERS: "/api/licensing/admin/customers/",
  CUSTOMER_DETAIL: (id: number) => `/api/licensing/admin/customers/${id}/`,
  ISSUE_LICENSE: "/api/licensing/admin/licenses/issue/",
  REVOKE_LICENSE: (id: number) => `/api/licensing/admin/licenses/${id}/revoke/`,
  ORDERS: "/api/licensing/admin/orders/",
  COMPLETE_ORDER: (id: number) => `/api/licensing/admin/orders/${id}/complete/`,
  REJECT_ORDER: (id: number) => `/api/licensing/admin/orders/${id}/reject/`,
  DELETE_ORDER: (id: number) => `/api/licensing/admin/orders/${id}/delete/`,
  DELETE_ALL_ORDERS: "/api/licensing/admin/orders/delete-all/",
  PRICING_PLANS: "/api/licensing/admin/pricing-plans/",
  PRICING_PLAN_DETAIL: (id: number) => `/api/licensing/admin/pricing-plans/${id}/`,
  AGENCY_BALANCES: "/api/licensing/admin/agency-balances/",
  UPDATE_AGENCY_BALANCE: "/api/licensing/admin/agency-balances/update/",
  GLOBAL_AGENCY_SETTINGS: "/api/licensing/admin/agency-settings/",
  ANNOUNCEMENTS: "/api/licensing/admin/announcements/",
  APP_RELEASES: "/api/licensing/admin/app-releases/",
} as const;

export const API_AGENCY = {
  ME: "/api/licensing/agency/me/",
  CUSTOMERS: "/api/licensing/agency/customers/",
  TOPUP: "/api/licensing/agency/topup/",
  ACTIVATE: "/api/licensing/agency/activate/",
} as const;
