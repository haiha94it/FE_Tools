export interface ZaloProxyItem {
  id: number;
  proxy?: string;
  host?: string;
  port?: string | number;
  username?: string | null;
  password?: string | null;
  note?: string | null;
  status?: boolean | string | null;
  status_display?: string | null;
  date_expiration?: string | null;
  account_count?: number;
}

export interface ZaloProxyListResponse {
  results?: ZaloProxyItem[];
  count?: number;
}

export interface ZaloProxyCheckTaskResponse {
  id_task?: string | number;
  task_status?: string;
  status?: string;
}

export interface CreateZaloProxyPayload {
  proxies: string[];
  date_expiration?: string;
  note?: string;
}

export interface EditZaloProxyPayload {
  id: number;
  proxy: string;
  note?: string;
  date_expiration?: string;
}