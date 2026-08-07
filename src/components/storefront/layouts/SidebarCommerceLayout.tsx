"use client";

import CustomerReviewsCarousel from "@/components/storefront/CustomerReviewsCarousel";
import LayoutProductTile from "@/components/storefront/layouts/LayoutProductTile";
import type { StorefrontLayoutProps } from "@/components/storefront/layouts/types";
import StoreLoading from "@/components/storefront/StoreLoading";
import { buildStoreCategoryUrl, buildStoreUrl, formatVnd } from "@/lib/shop-utils";
import { useShopCartStore } from "@/stores/use-shop-cart-store";
import Link from "next/link";
import { useMemo, useState } from "react";

/** B2B / Enterprise App Layout — Command Center (Visual Depth 7 Lớp & Filter Drawer Mobile) */
export default function SidebarCommerceLayout({
  sellerId,
  cover,
  categories,
  filteredProducts,
  config,
  loading,
  search,
  onSearchChange,
  sort,
  onSortChange,
  onQuickView,
}: StorefrontLayoutProps) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [priceMax, setPriceMax] = useState(20_000_000);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const cart = useShopCartStore((s) => s.cart);
  const openCart = useShopCartStore((s) => s.openCart);
  const openCheckout = useShopCartStore((s) => s.openCheckout);
  const itemCount = cart?.items?.reduce((s, i) => s + i.quantity, 0) ?? 0;
  const total = cart?.total_amount ?? 0;

  const visible = useMemo(() => {
    return filteredProducts.filter((p) => {
      const price = Number(p.variants[0]?.price ?? 0);
      if (price && price > priceMax) return false;
      if (inStockOnly && p.variants.every((v) => Number(v.total_quantity ?? 0) === 0)) return false;
      return true;
    });
  }, [filteredProducts, priceMax, inStockOnly]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16 pt-3">
      {/* Top B2B Enterprise Metric Banner */}
      <section className="mb-6 rounded-3xl border border-stone-200/90 bg-gradient-to-r from-stone-900 via-stone-950 to-stone-900 p-4 sm:p-6 text-white shadow-xl dark:border-stone-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-400 font-black text-stone-950 text-xl shadow-md">
              {(cover?.name ?? "B").charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2.5 py-0.5 text-[10px] font-black uppercase text-amber-300 border border-amber-400/30">
                  ⚡ B2B Verified Supplier
                </span>
              </div>
              <h1 className="mt-1 text-lg sm:text-2xl font-black text-white tracking-tight">
                {cover?.name || "Trung Tâm Cung Cấp B2B"}
              </h1>
            </div>
          </div>

          {/* B2B Metrics Badges */}
          <div className="grid grid-cols-3 gap-2 text-center sm:flex sm:items-center sm:gap-4">
            <div className="rounded-2xl bg-white/5 p-2.5 backdrop-blur-md border border-white/10 sm:px-4">
              <p className="text-[10px] font-extrabold uppercase text-stone-400">Kho B2B</p>
              <p className="text-xs sm:text-sm font-black text-amber-400">{filteredProducts.length} SP</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-2.5 backdrop-blur-md border border-white/10 sm:px-4">
              <p className="text-[10px] font-extrabold uppercase text-stone-400">Chiết Khấu Sỉ</p>
              <p className="text-xs sm:text-sm font-black text-emerald-400">Tới 35%</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-2.5 backdrop-blur-md border border-white/10 sm:px-4">
              <p className="text-[10px] font-extrabold uppercase text-stone-400">Giao Hàng</p>
              <p className="text-xs sm:text-sm font-black text-sky-400">Hỏa Tốc 2H</p>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Toggle Filter Button */}
      <div className="mb-4 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
          className="flex w-full cursor-pointer items-center justify-between rounded-2xl border border-stone-200 bg-white px-4 py-3 text-xs font-black text-stone-900 shadow-2xs dark:border-stone-800 dark:bg-stone-900 dark:text-white"
        >
          <span className="flex items-center gap-2">
            <span>⚙️</span> Bộ Lọc B2B & Danh Mục
          </span>
          <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] text-stone-950">
            {mobileFilterOpen ? "Ẩn ▲" : "Hiển thị ▼"}
          </span>
        </button>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Left B2B Control Sidebar Panel */}
        <aside
          className={`w-full shrink-0 lg:sticky lg:top-20 lg:w-72 lg:block ${
            mobileFilterOpen ? "block" : "hidden lg:block"
          }`}
        >
          <div className="rounded-3xl border border-stone-200/90 bg-white/95 p-5 shadow-xs backdrop-blur-md dark:border-stone-800/90 dark:bg-stone-900/95">
            {/* Header info */}
            <div className="border-b border-stone-100 dark:border-stone-800/80 pb-4">
              <p className="text-[10px] font-black uppercase tracking-wider text-amber-500">
                ⚡ B2B Enterprise Panel
              </p>
              <h2 className="mt-1 text-sm font-extrabold text-stone-900 dark:text-white">
                Bộ Lọc Sản Phẩm Sỉ
              </h2>
            </div>

            {/* Category Navigation Tree */}
            <div className="mt-5">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-2">
                📁 Danh Mục B2B ({categories.length})
              </p>
              <nav className="space-y-1.5 max-h-72 custom-scrollbar overflow-y-auto pr-1">
                <Link
                  href={buildStoreUrl(sellerId)}
                  className="flex items-center justify-between rounded-2xl px-3.5 py-2.5 text-xs font-extrabold text-stone-950 bg-amber-400 shadow-xs transition-colors"
                >
                  <span>Tất cả danh mục</span>
                  <span className="rounded-full bg-stone-950 px-2 py-0.5 text-[10px] font-black text-amber-400">
                    {filteredProducts.length}
                  </span>
                </Link>
                {categories.map((c) => (
                  <Link
                    key={c.id}
                    href={buildStoreCategoryUrl(sellerId, c.id)}
                    className="group flex items-center justify-between rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-950 dark:hover:text-white transition-all"
                  >
                    <span className="truncate">{c.name}</span>
                    <span className="text-[10px] font-bold text-stone-400 group-hover:text-amber-500">→</span>
                  </Link>
                ))}
              </nav>
            </div>

            {/* Price Range Filter */}
            <div className="mt-6 border-t border-stone-100 dark:border-stone-800/80 pt-5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                  💵 Mức Giá Tối Đa
                </p>
                <span className="rounded-full bg-amber-400/20 px-2.5 py-0.5 text-xs font-black text-amber-500 border border-amber-400/30">
                  {formatVnd(priceMax)}
                </span>
              </div>
              <input
                type="range"
                min={100000}
                max={20000000}
                step={500000}
                value={priceMax}
                onChange={(e) => setPriceMax(Number(e.target.value))}
                className="mt-3.5 w-full cursor-pointer accent-amber-400"
              />
            </div>

            {/* Availability & Stock Filter */}
            <div className="mt-6 border-t border-stone-100 dark:border-stone-800/80 pt-5">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-3">
                ⚙️ Trạng Thái Tồn Kho
              </p>
              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-stone-100 dark:border-stone-800/80 p-3 text-xs font-bold text-stone-800 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-950 transition-colors">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="h-4.5 w-4.5 rounded border-stone-300 text-amber-400 focus:ring-amber-400 cursor-pointer"
                />
                Chỉ hiện sản phẩm sẵn kho
              </label>
            </div>
          </div>
        </aside>

        {/* Main Content & Products Area */}
        <main className="flex-1 min-w-0">
          {/* B2B Command Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-stone-200/90 bg-white/95 p-4 shadow-xs backdrop-blur-md dark:border-stone-800/90 dark:bg-stone-900/95 mb-6">
            <div className="flex flex-1 min-w-[220px] items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="search"
                  value={search}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Tìm theo tên, mã SKU sản phẩm B2B..."
                  className="h-11 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 pl-10 text-xs font-medium text-stone-900 outline-none focus:border-amber-400 focus:bg-white dark:border-stone-800 dark:bg-stone-950 dark:text-white dark:focus:border-amber-400 transition-all"
                />
                <svg
                  className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <select
                value={sort}
                onChange={(e) => onSortChange(e.target.value as typeof sort)}
                className="h-11 cursor-pointer rounded-2xl border border-stone-200 bg-stone-50 px-3.5 text-xs font-bold text-stone-800 outline-none hover:bg-stone-100 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-200 transition-all"
              >
                <option value="default">Sắp xếp mặc định</option>
                <option value="price_asc">Giá: Thấp → Cao</option>
                <option value="price_desc">Giá: Cao → Thấp</option>
                <option value="name_asc">Tên: A → Z</option>
              </select>

              {/* View Switcher Pill */}
              <div className="flex rounded-2xl border border-stone-200 bg-stone-50 p-1 dark:border-stone-800 dark:bg-stone-950">
                <button
                  type="button"
                  onClick={() => setView("grid")}
                  className={`flex h-9 items-center gap-1.5 cursor-pointer rounded-xl px-3.5 text-xs font-black transition-all ${
                    view === "grid"
                      ? "bg-amber-400 text-stone-950 shadow-xs scale-102"
                      : "text-stone-500 hover:text-stone-900 dark:text-stone-400"
                  }`}
                >
                  <span>▦</span> Grid
                </button>
                <button
                  type="button"
                  onClick={() => setView("list")}
                  className={`flex h-9 items-center gap-1.5 cursor-pointer rounded-xl px-3.5 text-xs font-black transition-all ${
                    view === "list"
                      ? "bg-amber-400 text-stone-950 shadow-xs scale-102"
                      : "text-stone-500 hover:text-stone-900 dark:text-stone-400"
                  }`}
                >
                  <span>☰</span> List
                </button>
              </div>
            </div>
          </div>

          {/* Product Results Grid / List */}
          {loading ? (
            <StoreLoading />
          ) : visible.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-stone-300 p-12 text-center dark:border-stone-800">
              <p className="text-sm font-bold text-stone-500">Không tìm thấy sản phẩm B2B phù hợp</p>
            </div>
          ) : view === "list" ? (
            <div className="space-y-3.5">
              {visible.map((p, idx) => (
                <LayoutProductTile
                  key={p.id}
                  product={p}
                  sellerId={sellerId}
                  variant="list"
                  index={idx}
                  onQuickView={onQuickView}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
              {visible.map((p, idx) => (
                <LayoutProductTile
                  key={p.id}
                  product={p}
                  sellerId={sellerId}
                  variant="compact"
                  index={idx}
                  onQuickView={onQuickView}
                />
              ))}
            </div>
          )}

          {/* Reviews section */}
          {config.showReviews !== false ? (
            <section className="mt-12">
              <CustomerReviewsCarousel variant="dense" />
            </section>
          ) : null}
        </main>
      </div>

      {/* Floating B2B Persistent Quick Cart Strip */}
      {config.showPersistentCartStrip && itemCount > 0 ? (
        <div className="fixed bottom-6 left-4 right-4 z-40 mx-auto max-w-xl rounded-3xl border border-stone-800 bg-stone-950/95 p-4 text-white shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400 font-black text-stone-950 text-base shadow-md">
                {itemCount}
              </div>
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400">Giỏ Hàng B2B</p>
                <p className="text-base font-black text-white">{formatVnd(total)}</p>
              </div>
            </div>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={openCart}
                className="cursor-pointer rounded-2xl border border-stone-700 bg-stone-800 px-4 py-2.5 text-xs font-bold text-stone-200 hover:bg-stone-700 transition-all"
              >
                Xem Giỏ
              </button>
              <button
                type="button"
                onClick={openCheckout}
                className="cursor-pointer rounded-2xl bg-amber-400 px-5 py-2.5 text-xs font-black text-stone-950 hover:bg-amber-300 shadow-md transition-all hover:scale-105"
              >
                Thanh Toán →
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
