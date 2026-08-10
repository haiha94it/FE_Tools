import type {
  ZaloVideoTaskResultData,
  ZaloVideoTaskResultResponse,
} from "@/types/zalo-video";

/** Lấy trạng thái task — hỗ trợ envelope mới (`task_status`) và legacy (`status`) */
export function getVideoTaskStatus(
  result: Pick<ZaloVideoTaskResultResponse, "task_status" | "status">,
): string | undefined {
  return result.task_status ?? result.status;
}

export function isVideoTaskPending(status?: string): boolean {
  return (
    status === "PENDING" ||
    status === "PROGRESS" ||
    status === "STARTED" ||
    status === "RETRY"
  );
}

export function isVideoTaskTerminal(status?: string): boolean {
  return (
    status === "SUCCESS" ||
    status === "FAILURE" ||
    status === "FAILED" ||
    status === "REVOKED"
  );
}

function readInnerRecord(
  result: ZaloVideoTaskResultResponse,
): Record<string, unknown> | null {
  const candidate = result.result ?? result.data;
  if (candidate == null || typeof candidate !== "object") return null;
  return candidate as Record<string, unknown>;
}

/** Chuẩn hóa response /result — map envelope mới về shape legacy cho UI */
export function normalizeVideoTaskResult(
  raw: ZaloVideoTaskResultResponse,
): ZaloVideoTaskResultResponse {
  const taskStatus = getVideoTaskStatus(raw);
  const inner = readInnerRecord(raw);

  if (!inner) {
    return {
      ...raw,
      status: taskStatus ?? raw.status,
      task_status: taskStatus ?? raw.task_status,
    };
  }

  const success =
    typeof inner.success === "boolean"
      ? inner.success
      : typeof inner.status === "boolean"
        ? inner.status
        : undefined;

  const message =
    (typeof inner.message === "string" && inner.message) ||
    (typeof inner.messenger === "string" && inner.messenger) ||
    (typeof inner.error === "string" && inner.error) ||
    undefined;

  const data: ZaloVideoTaskResultData = {
    status: success,
    error: message,
    messenger: message,
    message,
    path: typeof inner.path === "string" ? inner.path : undefined,
  };

  return {
    ...raw,
    status: taskStatus ?? raw.status,
    task_status: taskStatus ?? raw.task_status,
    data,
    result: inner,
  };
}

export function getVideoTaskErrorMessage(
  result: ZaloVideoTaskResultResponse,
): string {
  const normalized = normalizeVideoTaskResult(result);
  return (
    normalized.data?.error ||
    normalized.data?.messenger ||
    normalized.data?.message ||
    normalized.message ||
    normalized.error ||
    "Tác vụ thất bại"
  );
}

/** Lấy error_code từ inner Celery result (nếu BE gửi). */
export function getVideoTaskErrorCode(
  result: ZaloVideoTaskResultResponse,
): string | undefined {
  const normalized = normalizeVideoTaskResult(result);
  const inner = normalized.result;
  if (inner && typeof inner === "object" && "error_code" in inner) {
    const code = (inner as { error_code?: unknown }).error_code;
    if (typeof code === "string" && code) return code;
  }
  return undefined;
}

/**
 * Nick chưa có Kênh Zalo Video — UI mở guide (popup instructions), không toast dài.
 * Khớp message cũ/mới + error_code CHANNEL_NOT_CREATED.
 */
export function isNoZaloVideoChannelError(
  resultOrMessage: ZaloVideoTaskResultResponse | string,
): boolean {
  if (typeof resultOrMessage === "string") {
    return matchesNoChannelMessage(resultOrMessage);
  }
  const code = getVideoTaskErrorCode(resultOrMessage);
  if (code === "CHANNEL_NOT_CREATED") return true;
  return matchesNoChannelMessage(getVideoTaskErrorMessage(resultOrMessage));
}

function matchesNoChannelMessage(message: string): boolean {
  const text = message.toLowerCase();
  // Không match generic “tạo kênh Creator” — message login/proxy cũng hay nhắc.
  return (
    text.includes("bạn cần có kênh") ||
    text.includes("chưa có kênh") ||
    text.includes("channel_not_created")
  );
}

export function isVideoTaskBusinessSuccess(
  result: ZaloVideoTaskResultResponse,
): boolean {
  const normalized = normalizeVideoTaskResult(result);
  return normalized.data?.status === true;
}