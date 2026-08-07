"use client";

import CustomerReviewsCarousel from "@/components/storefront/CustomerReviewsCarousel";
import LayoutProductTile from "@/components/storefront/layouts/LayoutProductTile";
import type { StorefrontLayoutProps } from "@/components/storefront/layouts/types";
import StoreLoading from "@/components/storefront/StoreLoading";
import { buildStoreCategoryUrl, buildStoreUrl, shopImageUrl } from "@/lib/shop-utils";
import { useShopCartStore } from "@/stores/use-shop-cart-store";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

/** Mobile Native PWA Layout — Responsive Pro Hybrid (App PWA di động & Luxury PC Storefront) */
export default function MobileNativeLayout({
  sellerId,
  categories,
  products,
  filteredProducts,
  config,
  loading,
  onQuickView,
}: StorefrontLayoutProps) {
  const openCart = useShopCartStore((s) => s.openCart);
  const cart = useShopCartStore((s) => s.cart);
  const itemCount = cart?.items?.reduce((s, i) => s + i.quantity, 0) ?? 0;
  const [reelIndex, setReelIndex] = useState(0);
  const reels = products.slice(0, 5);

  useEffect(() => {
    if (reels.length <= 1) return;
    const t = setInterval(
      () => setReelIndex((i) => (i + 1) % reels.length),
      3500,
    );
    return () => clearInterval(t);
  }, [reels.length]);

  const active = reels[reelIndex];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-24 pt-2">
      {/* Hero Showcase Cinema Banner — Responsive 16:9 Mobile & Ultra-Wide PC Banner */}
      <section className="relative overflow-hidden rounded-[2rem] border border-stone-200/90 bg-stone-950 shadow-2xl dark:border-stone-800">
        <div className="relative aspect-video sm:aspect-[21/9] lg:aspect-[24/9] w-full overflow-hidden">
          {active?.images[0] ? (
            <Image
              src={shopImageUrl(active.images[0])}
              alt={active.title}
              fill
              className="object-cover transition-transform duration-700 hover:scale-105"
              unoptimized
              priority
              sizes="(max-width: 1280px) 100vw, 1280px"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />

          {/* Banner Hero Copy Overlay */}
          <div className="absolute bottom-4 left-4 right-4 sm:bottom-8 sm:left-8 sm:right-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-3 py-1 text-[11px] font-black uppercase text-stone-950 shadow-md">
                ⚡ Live Showcase · Flash Deal
              </span>
              <h2 className="mt-2 text-lg sm:text-2xl lg:text-3xl font-extrabold text-white line-clamp-2 drop-shadow-md">
                {config.heroTitle?.trim() || active?.title || "Sản Phẩm Đỉnh Cao"}
              </h2>
              {config.heroSubtitle?.trim() ? (
                <p className="mt-1 hidden sm:block text-xs sm:text-sm text-stone-300 line-clamp-2">
                  {config.heroSubtitle}
                </p>
              ) : null}
            </div>

            {/* Reel Thumbnails Selector on PC & Mobile */}
            <div className="flex items-center gap-2">
              {reels.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setReelIndex(idx)}
                  className={`relative h-10 w-10 sm:h-12 sm:w-12 overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                    idx === reelIndex
                      ? "border-amber-400 scale-110 shadow-lg ring-2 ring-amber-400/50"
                      : "border-white/30 opacity-60 hover:opacity-100"
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                >
                  {item.images[0] ? (
                    <Image
                      src={shopImageUrl(item.images[0])}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized
                      sizes="48px"
                    />
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Category Rail — Horizontal on Mobile, Luxury Grid Pills on PC */}
      {config.showCategoryRail && categories.length > 0 ? (
        <section id="categories" className="mt-6 sm:mt-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-stone-400">
              🏷️ Danh Mục Phổ Biến
            </h3>
            <span className="text-xs text-stone-400 font-medium">
              {categories.length} danh mục
            </span>
          </div>

          <div className="store-scroll-x flex sm:flex-wrap items-center gap-2.5 pb-2">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={buildStoreCategoryUrl(sellerId, c.id)}
                className="group flex shrink-0 cursor-pointer items-center gap-2.5 rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-bold text-stone-800 shadow-2xs transition-all duration-200 hover:border-amber-400 hover:bg-amber-400 hover:text-stone-950 hover:shadow-md dark:border-stone-800 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-amber-400 dark:hover:text-stone-950"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-stone-100 text-[11px] font-black text-stone-700 transition-colors group-hover:bg-stone-950 group-hover:text-amber-400 dark:bg-stone-800 dark:text-stone-300">
                  {c.name.charAt(0)}
                </span>
                <span className="truncate">{c.name}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* Flash Sale Banner Strip */}
      {config.showFlashSale ? (
        <div className="mt-6 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-pink-600 p-4 text-white shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl animate-bounce">⚡</span>
            <div>
              <p className="text-sm font-black uppercase tracking-wide">
                Flash Sale Giờ Vàng
              </p>
              <p className="text-xs text-white/90">
                Săn ngay deal độc quyền ưu đãi lên đến 50%
              </p>
            </div>
          </div>
          <a
            href="#products"
            className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-stone-950 shadow-md hover:bg-stone-100 transition-all"
          >
            Khám Phá Ngay
          </a>
        </div>
      ) : null}

      {/* Main Products Grid — 2-Col Mobile, 3-Col Tablet, 4-Col PC Pro */}
      <section id="products" className="scroll-mt-24 mt-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base sm:text-xl font-bold text-stone-900 dark:text-white">
              🛍️ Sản Phẩm Gian Hàng
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Hiển thị {filteredProducts.length} sản phẩm chất lượng cao
            </p>
          </div>
        </div>

        {loading ? (
          <StoreLoading />
        ) : (
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6">
            {filteredProducts.map((p) => (
              <LayoutProductTile
                key={p.id}
                product={p}
                sellerId={sellerId}
                variant="compact"
                showBadges={config.showFlashBadge}
                onQuickView={onQuickView}
              />
            ))}
          </div>
        )}
      </section>

      {/* Customer Reviews Section */}
      {config.showReviews !== false ? (
        <section className="mt-12">
          <CustomerReviewsCarousel variant="dense" />
        </section>
      ) : null}

      {/* Bottom Floating Nav Bar (Mobile PWA layout tab bar) */}
      {config.showBottomNav ? (
        <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-lg border-t border-stone-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-stone-800 dark:bg-stone-950/95 sm:hidden">
          <div className="grid grid-cols-5 py-1.5">
            {[
              { label: "Trang chủ", href: buildStoreUrl(sellerId), icon: "⌂" },
              { label: "Danh mục", href: "#categories", icon: "▦" },
              { label: "Deals", href: "#products", icon: "%" },
              {
                label: "Giỏ",
                href: "#",
                icon: "◎",
                action: openCart,
                badge: itemCount,
              },
              { label: "Shop", href: buildStoreUrl(sellerId), icon: "☺" },
            ].map((tab) =>
              tab.action ? (
                <button
                  key={tab.label}
                  type="button"
                  onClick={tab.action}
                  className="relative flex cursor-pointer flex-col items-center gap-0.5 py-1 text-[10px] font-semibold text-stone-600 dark:text-stone-400"
                >
                  <span className="text-lg leading-none">{tab.icon}</span>
                  {tab.label}
                  {tab.badge ? (
                    <span className="absolute right-3 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-pink-500 px-1 text-[9px] font-bold text-white">
                      {tab.badge}
                    </span>
                  ) : null}
                </button>
              ) : (
                <Link
                  key={tab.label}
                  href={tab.href}
                  className="flex cursor-pointer flex-col items-center gap-0.5 py-1 text-[10px] font-semibold text-stone-600 dark:text-stone-400"
                >
                  <span className="text-lg leading-none">{tab.icon}</span>
                  {tab.label}
                </Link>
              ),
            )}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
