import type { PaginatedResponse } from "@/types/api";

export type UserPermissionFilter =
  | "is_developer"
  | "is_admin"
  | "is_sale_manager"
  | "is_saler"
  | "is_manager"
  | "no_active"
  | "all";

export type UserPermissionValue =
  | "is_developer"
  | "is_admin"
  | "is_sale_manager"
  | "is_saler"
  | "is_manager";

export interface ManagedUser {
  id: number;
  username: string;
  fullname?: string;
  raw_password?: string;
  password?: string;
  phone_number?: string;
  mail?: string;
  facebook_link?: string;
  system_domain?: string;
  permission?: string;
  is_admin?: boolean;
  is_developer?: boolean;
  is_sale_manager?: boolean;
  is_saler?: boolean;
  is_manager?: boolean;
  is_superuser?: boolean;
  is_trial?: boolean;
  is_locked?: boolean;
  manager_name?: string;
  employee_count?: number;
  employee_limit?: number;
  account_count?: number;
  account_limit?: number;
  chatbot_limit?: number;
  chatbot_expiration_date?: string | null;
  employee_expiration_date?: string | null;
  expiration_date?: string | null;
  created_at?: string | null;
  token?: string;
}

export interface UserActivityLog {
  id: number;
  performer_username?: string;
  action_display?: string;
  target_username?: string;
  detail?: string;
  created_at?: string;
}

export interface ResetPasswordRequest {
  id: number;
  username: string;
  fullname?: string;
  phone_number?: string;
}

export interface CheckedZaloAccount {
  id: number;
  name?: string;
  phone_number?: string;
  avatar?: string;
  checkpoint?: boolean;
  proxy?: {
    proxy?: string;
    status?: boolean;
  };
}

export interface CreateManagedUserPayload {
  facebook_link?: string;
  username: string;
  fullname: string;
  password: string;
  phone_number: string;
  employee_limit: number;
  expiration_date?: string;
  mail: string;
  account_limit: number;
  permission: UserPermissionValue;
  chatbot_limit?: number;
  chatbot_expiration_date?: string;
  employee_expiration_date?: string;
  is_pro?: boolean;
  coin_balance?: number;
}

export interface EditManagedUserPayload {
  id_manager: number;
  facebook_link?: string;
  username: string;
  fullname: string;
  password?: string;
  phone_number?: string;
  employee_limit?: number | string;
  account_limit?: number | string;
  expiration_date?: string | null;
  mail: string;
  permission?: UserPermissionValue;
  employee_expiration_date?: string | null;
}

export interface ListManagedUsersParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  permission?: UserPermissionFilter;
  startDate?: string;
  endDate?: string;
}

export type ManagedUsersResponse = PaginatedResponse<ManagedUser>;
export type ActivityLogsResponse = PaginatedResponse<UserActivityLog>;