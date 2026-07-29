/** Đồng thuận xử lý tin nhắn Zalo — /api/consent/* (ký submit → pending → admin duyệt) */

export type ConsentClientPlatform = "web_desktop" | "web_mobile" | "unknown";

/** FE hiển thị terms: empty | html | pdf | pdf_and_html */
export type ConsentDisplayMode = "empty" | "html" | "pdf" | "pdf_and_html";

/** Trạng thái hồ sơ thỏa thuận (status machine) */
export type ConsentAgreementStatus =
  | "none"
  | "pending_approval"
  | "approved"
  | "rejected"
  | string;

export type ConsentEntityType = "personal" | "business";

export interface ConsentFormDefaults {
  full_name?: string;
  email?: string;
  phone?: string;
}

export type ConsentSubject = "manager" | "self" | string;

export interface MessageProcessingConsentStatus {
  system_activated: boolean;
  /** Status HĐ **subject** (QL nếu NV) — none | pending_approval | approved | rejected */
  status: ConsentAgreementStatus;
  can_use_chat: boolean;
  /** true → wizard (chỉ non-NV) */
  need_wizard?: boolean;
  /** tương thích BE (need_wizard) */
  need_sign?: boolean;
  /** NV theo HĐ quản lý */
  is_employee?: boolean;
  consent_subject?: ConsentSubject;
  consent_subject_user_id?: number | null;
  show_pending_status?: boolean;
  show_rejected_status?: boolean;
  /** NV: QL chưa có hồ sơ (none) */
  show_wait_manager?: boolean;
  pending_message?: string | null;
  rejected_message?: string | null;
  /** Copy NV — báo quản lý ký */
  employee_message?: string | null;
  /** Alias employee_message */
  manager_message?: string | null;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  reject_reason?: string | null;
  signed_at?: string | null;
  has_signature_record?: boolean;
  user_signed?: boolean;
  /** Prefill form wizard (non-NV) */
  form_defaults?: ConsentFormDefaults | null;
  default_email?: string | null;
  default_full_name?: string | null;
  default_phone?: string | null;
}

export interface MessageProcessingTerms {
  title: string;
  body_html: string;
  has_body_html?: boolean;
  contract_pdf_url?: string | null;
  has_contract_pdf?: boolean;
  display_mode?: ConsentDisplayMode;
  company_name: string;
  company_tax_code: string;
  company_address: string;
  /** 1 ảnh chữ ký + con dấu (admin ghép sẵn) */
  company_signature_url: string | null;
  updated_at: string | null;
  system_activated?: boolean;
}

export interface ConsentSignaturePayload {
  image_base64: string;
  width: number;
  height: number;
  stroke_count: number;
  format?: "png";
}

/** Form + chữ ký — POST message-processing/sign/ */
export interface ConsentAgreementPayload {
  full_name: string;
  email: string;
  phone: string;
  address: string;
  entity_type: ConsentEntityType;
  company_name?: string;
  tax_code?: string;
  representative_name?: string;
  representative_title?: string;
  company_address?: string;
  company_phone?: string;
  company_email?: string;
  signature: ConsentSignaturePayload;
  client_platform: ConsentClientPlatform;
}

export interface ConsentSubmitResult {
  status: MessageProcessingConsentStatus;
  submitted_at?: string | null;
  message?: string | null;
  signed_at?: string | null;
}

export interface ConsentNotifyAccountSnippet {
  id: number;
  uid?: string | null;
  name?: string | null;
  phone_number?: string | null;
  avatar?: string | null;
}

export interface ConsentActivateChecklistItem {
  key: string;
  ok: boolean;
  message: string;
}

export interface ConsentAdminSetup extends MessageProcessingTerms {
  is_activated: boolean;
  activated_at: string | null;
  activated_by_id: number | null;
  /** Nick Zalo bắn @All vào nhóm khi user submit HĐ */
  notify_zalo_account_id?: number | null;
  notify_zalo_account?: ConsentNotifyAccountSnippet | null;
  notify_group_id?: string | null;
  notify_group_name?: string | null;
  /** BE: đủ setup để kích hoạt */
  can_activate?: boolean;
  activate_block_reason?: string | null;
  activate_missing?: string[];
  activate_checklist?: ConsentActivateChecklistItem[];
}

