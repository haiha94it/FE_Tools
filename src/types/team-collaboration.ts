import type { ZaloAccount } from "@/types/zalo-account";

export type CampaignTypeKey =
  | "add_friend"
  | "join_group"
  | "invite_group"
  | "invite_phone_group"
  | "mess_friend"
  | "mess_group"
  | "mess_member_group"
  | "mess_phone"
  | "mess_birthday"
  | "spam_link_group"
  | "auto_inbox";

export interface TeamUserRef {
  id: number;
  username: string;
  fullname: string | null;
}

/** Field mới trên list kịch bản team — §5 contract */
export interface TeamCategoryFields {
  is_mine?: boolean;
  status_label?: string;
  created_by?: TeamUserRef | null;
}

export type CampaignWithTeamMeta<T> = T & TeamCategoryFields;

export type CampaignPermissionsMap = Record<CampaignTypeKey, boolean>;

export interface SentByPayload {
  id: number;
  username: string;
  fullname: string;
}

export interface EmployeeAccountAssignmentsResponse {
  employee_id: number;
  account_ids: number[];
}

export interface EmployeeCampaignPermissionsResponse {
  employee_id: number;
  permissions: CampaignPermissionsMap;
}

export interface MyCampaignPermissionsResponse {
  permissions: CampaignPermissionsMap;
}

export interface SetAccountAssignmentsBody {
  employee_id: number;
  account_ids: number[];
}

export interface SetCampaignPermissionsBody {
  employee_id: number;
  permissions: Partial<Record<CampaignTypeKey, boolean>>;
}

export interface DeleteCampaignResultsBody {
  id_results: number[];
}

/**
 * Nhân viên thuộc manager — GET /api/users/get-employees
 * - account_count: số nick manager đã gán
 * - account_limit: = manager.account_limit (gói chủ team), KHÔNG phải quota riêng NV
 * - logged_account_count: alias account_count trên get-employees
 */
export interface TeamEmployee {
  id: number;
  username: string;
  fullname?: string | null;
  account_limit?: number;
  account_count?: number;
  listener_limit?: number;
  logged_account_count?: number;
  /** Mật khẩu plain (BE UserManagerSerializer / raw_password) — hiển thị cho manager */
  password?: string | null;
  raw_password?: string | null;
}

/**
 * POST /api/users/create-employee
 * Không gửi account_limit — BE ignore; response.account_limit = gói manager
 */
export interface CreateEmployeePayload {
  username: string;
  password: string;
  fullname: string;
  phone_number?: string;
  /** CarePro entitlement; default 0 — không = “NV bật listener bao nick” */
  listener_limit?: number;
}

/**
 * POST /api/users/edit-employee
 * Không gửi account_limit (đã bỏ quota nick riêng NV)
 */
export interface EditEmployeePayload {
  id_employee: number;
  listener_limit?: number;
  password?: string;
  fullname?: string;
  expiration_date?: string | null;
}

export type AccessibleAccount = ZaloAccount;