"use client";

import { formatVnd } from "@/lib/shop-utils";

interface ProductStickyBarProps {
  visible: boolean;
  title: string;
  price: number;
  isLoading: boolean;
  isZalo: boolean;
  onAddToCart: () => void;
  onBuyNow: () => void;
}

/** Mobile-only floating sticky CTA — slides up when main buy panel leaves viewport */
export default function ProductStickyBar({
  visible,
  title,
  price,
  isLoading,
  isZalo,
  onAddToCart,
  onBuyNow,
}: ProductStickyBarProps) {
  return (
    <div
      className={`store-pdp-sticky-bar fixed inset-x-0 bottom-0 z-[99990] border-t border-[var(--store-border)] bg-white/95 px-4 py-3 shadow-[0_-8px_30px_rgba(15,23,42,0.12)] backdrop-blur-xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:hidden ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-full opacity-0"
      }`}
      role="region"
      aria-label="Mua nhanh"
      aria-hidden={!visible}
    >
      <div className="mx-auto flex max-w-lg items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-[var(--store-muted)]">
            {title}
          </p>
          <p className="text-lg font-extrabold text-[var(--store-accent)]">
            {formatVnd(price)}
          </p>
        </div>
        {isZalo ? (
          <button
            type="button"
            onClick={onAddToCart}
            disabled={isLoading}
            className="store-btn-accent shrink-0 cursor-pointer rounded-xl px-5 py-3 text-sm font-semibold disabled:opacity-50"
          >
            Zalo
          </button>
        ) : (
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={onAddToCart}
              disabled={isLoading}
              className="store-pdp-btn-outline cursor-pointer rounded-xl px-3.5 py-3 text-xs font-bold disabled:opacity-50 sm:text-sm"
            >
              Giỏ
            </button>
            <button
              type="button"
              onClick={onBuyNow}
              disabled={isLoading}
              className="store-btn-accent cursor-pointer rounded-xl px-4 py-3 text-xs font-bold shadow-md disabled:opacity-50 sm:px-5 sm:text-sm"
            >
              Quick Buy
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
