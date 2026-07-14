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

export function isVideoTaskBusinessSuccess(
  result: ZaloVideoTaskResultResponse,
): boolean {
  const normalized = normalizeVideoTaskResult(result);
  return normalized.data?.status === true;
}