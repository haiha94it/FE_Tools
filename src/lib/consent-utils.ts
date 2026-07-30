import { API_BASE_URL } from "@/config/api";
import { getApiErrorCode } from "@/lib/api-response";
import { toast } from "@/lib/toast";
import { useConsentStore } from "@/stores/use-consent-store";
import type {
  ConsentAgreementPayload,
  ConsentAgreementStatus,
  ConsentDisplayMode,
  ConsentEntityType,
  MessageProcessingConsentStatus,
  MessageProcessingTerms,
} from "@/types/consent";
import {
  CONSENT_CHAT_REQUIRED,
  CONSENT_EMPLOYEE_WAIT_MANAGER_DEFAULT,
  CONSENT_MANAGER_REQUIRED,
  CONSENT_PENDING_APPROVAL,
  CONSENT_REJECTED,
} from "@/types/consent";
import axios from "axios";

/** URL media tuyệt đối hoặc path relative từ BE */
/**
 * URL media consent (chữ ký / PDF / stamp).
 * - data/blob → giữ
 * - absolute có `/media/` → ghép lại theo `API_BASE_URL` (tránh host BE sai khi FE localhost)
 * - relative → `API_BASE_URL` + path
 */
export function resolveConsentMediaUrl(
  path?: string | null,
): string | null {
  if (!path?.trim()) return null;
  const raw = path.trim();
  if (raw.startsWith("data:") || raw.startsWith("blob:")) return raw;

  const base = (API_BASE_URL || "").replace(/\/$/, "");

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    try {
      const u = new URL(raw);
      const isMedia =
        u.pathname === "/media" ||
        u.pathname.startsWith("/media/") ||
        u.pathname.includes("/media/");
      if (isMedia && base) {
        return `${base}${u.pathname}${u.search}`;
      }
      return raw;
    } catch {
      return raw;
    }
  }

  if (!base) return raw.startsWith("/") ? raw : `/${raw}`;
  return `${base}/${raw.replace(/^\//, "")}`;
}

/**
 * Đếm cấp thụt từ chuỗi tab / khoảng đầu dòng.
 * 1 tab = 1 cấp; 4 space/nbsp = 1 cấp.
 */
function countIndentLevelFromPrefix(prefix: string): number {
  let level = 0;
  let i = 0;
  while (i < prefix.length) {
    const ch = prefix[i];
    if (ch === "\t") {
      level += 1;
      i += 1;
      continue;
    }
    if (ch === " " || ch === "\u00a0") {
      let spaces = 0;
      while (
        i < prefix.length &&
        (prefix[i] === " " || prefix[i] === "\u00a0")
      ) {
        spaces += 1;
        i += 1;
      }
      level += Math.floor(spaces / 4);
      continue;
    }
    break;
  }
  return Math.min(Math.max(level, 0), 9);
}

function getExistingQuillIndent(el: Element): number {
  for (const cls of Array.from(el.classList)) {
    const m = /^ql-indent-([1-9])$/.exec(cls);
    if (m) return Number(m[1]);
  }
  return 0;
}

function setQuillIndentClass(el: Element, level: number) {
  Array.from(el.classList).forEach((cls) => {
    if (cls.startsWith("ql-indent-")) el.classList.remove(cls);
  });
  if (level >= 1 && level <= 9) {
    el.classList.add(`ql-indent-${level}`);
  }
}

/**
 * Gỡ tab/space đầu đoạn và gắn class ql-indent-N (Quill hiểu được).
 * Nội dung BE đang lưu `\t` trong `<p>` — Quill paste sẽ nuốt tab, nên phải convert.
 */
