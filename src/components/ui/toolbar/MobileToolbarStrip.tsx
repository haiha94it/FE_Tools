"use client";

import type { ReactNode } from "react";

interface MobileToolbarStripProps {
  children: ReactNode;
  className?: string;
}

/**
 * Nhóm nút toolbar — mobile: 1 hàng cuộn ngang; desktop: wrap + gap đều.
 */
export default function MobileToolbarStrip({
  children,
  className = "",
}: MobileToolbarStripProps) {
  return (
    <div
      className={`order-2 flex flex-wrap items-center gap-2 max-sm:-mx-0.5 max-sm:flex-nowrap max-sm:overflow-x-auto max-sm:overscroll-x-contain max-sm:pb-0.5 max-sm:[&_button]:shrink-0 ${className}`}
    >
      {children}
    </div>
  );
}

/** Nút toolbar gọn trên mobile — desktop giữ size sm mặc định */
export const mobileToolbarButtonClass =
  "max-sm:!px-3 max-sm:!py-2 max-sm:!text-xs max-sm:!leading-tight";