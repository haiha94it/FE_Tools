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
                  ? "border-[var(--store-primary)] bg-[var(--store-primary)] text-white shadow-md"
                  : "border-slate-200 bg-white hover:border-[var(--store-accent)]/50 hover:shadow-sm hover:-translate-y-0.5"
              }`}
            >
              <span
                className={`block text-sm font-bold ${
                  isSelected ? "text-white" : "text-[var(--store-primary)]"
                }`}
              >
                {variant.classify}
              </span>
              <span
                className={`mt-0.5 flex flex-wrap items-center gap-1.5 text-xs ${
                  isSelected ? "text-white/80" : "text-[var(--store-muted)]"
                }`}
              >
                <span className="font-semibold">{formatVnd(vp.display)}</span>
                {out ? (
                  <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                    Hết hàng
                  </span>
                ) : (
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : stock <= 5
                          ? "bg-amber-50 text-amber-700"
                          : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {stock <= 5 ? `Còn ${stock}` : `In stock (${stock})`}
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