export function convertLeadingTabsToQuillIndent(
  html?: string | null,
): string {
  if (!html) return "";

  if (typeof window === "undefined") {
    // SSR: chỉ convert tab (tránh nuốt khoảng trắng thường sau <p>)
    return html.replace(
      /<(p|h[1-6]|li|div)(\s[^>]*)?>((?:\t|&#9;)+)/gi,
      (_full, tag: string, attrs: string | undefined, indentRaw: string) => {
        const indent = indentRaw.replace(/&#9;/gi, "\t");
        const level = countIndentLevelFromPrefix(indent);
        if (level <= 0) return _full;
        let nextAttrs = attrs ?? "";
        if (/\bclass\s*=/.test(nextAttrs)) {
          nextAttrs = nextAttrs.replace(
            /class\s*=\s*(["'])(.*?)\1/i,
            (_m, q: string, cls: string) => {
              const cleaned = cls
                .split(/\s+/)
                .filter((c) => c && !c.startsWith("ql-indent-"))
                .join(" ");
              return `class=${q}${cleaned} ql-indent-${level}${q}`.replace(
                /class=(["'])\s+/,
                "class=$1",
              );
            },
          );
        } else {
          nextAttrs = `${nextAttrs} class="ql-indent-${level}"`;
        }
        return `<${tag}${nextAttrs}>`;
      },
    );
  }

  const template = document.createElement("template");
  template.innerHTML = html;

  const blocks = template.content.querySelectorAll(
    "p, h1, h2, h3, h4, h5, h6, li, div",
  );

  blocks.forEach((node) => {
    const el = node as HTMLElement;
    let levelFromTabs = 0;
    let child: ChildNode | null = el.firstChild;

    while (child) {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent ?? "";
        // Ưu tiên tab; space chỉ tính nếu có tab hoặc ≥4 space đầu dòng
        const match = text.match(/^(\t+|[\t \u00a0]*\t[\t \u00a0]*|(?:[ \u00a0]{4})+)/);
        if (match) {
          levelFromTabs += countIndentLevelFromPrefix(match[0]);
          const rest = text.slice(match[0].length);
          if (rest) {
            child.textContent = rest;
          } else {
            const empty = child;
            child = child.nextSibling;
            empty.parentNode?.removeChild(empty);
            continue;
          }
        }
        break;
      }
      if (child.nodeType === Node.ELEMENT_NODE) {
        // Tab chỉ đứng trước nội dung block, không chui vào thẻ con
        break;
      }
      child = child.nextSibling;
    }

    if (levelFromTabs <= 0) return;
    const existing = getExistingQuillIndent(el);
    setQuillIndentClass(el, Math.max(levelFromTabs, existing));
  });

  return template.innerHTML;
}

/**
 * Sanitize HTML điều khoản — cấm script/iframe/on* handlers.
 * Giữ class (ql-indent-*), data-list, span.ql-ui để preview thụt dòng giống editor.
 * Convert tab đầu dòng → ql-indent-* để khớp editor Quill.
 */
export function sanitizeConsentHtml(html?: string | null): string {
  if (!html) return "";
  const withIndent = convertLeadingTabsToQuillIndent(html);

  if (typeof window === "undefined") {
    return withIndent
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
      .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, "")
      .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  }

  const template = document.createElement("template");
  template.innerHTML = withIndent;
  const blocked = new Set([
    "SCRIPT",
    "IFRAME",
    "OBJECT",
    "EMBED",
    "LINK",
    "META",
    "BASE",
    "FORM",
  ]);

  const walk = (root: ParentNode) => {
    const nodes = Array.from(root.childNodes);
    for (const node of nodes) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        if (blocked.has(el.tagName)) {
          el.remove();
          continue;
        }
        for (const attr of Array.from(el.attributes)) {
          const name = attr.name.toLowerCase();
          const value = attr.value.trim().toLowerCase();
          // Giữ class / data-* / style an toàn (padding indent); chỉ gỡ handler
          if (name.startsWith("on") || value.startsWith("javascript:")) {
            el.removeAttribute(attr.name);
          }
        }
        // Quill list cần .ql-ui để vẽ bullet/số khi preview ngoài editor
        if (
          el.tagName === "LI" &&
          el.getAttribute("data-list") &&
          !el.querySelector(":scope > .ql-ui")
        ) {
          const ui = document.createElement("span");
          ui.className = "ql-ui";
          ui.setAttribute("contenteditable", "false");
          el.insertBefore(ui, el.firstChild);
        }
        walk(el);
      }
    }
  };

  walk(template.content);
  return template.innerHTML;
}

export function resolveConsentDisplayMode(
  terms?: Pick<
    MessageProcessingTerms,
    | "display_mode"
    | "has_body_html"
    | "has_contract_pdf"
    | "body_html"
    | "contract_pdf_url"
  > | null,
): ConsentDisplayMode {
  if (terms?.display_mode) return terms.display_mode;
  const hasHtml =
    terms?.has_body_html ?? Boolean((terms?.body_html || "").trim());
  const hasPdf =
    terms?.has_contract_pdf ?? Boolean(terms?.contract_pdf_url);
  if (hasPdf && hasHtml) return "pdf_and_html";
  if (hasPdf) return "pdf";
  if (hasHtml) return "html";
  return "empty";
}

export function isQuillHtmlEmpty(html?: string | null): boolean {
  if (!html?.trim()) return true;
  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length === 0;
}

/** Họ tên: ≥ 2 ký tự sau trim */
export function isConsentFullNameValid(name?: string | null): boolean {
  return (name ?? "").trim().length >= 2;
}

/**
 * SĐT: 9–11 chữ số; cho phép +, khoảng, dấu gạch (khớp BE).
 */
export function isConsentPhoneValid(phone?: string | null): boolean {
  const raw = (phone ?? "").trim();
  if (!raw) return false;
  if (!/^\+?[\d\s\-]{9,15}$/.test(raw)) return false;
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 9 && digits.length <= 11;
}

export function isConsentEmailValid(email?: string | null): boolean {
  const raw = (email ?? "").trim();
  if (!raw) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw);
}

export function normalizeConsentStatus(
  status?: ConsentAgreementStatus | null,
): ConsentAgreementStatus {
  if (!status) return "none";
  return status;
}

/** NV — không ký, theo HĐ quản lý */
export function consentIsEmployee(
  status: MessageProcessingConsentStatus | null | undefined,
): boolean {
  return Boolean(status?.is_employee);
}

/**
 * FE ưu tiên flag BE; fallback theo status machine.
 * NV: luôn false. Non-NV: need_wizard / none|rejected.
 */
export function consentNeedsWizard(
  status: MessageProcessingConsentStatus | null | undefined,
): boolean {
  if (!status) return false;
  if (!status.system_activated) return false;
  if (consentIsEmployee(status)) return false;
  return status.need_wizard;
}

/** NV: QL chưa có HĐ / chưa đủ điều kiện chat */
export function consentShowWaitManager(
  status: MessageProcessingConsentStatus | null | undefined,
): boolean {
  if (!status?.system_activated) return false;
  if (!consentIsEmployee(status)) return false;
  if (consentCanUseChat(status)) return false;
  return (
    !consentShowPending(status) &&
    !consentShowRejected(status)
  );
}

export function consentEmployeeMessage(
  status: MessageProcessingConsentStatus | null | undefined,
): string {
  if (status?.status === "pending_approval") {
    return "Thỏa thuận của quản lý đang chờ duyệt. Bạn sẽ dùng được tin nhắn sau khi hồ sơ được duyệt.";
  }
  if (status?.status === "rejected") {
    return "Thỏa thuận của quản lý chưa được duyệt. Vui lòng báo quản lý ký lại.";
  }
  return CONSENT_EMPLOYEE_WAIT_MANAGER_DEFAULT;
}

/** Prefill form từ GET status */
export function resolveConsentFormDefaults(
  status: MessageProcessingConsentStatus | null | undefined,
  authUser?: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null,
): { fullName: string; email: string; phone: string } {
  const d = status?.form_defaults;
  return {
    fullName: (d?.full_name || authUser?.name || "").trim(),
    email: (d?.email || authUser?.email || "").trim(),
    phone: (d?.phone || authUser?.phone || "").trim(),
  };
}

export function consentCanUseChat(
  status: MessageProcessingConsentStatus | null | undefined,
): boolean {
  if (!status) return true;
  if (!status.system_activated) return true;
  return status.can_use_chat;
}

export function consentShowPending(
  status: MessageProcessingConsentStatus | null | undefined,
): boolean {
  if (!status?.system_activated) return false;
  return normalizeConsentStatus(status.status) === "pending_approval";
}

export function consentShowRejected(
  status: MessageProcessingConsentStatus | null | undefined,
): boolean {
  if (!status?.system_activated) return false;
  return normalizeConsentStatus(status.status) === "rejected";
}

export function validateConsentAgreementForm(input: {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  entityType: ConsentEntityType;
  companyName: string;
  taxCode: string;
  representativeName: string;
  representativeTitle: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
}): string | null {
  if (!isConsentFullNameValid(input.fullName)) {
    return input.entityType === "business"
      ? "Vui lòng nhập họ tên người đại diện"
      : "Vui lòng nhập họ tên đầy đủ";
  }
  if (input.email.trim() && !isConsentEmailValid(input.email)) {
    return "Email không hợp lệ";
  }
  if (!isConsentPhoneValid(input.phone)) {
    return input.entityType === "business"
      ? "Vui lòng nhập số điện thoại liên hệ hợp lệ"
      : "Vui lòng nhập số điện thoại có Zalo hợp lệ";
  }
  if (input.entityType === "business") {
    if (!input.companyName.trim()) return "Vui lòng nhập tên công ty / HKD";
    if (!input.taxCode.trim()) return "Vui lòng nhập mã số thuế";
  }
  return null;
}

export function buildConsentAgreementPayload(input: {
  requestId: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  entityType: ConsentEntityType;
  companyName: string;
  taxCode: string;
  representativeName: string;
  representativeTitle: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  signature: {
    dataUrl: string;
    width: number;
    height: number;
    strokeCount: number;
  };
}): ConsentAgreementPayload {
  const base: ConsentAgreementPayload = {
    request_id: input.requestId,
    full_name: input.fullName.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    address: input.address.trim(),
    entity_type: input.entityType,
    signature: {
      format: "png",
      image_base64: input.signature.dataUrl,
      width: input.signature.width || 600,
      height: input.signature.height || 200,
      stroke_count: input.signature.strokeCount,
    },
    client_platform: detectConsentClientPlatform(),
  };

  if (input.entityType === "business") {
    base.company_name = input.companyName.trim();
    base.tax_code = input.taxCode.trim();
    base.representative_name = input.fullName.trim();
    base.representative_title = input.representativeTitle.trim();
    base.company_address = input.address.trim();
    base.company_phone = input.phone.trim();
    base.company_email = input.email.trim();
  }

  return base;
}

export function detectConsentClientPlatform(): "web_desktop" | "web_mobile" {
  if (typeof window === "undefined") return "web_desktop";
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const narrow = window.matchMedia("(max-width: 768px)").matches;
  return coarse || narrow ? "web_mobile" : "web_desktop";
}

export function formatConsentDateTime(dateStr?: string | null): string {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function readConsentErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data && typeof data === "object") {
      const message = (data as { message?: unknown }).message;
      if (typeof message === "string" && message.trim()) return message.trim();
    }
    if (error.message?.trim()) return error.message.trim();
  }
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  return fallback;
}

