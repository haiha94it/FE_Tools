import type { ReactNode } from "react";

interface ScrollableTableContainerProps {
  children: ReactNode;
  className?: string;
  /** Chiều cao cố định — dùng khi không có parent flex fill */
  maxHeightClass?: string;
  /** Lấp đầy vùng còn lại của parent flex — tránh 2 scroll (page + table) */
  fill?: boolean;
}

export default function ScrollableTableContainer({
  children,
  className = "",
  maxHeightClass = "max-h-[min(32rem,calc(100svh-18rem))]",
  fill = false,
}: ScrollableTableContainerProps) {
  const scrollClass = fill
    ? "custom-scrollbar h-full min-h-0 overflow-y-auto overflow-x-auto overscroll-contain"
    : `custom-scrollbar ${maxHeightClass} overflow-y-auto overflow-x-auto overscroll-contain`;

  return (
    <div
      className={`overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 ${
        fill ? "flex min-h-0 flex-1 flex-col" : ""
      } ${className}`}
    >
      <div className={scrollClass}>{children}</div>
    </div>
  );
}

export const stickyTableHeaderClass =
  "sticky top-0 z-10 border-b border-gray-100 bg-gray-50 dark:border-white/[0.05] dark:bg-gray-900";

/**
 * Shell trang data dày — h-0 flex-1: lấp phần còn lại của main, không đẩy scroll body.
 * Không dùng chỉ calc(100svh) (lỗi responsive) — kết hợp flex chain từ layout h-dvh.
 */
export const adminDataPageClass =
  "flex h-0 min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-hidden sm:gap-4";

export const adminDataPanelClass =
  "flex h-0 min-h-0 flex-1 flex-col overflow-hidden";