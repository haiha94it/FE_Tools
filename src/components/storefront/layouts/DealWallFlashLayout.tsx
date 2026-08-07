"use client";

import CustomerReviewsCarousel from "@/components/storefront/CustomerReviewsCarousel";
import LayoutProductTile from "@/components/storefront/layouts/LayoutProductTile";
import type { StorefrontLayoutProps } from "@/components/storefront/layouts/types";
import StoreLoading from "@/components/storefront/StoreLoading";
import { buildStoreCategoryUrl, formatPriceRange, shopImageUrl } from "@/lib/shop-utils";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

/** Amazon / Temu / Shopee — density + flash urgency */
export default function DealWallFlashLayout({
  sellerId,
  categories,
  products,
  filteredProducts,
  config,
  loading,
  search,
  onSearchChange,
  sort,
  onSortChange,
  onQuickView,
}: StorefrontLayoutProps) {
  const [timeLeft, setTimeLeft] = useState({ h: 2, m: 45, s: 19 });
  const flashProducts = products.filter((p) => p.is_flash_sale || p.is_hot).slice(0, 8);
  const dealRail = flashProducts.length > 0 ? flashProducts : products.slice(0, 8);
  const slider = products.slice(0, 3);

  useEffect(() => {
    const t = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.s > 0) return { ...prev, s: prev.s - 1 };
        if (prev.m > 0) return { ...prev, m: prev.m - 1, s: 59 };
        if (prev.h > 0) return { h: prev.h - 1, m: 59, s: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="pb-10">
      {/* Utility sticky filter bar under header */}
      <div className="sticky top-[6.5rem] z-30 border-b border-orange-100 bg-white/95 shadow-sm backdrop-blur sm:top-[7.5rem]">
        <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-3 py-2 sm:px-6">
          <span className="shrink-0 text-[10px] font-extrabold uppercase text-orange-600">
            Danh mục
          </span>
          {categories.slice(0, 12).map((c) => (
            <Link
              key={c.id}
              href={buildStoreCategoryUrl(sellerId, c.id)}
              className="shrink-0 cursor-pointer rounded-full bg-orange-50 px-3 py-1.5 text-[11px] font-bold text-orange-800 hover:bg-orange-100"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Hero: 60% slider + 40% flash widgets */}
      <section className="mx-auto max-w-7xl px-3 pt-3 sm:px-6 sm:pt-4">
        {config.showAnnouncement && config.announcement ? (
          <div className="mb-3 rounded-lg bg-gradient-to-r from-orange-600 to-rose-500 px-3 py-2 text-center text-xs font-bold text-white">
            {config.announcement}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-10">
          <div className="relative min-h-[200px] overflow-hidden rounded-xl bg-slate-900 lg:col-span-6 lg:min-h-[280px]">
            {slider[0]?.images[0] ? (
              <Image
                src={shopImageUrl(slider[0].images[0])}
                alt=""
                fill
                className="object-cover opacity-90"
                unoptimized
                priority
                sizes="60vw"
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" />
            <div className="absolute bottom-0 left-0 p-4 sm:p-6">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-orange-300">
                Hot deal
              </p>
              <h1 className="mt-1 max-w-md text-xl font-extrabold text-white sm:text-2xl">
                {config.heroTitle?.trim() ||
                  slider[0]?.title ||
                  "Sản phẩm"}
              </h1>
              <p className="mt-1 text-sm text-white/80">
                {config.heroSubtitle?.trim() ||
                  (slider[0] || products[0]
                    ? formatPriceRange(slider[0] ?? products[0])
                    : "")}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 lg:col-span-4">
            <div className="rounded-xl bg-gradient-to-br from-orange-600 to-rose-600 p-4 text-white shadow-lg">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-orange-100">
                Flash sale
              </p>
              <p className="mt-1 text-sm font-bold">Kết thúc sau</p>
              <div className="mt-2 flex gap-1.5 font-mono text-lg font-black">
                <span className="rounded bg-black/25 px-2 py-1">{pad(timeLeft.h)}</span>
                <span>:</span>
                <span className="rounded bg-black/25 px-2 py-1">{pad(timeLeft.m)}</span>
                <span>:</span>
                <span className="rounded bg-black/25 px-2 py-1">{pad(timeLeft.s)}</span>
              </div>
            </div>
            {dealRail.slice(0, 2).map((p) => {
              const sold = 55 + (p.id % 40);
              return (
                <div
                  key={p.id}
                  className="flex gap-3 rounded-xl border border-orange-100 bg-white p-2.5 shadow-sm"
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    {p.images[0] ? (
                      <Image
                        src={shopImageUrl(p.images[0])}
                        alt=""
                        fill
                        className="object-cover"
                        unoptimized
                        sizes="64px"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-xs font-bold text-slate-800">{p.title}</p>
                    <p className="text-sm font-extrabold text-orange-600">
                      {formatPriceRange(p)}
                    </p>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-orange-100">
                      <div
                        className="h-full bg-orange-500"
                        style={{ width: `${sold}%` }}
                      />
                    </div>
                    <p className="text-[9px] font-medium text-orange-700">Đã bán {sold}%</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Horizontal deal rail */}
      <section className="mt-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3 sm:px-6">
          <h2 className="text-sm font-extrabold text-orange-700">Deal đang cháy</h2>
          <span className="text-[11px] font-medium text-slate-500">Vuốt ngang →</span>
        </div>
        <div className="store-scroll-x mt-2 flex gap-2 px-3 pb-2 sm:px-6">
          {dealRail.map((p) => (
            <div key={p.id} className="w-[140px] shrink-0 sm:w-[160px]">
              <LayoutProductTile
                product={p}
                sellerId={sellerId}
                variant="deal"
                onQuickView={onQuickView}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Dense 5-col grid */}
      <section id="products" className="mx-auto max-w-7xl scroll-mt-40 px-3 pt-6 sm:px-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-extrabold text-slate-900">
            Tất cả deal · {filteredProducts.length}
          </h2>
          <div className="flex items-center gap-2">
            <input
              type="search"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Lọc SP..."
              className="h-9 w-36 rounded-lg border border-slate-200 px-2 text-xs sm:w-48"
            />
            <select
              value={sort}
              onChange={(e) => onSortChange(e.target.value as typeof sort)}
              className="h-9 cursor-pointer rounded-lg border border-slate-200 px-2 text-xs font-bold"
            >
              <option value="default">Nổi bật</option>
              <option value="price_asc">Giá ↑</option>
              <option value="price_desc">Giá ↓</option>
            </select>
          </div>
        </div>

        {loading ? (
          <StoreLoading />
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-2.5 md:grid-cols-4 lg:grid-cols-5">
            {filteredProducts.map((p) => (
              <LayoutProductTile
                key={p.id}
                product={p}
                sellerId={sellerId}
                variant="deal"
                onQuickView={onQuickView}
              />
            ))}
          </div>
        )}
      </section>

      {config.showReviews !== false ? (
        <div className="mt-8">
          <CustomerReviewsCarousel variant="dense" />
        </div>
      ) : null}
    </div>
  );
}
