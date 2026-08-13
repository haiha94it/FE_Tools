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
