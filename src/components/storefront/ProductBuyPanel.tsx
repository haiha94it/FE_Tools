"use client";

import FlashCountdown from "@/components/storefront/pdp/FlashCountdown";
import {
  productSocialProof,
  variantPrice,
} from "@/components/storefront/pdp/pdp-utils";
import StockUrgencyBar from "@/components/storefront/pdp/StockUrgencyBar";
import TrustBadges from "@/components/storefront/pdp/TrustBadges";
import VariantPicker from "@/components/storefront/pdp/VariantPicker";
import { formatVnd } from "@/lib/shop-utils";
import type { PDPBuyPanelStyle } from "@/types/pdp-template";
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
  panelStyle?: PDPBuyPanelStyle;
  showCountdown?: boolean;
  showStockBar?: boolean;
  dense?: boolean;
  minimal?: boolean;
  className?: string;
}

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
  panelStyle = "sticky-card",
  showCountdown = false,
  showStockBar = true,
  dense = false,
  minimal = false,
  className = "",
}: ProductBuyPanelProps) {
  const isZalo = product.sell_option === 1;
  const price = selectedVariant
    ? variantPrice(selectedVariant)
    : { original: 0, display: 0, hasDiscount: false, savings: 0, discountPct: 0 };
  const proof = productSocialProof(product);
  const sticky =
    panelStyle === "sticky-card" || panelStyle === "sidebar-fixed";

  const shell =
    panelStyle === "minimal-clean"
      ? "space-y-5"
      : panelStyle === "sidebar-fixed"
        ? "store-pdp-buy-panel space-y-5 rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-xl backdrop-blur lg:p-6"
        : "store-pdp-buy-panel space-y-5 rounded-[2rem] p-5 shadow-xl sm:p-7";

  return (
    <div
      id={id}
      className={`${sticky ? "lg:sticky lg:top-24 lg:self-start" : ""} ${className}`}
    >
      <div className={shell}>
        {showCountdown || product.is_flash_sale ? (
          <FlashCountdown />
        ) : null}

        {/* Vouchers / dense deal strip */}
        {dense ? (
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600">
              Freeship
            </span>
            <span className="rounded border border-orange-200 bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-700">
              Giảm 50k đơn từ 500k
            </span>
            <span className="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">
              COD
            </span>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          {product.is_hot ? (
            <span className="store-badge-hot rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase">
              Bestseller
            </span>
          ) : null}
          {product.is_flash_sale ? (
            <span className="store-badge-flash rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase">
              Flash Sale
            </span>
          ) : null}
        </div>

        <h1
          className={`${
            minimal
              ? "text-2xl font-normal tracking-tight sm:text-3xl"
              : "store-display text-2xl font-bold leading-[1.15] sm:text-3xl"
          } text-stone-900 dark:text-white`}
        >
          {product.title}
        </h1>

        {/* Rating & social proof */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className="inline-flex items-center gap-1 font-bold text-amber-500">
            {proof.rating}
            <span className="text-amber-400" aria-hidden>
              ★★★★★
            </span>
          </span>
          <span className="text-stone-500 dark:text-stone-400">
            ({proof.reviews} đánh giá)
          </span>
          <span className="hidden text-stone-300 dark:text-stone-700 sm:inline">|</span>
          <span className="font-medium text-stone-500 dark:text-stone-400">
            Đã bán {proof.soldLabel}
          </span>
        </div>

        {/* Dynamic price box */}
        <div
          className={`rounded-2xl ${
            dense
              ? "bg-gradient-to-r from-amber-50 to-rose-50 p-3.5 dark:from-stone-900 dark:to-stone-900"
              : "bg-stone-100 p-4 dark:bg-stone-900"
          }`}
        >
          <div className="flex flex-wrap items-baseline gap-2.5">
            <p
              className={`font-extrabold text-[var(--store-accent)] ${
                dense ? "text-2xl sm:text-3xl" : "store-display text-3xl sm:text-4xl"
              }`}
            >
              {formatVnd(price.display)}
            </p>
            {price.hasDiscount ? (
              <>
                <p className="text-base text-[var(--store-muted)] line-through">
                  {formatVnd(price.original)}
                </p>
                <span className="rounded-lg bg-[var(--store-accent)] px-2 py-0.5 text-xs font-extrabold text-white">
                  -{price.discountPct}%
                </span>
              </>
            ) : null}
          </div>
          {price.hasDiscount && price.savings > 0 ? (
            <p className="mt-1.5 text-xs font-bold text-emerald-700">
              Tiết kiệm {formatVnd(price.savings)}
            </p>
          ) : null}
        </div>

        {showStockBar ? (
          <StockUrgencyBar
            stock={maxQty}
            soldPct={55 + (product.id % 40)}
            showProgress={dense || product.is_flash_sale}
          />
        ) : null}

        <VariantPicker
          variants={product.variants}
          selected={selectedVariant}
          onSelect={onSelectVariant}
          dense={dense}
        />

        {!isZalo ? (
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--store-muted)]">
              Số lượng
            </p>
            <div className="mt-2.5 flex items-center gap-3">
              <div className="store-pdp-qty flex items-center rounded-2xl p-1">
                <button
                  type="button"
                  onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-lg font-bold disabled:opacity-30"
                  aria-label="Giảm"
                >
                  −
                </button>
                <span className="w-10 text-center text-base font-bold tabular-nums">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => onQuantityChange(Math.min(maxQty, quantity + 1))}
                  disabled={quantity >= maxQty}
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-lg font-bold disabled:opacity-30"
                  aria-label="Tăng"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-2.5 sm:flex-row">
          {isZalo ? (
            <button
              type="button"
              onClick={onAddToCart}
              disabled={isLoading}
              className="store-btn-accent flex-1 cursor-pointer rounded-2xl py-3.5 text-sm font-bold disabled:opacity-50"
            >
              Tư vấn & Mua qua Zalo
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onAddToCart}
                disabled={isLoading || maxQty <= 0}
                className="store-pdp-btn-outline flex-1 cursor-pointer rounded-2xl py-3.5 text-sm font-bold disabled:opacity-50"
              >
                {isLoading ? "Đang xử lý…" : "Thêm vào giỏ"}
              </button>
              <button
                type="button"
                onClick={onBuyNow}
                disabled={isLoading || maxQty <= 0}
                className="store-btn-accent flex-1 cursor-pointer rounded-2xl py-3.5 text-sm font-bold shadow-lg disabled:opacity-50"
              >
                Mua ngay
              </button>
            </>
          )}
        </div>

        {/* Integrated Trust Badges Block */}
        <div className="pt-2">
          <TrustBadges compact={true} />
        </div>
      </div>
    </div>
  );
}
