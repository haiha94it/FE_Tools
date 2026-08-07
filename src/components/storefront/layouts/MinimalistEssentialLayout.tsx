"use client";

import CustomerReviewsCarousel from "@/components/storefront/CustomerReviewsCarousel";
import type { StorefrontLayoutProps } from "@/components/storefront/layouts/types";
import StoreLoading from "@/components/storefront/StoreLoading";
import {
  buildStoreCategoryUrl,
  buildStoreProductUrl,
  formatPriceRange,
  shopImageUrl,
} from "@/lib/shop-utils";
import Image from "next/image";
import Link from "next/link";

/** MUJI — single focus hero, divided 3-col monochrome grid */
export default function MinimalistEssentialLayout({
  sellerId,
  cover,
  categories,
  products,
  filteredProducts,
  config,
  loading,
}: StorefrontLayoutProps) {
  const focus = products[0];
  const focusImg = focus?.images[0] ? shopImageUrl(focus.images[0]) : null;

  return (
    <div className="pb-20">
      {/* Centered single-product focus hero */}
      <section className="mx-auto max-w-3xl px-4 pt-12 sm:px-6 sm:pt-16">
        <div className="rounded-sm border border-neutral-200 bg-neutral-50 px-6 py-12 text-center sm:px-12 sm:py-16">
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-neutral-400">
            Cửa hàng
          </p>
          <h1 className="mt-3 text-2xl font-normal tracking-tight text-neutral-900 sm:text-3xl">
            {config.heroTitle?.trim() ||
              focus?.title ||
              cover?.name?.trim() ||
              "Cửa hàng"}
          </h1>
          {config.heroSubtitle?.trim() ? (
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-neutral-500">
              {config.heroSubtitle}
            </p>
          ) : focus ? (
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-neutral-500">
              {formatPriceRange(focus)}
            </p>
          ) : null}

          {focus ? (
            <Link
              href={buildStoreProductUrl(sellerId, focus.id, focus.category)}
              className="group mx-auto mt-10 block max-w-xs"
            >
              <div className="relative mx-auto aspect-square w-full max-w-[280px] overflow-hidden bg-white">
                {focusImg ? (
                  <Image
                    src={focusImg}
                    alt={focus.title}
                    fill
                    className="object-contain p-6 transition group-hover:scale-[1.02]"
                    unoptimized
                    priority
                    sizes="280px"
                  />
                ) : null}
              </div>
              <p className="mt-4 text-sm text-neutral-800">{focus.title}</p>
              <p className="mt-1 text-sm font-medium text-neutral-900">
                {formatPriceRange(focus)}
              </p>
            </Link>
          ) : null}

          <a
            href="#products"
            className="mt-8 inline-block cursor-pointer border border-neutral-900 px-8 py-2.5 text-xs font-medium uppercase tracking-wider text-neutral-900 transition hover:bg-neutral-900 hover:text-white"
          >
            {config.ctaText?.trim() || "Xem sản phẩm"}
          </a>
        </div>
      </section>

      {/* Underline categories */}
      {config.showCategoryRail && categories.length > 0 ? (
        <nav className="mx-auto mt-12 flex max-w-4xl flex-wrap justify-center gap-x-8 gap-y-2 px-4">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={buildStoreCategoryUrl(sellerId, c.id)}
              className="cursor-pointer border-b border-transparent pb-0.5 text-xs tracking-wide text-neutral-500 transition hover:border-neutral-900 hover:text-neutral-900"
            >
              {c.name}
            </Link>
          ))}
        </nav>
      ) : null}

      {/* Divided 3-column grid */}
      <section id="products" className="mx-auto max-w-5xl scroll-mt-28 px-0 py-14 sm:px-6">
        <p className="mb-6 px-4 text-center text-[11px] uppercase tracking-[0.25em] text-neutral-400 sm:px-0">
          All items · {filteredProducts.length}
        </p>

        {loading ? (
          <StoreLoading />
        ) : (
          <div className="grid grid-cols-1 divide-y divide-neutral-200 border border-neutral-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {filteredProducts.map((p, i) => {
              const img = p.images[0] ? shopImageUrl(p.images[0]) : null;
              // Add horizontal dividers every 3 on desktop via row groups
              return (
                <Link
                  key={p.id}
                  href={buildStoreProductUrl(sellerId, p.id, p.category)}
                  className={`group flex flex-col p-6 sm:p-8 ${
                    i >= 3 ? "sm:border-t sm:border-neutral-200" : ""
                  }`}
                >
                  <div className="relative mx-auto aspect-square w-full max-w-[200px] bg-neutral-50">
                    {img ? (
                      <Image
                        src={img}
                        alt={p.title}
                        fill
                        className="object-contain p-4 transition group-hover:scale-[1.02]"
                        unoptimized
                        sizes="200px"
                      />
                    ) : null}
                  </div>
                  <h3 className="mt-5 text-center text-sm font-normal text-neutral-800">
                    {p.title}
                  </h3>
                  <p className="mt-1 text-center text-sm text-neutral-500">
                    {formatPriceRange(p)}
                  </p>
                  <span className="mt-4 block text-center text-[11px] font-medium uppercase tracking-wider text-neutral-900 underline-offset-4 group-hover:underline">
                    Chọn
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {config.showReviews !== false ? (
        <CustomerReviewsCarousel variant="minimal" />
      ) : null}
    </div>
  );
}
