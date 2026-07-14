"use client";

import { useCallback, useEffect, useRef } from "react";

/** Giữ handler ổn định cho effect/listener — tránh re-run khi parent re-render */
export function useStableHandler<T extends (...args: never[]) => void>(
  handler: T,
): T {
  const ref = useRef(handler);
  useEffect(() => {
    ref.current = handler;
  });

  return useCallback((...args: Parameters<T>) => {
    ref.current(...args);
  }, []) as T;
}