"use client";

import { formatVnd, shopImageUrl } from "@/lib/shop-utils";
import { useShopCartStore } from "@/stores/use-shop-cart-store";
import type { ShopCover } from "@/types/zalo-shop";
import Image from "next/image";
import Link from "next/link";

interface StoreHeaderProps {
  sellerId: string;
  cover: ShopCover | null;
  onCartClick: () => void;
  variant?: "light" | "dark";
}

export default function StoreHeader({
  sellerId,
  cover,
  onCartClick,
  variant = "light",
}: StoreHeaderProps) {
  const cart = useShopCartStore((s) => s.cart);
  const itemCount = cart?.items?.reduce((sum, i) => sum + i.quantity, 0) ?? 0;
  const total = cart?.total_amount ?? 0;
  const logo = cover?.image_logo ? shopImageUrl(cover.image_logo) : null;
  const isDark = variant === "dark";

  return (
    <header className="sticky top-0 z-50 px-4 pt-4 sm:px-6">
      <div
        className={`mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 rounded-2xl px-4 sm:h-16 sm:px-6 ${
          isDark ? "store-glass-dark text-white" : "store-glass"
        }`}
      >
        <Link
          href={`/store/${sellerId}`}
          className="flex min-w-0 cursor-pointer items-center gap-3"
        >
          {logo ? (
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full ring-2 ring-white/30 sm:h-10 sm:w-10">
              <Image src={logo} alt="" fill className="object-cover" unoptimized />
            </div>
          ) : (
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold sm:h-10 sm:w-10 ${
                isDark
                  ? "bg-[var(--store-accent)] text-white"
                  : "bg-[var(--store-primary)] text-white"
              }`}
            >
              {(cover?.name ?? "S").charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p
              className={`truncate text-sm font-semibold ${
                isDark ? "text-white" : "text-[var(--store-primary)]"
              }`}
            >
              {cover?.name || "Cửa hàng"}
            </p>
            <p
              className={`truncate text-[11px] ${
                isDark ? "text-white/60" : "text-[var(--store-muted)]"
              }`}
            >
              Curated Collection
            </p>
          </div>
        </Link>

        <button
          type="button"
          onClick={onCartClick}
          className={`group relative flex cursor-pointer items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
            isDark
              ? "bg-white/10 text-white hover:bg-[var(--store-accent)]"
              : "bg-[var(--store-primary)] text-white hover:shadow-lg"
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6z" />
            <path d="M3 6h18M16 10a4 4 0 01-8 0" />
          </svg>
          <span className="hidden sm:inline">Giỏ</span>
          {itemCount > 0 ? (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--store-accent)] px-1.5 text-[11px] font-bold">
              {itemCount}
            </span>
          ) : null}
          {total > 0 ? (
            <span
              className={`hidden text-xs lg:inline ${
                isDark ? "text-white/70" : "text-white/80"
              }`}
            >
              {formatVnd(total)}
            </span>
          ) : null}
        </button>
      </div>
    </header>
  );
}