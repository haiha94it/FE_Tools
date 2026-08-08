/**
 * LayoutPreview — maps full sections[] → production/preview renderers.
 * Dùng cho live preview trong builder hoặc embed storefront custom layout.
 */

"use client";

import type { LayoutSection } from "@/types/shop-layout-canvas";
import type { ShopCategory, ShopProduct } from "@/types/zalo-shop";
import { useMemo } from "react";
import SectionRenderer from "./SectionRenderer";
import type { LayoutRenderTheme } from "./section-style-utils";

export interface LayoutPreviewProps {
  /** Ordered layout sections (full canvas state) */
  sections: LayoutSection[];
  /**
   * Sản phẩm thật của shop.
   * - Có phần tử → GRID / HOT / FLASH dùng data thật
   * - `[]` hoặc undefined → fallback demo preview
   */
  products?: ShopProduct[];
  categories?: ShopCategory[];
  /** Đang load SP từ API */
  productsLoading?: boolean;
  theme?: LayoutRenderTheme;
  /**
   * desktop | mobile frame chrome
   * @default "desktop"
   */
  device?: "desktop" | "mobile";
  /** Highlight section (builder selection) */
  activeSectionId?: string | null;
  /** Click section in preview → select in builder */
  onSelectSection?: (id: string) => void;
  className?: string;
  /**
   * Khi true: vẫn render section `enabled: false` với opacity thấp (debug builder).
   * Production nên để false.
   */
  showDisabled?: boolean;
}

export default function LayoutPreview({
  sections,
  products,
  categories,
  productsLoading = false,
  theme,
  device = "desktop",
  activeSectionId = null,
  onSelectSection,
  className = "",
  showDisabled = false,
}: LayoutPreviewProps) {
  const visible = useMemo(() => {
    if (showDisabled) return sections;
    return sections.filter((s) => s.enabled);
  }, [sections, showDisabled]);

  const hasRealProducts = Boolean(products && products.length > 0);
  const productSourceLabel = productsLoading
    ? "Đang tải sản phẩm…"
    : hasRealProducts
      ? `SP thật · ${products!.length}`
      : "Demo · shop chưa có SP";

  const frameClass =
    device === "mobile"
      ? "mx-auto w-full max-w-[390px] overflow-hidden rounded-[1.75rem] border-[10px] border-stone-900 shadow-2xl"
      : "w-full overflow-hidden rounded-2xl border border-gray-200 shadow-sm dark:border-gray-700";

  const pageBg = theme?.backgroundColor ?? "#f5f5f7";

  return (
    <div className={`${className}`}>
      {/* Device chrome label */}
      <div className="mb-2 flex items-center justify-between gap-2 px-0.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
          Live preview · {device}
        </p>
        <p
          className={`text-[10px] font-semibold ${
            hasRealProducts
              ? "text-emerald-600 dark:text-emerald-400"
              : productsLoading
                ? "text-gray-400"
                : "text-amber-600 dark:text-amber-400"
          }`}
        >
          {productSourceLabel}
          <span className="ml-2 font-normal text-gray-400">
            · {visible.length}/{sections.length} section
          </span>
        </p>
      </div>

      <div className={frameClass}>
        {device === "mobile" ? (
          <div className="flex h-6 items-center justify-center bg-stone-900">
            <span className="h-1 w-16 rounded-full bg-stone-700" />
          </div>
        ) : null}

        <div
          className="min-h-[320px]"
          style={{ background: pageBg }}
          data-layout-preview
        >
          {visible.length === 0 ? (
            <div className="flex min-h-[240px] flex-col items-center justify-center gap-2 p-8 text-center">
              <p className="text-sm font-semibold text-gray-600">
                Chưa có section hiển thị
              </p>
              <p className="max-w-xs text-xs text-gray-400">
                Bật section trên canvas hoặc thêm khối mới.
              </p>
            </div>
          ) : (
            visible.map((section) => {
              const isActive = activeSectionId === section.id;
              const isDimmed = showDisabled && !section.enabled;

              return (
                <div
                  key={section.id}
                  role={onSelectSection ? "button" : undefined}
                  tabIndex={onSelectSection ? 0 : undefined}
                  onClick={
                    onSelectSection
                      ? () => onSelectSection(section.id)
                      : undefined
                  }
                  onKeyDown={
                    onSelectSection
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onSelectSection(section.id);
                          }
                        }
                      : undefined
                  }
                  className={`relative outline-none transition ${
                    onSelectSection ? "cursor-pointer" : ""
                  } ${isDimmed ? "opacity-40" : ""} ${
                    isActive
                      ? "ring-2 ring-inset ring-brand-500 ring-offset-0"
                      : onSelectSection
                        ? "hover:ring-2 hover:ring-inset hover:ring-brand-300/60"
                        : ""
                  }`}
                >
                  {isActive ? (
                    <span className="pointer-events-none absolute left-2 top-2 z-10 rounded-md bg-brand-500 px-1.5 py-0.5 text-[9px] font-bold text-white shadow">
                      Đang chọn
                    </span>
                  ) : null}
                  <SectionRenderer
                    section={section}
                    theme={theme}
                    products={products}
                    categories={categories}
                  />
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