export const CONSENT_SETUP_INCOMPLETE = "CONSENT_SETUP_INCOMPLETE" as const;

export interface ConsentAdminSetupSavePayload {
  title: string;
  body_html: string;
  company_name: string;
  company_tax_code: string;
  company_address: string;
  company_signature?: File | null;
  contract_pdf?: File | null;
  clear_contract_pdf?: boolean;
  notify_zalo_account_id?: number | null;
  notify_group_id?: string | null;
  notify_group_name?: string | null;
}

export interface ConsentContractUser {
  id: number;
  username: string;
  fullname?: string;
  mail?: string;
  phone_number?: string;
}

export interface ConsentTermsSnippet {
  title?: string;
  body_html?: string;
  has_body_html?: boolean;
  contract_pdf_url?: string | null;
  has_contract_pdf?: boolean;
  display_mode?: ConsentDisplayMode;
  updated_at?: string | null;
}

export interface ConsentUserContract {
  user: ConsentContractUser;
  status?: ConsentAgreementStatus;
  signed?: boolean;
  full_name?: string;
  signed_at?: string | null;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  reject_reason?: string | null;
  signer_full_name?: string;
  signer_phone?: string;
  signer_email?: string;
  signer_address?: string;
  entity_type?: ConsentEntityType | string;
  company_name_user?: string;
  tax_code?: string;
  representative_name?: string;
  representative_title?: string;
  company_address_user?: string;
  company_phone?: string;
  company_email?: string;
  signature_url?: string | null;
  /** data:image/...;base64 — ưu tiên hiển thị khi /media/ 502 */
  signature_data_url?: string | null;
  ip?: string | null;
  user_agent?: string;
  stroke_count?: number;
  client_platform?: string;
  terms?: ConsentTermsSnippet;
  company_name?: string;
  company_tax_code?: string;
  company_address?: string;
  company_signature_url?: string | null;
  can_admin_approve?: boolean;
  can_admin_reject?: boolean;
}

export interface AdminRejectConsentPayload {
  reason?: string;
}

export const CONSENT_CHAT_REQUIRED = "CONSENT_CHAT_REQUIRED" as const;
export const CONSENT_PENDING_APPROVAL = "CONSENT_PENDING_APPROVAL" as const;
export const CONSENT_REJECTED = "CONSENT_REJECTED" as const;
/** NV: quản lý chưa đủ HĐ */
export const CONSENT_MANAGER_REQUIRED = "CONSENT_MANAGER_REQUIRED" as const;

export const CONSENT_PDF_MAX_BYTES = 20 * 1024 * 1024;

export const CONSENT_EMPLOYEE_WAIT_MANAGER_DEFAULT =
  "Tài khoản quản lý chưa hoàn tất thỏa thuận xử lý tin nhắn Zalo. Vui lòng báo quản lý ký và được duyệt thỏa thuận để bạn được sử dụng tin nhắn.";

/** Xác nhận Bên B (HĐ) — PDF + preview. Step 1 wizard: câu đồng bộ riêng. */
export const CONSENT_CONFIRM_SYNC_TEXT =
  "Tôi hiểu rằng hệ thống sẽ đồng bộ và lưu trữ dữ liệu tin nhắn từ các nền tảng mạng xã hội về máy chủ của phần mềm, để phục vụ cho nhu cầu chăm sóc khách hàng và bán hàng của tôi. Và tôi muốn tiếp tục chuyển đến trang xem và ký hợp đồng.";

export const CONSENT_CONFIRM_TERMS_TEXT =
  "Tôi đã đọc, hiểu rõ và đồng ý với toàn bộ nội dung Thỏa thuận trong hợp đồng này.";
