"use client";

import { useMediaQuery } from "@/hooks/use-media-query";

export type MessengerLayoutMode = "phone" | "tablet" | "desktop";

/**
 * phone   — <768px: 1 cột
 * tablet  — 768–1279px: 2 cột (hội thoại + chat), ẩn cột tài khoản
 * desktop — ≥1280px: 3 cột (tránh ép layout khi sidebar admin chiếm ~290px ở lg)
 */
export function useMessengerLayoutMode(): MessengerLayoutMode {
  const isDesktop = useMediaQuery("(min-width: 1280px)");
  const isTabletUp = useMediaQuery("(min-width: 768px)");

  if (isDesktop) return "desktop";
  if (isTabletUp) return "tablet";
  return "phone";
}