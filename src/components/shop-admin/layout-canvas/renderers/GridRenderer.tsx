/**
 * GridRenderer — product card grid from PRODUCT_GRID section.
 * Preview uses demo products when live catalog is not passed.
 */

"use client";

import { shopImageUrl } from "@/lib/shop-utils";
import type { LayoutSection } from "@/types/shop-layout-canvas";
import type { ShopProduct } from "@/types/zalo-shop";
import {
  buildSectionShellClasses,
  buildWidthFrameClass,
  mutedTextClass,
  productGridClass,
  radiusClass,
  type SectionRendererProps,
} from "./section-style-utils";

/** Demo catalog for builder live preview */
export const PREVIEW_DEMO_PRODUCTS: Array<{
  id: number;
  title: string;
  price: number;
  promo?: number;
  image: string;
  badge?: string;
}> = [
  {
    id: 1,
    title: "Áo Thun Cotton Unisex",
    price: 350_000,
    promo: 249_000,
    image:
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80",
    badge: "Sale",
  },
  {
    id: 2,
    title: "Giày Sneaker Limited",
    price: 1_250_000,
    promo: 990_000,
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80",
    badge: "Hot",
  },
  {
    id: 3,
    title: "Túi Xách Minimal",
    price: 890_000,
    image:
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: 4,
    title: "Smartwatch Pro",
    price: 2_100_000,
    promo: 1_790_000,
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
    badge: "New",
  },
  {
    id: 5,
    title: "Kính Mát Classic",
    price: 450_000,
    image:
      "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: 6,
    title: "Áo Khoác Denim",
    price: 780_000,
    promo: 650_000,
    image:
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: 7,
    title: "Balo Urban Travel",
    price: 620_000,
    image:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: 8,
    title: "Đồng Hồ Classic Leather",
    price: 1_450_000,
    image:
      "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600&auto=format&fit=crop&q=80",
  },
];

function formatVnd(n: number): string {
  return new Intl.NumberFormat("vi-VN").format(n) + "₫";
}

export type GridProductTile = {
  id: number;
  title: string;
  price: number;
  promo?: number;
  image: string;
  badge?: string;
};

export type GridRendererProps = SectionRendererProps<
  Extract<LayoutSection, { type: "PRODUCT_GRID" | "HOT_PRODUCTS" }>
> & {
  /**
   * Sản phẩm thật từ shop.
   * - Có data → render thật
   * - Rỗng / undefined → fallback PREVIEW_DEMO_PRODUCTS
   */
  products?: ShopProduct[];
  /** Giới hạn số card (HOT / FLASH override) */
  maxItems?: number;
  /** true khi đang dùng demo vì shop chưa có SP */
  usingDemoFallback?: boolean;
  /** Build href cho từng SP (storefront). Không có → card không link */
  getProductHref?: (productId: number) => string;
  /** Click card (quick view) — storefront optional */
  onProductClick?: (productId: number) => void;
};

/** Map ShopProduct[] → tile UI; chỉ gọi khi đã có SP thật */
export function mapShopProductsToTiles(
  products: ShopProduct[],
  maxItems = 12,
): GridProductTile[] {
  return products.slice(0, maxItems).map((p) => {
    const v = p.variants[0];
    const price = Number(v?.price ?? 0);
    const promoRaw = v?.promotion_price;
    const promo =
      promoRaw != null && promoRaw !== "" ? Number(promoRaw) : undefined;
    const rawImg = p.images[0];
    const image =
      shopImageUrl(rawImg) ||
      (rawImg?.startsWith("http") ? rawImg : PREVIEW_DEMO_PRODUCTS[0].image);
    return {
      id: p.id,
      title: p.title,
      price: Number.isFinite(price) ? price : 0,
      promo: promo != null && Number.isFinite(promo) ? promo : undefined,
      image,
      badge: p.is_flash_sale ? "Sale" : p.is_hot ? "Hot" : undefined,
    };
  });
}

/**
 * Chọn data hiển thị: SP thật nếu có, không thì demo preview.
 */
export function resolveGridDisplayItems(
  products: ShopProduct[] | undefined,
  maxItems = 12,
): { items: GridProductTile[]; usingDemo: boolean } {
  if (products && products.length > 0) {
    return {
      items: mapShopProductsToTiles(products, maxItems),
      usingDemo: false,
    };
  }
  return {
    items: PREVIEW_DEMO_PRODUCTS.slice(0, maxItems),
    usingDemo: true,
  };
}

