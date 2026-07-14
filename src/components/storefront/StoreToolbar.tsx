"use client";

import type { ShopSortOption } from "@/types/zalo-shop";

interface StoreToolbarProps {
  title: string;
  subtitle?: string;
  search: string;
  onSearchChange: (value: string) => void;
  sort: ShopSortOption;
  onSortChange: (value: ShopSortOption) => void;
  searchPlaceholder?: string;
}

const SORT_OPTIONS: { value: ShopSortOption; label: string }[] = [
  { value: "default", label: "Nổi bật" },
  { value: "price_asc", label: "Giá ↑" },
  { value: "price_desc", label: "Giá ↓" },
  { value: "name_asc", label: "A → Z" },
  { value: "name_desc", label: "Z → A" },
];

export default function StoreToolbar({
  title,
  subtitle,
  search,
  onSearchChange,
  sort,
  onSortChange,
  searchPlaceholder = "Tìm sản phẩm...",
}: StoreToolbarProps) {
  return (
    <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0 shrink-0">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--store-accent)]">
          Bộ sưu tập
        </p>
        <h2 className="store-display mt-2 text-3xl text-[var(--store-primary)] sm:text-4xl">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-2 text-sm text-[var(--store-muted)]">{subtitle}</p>
        ) : null}
      </div>

      <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row lg:max-w-xl lg:shrink">
        <div className="store-glass relative flex-1 rounded-2xl">
          <svg
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--store-muted)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-12 w-full cursor-text rounded-2xl bg-transparent pl-11 pr-4 text-sm text-[var(--store-primary)] placeholder:text-[var(--store-muted)] focus:outline-none"
          />
        </div>
        <div className="store-glass rounded-2xl">
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as ShopSortOption)}
            className="h-12 cursor-pointer rounded-2xl bg-transparent px-4 text-sm font-medium text-[var(--store-primary)] focus:outline-none"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}