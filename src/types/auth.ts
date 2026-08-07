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
  is_supporter?: boolean;
  /** Admin hoặc đã gán SupportFAQEditor */
  can_manage_support_faq?: boolean;
  accept_terms?: boolean;
  /** Shop: nick Zalo gửi tin đơn hàng (0 = tắt) */
  id_order_notification_account?: number | null;
  order_successful_message?: string | null;
  confirm_message?: string | null;
  /** Bật/tắt thông báo tin nhắn từ WS */
  new_message_notification?: boolean;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  name: string;
  phone?: string;
  facebookLink?: string;
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
  isSupporter?: boolean;
  /** Setup bot CSKH — admin hoặc editor đã gán */
  canManageSupportFaq?: boolean;
  acceptTerms?: boolean;
  /** Shop order notify */
  idOrderNotificationAccount?: number | null;
  orderSuccessfulMessage?: string | null;
  confirmMessage?: string | null;
  /** Bật/tắt thông báo tin nhắn từ WS */
  newMessageNotification?: boolean;
}

export interface AcceptTermsPayload {
  signature?: string;
  contract_pdf?: string;
  contract_filename?: string;
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
  mail: string;
  phone_number: string;
  facebook_link?: string;
}

export interface RegisterResponse {
  id_task?: string;
  status?: string;
  message?: string;
}

/** Quên mật khẩu — ZaloCN POST /api/users/reset-password/create */
export interface ResetPasswordPayload {
  username: string;
  mail: string;
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
