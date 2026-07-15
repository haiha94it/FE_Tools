import { useEffect } from "react";

/** §5.6 — refetch GET results mỗi 3–10s khi campaign đang chạy và màn log mở */
export function useCampaignResultsAutoRefresh(options: {
  enabled: boolean;
  isRunning: boolean;
  refreshResults: (options?: { silent?: boolean }) => Promise<void>;
  intervalMs?: number;
}) {
  const { enabled, isRunning, refreshResults, intervalMs = 5000 } = options;

  useEffect(() => {
    if (!enabled || !isRunning) return;

    const timer = window.setInterval(() => {
      void refreshResults({ silent: true });
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [enabled, isRunning, refreshResults, intervalMs]);
}