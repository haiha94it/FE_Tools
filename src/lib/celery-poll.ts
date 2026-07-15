import type { ScanTaskResponse } from "@/types/zalo-contacts";

export interface CeleryPollData<T = unknown> {
  id_task?: string | number;
  task_status?: string;
  status?: string;
  result?: T;
  message?: string;
  error?: string;
  data?: unknown;
}

/** Envelope mới (`task_status`) hoặc legacy (`status`) — §16.2 contract */
export function getCeleryTaskStatus(
  result: Pick<CeleryPollData, "task_status" | "status">,
): string | undefined {
  return result.task_status ?? result.status;
}

export function isCeleryTaskPending(status?: string): boolean {
  return (
    !status ||
    status === "PENDING" ||
    status === "PROGRESS" ||
    status === "STARTED" ||
    status === "RETRY"
  );
}

export function isCeleryTaskDone(status?: string): boolean {
  return (
    status === "SUCCESS" ||
    status === "FAILURE" ||
    status === "FAILED" ||
    status === "REVOKED"
  );
}

/** Chuẩn hóa poll Celery → `status` + `data` (đọc `result` khi SUCCESS) */
export function normalizeCeleryPollResponse<T = unknown>(
  body: CeleryPollData<T>,
): ScanTaskResponse {
  const status = getCeleryTaskStatus(body);
  const payload =
    status === "SUCCESS" ? (body.result ?? body.data) : body.data;

  return {
    ...body,
    task_status: body.task_status,
    status,
    data: payload,
    result: body.result,
  };
}

/** Bóc envelope lồng `{ success, data: [...] }` trong `result` Celery */
export function unwrapCeleryNestedPayload(payload: unknown): unknown {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return payload;
  }
  const record = payload as Record<string, unknown>;
  if ("data" in record) return record.data;
  return payload;
}

/**
 * Sync nhóm Zalo — `result.data[].groups` (§16.4).
 * Ví dụ: task SUCCESS → result → data[0].groups[]
 */
export function extractGroupsFromScanTaskPayload(payload: unknown): unknown[] {
  const unwrapped = unwrapCeleryNestedPayload(payload);
  if (!unwrapped) return [];

  if (Array.isArray(unwrapped)) {
    const fromAccountRows = unwrapped.flatMap((row) => {
      if (!row || typeof row !== "object") return [];
      const groups = (row as { groups?: unknown[] }).groups;
      return Array.isArray(groups) ? groups : [];
    });
    if (fromAccountRows.length) return fromAccountRows;
    return unwrapped;
  }

  if (typeof unwrapped === "object") {
    const record = unwrapped as Record<string, unknown>;
    if (Array.isArray(record.groups)) return record.groups;
  }

  return [];
}

export function countGroupsInScanTaskPayload(payload: unknown): number {
  return extractGroupsFromScanTaskPayload(payload).length;
}

export async function pollCeleryTask<T>(
  pollFn: (idTask: string | number) => Promise<CeleryPollData<T>>,
  idTask: string | number,
  options?: { maxAttempts?: number; intervalMs?: number },
): Promise<T> {
  const maxAttempts = options?.maxAttempts ?? 60;
  const intervalMs = options?.intervalMs ?? 1500;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const body = await pollFn(idTask);
    const status = getCeleryTaskStatus(body);

    if (status === "SUCCESS") {
      return (body.result ?? body.data) as T;
    }

    if (isCeleryTaskDone(status) && status !== "SUCCESS") {
      throw new Error(body.message || body.error || "Celery task failed");
    }

    await new Promise((resolve) => window.setTimeout(resolve, intervalMs));
  }

  throw new Error("Task timeout");
}