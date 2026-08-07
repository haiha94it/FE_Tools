"use client";

import CustomerReviewsCarousel from "@/components/storefront/CustomerReviewsCarousel";
import LayoutProductTile from "@/components/storefront/layouts/LayoutProductTile";
import type { StorefrontLayoutProps } from "@/components/storefront/layouts/types";
import StoreLoading from "@/components/storefront/StoreLoading";
import { buildStoreCategoryUrl, buildStoreUrl, formatVnd } from "@/lib/shop-utils";
import { useShopCartStore } from "@/stores/use-shop-cart-store";
import Link from "next/link";
import { useMemo, useState } from "react";

/** B2B / Desktop app — permanent left panel + tool bar + list/grid + cart strip */
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
  const [view, setView] = useState<"grid" | "list">("list");
  const [priceMax, setPriceMax] = useState(10_000_000);
  const cart = useShopCartStore((s) => s.cart);
  const openCart = useShopCartStore((s) => s.openCart);
  const openCheckout = useShopCartStore((s) => s.openCheckout);
  const itemCount = cart?.items?.reduce((s, i) => s + i.quantity, 0) ?? 0;
  const total = cart?.total_amount ?? 0;

  const visible = useMemo(() => {
    // Soft client filter by max price when variants exist
    return filteredProducts.filter((p) => {
      const price = Number(p.variants[0]?.price ?? 0);
      if (!price) return true;
      return price <= priceMax;
    });
  }, [filteredProducts, priceMax]);

  return (
    <div className="flex min-h-[calc(100vh-0px)] flex-col lg:flex-row">
      {/* Permanent 250px left panel */}
      <aside className="w-full shrink-0 border-b border-slate-200 bg-white lg:sticky lg:top-0 lg:h-screen lg:w-[250px] lg:border-b-0 lg:border-r lg:overflow-y-auto">
        <div className="p-4">
          <Link href={buildStoreUrl(sellerId)} className="block">
            <p className="text-sm font-extrabold text-slate-900">
              {cover?.name || "Catalog"}
            </p>
            <p className="text-[11px] text-slate-500">B2B / Power shopper</p>
          </Link>

          <div className="mt-6">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Danh mục
            </p>
            <nav className="mt-2 space-y-0.5">
              <Link
                href={buildStoreUrl(sellerId)}
                className="block cursor-pointer rounded-lg px-2.5 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100"
              >
                Tất cả sản phẩm
              </Link>
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={buildStoreCategoryUrl(sellerId, c.id)}
                  className="block cursor-pointer rounded-lg px-2.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                >
                  {c.name}
                </Link>
              ))}
            </nav>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-4">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Khoảng giá
            </p>
            <input
              type="range"
              min={100000}
              max={20000000}
              step={100000}
              value={priceMax}
              onChange={(e) => setPriceMax(Number(e.target.value))}
              className="mt-3 w-full cursor-pointer accent-blue-600"
            />
            <p className="mt-1 text-xs font-semibold text-slate-700">
              ≤ {formatVnd(priceMax)}
            </p>
          </div>

          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Thương hiệu
            </p>
            <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs text-slate-600">
              <input type="checkbox" className="rounded" defaultChecked /> Chính hãng
            </label>
            <label className="mt-1.5 flex cursor-pointer items-center gap-2 text-xs text-slate-600">
              <input type="checkbox" className="rounded" /> Flash sale
            </label>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col pb-20">
        {/* Sticky toolbar */}
        <div className="sticky top-0 z-20 flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white/95 px-3 py-2.5 backdrop-blur sm:px-5">
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm trong catalog..."
            className="h-10 min-w-0 flex-1 rounded-lg border border-slate-200 px-3 text-sm"
          />
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as typeof sort)}
            className="h-10 cursor-pointer rounded-lg border border-slate-200 px-2 text-xs font-bold"
          >
            <option value="default">Mặc định</option>
            <option value="price_asc">Giá tăng</option>
            <option value="price_desc">Giá giảm</option>
            <option value="name_asc">Tên A-Z</option>
          </select>
          <div className="flex rounded-lg border border-slate-200 p-0.5">
            <button
              type="button"
              onClick={() => setView("grid")}
              className={`cursor-pointer rounded-md px-2.5 py-1.5 text-[11px] font-bold ${
                view === "grid" ? "bg-slate-900 text-white" : "text-slate-600"
              }`}
            >
              Grid
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              className={`cursor-pointer rounded-md px-2.5 py-1.5 text-[11px] font-bold ${
                view === "list" ? "bg-slate-900 text-white" : "text-slate-600"
              }`}
            >
              List
            </button>
          </div>
        </div>

        <div id="products" className="flex-1 p-3 sm:p-5">
          <p className="mb-3 text-xs text-slate-500">
            {visible.length} sản phẩm · chế độ {view}
          </p>
          {loading ? (
            <StoreLoading />
          ) : view === "list" ? (
            <div className="space-y-2">
              {visible.map((p) => (
                <LayoutProductTile
                  key={p.id}
                  product={p}
                  sellerId={sellerId}
                  variant="list"
                  onQuickView={onQuickView}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {visible.map((p) => (
                <LayoutProductTile
                  key={p.id}
                  product={p}
                  sellerId={sellerId}
                  variant="compact"
                  onQuickView={onQuickView}
                />
              ))}
            </div>
          )}

          {config.showReviews !== false ? (
            <div className="mt-8 border-t border-slate-200 pt-2">
              <CustomerReviewsCarousel variant="default" />
            </div>
          ) : null}
        </div>
      </div>

      {/* Persistent cart summary strip */}
      {config.showPersistentCartStrip ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] lg:left-[250px]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Giỏ hàng · {itemCount} SP
              </p>
              <p className="text-sm font-extrabold text-slate-900">
                {total > 0 ? formatVnd(total) : "Chưa có SP"}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={openCart}
                className="cursor-pointer rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold"
              >
                Xem giỏ
              </button>
              <button
                type="button"
                onClick={openCheckout}
                disabled={itemCount === 0}
                className="cursor-pointer rounded-lg bg-[var(--store-accent)] px-4 py-2 text-xs font-bold text-white disabled:opacity-40"
              >
                Thanh toán
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
