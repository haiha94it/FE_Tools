"use client";

import CustomerReviewsCarousel from "@/components/storefront/CustomerReviewsCarousel";
import LayoutProductTile from "@/components/storefront/layouts/LayoutProductTile";
import type { StorefrontLayoutProps } from "@/components/storefront/layouts/types";
import StoreLoading from "@/components/storefront/StoreLoading";
import { buildStoreCategoryUrl, formatPriceRange, shopImageUrl } from "@/lib/shop-utils";
import Image from "next/image";
import Link from "next/link";

/** Vogue / Kinfolk High-Fashion Magazine Editorial Layout — Asymmetrical Lookbook & Gold Accents */
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
  const heroProduct = products[0];
  const spotlightProducts = products.slice(1, 3);
  const bannerImg = cover?.image ? shopImageUrl(cover.image) : null;
  const shopName = cover?.name?.trim() || "Cửa hàng";

  return (
    <div className="pb-24 pt-4 bg-stone-950 text-stone-100 min-h-screen">
      {/* ── 1. Vogue High-Fashion Editorial Masthead ── */}
      <header className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center pb-6 border-b border-stone-800">
        <div className="flex items-center justify-between text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] text-amber-400/90 py-1">
          <span>ISSUE N° 08 · EDITION LUXE</span>
          <span className="hidden sm:inline">⚡ BỘ SƯU TẬP THƯƠNG HIỆU CAO CẤP</span>
          <span>EST. 2026</span>
        </div>

        <h1 className="mt-2 text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white font-serif italic drop-shadow-lg">
          {config.heroTitle?.trim() || shopName}
        </h1>

        <p className="mt-2 max-w-2xl mx-auto text-xs sm:text-sm font-medium text-stone-400 tracking-wide">
          {config.heroSubtitle?.trim() || "Khám phá định nghĩa mới của phong cách & đẳng cấp thời trang độc bản."}
        </p>
      </header>

      {/* ── 2. Editorial Asymmetrical Hero Feature Stage ── */}
      <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Large Magazine Cover Banner (7 Cols) */}
          <div className="lg:col-span-7 relative group overflow-hidden rounded-3xl border border-stone-800 bg-stone-900 shadow-2xl">
            <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full">
              {bannerImg ? (
                <Image
                  src={bannerImg}
                  alt={shopName}
                  fill
                  className="object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                  unoptimized
                  priority
                  sizes="(max-width: 1024px) 100vw, 60vw"
                />
              ) : heroProduct?.images[0] ? (
                <Image
                  src={shopImageUrl(heroProduct.images[0])}
                  alt={heroProduct.title}
                  fill
                  className="object-contain p-8 bg-stone-900 transition-transform duration-1000 group-hover:scale-105"
                  unoptimized
                  priority
                  sizes="(max-width: 1024px) 100vw, 60vw"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-stone-900 via-stone-950 to-stone-900" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />
            </div>

            <div className="absolute bottom-6 left-6 right-6 z-10">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-3.5 py-1 text-[10px] font-black uppercase text-stone-950 tracking-widest shadow-md">
                ✨ Curator&apos;s Choice 2026
              </span>
              <h2 className="mt-2 text-xl sm:text-3xl font-black text-white leading-tight">
                {heroProduct?.title || shopName}
              </h2>
              {heroProduct ? (
                <div className="mt-3 flex items-center gap-3">
                  <span className="text-lg font-black text-amber-400">{formatPriceRange(heroProduct)}</span>
                  {onQuickView ? (
                    <button
                      type="button"
                      onClick={() => onQuickView(heroProduct)}
                      className="cursor-pointer rounded-2xl bg-amber-400 px-4 py-2 text-xs font-black text-stone-950 hover:bg-amber-300 transition-all shadow-md"
                    >
                      Xem Nhanh 🔍
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          {/* Right Curator's Manifesto Card (5 Cols) */}
          <div className="lg:col-span-5 rounded-3xl border border-stone-800 bg-stone-900/90 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-5">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-widest text-amber-400">
                Editorial Manifesto
              </span>
            </div>

            <blockquote className="text-lg sm:text-xl font-serif italic text-stone-200 leading-relaxed border-l-2 border-amber-400 pl-4">
              &quot;Phong cách không chỉ là những gì bạn mặc, đó là tuyên ngôn tự tin về cá tính và gu thẩm mỹ thượng thừa.&quot;
            </blockquote>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="rounded-2xl border border-stone-800 bg-stone-950 p-3.5">
                <p className="text-[10px] font-black uppercase text-stone-400">Chất Lượng</p>
                <p className="text-xs font-bold text-amber-400 mt-0.5">💎 Chính Hãng 100%</p>
              </div>
              <div className="rounded-2xl border border-stone-800 bg-stone-950 p-3.5">
                <p className="text-[10px] font-black uppercase text-stone-400">Vận Chuyển</p>
                <p className="text-xs font-bold text-emerald-400 mt-0.5">⚡ Hỏa Tốc 2H</p>
              </div>
            </div>

            <a
              href="#products"
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-amber-400/40 bg-amber-400/10 py-3.5 text-xs font-black uppercase tracking-wider text-amber-300 hover:bg-amber-400 hover:text-stone-950 transition-all shadow-md"
            >
              <span>Xem Toàn Bộ Catalog Editorial</span>
              <span>→</span>
            </a>
          </div>
        </div>
      </section>

      {/* ── 3. Lookbook Spotlight Dual Cards ── */}
      {spotlightProducts.length > 0 ? (
        <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between pb-6 border-b border-stone-800">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Lookbook</span>
              <h2 className="text-xl font-black uppercase tracking-wider text-white">
                Sản Phẩm Tiêu Điểm
              </h2>
            </div>
            <span className="text-xs font-bold text-stone-400">02 / {filteredProducts.length} Items</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
            {spotlightProducts.map((p, idx) => (
              <div
                key={p.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-stone-800 bg-stone-900 p-5 shadow-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-amber-400/80"
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-stone-950">
                  {p.images[0] ? (
                    <Image
                      src={shopImageUrl(p.images[0])}
                      alt={p.title}
                      fill
                      className="object-contain p-6 transition-transform duration-700 group-hover:scale-105"
                      unoptimized
                      sizes="50vw"
                    />
                  ) : null}

                  <span className="absolute left-3 top-3 rounded-full bg-stone-950/90 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-400 border border-amber-400/30">
                    LOOK #{idx + 1}
                  </span>

                  <span className="absolute right-3 top-3 rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-stone-950 shadow-md">
                    {formatPriceRange(p)}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <h3 className="line-clamp-1 text-base font-extrabold text-white group-hover:text-amber-400 transition-colors">
                    {p.title}
                  </h3>
                  {onQuickView ? (
                    <button
                      type="button"
                      onClick={() => onQuickView(p)}
                      className="shrink-0 rounded-2xl border border-stone-700 bg-stone-800 px-3.5 py-2 text-xs font-bold text-stone-200 hover:border-amber-400 hover:bg-amber-400 hover:text-stone-950 transition-all cursor-pointer"
                    >
                      Xem nhanh 🔍
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* ── 4. Category Glass Navigation ── */}
      {config.showCategoryRail && categories.length > 0 ? (
        <nav className="mx-auto mt-12 flex max-w-7xl flex-wrap justify-center gap-3 px-4 lg:px-8">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={buildStoreCategoryUrl(sellerId, c.id)}
              className="group cursor-pointer rounded-2xl border border-stone-800 bg-stone-900/90 px-5 py-2.5 text-xs font-extrabold tracking-wider text-stone-300 shadow-sm backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-400 hover:bg-amber-400 hover:text-stone-950"
            >
              <span>{c.name}</span>
            </Link>
          ))}
        </nav>
      ) : null}

      {/* ── 5. Main Editorial Product Grid ── */}
      <section id="products" className="mx-auto max-w-7xl scroll-mt-28 px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between border-b border-stone-800 pb-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Editorial Gallery</span>
            <h2 className="text-xl font-black uppercase tracking-wider text-white">
              Toàn Bộ Bộ Sưu Tập
            </h2>
          </div>
          <span className="rounded-full bg-amber-400/20 border border-amber-400/30 px-3.5 py-1 text-xs font-black text-amber-400">
            {filteredProducts.length} sản phẩm
          </span>
        </div>

        {loading ? (
          <StoreLoading />
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
            {filteredProducts.map((p, index) => (
              <LayoutProductTile
                key={p.id}
                product={p}
                sellerId={sellerId}
                variant="editorial"
                index={index}
                onQuickView={onQuickView}
              />
            ))}
          </div>
        )}
      </section>

      {config.showReviews ? (
        <CustomerReviewsCarousel variant="editorial" />
      ) : null}
    </div>
  );
}
