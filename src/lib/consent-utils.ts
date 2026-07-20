import { API_BASE_URL } from "@/config/api";
import { getApiErrorCode } from "@/lib/api-response";
import { toast } from "@/lib/toast";
import { useConsentStore } from "@/stores/use-consent-store";
import type { ConsentDisplayMode, MessageProcessingTerms } from "@/types/consent";
import {
  CONSENT_CHAT_REQUIRED,
  CONSENT_PDF_MAX_BYTES,
} from "@/types/consent";
import axios from "axios";

/** URL media tuyệt đối hoặc path relative từ BE */
export function resolveConsentMediaUrl(
  path?: string | null,
): string | null {
  if (!path) return null;
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("data:") ||
    path.startsWith("blob:")
  ) {
    return path;
  }
  return `${API_BASE_URL}/${path.replace(/^\//, "")}`;
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

export function validateConsentPdfFile(file: File): string | null {
  const name = file.name.toLowerCase();
  if (!name.endsWith(".pdf") && file.type !== "application/pdf") {
    return "Chỉ chấp nhận file PDF (.pdf).";
  }
  if (file.size > CONSENT_PDF_MAX_BYTES) {
    return "File PDF tối đa 20MB.";
  }
  return null;
}

export function formatConsentFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

export function validateConsentSignerFields(
  fullName: string,
  phone: string,
): string | null {
  if (!isConsentFullNameValid(fullName)) {
    return "Vui lòng nhập họ tên đầy đủ";
  }
  if (!isConsentPhoneValid(phone)) {
    return "Vui lòng nhập số điện thoại hợp lệ";
  }
  return null;
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

function readConsentErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data && typeof data === "object") {
      const message = (data as { message?: unknown }).message;
      if (typeof message === "string" && message.trim()) return message.trim();
    }
    if (error.message?.trim()) return error.message.trim();
  }
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  return "Bạn cần ký đồng ý xử lý tin nhắn Zalo trước khi sử dụng chat.";
}

/**
 * Khi BE gate chat trả CONSENT_CHAT_REQUIRED → toast + mở modal ký.
 * Trả true nếu đã xử lý (caller có thể skip toast trùng).
 * Không import errors.ts để tránh circular dependency.
 */
export function handleConsentChatRequired(error: unknown): boolean {
  if (getApiErrorCode(error) !== CONSENT_CHAT_REQUIRED) return false;
  toast.error(readConsentErrorMessage(error));
  useConsentStore.getState().openConsentModal();
  void useConsentStore.getState().fetchStatus({ force: true });
  return true;
}
