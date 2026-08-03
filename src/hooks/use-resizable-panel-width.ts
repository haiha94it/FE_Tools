"use client";

import { useCallback, useEffect, useState, type PointerEvent as ReactPointerEvent } from "react";

const DEFAULT_MIN = 220;
const DEFAULT_MAX = 520;

function readStoredWidth(storageKey: string, fallback: number): number {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return fallback;
    const n = Number(raw);
    return Number.isFinite(n) ? n : fallback;
  } catch {
    return fallback;
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/**
 * Kéo ngang đổi width panel — persist localStorage.
 * Dùng cho cột hội thoại messenger (desktop/tablet).
 */
export function useResizablePanelWidth(options: {
  storageKey: string;
  defaultWidth: number;
  minWidth?: number;
  maxWidth?: number;
}) {
  const {
    storageKey,
    defaultWidth,
    minWidth = DEFAULT_MIN,
    maxWidth = DEFAULT_MAX,
  } = options;

  const [width, setWidth] = useState(defaultWidth);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    setWidth(clamp(readStoredWidth(storageKey, defaultWidth), minWidth, maxWidth));
  }, [storageKey, defaultWidth, minWidth, maxWidth]);

  const persist = useCallback(
    (next: number) => {
      const value = clamp(next, minWidth, maxWidth);
      setWidth(value);
      try {
        localStorage.setItem(storageKey, String(value));
      } catch {
        // ignore quota
      }
      return value;
    },
    [minWidth, maxWidth, storageKey],
  );

  const startResize = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      event.preventDefault();
      const startX = event.clientX;
      const startWidth = width;
      const pointerId = event.pointerId;
      const target = event.currentTarget;
      target.setPointerCapture?.(pointerId);
      setDragging(true);

      const onMove = (e: PointerEvent) => {
        setWidth(clamp(startWidth + (e.clientX - startX), minWidth, maxWidth));
      };

      const onUp = (e: PointerEvent) => {
        setDragging(false);
        try {
          target.releasePointerCapture?.(pointerId);
        } catch {
          // ignore
        }
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
        document.removeEventListener("pointercancel", onUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        persist(startWidth + (e.clientX - startX));
      };

      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
      document.addEventListener("pointercancel", onUp);
    },
    [width, minWidth, maxWidth, persist],
  );

  /** Phím ← → tinh chỉnh width */
  const nudgeWidth = useCallback(
    (delta: number) => {
      persist(width + delta);
    },
    [persist, width],
  );

  return { width, dragging, startResize, nudgeWidth, minWidth, maxWidth };
}
