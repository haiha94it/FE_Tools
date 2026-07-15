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