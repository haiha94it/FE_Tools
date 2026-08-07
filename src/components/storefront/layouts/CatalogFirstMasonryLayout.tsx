"use client";

import CustomerReviewsCarousel from "@/components/storefront/CustomerReviewsCarousel";
import LayoutProductTile from "@/components/storefront/layouts/LayoutProductTile";
import type { StorefrontLayoutProps } from "@/components/storefront/layouts/types";
import StoreLoading from "@/components/storefront/StoreLoading";
import { buildStoreCategoryUrl, buildStoreUrl } from "@/lib/shop-utils";
import Link from "next/link";
import { useState } from "react";

/** High-Fashion Zara / Vogue Editorial Lookbook & Masonry Feed */
export default function CatalogFirstMasonryLayout({
  sellerId,
  categories,
  filteredProducts,
  config,
  loading,
  onQuickView,
}: StorefrontLayoutProps) {
  const [activeTab, setActiveTab] = useState<"all" | "featured" | "new">("all");

  const title = config.heroTitle?.trim() || "Bộ Sưu Tập Sản Phẩm";
  const subtitle =
    config.heroSubtitle?.trim() ||
    "Khám phá các sản phẩm hot nhất — Thiết kế độc quyền, chất liệu cao cấp và phong cách dẫn đầu xu hướng.";

  const displayProducts =
    activeTab === "featured"
      ? filteredProducts.filter((p) => p.is_flash_sale || Number(p.variants[0]?.price || 0) > 200000)
      : activeTab === "new"
      ? [...filteredProducts].reverse()
      : filteredProducts;


  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 via-amber-50/20 to-stone-100/60 pb-20 dark:from-stone-950 dark:via-stone-900/60 dark:to-stone-950 text-stone-900 dark:text-stone-100">
      {/* ── High-End Magazine Banner / Header Showcase ── */}
      <section className="mx-auto max-w-6xl px-3 pt-4 sm:px-6 sm:pt-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 p-6 text-white shadow-2xl sm:p-10 border border-stone-800/80">
          {/* Subtle Ambient Aura */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-amber-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-rose-500/10 blur-3xl" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-xl">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="rounded-full bg-amber-400/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-300 border border-amber-400/30 backdrop-blur-md">
                  ✨ LOOKBOOK EDITORIAL 2026
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold tracking-wider text-stone-300 backdrop-blur-md">
                  Bộ Sưu Tập Mới
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white leading-tight">
                {title}
              </h1>

              <p className="mt-2.5 text-xs sm:text-sm text-stone-300 leading-relaxed">
                {subtitle}
              </p>

              {/* Quick Key Highlights */}
              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-semibold text-stone-300">
                <div className="flex items-center gap-1.5">
                  <span className="text-amber-400">🛍️</span>
                  <span>{filteredProducts.length} Sản Phẩm Khả Dụng</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-amber-400">⭐</span>
                  <span>4.9/5 Đánh Giá Độc Quyền</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-amber-400">🚀</span>
                  <span>Giao Nhanh 2H</span>
                </div>
              </div>
            </div>

            {/* Quick Action Navigation Filter */}
            <div className="flex items-center gap-2 rounded-2xl bg-white/10 p-1.5 backdrop-blur-xl border border-white/15">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "all"
                    ? "bg-amber-400 text-stone-950 shadow-md font-black"
                    : "text-stone-300 hover:text-white hover:bg-white/10"
                }`}
              >
                Tất Cả ({filteredProducts.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("featured")}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "featured"
                    ? "bg-amber-400 text-stone-950 shadow-md font-black"
                    : "text-stone-300 hover:text-white hover:bg-white/10"
                }`}
              >
                Nổi Bật 🔥
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("new")}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "new"
                    ? "bg-amber-400 text-stone-950 shadow-md font-black"
                    : "text-stone-300 hover:text-white hover:bg-white/10"
                }`}
              >
                Mới Nhất ✨
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Category Story Circle Row ── */}
      <section id="categories" className="mx-auto max-w-6xl px-3 py-5 sm:px-6">
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-xs font-black uppercase tracking-wider text-stone-500 dark:text-stone-400">
            Danh Mục Nổi Bật
          </h2>
          <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
            {categories.length} danh mục
          </span>
        </div>

        <div className="store-scroll-x flex gap-3.5 pb-2">
          <Link
            href={buildStoreUrl(sellerId)}
            className="group flex w-18 shrink-0 cursor-pointer flex-col items-center gap-2"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-stone-900 to-stone-700 text-xs font-black text-white ring-2 ring-amber-400 ring-offset-2 ring-offset-stone-50 shadow-md transition-transform duration-300 group-hover:scale-105 dark:ring-offset-stone-950">
              ALL
            </span>
            <span className="w-full truncate text-center text-xs font-bold text-stone-800 dark:text-stone-200">
              Tất cả
            </span>
          </Link>
          {categories.map((c, i) => (
            <Link
              key={c.id}
              href={buildStoreCategoryUrl(sellerId, c.id)}
              className="group flex w-18 shrink-0 cursor-pointer flex-col items-center gap-2"
            >
              <span
                className="flex h-16 w-16 items-center justify-center rounded-full text-base font-black text-white ring-2 ring-stone-200 ring-offset-2 ring-offset-stone-50 shadow-md transition-transform duration-300 group-hover:scale-105 group-hover:ring-amber-400 dark:ring-stone-800 dark:ring-offset-stone-950"
                style={{
                  background: `linear-gradient(135deg, hsl(${
                    (i * 53) % 360
                  } 55% 42%), hsl(${(i * 53 + 45) % 360} 60% 30%))`,
                }}
              >
                {c.name.charAt(0).toUpperCase()}
              </span>
              <span className="w-full truncate text-center text-xs font-bold text-stone-700 group-hover:text-amber-600 dark:text-stone-300 dark:group-hover:text-amber-400">
                {c.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Main Masonry & Dynamic Staggered Catalog Feed ── */}
      <section id="products" className="mx-auto max-w-6xl scroll-mt-28 px-3 py-4 sm:px-6">
        <div className="flex items-center justify-between mb-5 border-b border-stone-200/80 pb-3 dark:border-stone-800">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
              LOOKBOOK CATALOG
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-stone-900 dark:text-white">
              Sản Phẩm Thời Trang ({displayProducts.length})
            </h2>
          </div>
        </div>


        {loading ? (
          <StoreLoading />
        ) : displayProducts.length === 0 ? (
          <div className="my-12 rounded-3xl border border-dashed border-stone-300 p-12 text-center dark:border-stone-800 bg-white/50 dark:bg-stone-900/50 backdrop-blur-md">
            <span className="text-4xl">🛍️</span>
            <h3 className="mt-3 text-base font-bold text-stone-900 dark:text-white">
              Chưa tìm thấy sản phẩm phù hợp
            </h3>
            <p className="mt-1 text-xs text-stone-500">
              Vui lòng thử chọn danh mục khác hoặc xóa bộ lọc tìm kiếm.
            </p>
          </div>
        ) : displayProducts.length <= 2 ? (
          /* ── Editorial Dual Showcase Hero Grid (Solves Empty Layout Void for 1-2 Items!) ── */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {displayProducts.map((p, i) => (
              <div key={p.id} className="w-full">
                <LayoutProductTile
                  product={p}
                  sellerId={sellerId}
                  variant="masonry"
                  tall={true}
                  onQuickView={onQuickView}
                  index={i}
                />
              </div>
            ))}
          </div>
        ) : (
          /* ── Full Staggered Pinterest Masonry Grid (For 3+ Items) ── */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {displayProducts.map((p, i) => (
              <div
                key={p.id}
                className={i % 5 === 0 ? "col-span-1 sm:col-span-2 lg:col-span-2" : "col-span-1"}
              >
                <LayoutProductTile
                  product={p}
                  sellerId={sellerId}
                  variant="masonry"
                  tall={i % 2 === 0 || i % 5 === 0}
                  onQuickView={onQuickView}
                  index={i}
                />
              </div>
            ))}
          </div>
        )}

        {!loading && displayProducts.length > 0 ? (
          <div className="mt-12 text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white dark:bg-stone-900 px-5 py-2.5 text-xs font-bold text-stone-600 dark:text-stone-300 shadow-md border border-stone-200 dark:border-stone-800">
              <span>✨</span> Cuộn để xem thêm · Chạm 👁️ xem nhanh · Chạm Giỏ để mua ngay
            </span>
          </div>
        ) : null}
      </section>

      {/* ── Brand Trust & Value Proposition ── */}
      <section className="mx-auto max-w-6xl px-3 py-8 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 rounded-3xl bg-white dark:bg-stone-900 p-6 shadow-xl border border-stone-200/80 dark:border-stone-800">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-400/20 text-amber-600 text-lg">
              🚀
            </span>
            <div>
              <h4 className="text-xs font-black text-stone-900 dark:text-white">Giao Hàng 2H</h4>
              <p className="text-[10px] text-stone-500">Miễn phí từ 300k</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-400/20 text-rose-600 text-lg">
              🔄
            </span>
            <div>
              <h4 className="text-xs font-black text-stone-900 dark:text-white">Đổi Trả 7 Ngày</h4>
              <p className="text-[10px] text-stone-500">Thủ tục nhanh chóng</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/20 text-emerald-600 text-lg">
              🛡️
            </span>
            <div>
              <h4 className="text-xs font-black text-stone-900 dark:text-white">Chính Hãng 100%</h4>
              <p className="text-[10px] text-stone-500">Cam kết chất lượng</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-400/20 text-indigo-600 text-lg">
              💬
            </span>
            <div>
              <h4 className="text-xs font-black text-stone-900 dark:text-white">Tư Vấn Styling</h4>
              <p className="text-[10px] text-stone-500">Hỗ trợ 24/7</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Customer Reviews Section ── */}
      {config.showReviews !== false ? (
        <section className="mx-auto max-w-6xl px-3 sm:px-6">
          <CustomerReviewsCarousel variant="minimal" />
        </section>
      ) : null}
    </div>
  );
}
