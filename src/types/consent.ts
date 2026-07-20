/** Đồng thuận xử lý tin nhắn Zalo — /api/consent/* */

export type ConsentClientPlatform = "web_desktop" | "web_mobile" | "unknown";

/** FE hiển thị terms: empty | html | pdf | pdf_and_html */
export type ConsentDisplayMode = "empty" | "html" | "pdf" | "pdf_and_html";

export interface MessageProcessingConsentStatus {
  system_activated: boolean;
  user_signed: boolean;
  need_sign: boolean;
  can_use_chat: boolean;
  signed_at: string | null;
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
  /** Họ tên đầy đủ người ký — bắt buộc */
  full_name: string;
  /** SĐT người ký — bắt buộc (9–11 chữ số) */
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
  /** 1 ảnh chữ ký + con dấu ghép sẵn */
  company_signature?: File | null;
  /** PDF hợp đồng gốc (phương án B) */
  contract_pdf?: File | null;
  /** Xóa PDF đã upload khi không gửi file mới */
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
  /** Snapshot họ tên lúc ký */
  signer_full_name?: string;
  /** Snapshot SĐT lúc ký */
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
}

export const CONSENT_CHAT_REQUIRED = "CONSENT_CHAT_REQUIRED" as const;

/** PDF upload admin — max 20MB */
export const CONSENT_PDF_MAX_BYTES = 20 * 1024 * 1024;
