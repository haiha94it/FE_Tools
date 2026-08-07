"use client";

import LayoutProductTile from "@/components/storefront/layouts/LayoutProductTile";
import type { StorefrontLayoutProps } from "@/components/storefront/layouts/types";
import CustomerReviewsCarousel from "@/components/storefront/CustomerReviewsCarousel";
import StoreLoading from "@/components/storefront/StoreLoading";
import { buildStoreCategoryUrl, shopImageUrl } from "@/lib/shop-utils";
import Image from "next/image";
import Link from "next/link";

/** Vogue / Kinfolk — editorial headline, dual heroes, quote bands, serif cards */
export default function MagazineEditorialLayout({
  sellerId,
  cover,
  categories,
  products,
  filteredProducts,
  config,
  loading,
  onQuickView,
}: StorefrontLayoutProps) {
  const left = products[0];
  const right = products[1];
  const mid = Math.ceil(filteredProducts.length / 2);

  return (
    <div className="pb-20">
      {/* Editorial headline + dual vertical images */}
      <section className="mx-auto max-w-6xl px-4 pt-10 sm:px-6 sm:pt-14">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.35em] text-[var(--store-muted)]">
          Cửa hàng
        </p>
        <h1 className="store-display mx-auto mt-3 max-w-4xl text-center text-3xl leading-[1.15] text-[var(--store-primary)] sm:text-5xl lg:text-6xl">
          {config.heroTitle?.trim() ||
            cover?.name?.trim() ||
            products[0]?.title ||
            "Cửa hàng"}
        </h1>
        {config.heroSubtitle?.trim() ? (
          <p className="mx-auto mt-4 max-w-xl text-center text-sm italic leading-relaxed text-[var(--store-muted)]">
            {config.heroSubtitle}
          </p>
        ) : (
          <p className="mx-auto mt-4 max-w-xl text-center text-sm leading-relaxed text-[var(--store-muted)]">
            {filteredProducts.length} sản phẩm
          </p>
        )}

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
          {[left, right].map((p, i) => (
            <div
              key={p?.id ?? i}
              className="relative aspect-[3/4] overflow-hidden bg-stone-200"
            >
              {p?.images[0] ? (
                <Image
                  src={shopImageUrl(p.images[0])}
                  alt={p.title}
                  fill
                  className="object-cover"
                  unoptimized
                  priority={i === 0}
                  sizes="50vw"
                />
              ) : null}
              {p ? (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-5">
                  <p className="store-display text-lg text-white">{p.title}</p>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      {/* Category underline nav */}
      {config.showCategoryRail && categories.length > 0 ? (
        <nav className="mx-auto mt-12 flex max-w-6xl flex-wrap justify-center gap-6 border-y border-stone-200 px-4 py-4">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={buildStoreCategoryUrl(sellerId, c.id)}
              className="cursor-pointer text-xs font-semibold uppercase tracking-[0.2em] text-stone-500 transition hover:text-stone-900"
            >
              {c.name}
            </Link>
          ))}
        </nav>
      ) : null}

      {/* First product wave */}
      <section id="products" className="mx-auto max-w-6xl scroll-mt-28 px-4 py-14 sm:px-6">
        <h2 className="store-display text-center text-2xl text-[var(--store-primary)]">
          Sản phẩm
        </h2>
        {loading ? (
          <StoreLoading />
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
            {filteredProducts.slice(0, mid || 6).map((p) => (
              <LayoutProductTile
                key={p.id}
                product={p}
                sellerId={sellerId}
                variant="editorial"
                onQuickView={onQuickView}
              />
            ))}
          </div>
        )}
      </section>

      {/* Full-width quote / review banner */}
      {/* Second wave */}
      {!loading && filteredProducts.length > mid ? (
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="store-display text-center text-2xl text-[var(--store-primary)]">
            Thêm sản phẩm
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
            {filteredProducts.slice(mid).map((p) => (
              <LayoutProductTile
                key={p.id}
                product={p}
                sellerId={sellerId}
                variant="editorial"
                onQuickView={onQuickView}
              />
            ))}
          </div>
        </section>
      ) : null}

      {config.showReviews ? (
        <CustomerReviewsCarousel variant="editorial" />
      ) : null}
    </div>
  );
}
