"use client";

import type { ShopSortOption } from "@/types/zalo-shop";

interface StoreToolbarProps {
  title: string;
  subtitle?: string;
  search?: string;
  onSearchChange?: (value: string) => void;
  sort: ShopSortOption;
  onSortChange: (value: ShopSortOption) => void;
  searchPlaceholder?: string;
}

const SORT_OPTIONS: { value: ShopSortOption; label: string }[] = [
  { value: "default", label: "Nổi bật nhất" },
  { value: "price_asc", label: "Giá: Thấp → Cao" },
  { value: "price_desc", label: "Giá: Cao → Thấp" },
  { value: "name_asc", label: "Tên: A → Z" },
  { value: "name_desc", label: "Tên: Z → A" },
];

export default function StoreToolbar({
  title,
  subtitle,
  sort,
  onSortChange,
}: StoreToolbarProps) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-pink-600">
          Bộ sưu tập
        </p>
        <h2 className="store-display mt-1 text-2xl font-normal text-slate-900 sm:text-3xl">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        ) : null}
      </div>

      <div className="relative w-full sm:w-auto sm:min-w-[200px]">
        <label htmlFor="store-sort" className="sr-only">
          Sắp xếp sản phẩm
        </label>
        <select
          id="store-sort"
          value={sort}
          onChange={(e) => onSortChange(e.target.value as ShopSortOption)}
          className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white px-3.5 pr-9 text-xs font-bold text-slate-800 shadow-sm transition focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}
