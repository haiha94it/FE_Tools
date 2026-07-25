import { isApiEnvelope, unwrapApiBody } from "@/lib/api-response";
import type {
  ZaloAccount,
  ZaloAccountCheckResultResponse,
  ZaloAccountsListResponse,
} from "@/types/zalo-account";

export const MASKED_SENSITIVE_VALUE = "********";

export function extractZaloAccounts(data: unknown): ZaloAccount[] {
  const body = isApiEnvelope(data) ? unwrapApiBody<unknown>(data) : data;

  if (Array.isArray(body)) return body as ZaloAccount[];

  if (body && typeof body === "object") {
    const record = body as ZaloAccountsListResponse;
    return record.results ?? [];
  }

  return [];
}

export function filterZaloAccounts(
  accounts: ZaloAccount[],
  keyword: string,
): ZaloAccount[] {
  const key = keyword.trim().toLowerCase();
  if (!key) return accounts;

  return accounts.filter((account) =>
    Object.values(account).some(
      (value) =>
        typeof value === "string" && value.toLowerCase().includes(key),
    ),
  );
}

/** Hoạt động khi checkpoint=false — chỉ kiểm tra checkpoint, không kèm proxy */
export function isZaloAccountActive(account: ZaloAccount): boolean {
  return account.checkpoint === false;
}

/** Proxy OK, nick không gắn proxy, hoặc user được bỏ qua proxy khi thêm/quét nick */
export function meetsZaloProxyRequirement(
  account: ZaloAccount,
  canSkipProxy = false,
): boolean {
  if (canSkipProxy || account.proxy == null) return true;
  return account.proxy.status === true;
}

/** Nick đủ điều kiện chạy tác vụ — checkpoint tắt + proxy (nếu bắt buộc) */
export function isZaloAccountRunnable(
  account: ZaloAccount,
  canSkipProxy = false,
): boolean {
  return (
    isZaloAccountActive(account) &&
    meetsZaloProxyRequirement(account, canSkipProxy)
  );
}

export function getZaloAccountStatus(
  account: ZaloAccount,
  checkingIds: number[],
): { label: string; color: "success" | "error" | "warning" } {
  if (checkingIds.includes(account.id)) {
    return { label: "Đang kiểm tra", color: "warning" };
  }
  if (isZaloAccountActive(account)) {
    return { label: "Hoạt động", color: "success" };
  }
  return { label: "Không hoạt động", color: "error" };
}

export function getZaloProxyStatus(
  account: ZaloAccount,
): { label: string; color: "success" | "error" | "warning" | "light" } {
  if (!account.proxy) {
    return { label: "—", color: "light" };
  }
  if (account.proxy.status === true) {
    return { label: "Hoạt động", color: "success" };
  }
  return { label: "Không hoạt động", color: "error" };
}

export function getProxyDisplay(
  proxy?: ZaloAccount["proxy"],
  masked = false,
): string {
  if (!proxy) return "—";
  const value = resolveProxyString(proxy);
  if (!value) return "—";
  return masked ? MASKED_SENSITIVE_VALUE : value;
}

export function resolveProxyString(
  proxy: NonNullable<ZaloAccount["proxy"]>,
): string {
  if (proxy.proxy) return proxy.proxy;
  if (!proxy.host || !proxy.port) return "";

  const auth = proxy.username
    ? `:${proxy.username}${proxy.password ? `:${proxy.password}` : ""}`
    : "";
  return `${proxy.host}:${proxy.port}${auth}`;
}

export function maskPhone(
  phone: string | null | undefined,
  showSensitive: boolean,
): string {
  if (!phone) return "—";
  return showSensitive ? phone : MASKED_SENSITIVE_VALUE;
}

/** ON nếu có ít nhất 1 tài khoản đang bật tin nhắn (disable_message=false) */
export function isTotalMessagesOn(accounts: ZaloAccount[]): boolean {
  return accounts.some((item) => item.disable_message === false);
}

export function isZaloMessageEnabled(account: ZaloAccount): boolean {
  return account.disable_message === false;
}

export function isZaloChatbotEnabled(
  account: Pick<ZaloAccount, "is_chatbot"> | { is_chatbot?: boolean },
): boolean {
  // Chuẩn hóa truthy — list/API đôi khi trả 1/"true"
  const v = account.is_chatbot as unknown;
  return v === true || v === 1 || v === "true" || v === "1";
}

export function getZaloCheckTaskStatus(
  result: Pick<ZaloAccountCheckResultResponse, "task_status" | "status">,
): string | undefined {
  return result.task_status ?? result.status;
}

export function isZaloCheckTaskPending(status?: string): boolean {
  return status === "PENDING" || status === "PROGRESS";
}

export function isLoginQrSuccess(result: unknown): boolean {
  if (result === true) return true;
  if (typeof result === "string") {
    const normalized = result.trim().toLowerCase();
    return (
      normalized === "thành công" ||
      normalized === "success" ||
      normalized === "true"
    );
  }
  return false;
}

export function getLoginQrResultToast(
  result: unknown,
  isRelogin: boolean,
): { type: "success" | "warning"; message: string } {
  if (isLoginQrSuccess(result)) {
    return {
      type: "success",
      message: isRelogin
        ? "Đăng nhập lại thành công."
        : "Thêm tài khoản thành công.",
    };
  }

  if (result === false) {
    return {
      type: "warning",
      message: isRelogin
        ? "Đăng nhập lại thất bại."
        : "Thêm tài khoản thất bại.",
    };
  }

  if (typeof result === "string" && result.trim()) {
    return { type: "warning", message: result.trim() };
  }

  return {
    type: "warning",
    message: isRelogin
      ? "Đăng nhập lại thất bại."
      : "Thêm tài khoản thất bại.",
  };
}

export function formatMessageListenerError(message: string): string {
  if (message.includes("gói listener") || message.includes("hết hạn")) {
    return `${message}. Vui lòng mua hoặc gia hạn gói tin nhắn.`;
  }
  if (message.includes("dùng hết") || message.includes("số lượng")) {
    return `${message}. Vui lòng tắt bớt tài khoản Zalo khác hoặc nâng cấp gói.`;
  }
  if (message.includes("tắt chức năng tin nhắn")) {
    return `${message}. Hãy bật chức năng ở cấp người dùng trước.`;
  }
  return message;
}