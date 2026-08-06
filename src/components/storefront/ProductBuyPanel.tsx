"use client";

import { formatVnd, shopImageUrl } from "@/lib/shop-utils";
import type { ShopProduct, ShopProductVariant } from "@/types/zalo-shop";

interface ProductBuyPanelProps {
  product: ShopProduct;
  selectedVariant: ShopProductVariant | null;
  onSelectVariant: (variant: ShopProductVariant) => void;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  maxQty: number;
  isLoading: boolean;
  onAddToCart: () => void;
  onBuyNow: () => void;
  id?: string;
}

function variantStock(variant: ShopProductVariant): number {
  const total = Number(variant.total_quantity);
  const sold = Number(variant.sold_quantity ?? 0);
  return Math.max(0, total - sold);
}

function variantPrice(variant: ShopProductVariant) {
  // BE/form: price = giá bán; promotion_price = giá niêm yết cũ (thường cao hơn)
  const display = Number(variant.price);
  const list = variant.promotion_price ? Number(variant.promotion_price) : null;
  const hasDiscount = list != null && list > display;
  return {
    original: hasDiscount ? list! : display,
    display,
    hasDiscount,
  };
}

const TRUST_ITEMS = [
  {
    label: "COD",
    sub: "Thanh toán khi nhận",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
    ),
  },
  {
    label: "Giao nhanh",
    sub: "2–5 ngày làm việc",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177A48.78 48.78 0 0012 2.25c-2.676 0-5.216.584-7.499 1.632" />
    ),
  },
  {
    label: "Đổi trả",
    sub: "Trong 7 ngày",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
    ),
  },
] as const;

export default function ProductBuyPanel({
  product,
  selectedVariant,
  onSelectVariant,
  quantity,
  onQuantityChange,
  maxQty,
  isLoading,
  onAddToCart,
  onBuyNow,
  id,
}: ProductBuyPanelProps) {
  const isZalo = product.sell_option === 1;
  const price = selectedVariant ? variantPrice(selectedVariant) : { original: 0, display: 0, hasDiscount: false };
  const discountPct =
    price.hasDiscount && price.original > 0
      ? Math.round((1 - price.display / price.original) * 100)
      : 0;

  return (
    <div id={id} className="space-y-6 lg:sticky lg:top-28 lg:self-start">
      <div className="store-pdp-buy-panel rounded-[2rem] p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          {/* Hot: dùng image_hot nhỏ thay badge hồng (nếu có) */}
          {product.is_hot && product.image_hot ? (
            <span className="relative inline-flex h-7 w-auto max-w-[5.5rem] items-center overflow-hidden rounded-full bg-transparent">
              {/* eslint-disable-next-line @next/next/no-img-element -- GIF hot cần animate, size badge */}
              <img
                src={shopImageUrl(product.image_hot)}
                alt="Hot"
                className="h-7 w-auto max-w-[5.5rem] object-contain object-left"
              />
            </span>
          ) : product.is_hot ? (
            <span className="rounded-full bg-[var(--store-accent)] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
              Hot
            </span>
          ) : null}
          {product.is_flash_sale ? (
            <span className="rounded-full bg-amber-400 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-900">
              Flash Sale
            </span>
          ) : null}
          {maxQty > 0 && maxQty <= 10 ? (
            <span className="rounded-full bg-[var(--store-accent-soft)] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--store-accent)]">
              Sắp hết hàng
            </span>
          ) : null}
        </div>

        <h1 className="store-display mt-4 text-[1.75rem] leading-[1.15] text-[var(--store-primary)] sm:text-4xl lg:text-[2.5rem]">
          {product.title}
        </h1>

        <div className="mt-6 flex flex-wrap items-end gap-3">
          <p className="store-display text-3xl text-[var(--store-primary)] sm:text-4xl">
            {formatVnd(price.display)}
          </p>
          {price.hasDiscount ? (
            <>
              <p className="pb-1 text-lg text-[var(--store-muted)] line-through">
                {formatVnd(price.original)}
              </p>
              <span className="mb-1 rounded-lg bg-[var(--store-accent-soft)] px-2.5 py-1 text-xs font-bold text-[var(--store-accent)]">
                −{discountPct}%
              </span>
            </>
          ) : null}
        </div>

        {product.variants.length > 0 ? (
          <div className="mt-8">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--store-muted)]">
                Phân loại
              </p>
              {selectedVariant ? (
                <p className="text-xs text-[var(--store-muted)]">
                  Còn <span className="font-semibold text-[var(--store-primary)]">{maxQty}</span>
                </p>
              ) : null}
            </div>
            <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
              {product.variants.map((variant) => {
                const selected = selectedVariant?.classify === variant.classify;
                const stock = variantStock(variant);
                const vp = variantPrice(variant);
                const outOfStock = stock <= 0;

                return (
                  <button
                    key={variant.id ?? variant.classify}
                    type="button"
                    disabled={outOfStock}
                    onClick={() => onSelectVariant(variant)}
                    className={`store-pdp-variant-card cursor-pointer rounded-2xl px-4 py-3.5 text-left transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${
                      selected ? "store-pdp-variant-selected" : ""
                    }`}
                  >
                    <span className="block text-sm font-semibold text-[var(--store-primary)]">
                      {variant.classify}
                    </span>
                    <span className="mt-0.5 block text-xs text-[var(--store-muted)]">
                      {formatVnd(vp.display)}
                      {outOfStock ? " · Hết hàng" : stock <= 5 ? ` · Còn ${stock}` : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {!isZalo ? (
          <div className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--store-muted)]">
              Số lượng
            </p>
            <div className="mt-3 flex items-center gap-4">
              <div className="store-pdp-qty flex items-center rounded-2xl">
                <button
                  type="button"
                  onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="flex h-12 w-12 cursor-pointer items-center justify-center text-xl text-[var(--store-primary)] transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Giảm số lượng"
                >
                  −
                </button>
                <span className="w-14 text-center text-base font-semibold tabular-nums">{quantity}</span>
                <button
                  type="button"
                  onClick={() => onQuantityChange(Math.min(maxQty, quantity + 1))}
                  disabled={quantity >= maxQty}
                  className="flex h-12 w-12 cursor-pointer items-center justify-center text-xl text-[var(--store-primary)] transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Tăng số lượng"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {isZalo ? (
            <button
              type="button"
              onClick={onAddToCart}
              disabled={isLoading}
              className="store-btn-accent flex-1 cursor-pointer rounded-2xl py-4 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Liên hệ Zalo ngay
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onAddToCart}
                disabled={isLoading}
                className="store-pdp-btn-outline flex-1 cursor-pointer rounded-2xl py-4 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? "Đang xử lý…" : "Thêm vào giỏ"}
              </button>
              <button
                type="button"
                onClick={onBuyNow}
                disabled={isLoading}
                className="store-btn-primary flex-1 cursor-pointer rounded-2xl py-4 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Mua ngay
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        {TRUST_ITEMS.map((item) => (
          <div
            key={item.label}
            className="store-pdp-trust flex flex-col items-center rounded-2xl px-2 py-4 text-center sm:px-3"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--store-accent-soft)] text-[var(--store-accent)]">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                {item.icon}
              </svg>
            </div>
            <p className="mt-2 text-[11px] font-semibold text-[var(--store-primary)] sm:text-xs">{item.label}</p>
            <p className="mt-0.5 text-[10px] leading-tight text-[var(--store-muted)]">{item.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}