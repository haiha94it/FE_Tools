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

/** TikTok Shop / PWA — 2-col + reel + bottom tabs */
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
    <div className="mx-auto max-w-lg pb-24">
      {/* 16:9 TikTok-style reel */}
      <section className="relative aspect-video overflow-hidden bg-slate-900">
        {active?.images[0] ? (
          <Image
            src={shopImageUrl(active.images[0])}
            alt=""
            fill
            className="object-cover"
            unoptimized
            priority
            sizes="100vw"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-pink-300">
            Live reel
          </p>
          <p className="line-clamp-1 text-sm font-bold text-white">
            {config.heroTitle?.trim() || active?.title || "Sản phẩm"}
          </p>
        </div>
        <div className="absolute bottom-3 right-3 flex gap-1">
          {reels.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setReelIndex(i)}
              className={`h-1 w-4 cursor-pointer rounded-full ${
                i === reelIndex ? "bg-white" : "bg-white/40"
              }`}
              aria-label={`Reel ${i + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Story categories */}
      {config.showCategoryRail ? (
        <div className="store-scroll-x flex gap-3 border-b border-slate-100 px-3 py-3">
          {categories.slice(0, 10).map((c) => (
            <Link
              key={c.id}
              href={buildStoreCategoryUrl(sellerId, c.id)}
              className="flex shrink-0 cursor-pointer flex-col items-center gap-1"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-rose-600 text-xs font-bold text-white">
                {c.name.charAt(0)}
              </span>
              <span className="max-w-[56px] truncate text-[10px] font-semibold text-slate-600">
                {c.name}
              </span>
            </Link>
          ))}
        </div>
      ) : null}

      {/* Flash strip */}
      {config.showFlashSale ? (
        <div className="mx-3 mt-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-3 py-2 text-center text-xs font-bold text-white">
          Flash · Chạm để săn deal
        </div>
      ) : null}

      {/* Strict 2-column large touch targets */}
      <section id="products" className="scroll-mt-20 px-2 pt-3">
        {loading ? (
          <StoreLoading />
        ) : (
          <div className="grid grid-cols-2 gap-2">
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

      {config.showReviews !== false ? (
        <div className="mt-4">
          <CustomerReviewsCarousel variant="dense" />
        </div>
      ) : null}

      {/* Bottom tab bar */}
      {config.showBottomNav ? (
        <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-lg border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
          <div className="grid grid-cols-5 py-1.5">
            {[
              { label: "Home", href: buildStoreUrl(sellerId), icon: "⌂" },
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
                  className="relative flex cursor-pointer flex-col items-center gap-0.5 py-1 text-[10px] font-semibold text-slate-600"
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
                  className="flex cursor-pointer flex-col items-center gap-0.5 py-1 text-[10px] font-semibold text-slate-600"
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
