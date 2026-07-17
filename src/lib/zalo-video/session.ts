import { formatProxy } from "@/const/convertProxy";
import type { DataFbAccount } from "@/types/zalo-video";

const DATA_FB_KEY = "dataFb";
const CSRF_KEY = "csrfZaloData";

export function getDataFbAccounts(): DataFbAccount[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DATA_FB_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DataFbAccount[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getDataFbAccount(accountId: number): DataFbAccount | undefined {
  return getDataFbAccounts().find((item) => item.id === accountId);
}

export function getAccountSession(accountId: number) {
  const account = getDataFbAccount(accountId);
  if (!account?.webSession) return null;

  const proxyRaw = account.proxy?.proxy;
  let proxy: string | undefined;
  if (proxyRaw) {
    try {
      proxy = formatProxy(proxyRaw);
    } catch {
      proxy = undefined;
    }
  }

  return {
    clientCookie: account.webSession,
    proxy,
  };
}

export function getCsrfToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CSRF_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { token?: string };
    return typeof parsed.token === "string" ? parsed.token : null;
  } catch {
    return null;
  }
}

export async function ensureCsrfToken(accountId: number): Promise<string> {
  let token = getCsrfToken();
  if (token) return token;

  await refreshCsrfToken(accountId);
  token = getCsrfToken();
  if (!token) throw new Error("Không lấy được CSRF token.");
  return token;
}

/** Cập nhật webSession trong localStorage dataFb sau BE channel login. */
export function patchDataFbWebSession(
  accountId: number,
  webSession: string | null | undefined,
): void {
  if (typeof window === "undefined" || !webSession) return;
  try {
    const raw = localStorage.getItem(DATA_FB_KEY);
    const list = raw ? (JSON.parse(raw) as DataFbAccount[]) : [];
    if (!Array.isArray(list)) return;
    const next = list.map((item) =>
      item.id === accountId ? { ...item, webSession } : item,
    );
    // Nếu chưa có entry account — không tạo full object (fetchAccounts sẽ sync)
    if (!next.some((item) => item.id === accountId)) return;
    localStorage.setItem(DATA_FB_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export async function refreshCsrfToken(accountId: number): Promise<void> {
  const session = getAccountSession(accountId);
  if (!session?.clientCookie) return;

  const response = await fetch("/next-api/get_csrf_token_zl", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientCookie: session.clientCookie,
      proxy: session.proxy,
    }),
  });

  // Body rỗng / non-JSON (nginx 200 5 bytes) → không .json() mù
  const text = await response.text();
  if (!response.ok || !text?.trim()) return;

  try {
    const result = JSON.parse(text) as unknown;
    if (result != null && typeof result === "object") {
      localStorage.setItem(CSRF_KEY, JSON.stringify(result));
    }
  } catch {
    // Unexpected end of JSON input — bỏ qua, không chặn login kênh
  }
}