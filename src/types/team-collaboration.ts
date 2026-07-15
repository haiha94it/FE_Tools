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

/** Nhân viên thuộc manager — GET /api/users/get-employees */
export interface TeamEmployee {
  id: number;
  username: string;
  fullname?: string | null;
  account_limit?: number;
  account_count?: number;
  listener_limit?: number;
  logged_account_count?: number;
}

/** POST /api/users/create-employee — đồng bộ ZaloCN ManageEmployee */
export interface CreateEmployeePayload {
  username: string;
  password: string;
  fullname: string;
  account_limit: number;
  listener_limit: number;
}

/** POST /api/users/edit-employee */
export interface EditEmployeePayload {
  id_employee: number;
  account_limit?: number;
  listener_limit?: number;
  password?: string;
  fullname?: string;
}

export type AccessibleAccount = ZaloAccount;