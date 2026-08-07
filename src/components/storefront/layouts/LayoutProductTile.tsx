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
  const motion = `store-card-enter store-hover-lift store-delay-${Math.min(index, 11)}`;
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
    return (
      <Link
        href={href}
        className={`group relative block overflow-hidden rounded-2xl bg-slate-100 ${motion} ${
          tall ? "min-h-[280px] sm:min-h-[360px]" : "min-h-[200px] sm:min-h-[240px]"
        } ${className}`}
      >
        {img ? (
          <Image
            src={img}
            alt={product.title}
            fill
            className="store-img-zoom object-cover"
            unoptimized
            sizes="(max-width: 768px) 50vw, 33vw"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-90" />
        <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
          <p className="line-clamp-2 text-sm font-semibold text-white">{product.title}</p>
          <p className="mt-1 text-sm font-bold text-white/95">{formatPriceRange(product)}</p>
        </div>
        {onQuickView ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onQuickView(product);
            }}
            className="absolute right-3 top-3 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/90 text-xs font-bold shadow opacity-0 transition group-hover:opacity-100"
            aria-label="Xem nhanh"
          >
            +
          </button>
        ) : null}
      </Link>
    );
  }

  /* ── Editorial vertical 3:4 ── */
  if (variant === "editorial" || variant === "vertical") {
    return (
      <article className={`group flex h-full flex-col ${motion} ${className}`}>
        <Link href={href} className="relative block aspect-[3/4] overflow-hidden rounded-xl bg-slate-100">
          {img ? (
            <Image
              src={img}
              alt={product.title}
              fill
              className="store-img-zoom object-cover"
              unoptimized
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          ) : null}
        </Link>
        <div className="mt-3 text-center">
          <Link href={href}>
            <h3 className="store-display line-clamp-2 text-sm font-normal tracking-wide text-[var(--store-primary)]">
              {product.title}
            </h3>
          </Link>
          <p className="mt-1 text-sm text-[var(--store-muted)]">{formatPriceRange(product)}</p>
          <button
            type="button"
            onClick={handleAdd}
            className="mt-2 cursor-pointer text-xs font-medium underline underline-offset-4 decoration-[var(--store-primary)]/40 transition hover:decoration-[var(--store-accent)]"
          >
            {adding ? "…" : "Add to bag"}
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
        className={`flex h-full flex-col overflow-hidden rounded-lg border border-orange-100 bg-white shadow-sm ${motion} ${className}`}
      >
        <Link href={href} className="relative aspect-square bg-slate-50">
          {img ? (
            <Image src={img} alt={product.title} fill className="object-cover" unoptimized sizes="20vw" />
          ) : null}
          {showBadges && product.is_flash_sale ? (
            <span className="absolute left-1 top-1 rounded bg-orange-500 px-1.5 py-0.5 text-[9px] font-extrabold text-white">
              -FLASH
            </span>
          ) : null}
        </Link>
        <div className="flex flex-1 flex-col p-2">
          <Link href={href}>
            <h3 className="line-clamp-2 text-[11px] font-semibold leading-snug text-slate-800">
              {product.title}
            </h3>
          </Link>
          <p className="mt-1 text-sm font-extrabold text-orange-600">{formatPriceRange(product)}</p>
          <div className="mt-1.5">
            <div className="h-1.5 overflow-hidden rounded-full bg-orange-100">
              <div
                className="h-full rounded-full bg-orange-500"
                style={{ width: `${soldPct}%` }}
              />
            </div>
            <p className="mt-0.5 text-[9px] font-medium text-orange-700/80">
              Đã bán {soldPct}%
            </p>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            className="mt-auto store-btn-shimmer cursor-pointer rounded-md py-1.5 text-[10px] font-bold uppercase"
          >
            Mua
          </button>
        </div>
      </article>
    );
  }

  /* ── List hybrid (sidebar commerce) ── */
  if (variant === "list") {
    return (
      <article className={`flex gap-3 rounded-xl border border-slate-200 bg-white p-3 ${motion} ${className}`}>
        <Link href={href} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
          {img ? (
            <Image src={img} alt="" fill className="object-cover" unoptimized sizes="80px" />
          ) : null}
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={href}>
            <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">{product.title}</h3>
          </Link>
          <p className="mt-1 text-sm font-bold text-[var(--store-accent)]">
            {formatPriceRange(product)}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={handleAdd}
              disabled={adding}
              className="cursor-pointer rounded-lg bg-[var(--store-primary)] px-3 py-1.5 text-xs font-bold text-white"
            >
              {adding ? "…" : "+ Giỏ"}
            </button>
            {onQuickView ? (
              <button
                type="button"
                onClick={() => onQuickView(product)}
                className="cursor-pointer text-xs font-medium text-slate-500 underline"
              >
                Chi tiết
              </button>
            ) : null}
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
      className={`group flex h-full flex-col overflow-hidden bg-[var(--store-surface,#fff)] ${motion} ${
        isBordered
          ? "border border-slate-200"
          : isBentoLarge
            ? "rounded-3xl shadow-sm"
            : "rounded-2xl border border-slate-100 shadow-sm"
      } ${className}`}
    >
      <Link
        href={href}
        className={`relative block overflow-hidden bg-slate-100 ${
          isBentoLarge ? "aspect-[4/3] sm:aspect-auto sm:min-h-[280px] sm:flex-1" : "aspect-square"
        }`}
      >
        {img ? (
          <Image
            src={img}
            alt={product.title}
            fill
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
            unoptimized
            sizes={isBentoLarge ? "50vw" : "(max-width: 768px) 50vw, 25vw"}
            priority={isBentoLarge}
          />
        ) : null}
      </Link>
      <div className={isCompact ? "p-2.5" : isBentoLarge ? "p-5 sm:p-6" : "p-3.5"}>
        <Link href={href}>
          <h3
            className={`line-clamp-2 font-semibold text-[var(--store-primary)] ${
              isBentoLarge ? "text-lg sm:text-xl" : isCompact ? "text-xs" : "text-sm"
            }`}
          >
            {product.title}
          </h3>
        </Link>
        <div className="mt-2 flex items-center justify-between gap-2">
          <p
            className={`font-bold text-[var(--store-accent)] ${
              isBentoLarge ? "text-xl" : "text-sm"
            }`}
          >
            {formatPriceRange(product)}
          </p>
          {isBentoLarge ? (
            <button
              type="button"
              onClick={handleAdd}
              className="store-btn-shimmer cursor-pointer rounded-full px-4 py-2 text-xs font-bold"
            >
              Mua
            </button>
          ) : (
            <button
              type="button"
              onClick={handleAdd}
              aria-label="Thêm giỏ"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[var(--store-primary)] text-white opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100"
            >
              +
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
