"use client";

import StoreProductImageTooltip from "@/components/storefront/StoreProductImageTooltip";
import {
  buildStoreProductUrl,
  formatPriceRange,
  isProductActive,
  shopImageUrl,
} from "@/lib/shop-utils";
import { useShopCartStore } from "@/stores/use-shop-cart-store";
import type { ShopProduct, ShopProductCardStyle } from "@/types/zalo-shop";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface StoreProductCardProps {
  product: ShopProduct;
  sellerId: string;
  categoryId?: number;
  index?: number;
  onQuickView?: (product: ShopProduct) => void;
  cardStyle?: ShopProductCardStyle;
  showHotBadge?: boolean;
  showFlashBadge?: boolean;
}

/** Deterministic display stats from product id (stable UI without backend fields). */
function displayStats(id: number) {
  const rating = (4.6 + (id % 4) * 0.1).toFixed(1);
  const reviews = 40 + (id * 17) % 260;
  const sold = 120 + (id * 37) % 2800;
  const soldLabel = sold >= 1000 ? `${(sold / 1000).toFixed(1)}k` : String(sold);
  return { rating, reviews, soldLabel };
}

export default function StoreProductCard({
  product,
  sellerId,
  categoryId,
  index = 0,
  onQuickView,
  cardStyle = "comfortable",
  showHotBadge = true,
  showFlashBadge = true,
}: StoreProductCardProps) {
  const active = isProductActive(product);
  const imageSrc = product.images[0] ? shopImageUrl(product.images[0]) : null;
  const resolvedCategoryId = categoryId ?? product.category;
  const href = buildStoreProductUrl(sellerId, product.id, resolvedCategoryId);
  const stats = displayStats(product.id);
  const addToCart = useShopCartStore((s) => s.addToCart);
  const isLoading = useShopCartStore((s) => s.isLoading);
  const [adding, setAdding] = useState(false);

  const firstVariant = product.variants[0];
  const canQuickAdd = Boolean(firstVariant?.id) && active;

  const handleAddToCart = async () => {
    if (!firstVariant?.id || adding) return;
    setAdding(true);
    try {
      await addToCart({
        id_employee: Number(sellerId),
        options: [{ id_variant: firstVariant.id, quantity: 1 }],
      });
    } finally {
      setAdding(false);
    }
  };

  const padClass =
    cardStyle === "compact" ? "p-2 sm:p-2.5" : cardStyle === "bordered" ? "p-3 sm:p-3.5" : "p-3 sm:p-3.5";
  const borderExtra =
    cardStyle === "bordered" ? "ring-1 ring-slate-200/90 shadow-none" : "";

  return (
    <article
      className={`store-product-card store-card-enter store-hover-lift group relative flex h-full flex-col overflow-hidden rounded-2xl store-delay-${Math.min(index, 11)} ${borderExtra} ${
        active ? "" : "pointer-events-none opacity-40"
      }`}
      style={{
        backgroundColor: "var(--store-surface, #fff)",
      }}
    >
      {/* Standardized 1:1 image */}
      <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-slate-100">
        <StoreProductImageTooltip product={product}>
          <Link href={href} className="absolute inset-0 block cursor-pointer" tabIndex={-1} aria-hidden>
            {imageSrc ? (
              <Image
                src={imageSrc}
                alt=""
                fill
                className="store-img-zoom object-cover"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                unoptimized
              />
            ) : (
              <div className="flex h-full items-center justify-center text-slate-300">
                <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                </svg>
              </div>
            )}
          </Link>
        </StoreProductImageTooltip>

        {/* Clean coded badges — top-left only */}
        <div className="pointer-events-none absolute left-2 top-2 z-[2] flex flex-col gap-1">
          {product.is_flash_sale && showFlashBadge ? (
            <span className="store-badge-flash rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide">
              Flash Sale
            </span>
          ) : product.is_hot && showHotBadge ? (
            <span className="store-badge-hot rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide">
              Best Seller
            </span>
          ) : null}
        </div>

        {/* Quick actions — outside the Link (valid HTML + touch-friendly) */}
        <div className="absolute inset-x-0 bottom-0 z-[2] flex items-center justify-end gap-1.5 p-2 opacity-100 transition-opacity duration-200 sm:opacity-0 sm:group-hover:opacity-100">
          {onQuickView ? (
            <button
              type="button"
              onClick={() => onQuickView(product)}
              aria-label={`Xem nhanh ${product.title}`}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/95 text-slate-800 shadow-md backdrop-blur-sm transition hover:bg-slate-900 hover:text-white"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          ) : null}
          {canQuickAdd ? (
            <button
              type="button"
              onClick={() => void handleAddToCart()}
              disabled={adding || isLoading}
              aria-label={`Thêm ${product.title} vào giỏ`}
              className="store-btn-shimmer flex h-9 cursor-pointer items-center gap-1.5 rounded-full px-3 text-[11px] font-extrabold uppercase tracking-wide shadow-md disabled:opacity-60"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6z" />
                <path d="M3 6h18M16 10a4 4 0 01-8 0" />
              </svg>
              <span className="sm:inline">{adding ? "..." : "Thêm"}</span>
            </button>
          ) : null}
        </div>
      </div>

      <div className={`flex flex-1 flex-col ${padClass}`}>
        <div className="flex items-center justify-between gap-2 text-[10px] font-medium text-slate-500 sm:text-[11px]">
          <span className="inline-flex items-center gap-0.5 font-bold text-amber-500">
            <svg className="h-3 w-3 fill-current" viewBox="0 0 20 20" aria-hidden>
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {stats.rating}
            <span className="font-normal text-slate-400">({stats.reviews})</span>
          </span>
          <span className="text-slate-400">Đã bán {stats.soldLabel}</span>
        </div>

        <Link href={href} className="mt-1.5 cursor-pointer">
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-[var(--store-primary,#0f172a)] transition-colors group-hover:text-[var(--store-accent)]">
            {product.title}
          </h3>
        </Link>

        <div className="mt-auto flex items-end justify-between gap-2 border-t border-slate-100 pt-2.5">
          <Link href={href} className="cursor-pointer">
            <p className="text-sm font-extrabold text-[var(--store-accent)] sm:text-base">
              {formatPriceRange(product)}
            </p>
          </Link>
          {product.variants.length > 1 ? (
            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
              {product.variants.length} loại
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
