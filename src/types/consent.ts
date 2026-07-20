/** Đồng thuận xử lý tin nhắn Zalo — /api/consent/* */

export type ConsentClientPlatform = "web_desktop" | "web_mobile" | "unknown";

/** FE hiển thị terms: empty | html | pdf | pdf_and_html */
export type ConsentDisplayMode = "empty" | "html" | "pdf" | "pdf_and_html";

export type ConsentRevokeSource = "user" | "admin" | string;

export type ConsentRevokeReasonCode =
  | "wrong_name"
  | "wrong_phone"
  | "bad_signature"
  | "other"
  | string;

export interface ConsentRevokeReasonOption {
  code: string;
  label: string;
}

export interface MessageProcessingConsentStatus {
  system_activated: boolean;
  /** true chỉ khi thỏa thuận đang hiệu lực (is_active) */
  user_signed: boolean;
  need_sign: boolean;
  can_use_chat: boolean;
  signed_at: string | null;
  has_signature_record?: boolean;
  revoked?: boolean;
  revoke_source?: ConsentRevokeSource | null;
  revoke_reason_code?: ConsentRevokeReasonCode | null;
  revoke_reason_label?: string | null;
  revoke_reason_text?: string | null;
  revoked_at?: string | null;
  notice_code?: string | null;
  /** Banner ưu tiên trên Tin nhắn khi bị thu hồi */
  notice_message?: string | null;
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
  format: "png";
  image_base64: string;
  width: number;
  height: number;
  stroke_count: number;
}

export interface SignMessageProcessingPayload {
  full_name: string;
  phone: string;
  signature: ConsentSignaturePayload;
  client_platform: ConsentClientPlatform;
}

export interface SignMessageProcessingResult {
  signed_at: string | null;
  signer_full_name?: string;
  signer_phone?: string;
  status: MessageProcessingConsentStatus;
}

export interface UserRevokeConsentResult {
  revoked_at: string | null;
  status: MessageProcessingConsentStatus;
}

export interface ConsentAdminSetup extends MessageProcessingTerms {
  is_activated: boolean;
  activated_at: string | null;
  activated_by_id: number | null;
}

export interface ConsentAdminSetupSavePayload {
  title: string;
  body_html: string;
  company_name: string;
  company_tax_code: string;
  company_address: string;
  company_signature?: File | null;
  contract_pdf?: File | null;
  clear_contract_pdf?: boolean;
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
  signed: boolean;
  signed_at?: string | null;
  signer_full_name?: string;
  signer_phone?: string;
  signature_url?: string | null;
  ip?: string | null;
  user_agent?: string;
  stroke_count?: number;
  client_platform?: string;
  terms?: ConsentTermsSnippet;
  company_name?: string;
  company_tax_code?: string;
  company_address?: string;
  company_signature_url?: string | null;
  /** Thu hồi */
  is_active?: boolean;
  status?: "active" | "revoked" | string;
  can_admin_revoke?: boolean;
  revoked?: boolean;
  revoke_reason_code?: ConsentRevokeReasonCode | null;
  revoke_reason_label?: string | null;
  revoke_reason_text?: string | null;
  revoked_at?: string | null;
  revoke_source?: ConsentRevokeSource | null;
  revoke_reason_options?: ConsentRevokeReasonOption[];
}

export interface AdminRevokeConsentPayload {
  reason_code: ConsentRevokeReasonCode;
  reason_text?: string;
}

export const CONSENT_CHAT_REQUIRED = "CONSENT_CHAT_REQUIRED" as const;
export const CONSENT_REVOKED_NOTICE = "CONSENT_REVOKED" as const;

export const CONSENT_PDF_MAX_BYTES = 20 * 1024 * 1024;

/** Fallback options nếu BE chưa trả revoke_reason_options */
export const DEFAULT_CONSENT_REVOKE_REASON_OPTIONS: ConsentRevokeReasonOption[] =
  [
    { code: "wrong_name", label: "Họ tên không đúng" },
    { code: "wrong_phone", label: "Số điện thoại không đúng" },
    { code: "bad_signature", label: "Chữ ký không đạt yêu cầu" },
    { code: "other", label: "Lý do khác" },
  ];
