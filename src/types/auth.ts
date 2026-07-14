/** Profile từ GET /api/users/me */
export interface ApiUserProfile {
  id: number | string;
  username: string;
  fullname?: string;
  full_name?: string;
  mail?: string;
  phone_number?: string;
  facebook_link?: string;
  expiration_date?: string | null;
  coin_balance?: number;
  account_count?: number;
  account_limit?: number;
  employee_limit?: number;
  is_admin?: boolean;
  is_superuser?: boolean;
  is_saler?: boolean;
  is_sale_manager?: boolean;
  is_agency_admin?: boolean;
  is_manager?: boolean;
  is_employee?: boolean;
  is_developer?: boolean;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  name: string;
  phone?: string;
  facebookLink?: string;
  coinBalance?: number;
  expirationDate?: string | null;
  accountCount?: number;
  accountLimit?: number;
  employeeLimit?: number;
  isAdmin?: boolean;
  isSaler?: boolean;
  isSaleManager?: boolean;
  isAgencyAdmin?: boolean;
  isManager?: boolean;
  isEmployee?: boolean;
  isDeveloper?: boolean;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export type LoginResponse = AuthTokens;

export interface LoginCareResponse {
  access: string;
  refresh: string;
}

/** Đăng ký — đồng bộ ZaloCN POST /api/register/create */
export interface RegisterPayload {
  username: string;
  fullname: string;
  password: string;
  phone_number: string;
  mail: string;
  facebook_link?: string;
  referral_code?: string;
  is_pro?: boolean;
}

export interface RegisterResponse {
  id_task?: string;
  status?: string;
  message?: string;
}

/** Quên mật khẩu — ZaloCN POST /api/users/reset-password/create */
export interface ResetPasswordPayload {
  username: string;
  fullname: string;
  phone_number: string;
}

export interface ResetPasswordResponse {
  status?: string;
  error?: string;
  message?: string;
}

/** Popup thông báo sau đăng ký — GET /api/popup/register/get */
export interface RegisterPopupItem {
  image?: string;
  content?: string;
}

/** Nội dung điều khoản — GET /api/popup/decree/get */
export interface DecreeItem {
  content?: string;
  active?: boolean;
}