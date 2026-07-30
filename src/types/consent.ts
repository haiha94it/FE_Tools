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
  status: ConsentAgreementStatus;
  can_use_chat: boolean;
  need_wizard: boolean;
  need_sign: boolean;
  is_employee: boolean;
  consent_subject: ConsentSubject;
  consent_subject_user_id: number;
  submitted_at: string | null;
  reviewed_at: string | null;
  reject_reason: string | null;
  signed_at: string | null;
  user_signed: boolean;
  form_defaults: ConsentFormDefaults;
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
  request_id: string;
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

export const CONSENT_CHAT_REQUIRED = "CONSENT_CHAT_REQUIRED" as const;
export const CONSENT_PENDING_APPROVAL = "CONSENT_PENDING_APPROVAL" as const;
export const CONSENT_REJECTED = "CONSENT_REJECTED" as const;
/** NV: quản lý chưa đủ HĐ */
export const CONSENT_MANAGER_REQUIRED = "CONSENT_MANAGER_REQUIRED" as const;

export const CONSENT_EMPLOYEE_WAIT_MANAGER_DEFAULT =
  "Tài khoản quản lý chưa hoàn tất thỏa thuận xử lý tin nhắn Zalo. Vui lòng báo quản lý ký và được duyệt thỏa thuận để bạn được sử dụng tin nhắn.";

/** Xác nhận Bên B (HĐ) — PDF + preview. Step 1 wizard: câu đồng bộ riêng. */
export const CONSENT_CONFIRM_SYNC_TEXT =
  "Tôi hiểu rằng hệ thống sẽ đồng bộ và lưu trữ dữ liệu tin nhắn từ các nền tảng mạng xã hội về máy chủ của phần mềm, để phục vụ cho nhu cầu chăm sóc khách hàng và bán hàng của tôi. Và tôi muốn tiếp tục chuyển đến trang xem và ký hợp đồng.";

export const CONSENT_CONFIRM_TERMS_TEXT =
  "Tôi đã đọc, hiểu rõ và đồng ý với toàn bộ nội dung Thỏa thuận trong hợp đồng này.";
