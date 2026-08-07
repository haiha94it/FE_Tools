"use client";

import CustomerReviewsCarousel from "@/components/storefront/CustomerReviewsCarousel";
import LayoutProductTile from "@/components/storefront/layouts/LayoutProductTile";
import type { StorefrontLayoutProps } from "@/components/storefront/layouts/types";
import StoreLoading from "@/components/storefront/StoreLoading";
import { buildStoreCategoryUrl, buildStoreUrl } from "@/lib/shop-utils";
import Link from "next/link";

/** IKEA / Zara — no hero, story circles, masonry staggered feed */
export default function CatalogFirstMasonryLayout({
  sellerId,
  categories,
  filteredProducts,
  config,
  loading,
  onQuickView,
}: StorefrontLayoutProps) {
  return (
    <div className="pb-16">
      {/* Instagram-style story category circles — immediate entry */}
      <section id="categories" className="border-b border-slate-100 bg-white px-3 py-4 sm:px-6">
        <div className="store-scroll-x mx-auto flex max-w-6xl gap-4">
          <Link
            href={buildStoreUrl(sellerId)}
            className="flex w-16 shrink-0 cursor-pointer flex-col items-center gap-1.5"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-slate-800 to-slate-600 text-xs font-bold text-white ring-2 ring-offset-2 ring-slate-300">
              All
            </span>
            <span className="w-full truncate text-center text-[10px] font-semibold text-slate-600">
              Tất cả
            </span>
          </Link>
          {categories.map((c, i) => (
            <Link
              key={c.id}
              href={buildStoreCategoryUrl(sellerId, c.id)}
              className="flex w-16 shrink-0 cursor-pointer flex-col items-center gap-1.5"
            >
              <span
                className="flex h-14 w-14 items-center justify-center rounded-full text-sm font-bold text-white ring-2 ring-offset-2 ring-slate-200"
                style={{
                  background: `linear-gradient(135deg, hsl(${(i * 47) % 360} 45% 45%), hsl(${(i * 47 + 40) % 360} 50% 35%)`,
                }}
              >
                {c.name.charAt(0)}
              </span>
              <span className="w-full truncate text-center text-[10px] font-semibold text-slate-600">
                {c.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Masonry-like staggered grid */}
      <section id="products" className="mx-auto max-w-6xl scroll-mt-28 px-3 py-6 sm:px-6">
        <p className="mb-4 text-xs font-medium uppercase tracking-[0.15em] text-slate-400">
          Lookbook · {filteredProducts.length} items
        </p>

        {loading ? (
          <StoreLoading />
        ) : (
          <div className="columns-2 gap-3 sm:columns-3 sm:gap-4 lg:columns-4">
            {filteredProducts.map((p, i) => (
              <div key={p.id} className="mb-3 break-inside-avoid sm:mb-4">
                <LayoutProductTile
                  product={p}
                  sellerId={sellerId}
                  variant="masonry"
                  tall={i % 3 === 0 || i % 5 === 0}
                  onQuickView={onQuickView}
                />
              </div>
            ))}
          </div>
        )}

        {!loading && filteredProducts.length > 0 ? (
          <p className="mt-10 text-center text-xs text-[var(--store-muted)]">
            Cuộn để khám phá thêm · chạm + để xem nhanh
          </p>
        ) : null}
      </section>

      {config.showReviews !== false ? (
        <CustomerReviewsCarousel variant="minimal" />
      ) : null}
    </div>
  );
}
