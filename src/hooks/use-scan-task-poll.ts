"use client";

import { getScanTaskStatus, isScanTaskDone } from "@/lib/zalo-contacts-utils";
import type { ScanTaskResponse } from "@/types/zalo-contacts";
import { useEffect, useRef } from "react";

export function useScanTaskPoll<T>(options: {
  taskId: string | number | null;
  poll: (taskId: string | number) => Promise<T>;
  onResult: (result: T) => void;
  intervalMs?: number;
}) {
  const { taskId, poll, onResult, intervalMs = 3000 } = options;
  const onResultRef = useRef(onResult);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    if (!taskId) return;

    let active = true;

    const run = async () => {
      try {
        const result = await poll(taskId);
        if (!active) return;
        const status =
          result && typeof result === "object"
            ? getScanTaskStatus(result as ScanTaskResponse)
            : undefined;
        onResultRef.current(result);
        if (isScanTaskDone(status)) {
          active = false;
        }
      } catch {
        active = false;
      }
    };

    void run();
    const timer = window.setInterval(() => {
      if (active) void run();
    }, intervalMs);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [taskId, poll, intervalMs]);
}