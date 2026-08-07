"use client";

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

interface LayoutProductTileProps {
  product: ShopProduct;
  sellerId: string;
  variant?: ShopProductCardStyle | "bento-large" | "deal" | "masonry" | "vertical";
  onQuickView?: (p: ShopProduct) => void;
  showBadges?: boolean;
  className?: string;
  /** Masonry row span hint */
  tall?: boolean;
}

export default function LayoutProductTile({
  product,
  sellerId,
  variant = "comfortable",
  onQuickView,
  showBadges = true,
  className = "",
  tall = false,
  index = 0,
}: LayoutProductTileProps & { index?: number }) {
  const active = isProductActive(product);
  const motion = `store-card-enter store-delay-${Math.min(index, 11)}`;
  const href = buildStoreProductUrl(sellerId, product.id, product.category);
  const img = product.images[0] ? shopImageUrl(product.images[0]) : null;
  const addToCart = useShopCartStore((s) => s.addToCart);
  const [adding, setAdding] = useState(false);
  const firstVariant = product.variants[0];

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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

  if (!active) return null;

  /* ── Overlay (catalog masonry / fashion) ── */
  if (variant === "overlay" || variant === "masonry") {
    const v0 = product.variants[0];
    const price = Number(v0?.price || 0);
    const promoPrice = v0?.promotion_price != null ? Number(v0.promotion_price) : null;

    const discount =
      promoPrice && price > promoPrice
        ? Math.round(((price - promoPrice) / price) * 100)
        : null;


    return (
      <div
        className={`group relative flex flex-col overflow-hidden rounded-2xl border border-stone-200/90 bg-stone-950 shadow-md transition-all duration-500 hover:-translate-y-1.5 hover:border-amber-400/90 hover:shadow-2xl hover:shadow-amber-500/10 dark:border-stone-800 ${motion} ${
          tall ? "aspect-[3/4] sm:aspect-[4/5]" : "aspect-[4/5] sm:aspect-square"
        } ${className}`}
      >
        <Link href={href} className="relative h-full w-full overflow-hidden block">
          {img ? (
            <Image
              src={img}
              alt={product.title}
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              unoptimized
              sizes="(max-width: 768px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-stone-900 text-stone-600">
              🖼️
            </div>
          )}
          {/* Multi-layered gradient depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent opacity-85 transition-opacity duration-300 group-hover:opacity-95" />
          <div className="absolute inset-0 bg-gradient-to-b from-stone-950/50 via-transparent to-transparent opacity-60" />

          {/* Top Badges */}
          <div className="absolute left-3 top-3 flex flex-wrap items-center gap-1.5 z-10">
            {discount ? (
              <span className="rounded-full bg-rose-600 px-2.5 py-0.5 text-[9px] font-black uppercase text-white shadow-sm">
                -{discount}%
              </span>
            ) : showBadges && product.is_flash_sale ? (
              <span className="rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-2.5 py-0.5 text-[9px] font-black uppercase text-stone-950 shadow-sm">
                ⚡ Flash
              </span>
            ) : (
              <span className="rounded-full bg-white/20 backdrop-blur-md px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-amber-300 border border-white/10">
                Editorial
              </span>
            )}
          </div>

          {/* Top Right Floating Actions */}
          <div className="absolute right-3 top-3 flex items-center gap-1.5 z-10 opacity-90 transition-all duration-300 group-hover:opacity-100">
            {onQuickView ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onQuickView(product);
                }}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/90 text-stone-900 shadow-md backdrop-blur-md transition-all duration-200 hover:bg-amber-400 hover:text-stone-950 hover:scale-110 dark:bg-stone-900/90 dark:text-white"
                aria-label="Xem nhanh"
                title="Xem nhanh sản phẩm"
              >
                👁️
              </button>
            ) : null}
          </div>

          {/* Bottom Info Overlay */}
          <div className="absolute inset-x-0 bottom-0 p-3.5 sm:p-5 z-10 flex flex-col justify-end">
            <div className="flex items-center gap-1 text-[10px] font-bold text-amber-400/90">
              <span>★ 4.9</span>
              <span className="text-stone-400">· Best Choice</span>
            </div>

            <h3 className="mt-1 line-clamp-2 text-xs sm:text-sm font-bold text-white leading-snug drop-shadow-sm transition-colors group-hover:text-amber-200">
              {product.title}
            </h3>

            <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-white/15 pt-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm sm:text-base font-black text-amber-300">
                  {formatPriceRange(product)}
                </span>
                {promoPrice && price > promoPrice ? (
                  <span className="text-[10px] text-stone-400 line-through">
                    {price.toLocaleString("vi-VN")}đ
                  </span>
                ) : null}
              </div>

              {/* Quick Add to Cart Button */}
              <button
                type="button"
                onClick={handleAdd}
                disabled={adding}
                title="Thêm vào giỏ hàng"
                className="flex h-8 px-3 shrink-0 cursor-pointer items-center gap-1 rounded-xl bg-amber-400 text-stone-950 font-extrabold text-xs shadow-md transition-all duration-200 hover:bg-amber-300 hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                {adding ? (
                  <span className="text-[10px] animate-pulse">…</span>
                ) : (
                  <>
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="hidden sm:inline">Giỏ</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </Link>
      </div>
    );
  }



  /* ── Editorial vertical Luxury (Compact 1:1 Aspect Ratio) ── */
  if (variant === "editorial" || variant === "vertical") {
    return (
      <article
        className={`group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-stone-200/90 bg-white p-3 shadow-2xs transition-all duration-300 hover:-translate-y-1 hover:border-amber-400/80 hover:shadow-lg dark:border-stone-800 dark:bg-stone-900 ${motion} ${className}`}
      >
        <div>
          {/* Square Image Stage */}
          <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-stone-100/80 dark:bg-stone-950/60 border border-stone-100 dark:border-stone-800/80">
            <Link href={href} className="block h-full w-full">
              {img ? (
                <Image
                  src={img}
                  alt={product.title}
                  fill
                  className="object-contain p-2.5 transition-transform duration-500 ease-out group-hover:scale-105"
                  unoptimized
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                />
              ) : null}
            </Link>

            {showBadges && product.is_flash_sale ? (
              <span className="absolute left-2.5 top-2.5 rounded-full bg-amber-400 px-2.5 py-0.5 text-[9px] font-black uppercase text-stone-950 shadow-xs">
                ⚡ Flash
              </span>
            ) : null}

            {onQuickView ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onQuickView(product);
                }}
                aria-label="Xem nhanh"
                className="absolute right-2.5 top-2.5 flex h-7.5 w-7.5 cursor-pointer items-center justify-center rounded-full border border-stone-200/80 bg-white/90 text-stone-700 shadow-xs opacity-0 backdrop-blur-md transition-all duration-200 group-hover:opacity-100 hover:bg-stone-950 hover:text-white dark:border-stone-700 dark:bg-stone-900/90 dark:text-stone-300 dark:hover:bg-amber-400 dark:hover:text-stone-950"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            ) : null}
          </div>

          {/* Details & Title */}
          <div className="mt-3 px-0.5">
            <Link href={href}>
              <h3 className="line-clamp-2 text-xs font-bold leading-snug text-stone-900 transition-colors group-hover:text-amber-500 dark:text-white sm:text-sm">
                {product.title}
              </h3>
            </Link>
          </div>
        </div>

        {/* Price & Compact Cart Action */}
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-stone-100 dark:border-stone-800/80 pt-2.5 px-0.5">
          <div className="flex flex-col">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-stone-400">Giá Niêm Yết</span>
            <span className="text-xs sm:text-sm font-black text-stone-900 dark:text-amber-400">{formatPriceRange(product)}</span>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            disabled={adding}
            title="Thêm vào giỏ"
            className="flex h-8.5 w-8.5 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-stone-950 text-white shadow-xs transition-all duration-200 hover:bg-amber-400 hover:text-stone-950 hover:scale-105 active:scale-95 disabled:opacity-50 dark:bg-white dark:text-stone-950 dark:hover:bg-amber-400"
          >
            {adding ? (
              <span className="text-[10px] animate-pulse">…</span>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            )}
          </button>
        </div>
      </article>
    );
  }

  /* ── Deal density card ── */
  if (variant === "deal") {
    const soldPct = 40 + (product.id * 13) % 55;
    return (
      <article
        className={`flex h-full flex-col overflow-hidden rounded-2xl border border-amber-200/80 bg-white shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-amber-400 hover:shadow-md dark:border-amber-900/40 dark:bg-stone-900 ${motion} ${className}`}
      >
        <Link href={href} className="relative aspect-square bg-stone-100/80 dark:bg-stone-950/60 overflow-hidden">
          {img ? (
            <Image src={img} alt={product.title} fill className="object-contain p-2 transition-transform duration-500 group-hover:scale-105" unoptimized sizes="20vw" />
          ) : null}
          {showBadges && product.is_flash_sale ? (
            <span className="absolute left-2 top-2 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 px-2 py-0.5 text-[9px] font-black uppercase text-white shadow-xs">
              ⚡ Flash Deal
            </span>
          ) : null}
        </Link>
        <div className="flex flex-1 flex-col p-3">
          <Link href={href}>
            <h3 className="line-clamp-2 text-xs font-bold leading-snug text-stone-900 dark:text-white hover:text-amber-500 transition-colors">
              {product.title}
            </h3>
          </Link>
          <p className="mt-1.5 text-sm font-black text-rose-600 dark:text-amber-400">{formatPriceRange(product)}</p>
          <div className="mt-2">
            <div className="h-1.5 overflow-hidden rounded-full bg-amber-100 dark:bg-stone-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-rose-500"
                style={{ width: `${soldPct}%` }}
              />
            </div>
            <p className="mt-1 text-[9px] font-bold text-amber-700 dark:text-amber-400">
              Đã bán {soldPct}%
            </p>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={adding}
            className="mt-3 cursor-pointer rounded-xl bg-stone-950 py-2 text-[11px] font-black uppercase text-white shadow-xs transition-all hover:bg-amber-400 hover:text-stone-950 dark:bg-amber-400 dark:text-stone-950 dark:hover:bg-amber-300"
          >
            {adding ? "Đang Thêm..." : "Săn Ngay"}
          </button>
        </div>
      </article>
    );
  }

  /* ── List hybrid (sidebar commerce) ── */
  if (variant === "list") {
    return (
      <article className={`group flex items-center gap-4 rounded-2xl border border-stone-200/80 bg-white p-3.5 shadow-2xs transition-all duration-300 hover:border-amber-400/80 hover:shadow-md dark:border-stone-800 dark:bg-stone-900 ${motion} ${className}`}>
        <Link href={href} className="relative h-22 w-22 shrink-0 overflow-hidden rounded-xl bg-stone-100/80 dark:bg-stone-950/60 border border-stone-100 dark:border-stone-800">
          {img ? (
            <Image src={img} alt={product.title} fill className="object-contain p-1.5 transition-transform duration-500 group-hover:scale-105" unoptimized sizes="88px" />
          ) : null}
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-stone-100 dark:bg-stone-800 px-2 py-0.5 text-[9px] font-bold text-stone-600 dark:text-stone-400">
              Mã SKU: B2B-{product.id}
            </span>
          </div>
          <Link href={href} className="block mt-1">
            <h3 className="line-clamp-2 text-xs sm:text-sm font-bold text-stone-900 dark:text-white transition-colors group-hover:text-amber-500">{product.title}</h3>
          </Link>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-black text-amber-500">
              {formatPriceRange(product)}
            </p>
            <div className="flex items-center gap-2">
              {onQuickView ? (
                <button
                  type="button"
                  onClick={() => onQuickView(product)}
                  className="cursor-pointer rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 px-3 py-1.5 text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-100 transition-colors"
                >
                  Xem Nhanh
                </button>
              ) : null}
              <button
                type="button"
                onClick={handleAdd}
                disabled={adding}
                className="cursor-pointer rounded-xl bg-stone-950 dark:bg-amber-400 px-4 py-1.5 text-xs font-extrabold text-white dark:text-stone-950 hover:bg-amber-400 hover:text-stone-950 transition-all shadow-xs"
              >
                {adding ? "…" : "+ Thêm Giỏ"}
              </button>
            </div>
          </div>
        </div>
      </article>
    );
  }

  /* ── Bento large / comfortable / bordered / compact default ── */
  const isBentoLarge = variant === "bento-large";
  const isBordered = variant === "bordered";
  const isCompact = variant === "compact";

  return (
    <article
      className={`group flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-stone-200/90 bg-white p-3 shadow-2xs transition-all duration-300 hover:-translate-y-1 hover:border-amber-400/80 hover:shadow-lg dark:border-stone-800 dark:bg-stone-900 ${motion} ${
        isBordered ? "border-2 border-stone-300 dark:border-stone-700" : ""
      } ${className}`}
    >
      <div>
        <Link
          href={href}
          className={`relative block overflow-hidden rounded-xl bg-stone-100/80 dark:bg-stone-950/60 border border-stone-100 dark:border-stone-800/80 ${
            isBentoLarge ? "aspect-[4/3] sm:aspect-auto sm:min-h-[280px] sm:flex-1" : "aspect-square"
          }`}
        >
          {img ? (
            <Image
              src={img}
              alt={product.title}
              fill
              className="object-contain p-2.5 transition-transform duration-500 ease-out group-hover:scale-105"
              unoptimized
              sizes={isBentoLarge ? "50vw" : "(max-width: 768px) 50vw, 25vw"}
              priority={isBentoLarge}
            />
          ) : null}

          {showBadges && product.is_flash_sale ? (
            <span className="absolute left-2.5 top-2.5 rounded-full bg-amber-400 px-2.5 py-0.5 text-[9px] font-black uppercase text-stone-950 shadow-xs">
              ⚡ Flash
            </span>
          ) : null}
        </Link>
        <div className={isCompact ? "pt-2.5 px-0.5" : isBentoLarge ? "pt-4 px-1" : "pt-3 px-0.5"}>
          <Link href={href}>
            <h3
              className={`line-clamp-2 font-bold text-stone-900 dark:text-white transition-colors group-hover:text-amber-500 ${
                isBentoLarge ? "text-base sm:text-lg" : isCompact ? "text-xs leading-snug" : "text-xs sm:text-sm leading-snug"
              }`}
            >
              {product.title}
            </h3>
          </Link>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-stone-100 dark:border-stone-800/80 pt-2.5 px-0.5">
        <div className="flex flex-col">
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-stone-400">Giá</span>
          <span className={`font-black text-stone-900 dark:text-amber-400 ${isBentoLarge ? "text-lg" : "text-xs sm:text-sm"}`}>
            {formatPriceRange(product)}
          </span>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={adding}
          aria-label="Thêm giỏ"
          className="flex h-8.5 w-8.5 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-stone-950 text-white shadow-xs transition-all duration-200 hover:bg-amber-400 hover:text-stone-950 hover:scale-105 active:scale-95 disabled:opacity-50 dark:bg-white dark:text-stone-950 dark:hover:bg-amber-400"
        >
          {adding ? (
            <span className="text-[10px] animate-pulse">…</span>
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          )}
        </button>
      </div>
    </article>
  );
}
