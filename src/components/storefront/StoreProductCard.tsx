"use client";

import {
  buildStoreProductUrl,
  formatPriceRange,
  isProductActive,
  shopImageUrl,
} from "@/lib/shop-utils";
import type { ShopProduct } from "@/types/zalo-shop";
import Image from "next/image";
import Link from "next/link";

interface StoreProductCardProps {
  product: ShopProduct;
  sellerId: string;
  categoryId?: number;
  size?: "default" | "featured";
  index?: number;
}

export default function StoreProductCard({
  product,
  sellerId,
  categoryId,
  size = "default",
  index = 0,
}: StoreProductCardProps) {
  const active = isProductActive(product);
  const imageSrc = product.images[0] ? shopImageUrl(product.images[0]) : null;
  const resolvedCategoryId = categoryId ?? product.category;
  const href = buildStoreProductUrl(sellerId, product.id, resolvedCategoryId);

  const isFeatured = size === "featured";

  return (
    <Link
      href={href}
      className={`store-card-shine group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-3xl bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
        active ? "" : "pointer-events-none opacity-40"
      }`}
      style={{
        animationDelay: `${index * 60}ms`,
        boxShadow: "0 1px 3px rgba(24,24,27,0.06), 0 8px 24px rgba(24,24,27,0.04)",
      }}
    >
      <div className="pointer-events-none absolute inset-0 z-[1] rounded-3xl opacity-0 ring-2 ring-[var(--store-accent)] transition-opacity duration-300 group-hover:opacity-100" />

      <div
        className={`relative w-full shrink-0 overflow-hidden bg-zinc-100 ${
          isFeatured ? "aspect-[5/4] sm:aspect-[4/3]" : "aspect-[3/4]"
        }`}
      >
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={product.title}
            fill
            className="object-cover transition duration-500 ease-out group-hover:scale-105"
            sizes={isFeatured ? "(max-width: 1024px) 100vw, 50vw" : "(max-width: 640px) 50vw, 280px"}
            unoptimized
          />
        ) : (
          <div className="flex h-full min-h-[160px] items-center justify-center text-zinc-300">
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
            </svg>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <div className="absolute left-3 top-3 z-[2] flex flex-col gap-1.5">
          {product.is_hot ? (
            <span className="rounded-full bg-[var(--store-accent)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg">
              Hot
            </span>
          ) : null}
          {product.is_flash_sale ? (
            <span className="rounded-full bg-amber-400 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-900 shadow-lg">
              Sale
            </span>
          ) : null}
        </div>

        <div className="absolute bottom-3 right-3 z-[2] flex h-9 w-9 items-center justify-center rounded-full bg-white text-[var(--store-primary)] opacity-0 shadow-lg transition-opacity duration-300 group-hover:opacity-100">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
      </div>

      <div className={`relative z-[2] flex flex-1 flex-col p-4 ${isFeatured ? "sm:p-5" : ""}`}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--store-muted)]">
          {product.variants.length} phân loại
        </p>
        <h3
          className={`store-display mt-1 line-clamp-2 text-[var(--store-primary)] transition-colors group-hover:text-[var(--store-accent)] ${
            isFeatured ? "text-base sm:text-lg" : "text-sm"
          }`}
        >
          {product.title}
        </h3>
        <p
          className={`mt-auto pt-2 font-semibold text-[var(--store-primary)] ${
            isFeatured ? "text-lg sm:text-xl" : "text-sm sm:text-base"
          }`}
        >
          {formatPriceRange(product)}
        </p>
      </div>
    </Link>
  );
}