/**
 * Gate chat / API consent:
 * - CONSENT_MANAGER_REQUIRED → NV: banner nhờ QL (không wizard)
 * - CONSENT_CHAT_REQUIRED → wizard (non-NV)
 * - CONSENT_PENDING_APPROVAL → refresh status
 * - CONSENT_REJECTED → refresh + CTA ký lại (non-NV)
 */
export function handleConsentChatRequired(error: unknown): boolean {
  const code = getApiErrorCode(error);
  const store = useConsentStore.getState();

  if (code === CONSENT_MANAGER_REQUIRED) {
    toast.error(
      readConsentErrorMessage(error, CONSENT_EMPLOYEE_WAIT_MANAGER_DEFAULT),
    );
    void store.fetchStatus({ force: true });
    store.closeConsentWizard();
    return true;
  }

  if (code === CONSENT_PENDING_APPROVAL) {
    toast.error(
      readConsentErrorMessage(
        error,
        "Hồ sơ đang chờ duyệt. Bạn chưa thể dùng tin nhắn.",
      ),
    );
    void store.fetchStatus({ force: true });
    store.closeConsentWizard();
    return true;
  }

  if (code === CONSENT_REJECTED) {
    toast.error(
      readConsentErrorMessage(
        error,
        "Thỏa thuận không được duyệt. Vui lòng tạo / ký lại.",
      ),
    );
    void store.fetchStatus({ force: true });
    return true;
  }

  if (code === CONSENT_CHAT_REQUIRED) {
    toast.error(
      readConsentErrorMessage(
        error,
        "Bạn cần hoàn tất thỏa thuận xử lý tin nhắn Zalo trước khi dùng chat.",
      ),
    );
    store.openConsentWizard();
    void store.fetchStatus({ force: true });
    return true;
  }

  return false;
}
