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
      className={`store-pdp-sticky-bar fixed inset-x-0 bottom-0 z-[99990] border-t border-[var(--store-border)] bg-white/95 px-4 py-3 backdrop-blur-xl transition-transform duration-300 lg:hidden ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
      role="region"
      aria-label="Mua nhanh"
      aria-hidden={!visible}
    >
      <div className="mx-auto flex max-w-lg items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-[var(--store-muted)]">{title}</p>
          <p className="store-display text-lg text-[var(--store-primary)]">{formatVnd(price)}</p>
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
              className="store-pdp-btn-outline cursor-pointer rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-50"
            >
              Giỏ
            </button>
            <button
              type="button"
              onClick={onBuyNow}
              disabled={isLoading}
              className="store-btn-primary cursor-pointer rounded-xl px-5 py-3 text-sm font-semibold disabled:opacity-50"
            >
              Mua ngay
            </button>
          </div>
        )}
      </div>
    </div>
  );
}