export default function GridRenderer({
  section,
  theme,
  products,
  maxItems,
  usingDemoFallback,
  getProductHref,
  onProductClick,
  className = "",
}: GridRendererProps) {
  const { styling, widthPreset, data } = section;
  const shell = buildSectionShellClasses(styling);
  const accent = theme?.accentColor ?? "#0071E3";

  const limit =
    maxItems ??
    (section.type === "HOT_PRODUCTS"
      ? (section.data.maxItems ?? 8)
      : 12);

  const resolved = resolveGridDisplayItems(products, limit);
  const items = resolved.items;
  const usingDemo = usingDemoFallback ?? resolved.usingDemo;

  const density =
    section.type === "PRODUCT_GRID" ? section.data.density : "comfortable";
  const cardStyle =
    section.type === "PRODUCT_GRID" ? section.data.cardStyle : "comfortable";
  const isList = cardStyle === "list";
  const isOverlay = cardStyle === "overlay";
  const isBordered = cardStyle === "bordered" || cardStyle === "editorial";

  return (
    <section
      className={`${shell.className} ${className}`}
      style={shell.style}
      data-section-type={section.type}
      data-section-id={section.id}
    >
      {/* Width frame: chỉ max-w + gutter — giống mọi section cùng Boxed model */}
      <div className={`${buildWidthFrameClass(widthPreset)} h-full w-full`}>
        {/* Heading */}
        {(data.title ||
          ("subtitle" in data && data.subtitle) ||
          usingDemo) && (
          <div className="mb-5 flex w-full flex-wrap items-end justify-between gap-3">
            <div>
              {data.title ? (
                <h2 className="text-xl font-black tracking-tight sm:text-2xl">
                  {data.title}
                </h2>
              ) : null}
              {"subtitle" in data && data.subtitle ? (
                <p
                  className={`mt-1 text-sm ${mutedTextClass(styling.textTone, styling.bgPreset)}`}
                >
                  {data.subtitle}
                </p>
              ) : null}
              {usingDemo ? (
                <p className="mt-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                  Shop chưa có sản phẩm — đang hiện dữ liệu demo
                </p>
              ) : null}
            </div>
            {section.type === "PRODUCT_GRID" &&
            "showFilters" in data &&
            data.showFilters !== false ? (
              <div className="flex flex-wrap gap-1.5">
                {["Tất cả", "Mới", "Giá ↓"].map((f, i) => (
                  <span
                    key={f}
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                      i === 0
                        ? "text-white"
                        : "bg-black/5 text-current/70 dark:bg-white/10"
                    }`}
                    style={i === 0 ? { background: accent } : undefined}
                  >
                    {f}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        )}

        {/* Grid */}
        <ul
          className={
            isList
              ? "flex list-none flex-col gap-3 p-0"
              : `list-none p-0 ${productGridClass(widthPreset, density)}`
          }
        >
          {items.map((item) => {
            const href = !usingDemo ? getProductHref?.(item.id) : undefined;
            const cardClass = `group h-full overflow-hidden bg-white text-gray-900 transition hover:-translate-y-0.5 hover:shadow-md ${radiusClass(styling.radius)} ${
              isBordered
                ? "border border-gray-200 shadow-sm"
                : "shadow-sm ring-1 ring-black/5"
            } ${isList ? "flex flex-row gap-3 p-2" : ""} ${
              href || onProductClick ? "cursor-pointer" : ""
            }`;

            const inner = (
              <>
                <div
                  className={`relative overflow-hidden bg-gray-100 ${
                    isList
                      ? `h-24 w-24 shrink-0 ${radiusClass("md")}`
                      : "aspect-[3/4] w-full"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  {item.badge ? (
                    <span
                      className="absolute left-2 top-2 rounded-md px-1.5 py-0.5 text-[10px] font-bold text-white"
                      style={{
                        background:
                          item.badge === "Sale" ? "#e11d48" : accent,
                      }}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                  {isOverlay ? (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-8">
                      <p className="line-clamp-1 text-xs font-bold text-white">
                        {item.title}
                      </p>
                      <p className="text-xs font-semibold text-white/90">
                        {formatVnd(item.promo ?? item.price)}
                      </p>
                    </div>
                  ) : null}
                </div>

                {!isOverlay ? (
                  <div
                    className={`flex min-w-0 flex-1 flex-col ${
                      isList ? "justify-center py-1 pr-2" : "p-3"
                    }`}
                  >
                    <h3 className="line-clamp-2 text-sm font-semibold leading-snug">
                      {item.title}
                    </h3>
                    <div className="mt-1.5 flex flex-wrap items-baseline gap-1.5">
                      <span
                        className="text-sm font-bold"
                        style={{ color: accent }}
                      >
                        {formatVnd(item.promo ?? item.price)}
                      </span>
                      {item.promo != null ? (
                        <span className="text-xs text-gray-400 line-through">
                          {formatVnd(item.price)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </>
            );

            return (
              <li key={item.id} className={isList ? "" : "min-w-0"}>
                {href ? (
                  <a href={href} className={`${cardClass} block no-underline`}>
                    {inner}
                  </a>
                ) : onProductClick && !usingDemo ? (
                  <button
                    type="button"
                    className={`${cardClass} w-full text-left`}
                    onClick={() => onProductClick(item.id)}
                  >
                    {inner}
                  </button>
                ) : (
                  <article className={cardClass}>{inner}</article>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
