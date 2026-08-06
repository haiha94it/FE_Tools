"use client";

import {
  buildStoreCategoryUrl,
  buildStoreUrl,
} from "@/lib/shop-utils";
import type { ShopCategory } from "@/types/zalo-shop";
import Link from "next/link";

interface StoreCategoryRailProps {
  sellerId: string;
  categories: ShopCategory[];
  activeId?: number | null;
}

export default function StoreCategoryRail({
  sellerId,
  categories,
  activeId = null,
}: StoreCategoryRailProps) {
  if (categories.length === 0) return null;

  return (
    <section className="mt-5 px-4 sm:mt-6 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="store-glass flex gap-2 overflow-x-auto rounded-2xl p-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Link
            href={buildStoreUrl(sellerId)}
            className={`shrink-0 cursor-pointer rounded-xl px-5 py-2.5 text-sm font-medium transition-all duration-200 ${
              activeId == null
                ? "store-pill-active"
                : "text-[var(--store-muted)] hover:bg-white/80 hover:text-[var(--store-primary)]"
            }`}
          >
            Tất cả
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={buildStoreCategoryUrl(sellerId, cat.id)}
              className={`shrink-0 cursor-pointer rounded-xl px-5 py-2.5 text-sm font-medium transition-all duration-200 ${
                activeId === cat.id
                  ? "store-pill-active"
                  : "text-[var(--store-muted)] hover:bg-white/80 hover:text-[var(--store-primary)]"
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}