import { isApiEnvelope, unwrapApiBody } from "@/lib/api-response";
import {
  getZaloCheckTaskStatus,
  isZaloCheckTaskPending,
} from "@/lib/zalo-account-utils";
import type {
  ZaloProxyCheckTaskResponse,
  ZaloProxyItem,
  ZaloProxyListResponse,
} from "@/types/zalo-proxy";

export function extractZaloProxies(data: unknown): ZaloProxyItem[] {
  const body = isApiEnvelope(data) ? unwrapApiBody<unknown>(data) : data;

  if (Array.isArray(body)) return body as ZaloProxyItem[];

  if (body && typeof body === "object") {
    const record = body as ZaloProxyListResponse;
    return record.results ?? [];
  }

  return [];
}

export function getActiveZaloProxies(proxies: ZaloProxyItem[]): ZaloProxyItem[] {
  return proxies.filter((item) => item.status === true);
}

export function getZaloProxyDisplayValue(proxy: ZaloProxyItem): string {
  if (proxy.proxy?.trim()) return proxy.proxy.trim();
  if (proxy.host && proxy.port) {
    const auth = proxy.username
      ? `:${proxy.username}${proxy.password ? `:${proxy.password}` : ""}`
      : "";
    return `${proxy.host}:${proxy.port}${auth}`;
  }
  return `Proxy #${proxy.id}`;
}

export function formatZaloProxyOptionLabel(proxy: ZaloProxyItem): string {
  const value = getZaloProxyDisplayValue(proxy);
  if (proxy.note?.trim()) {
    return `${value} — Ghi chú: ${proxy.note.trim()}`;
  }
  return value;
}

export function filterZaloProxies(
  proxies: ZaloProxyItem[],
  keyword: string,
): ZaloProxyItem[] {
  const key = keyword.trim().toLowerCase();
  if (!key) return proxies;

  return proxies.filter((proxy) => {
    const haystack = [
      getZaloProxyDisplayValue(proxy),
      proxy.note,
      proxy.status_display,
      proxy.status === true ? "hoạt động" : "không hoạt động",
      proxy.date_expiration,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(key);
  });
}

export function isZaloProxyExpired(dateExpiration?: string | null): boolean {
  if (!dateExpiration) return false;
  const date = new Date(dateExpiration);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() < Date.now();
}

export function formatZaloProxyExpiration(
  dateExpiration?: string | null,
): string {
  if (!dateExpiration) return "—";
  const date = new Date(dateExpiration);
  if (Number.isNaN(date.getTime())) return dateExpiration;
  return date.toLocaleDateString("vi-VN");
}

export function parseExpirationToDateInput(
  value?: string | null,
): string {
  if (!value) return "";
  const datePart = value.split("T")[0];
  const [year, month, day] = datePart.split("-");
  if (year?.length === 4 && month && day) {
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  return "";
}

/** API ZaloCN nhận DD-MM-YYYY */
export function formatExpirationForApi(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const parts = trimmed.split("-");
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return trimmed;
}

export function parseProxyLines(raw: string): string[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function getZaloProxyStatusMeta(
  proxy: ZaloProxyItem,
  isChecking = false,
): { label: string; color: "success" | "error" | "warning" | "light" } {
  if (isChecking) {
    return { label: "Đang kiểm tra", color: "warning" };
  }
  if (proxy.status === false || proxy.status === "dead") {
    return { label: "Không hoạt động", color: "error" };
  }
  if (proxy.status === true) {
    return { label: "Hoạt động", color: "success" };
  }
  return { label: proxy.status_display || "Không rõ", color: "light" };
}

export function getProxyCheckTaskStatus(
  result: Pick<ZaloProxyCheckTaskResponse, "task_status" | "status">,
): string | undefined {
  return getZaloCheckTaskStatus(result);
}

export function isProxyCheckTaskPending(status?: string): boolean {
  return isZaloCheckTaskPending(status);
}