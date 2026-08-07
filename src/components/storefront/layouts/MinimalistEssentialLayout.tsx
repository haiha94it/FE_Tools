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

import StoreProductImageTooltip from "@/components/storefront/StoreProductImageTooltip";

/**
 * Minimalist Essential — High-Depth Glassmorphism & Modern 3D Elevation
 * Designed with UI/UX Pro Max guidelines for subtle luxury depth.
 */
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
    <div className="relative min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-100/90 via-slate-50 to-zinc-100/60 pb-24 text-slate-900 overflow-hidden">
      {/* Background Ambient Depth Orbs */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-pink-200/30 via-purple-200/20 to-sky-200/30 blur-[120px] opacity-70" />
      <div className="pointer-events-none absolute top-[600px] -left-32 h-96 w-96 rounded-full bg-slate-200/40 blur-[100px]" />
      <div className="pointer-events-none absolute top-[1000px] -right-32 h-96 w-96 rounded-full bg-purple-100/30 blur-[100px]" />

      {/* Compact Header for Minimal Layout */}
      <section className="relative mx-auto max-w-4xl px-4 pt-6 sm:px-6 sm:pt-8 text-center">
        {config.heroTitle?.trim() ? (
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            {config.heroTitle}
          </h1>
        ) : null}
        {config.heroSubtitle?.trim() ? (
          <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
            {config.heroSubtitle}
          </p>
        ) : null}
      </section>

          {/* Featured Product Hero Card with 3D Elevation */}
          {focus ? (
            <StoreProductImageTooltip product={focus}>
              <Link
                href={buildStoreProductUrl(sellerId, focus.id, focus.category)}
                className="group relative mx-auto mt-9 flex max-w-md flex-col items-center rounded-2xl border border-slate-200/70 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-[0_10px_30px_-10px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1.5 hover:border-slate-400 hover:shadow-[0_25px_50px_-12px_rgba(15,23,42,0.14)]"
              >
                <div className="relative aspect-square w-full max-w-[260px] overflow-hidden rounded-xl border border-slate-100 bg-white p-3 shadow-inner">
                  {focusImg ? (
                    <Image
                      src={focusImg}
                      alt={focus.title}
                      fill
                      className="object-contain p-4 transition-transform duration-500 group-hover:scale-108"
                      unoptimized
                      priority
                      sizes="260px"
                    />
                  ) : null}
                  <div className="absolute left-3 top-3 rounded-md bg-slate-900/90 px-2.5 py-1 text-[9px] font-bold tracking-widest text-white uppercase backdrop-blur-xs">
                    Sản phẩm nổi bật
                  </div>
                </div>

                <h2 className="mt-4 line-clamp-1 text-sm font-semibold text-slate-900 group-hover:text-black">
                  {focus.title}
                </h2>
                <p className="mt-1 text-base font-bold text-slate-900">
                  {formatPriceRange(focus)}
                </p>
              </Link>
            </StoreProductImageTooltip>
          ) : null}

          {/* CTA Action */}
          <div className="mt-6 flex justify-center">
            <a
              href="#products"
              className="group inline-flex cursor-pointer items-center gap-3 rounded-full bg-slate-900 px-8 py-3.5 text-xs font-bold tracking-widest text-white uppercase shadow-lg shadow-slate-900/20 transition-all duration-300 hover:bg-black hover:shadow-xl hover:shadow-slate-900/30 hover:scale-102 active:scale-98"
            >
              <span>{config.ctaText?.trim() || "Khám phá danh sách"}</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="transition-transform duration-300 group-hover:translate-x-1"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </div>

      {/* Floating Glass Category Navigation */}
      {config.showCategoryRail && categories.length > 0 ? (
        <nav className="relative mx-auto mt-12 flex max-w-5xl flex-wrap justify-center gap-2.5 px-4 sm:gap-3">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={buildStoreCategoryUrl(sellerId, c.id)}
              className="group cursor-pointer rounded-full border border-slate-200/80 bg-white/80 px-4 py-2 text-xs font-semibold tracking-wide text-slate-600 shadow-xs backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-900 hover:bg-white hover:text-slate-900 hover:shadow-md"
            >
              <span>{c.name}</span>
            </Link>
          ))}
        </nav>
      ) : null}

      {/* Product Grid Section with Card Lift Depth */}
      <section id="products" className="relative mx-auto max-w-6xl scroll-mt-28 px-4 py-14 sm:px-6">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="h-6 w-1 rounded-full bg-slate-900" />
            <p className="text-xs font-extrabold tracking-[0.2em] text-slate-400 uppercase">
              TẤT CẢ SẢN PHẨM ({filteredProducts.length})
            </p>
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-slate-200 via-slate-200/60 to-transparent mx-4" />
        </div>

        {loading ? (
          <StoreLoading />
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-16 text-center shadow-xs backdrop-blur-md">
            <p className="text-sm font-medium text-slate-500">Không tìm thấy sản phẩm nào trong danh mục này</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:gap-6">
            {filteredProducts.map((p) => {
              const img = p.images[0] ? shopImageUrl(p.images[0]) : null;
              return (
                <StoreProductImageTooltip key={p.id} product={p}>
                  <Link
                    href={buildStoreProductUrl(sellerId, p.id, p.category)}
                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_4px_20px_rgba(15,23,42,0.03)] transition-all duration-300 hover:-translate-y-1.5 hover:border-slate-300 hover:shadow-[0_20px_40px_-10px_rgba(15,23,42,0.1)] sm:p-5"
                  >
                    {/* Subtle Image Container with Layered Background */}
                    <div className="relative mx-auto aspect-square w-full overflow-hidden rounded-xl bg-gradient-to-b from-slate-50 to-slate-100/60 p-3">
                      {img ? (
                        <Image
                          src={img}
                          alt={p.title}
                          fill
                          className="object-contain p-3 transition-transform duration-500 group-hover:scale-106"
                          unoptimized
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        />
                      ) : null}
                    </div>

                    <div className="mt-4 flex flex-1 flex-col justify-between">
                      <div>
                        <h3 className="line-clamp-2 text-center text-xs font-semibold leading-relaxed text-slate-800 transition-colors group-hover:text-black sm:text-sm">
                          {p.title}
                        </h3>
                      </div>

                      <div className="mt-4 text-center">
                        <p className="text-sm font-bold text-slate-900 sm:text-base">
                          {formatPriceRange(p)}
                        </p>
                        
                        <div className="mt-3 flex items-center justify-center gap-1">
                          <span className="inline-flex cursor-pointer items-center justify-center rounded-full bg-slate-900 px-4 py-1.5 text-[10px] font-bold tracking-wider text-white uppercase shadow-xs transition-all duration-200 group-hover:bg-black group-hover:shadow-md">
                            Xem chi tiết
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </StoreProductImageTooltip>
              );
            })}
          </div>
        )}
      </section>

      {config.showReviews !== false ? (
        <div className="relative mt-8">
          <CustomerReviewsCarousel variant="minimal" />
        </div>
      ) : null}
    </div>
  );
}
