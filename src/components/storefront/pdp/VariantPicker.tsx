"use client";

import { formatVnd } from "@/lib/shop-utils";
import {
  variantPrice,
  variantStock,
} from "@/components/storefront/pdp/pdp-utils";
import type { ShopProductVariant } from "@/types/zalo-shop";

interface VariantPickerProps {
  variants: ShopProductVariant[];
  selected: ShopProductVariant | null;
  onSelect: (v: ShopProductVariant) => void;
  dense?: boolean;
}

export default function VariantPicker({
  variants,
  selected,
  onSelect,
  dense = false,
}: VariantPickerProps) {
  if (variants.length === 0) return null;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--store-muted)]">
          Phân loại
        </p>
        {selected ? (
          <p className="text-xs text-[var(--store-muted)]">
            {variantStock(selected) > 0 ? (
              <>
                Còn{" "}
                <span className="font-bold text-emerald-600">
                  {variantStock(selected)}
                </span>
              </>
            ) : (
              <span className="font-bold text-rose-600">Hết hàng</span>
            )}
          </p>
        ) : null}
      </div>
      <div
        className={`mt-3 grid gap-2 ${dense ? "grid-cols-2 sm:grid-cols-3" : "sm:grid-cols-2"}`}
      >
        {variants.map((variant) => {
          const isSelected = selected?.classify === variant.classify;
          const stock = variantStock(variant);
          const vp = variantPrice(variant);
          const out = stock <= 0;

          return (
            <button
              key={variant.id ?? variant.classify}
              type="button"
              disabled={out}
              onClick={() => onSelect(variant)}
              className={`store-press cursor-pointer rounded-2xl border px-3.5 py-3 text-left transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${
                isSelected
                  ? "border-stone-900 bg-stone-900 text-white shadow-md dark:border-white dark:bg-white dark:text-stone-950"
                  : "border-stone-200 bg-white text-stone-900 hover:border-stone-400 hover:shadow-sm dark:border-stone-800 dark:bg-stone-900 dark:text-white"
              }`}
            >
              <span
                className={`block text-sm font-bold ${
                  isSelected ? "text-white dark:text-stone-950" : "text-stone-900 dark:text-white"
                }`}
              >
                {variant.classify}
              </span>
              <span
                className={`mt-0.5 flex flex-wrap items-center gap-1.5 text-xs ${
                  isSelected
                    ? "text-stone-200 dark:text-stone-700"
                    : "text-stone-500 dark:text-stone-400"
                }`}
              >
                <span className="font-semibold">{formatVnd(vp.display)}</span>
                {out ? (
                  <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
                    Hết hàng
                  </span>
                ) : (
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                      isSelected
                        ? "bg-white/20 text-white dark:bg-stone-900/20 dark:text-stone-900"
                        : stock <= 5
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                          : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                    }`}
                  >
                    {stock <= 5 ? `Còn ${stock}` : `Còn ${stock}`}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
