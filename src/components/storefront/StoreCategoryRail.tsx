"use client";

import { buildStoreCategoryUrl, buildStoreUrl } from "@/lib/shop-utils";
import type { ShopCategory, ShopCategoryStyle } from "@/types/zalo-shop";
import Link from "next/link";
import type { ReactNode } from "react";

interface StoreCategoryRailProps {
  sellerId: string;
  categories: ShopCategory[];
  activeId?: number | null;
  /** horizontal (default) | vertical for sidebar-rail layout */
  orientation?: "horizontal" | "vertical";
  categoryStyle?: ShopCategoryStyle;
  className?: string;
  /** Bỏ max-width wrapper khi nest trong sidebar */
  flush?: boolean;
}

function CategoryIcon({ name }: { name: string }): ReactNode {
  const n = name.toLowerCase();
  const cls = "h-4 w-4";

  if (n.includes("tai nghe") || n.includes("headphone") || n.includes("earphone")) {
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 18v-6a9 9 0 0118 0v6" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" />
      </svg>
    );
  }
  if (n.includes("loa") || n.includes("speaker") || n.includes("âm thanh")) {
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <circle cx="12" cy="12" r="3" />
        <circle cx="12" cy="6" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (n.includes("điện thoại") || n.includes("phone") || n.includes("mobile")) {
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <rect x="7" y="2" width="10" height="20" rx="2" />
        <path strokeLinecap="round" d="M11 18h2" />
      </svg>
    );
  }
  if (n.includes("đồng hồ") || n.includes("watch")) {
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <circle cx="12" cy="12" r="7" />
        <path strokeLinecap="round" d="M12 9v3l2 1" />
        <path strokeLinecap="round" d="M9 3h6M9 21h6" />
      </svg>
    );
  }
  if (n.includes("phụ kiện") || n.includes("cáp") || n.includes("sạc")) {
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    );
  }
  if (n.includes("áo") || n.includes("quần") || n.includes("thời trang")) {
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 4l4 4-2 1-1 11H7L6 9 4 8l4-4h2l2 3 2-3h2z" />
      </svg>
    );
  }
  if (n.includes("mỹ phẩm") || n.includes("skincare") || n.includes("làm đẹp")) {
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2 3 5 5 5 9a5 5 0 11-10 0c0-4 3-6 5-9z" />
      </svg>
    );
  }
  return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h10" />
    </svg>
  );
}

function linkClass(
  isActive: boolean,
  style: ShopCategoryStyle,
  vertical: boolean,
): string {
  const base = `flex shrink-0 cursor-pointer items-center gap-2 text-xs font-bold transition-all duration-200 ${
    vertical ? "w-full justify-start px-3 py-2.5" : "h-11 px-4"
  }`;

  if (style === "underline") {
    return `${base} rounded-none border-b-2 ${
      isActive
        ? "border-[var(--store-accent)] text-[var(--store-primary)]"
        : "border-transparent text-slate-600 hover:text-slate-900"
    }`;
  }

  if (style === "chips") {
    return `${base} rounded-full ${
      isActive
        ? "store-pill-accent"
        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
    }`;
  }

  if (style === "icons") {
    return `${base} flex-col gap-1 rounded-xl py-2.5 ${
      isActive
        ? "store-pill-active"
        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
    } ${vertical ? "!flex-row !gap-2" : "min-w-[4.5rem]"}`;
  }

  // pills (default)
  return `${base} rounded-xl ${
    isActive
      ? "store-pill-active"
      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
  }`;
}

export default function StoreCategoryRail({
  sellerId,
  categories,
  activeId = null,
  orientation = "horizontal",
  categoryStyle = "pills",
  className = "",
  flush = false,
}: StoreCategoryRailProps) {
  if (categories.length === 0) return null;

  const vertical = orientation === "vertical";
  const items = (
    <>
      <Link
        href={buildStoreUrl(sellerId)}
        className={linkClass(activeId == null, categoryStyle, vertical)}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
        <span>Tất cả</span>
      </Link>
      {categories.map((cat) => {
        const isActive = activeId === cat.id;
        return (
          <Link
            key={cat.id}
            href={buildStoreCategoryUrl(sellerId, cat.id)}
            className={linkClass(isActive, categoryStyle, vertical)}
          >
            <span className={isActive ? "text-inherit" : "text-slate-500"}>
              <CategoryIcon name={cat.name} />
            </span>
            <span className={vertical ? "truncate" : "whitespace-nowrap"}>{cat.name}</span>
          </Link>
        );
      })}
    </>
  );

  if (vertical) {
    return (
      <nav
        id="categories"
        className={`scroll-mt-36 ${className}`}
        aria-label="Danh mục"
      >
        <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-500">
          Danh mục
        </p>
        <div
          className="flex flex-col gap-1 rounded-2xl border border-slate-200/80 p-2 shadow-sm"
          style={{ backgroundColor: "var(--store-surface, #fff)" }}
        >
          {items}
        </div>
      </nav>
    );
  }

  const inner = (
    <>
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <h2 className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">
          Danh mục
        </h2>
        <span className="text-[11px] font-medium text-slate-400">
          Vuốt ngang để xem thêm
        </span>
      </div>
      <div
        className={`store-scroll-x flex items-center gap-2 p-2 shadow-sm ${
          categoryStyle === "underline"
            ? "border-b border-slate-200 bg-transparent"
            : "rounded-2xl border border-slate-200/80"
        }`}
        style={
          categoryStyle === "underline"
            ? undefined
            : { backgroundColor: "var(--store-surface, #fff)" }
        }
      >
        {items}
      </div>
    </>
  );

  return (
    <section id="categories" className={`scroll-mt-36 px-4 pt-5 sm:px-6 sm:pt-6 ${className}`}>
      {flush ? inner : <div className="mx-auto max-w-7xl">{inner}</div>}
    </section>
  );
}
