/**
 * CustomCanvasLayout — storefront dùng CÙNG layoutCanvas + SectionRenderer
 * như tab Kéo thả Canvas (/shop/theme).
 */

"use client";

import SectionMotion from "@/components/shop-admin/layout-canvas/SectionMotion";
import SectionRenderer from "@/components/shop-admin/layout-canvas/renderers/SectionRenderer";
import type { LayoutRenderTheme } from "@/components/shop-admin/layout-canvas/renderers/section-style-utils";
import { buildWidthFrameClass } from "@/components/shop-admin/layout-canvas/renderers/section-style-utils";
import type { StorefrontLayoutProps } from "@/components/storefront/layouts/types";
import StoreLoading from "@/components/storefront/StoreLoading";
import { resolveLayoutCanvas } from "@/lib/shop-layout-canvas";
import {
  buildStoreCategoryUrl,
  buildStoreProductUrl,
  buildStoreUrl,
  shopImageUrl,
} from "@/lib/shop-utils";
import type { LayoutSection } from "@/types/shop-layout-canvas";
import Link from "next/link";
import { useCallback, useMemo } from "react";

export default function CustomCanvasLayout({
  sellerId,
  cover,
  categories,
  products,
  filteredProducts,
  config,
  loading,
  onQuickView,
}: StorefrontLayoutProps) {
  const sections = useMemo(
    () => resolveLayoutCanvas(config).sections.filter((s) => s.enabled),
    [config],
  );

  const theme = useMemo<LayoutRenderTheme>(
    () => ({
      primaryColor: config.primaryColor,
      accentColor: config.accentColor,
      backgroundColor: config.backgroundColor,
      shopName: cover?.name?.trim() || "Cửa hàng",
      logoUrl: shopImageUrl(cover?.image_logo) || undefined,
      coverImageUrl: shopImageUrl(cover?.image) || undefined,
      contactPhone: config.contactPhone,
      contactZalo: config.contactZalo,
      contactFacebook: config.contactFacebook,
      contactWebsite: config.contactWebsite,
      contactAddress: config.contactAddress,
      heroTitle: config.heroTitle,
      heroSubtitle: config.heroSubtitle,
      ctaText: config.ctaText,
      announcement: config.announcement,
    }),
    [config, cover],
  );

  const catalogProducts =
    filteredProducts.length > 0 ? filteredProducts : products;

  const getProductHref = useCallback(
    (productId: number) => {
      const p = products.find((x) => x.id === productId);
      return buildStoreProductUrl(sellerId, productId, p?.category ?? 0);
    },
    [products, sellerId],
  );

  const onProductClick = useCallback(
    (productId: number) => {
      const p = products.find((x) => x.id === productId);
      if (p) onQuickView(p);
    },
    [products, onQuickView],
  );

  if (loading && !products.length) {
    return <StoreLoading />;
  }

  if (sections.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-sm font-semibold text-stone-700 dark:text-stone-200">
          Chưa có layout canvas
        </p>
        <p className="mt-2 text-xs text-stone-500">
          Vào Quản trị → Giao diện gian hàng → Kéo thả Canvas, chỉnh section rồi
          Lưu thay đổi. Chọn mẫu «Custom Drag & Drop» nếu chưa chọn.
        </p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full"
      style={{ background: config.backgroundColor || "#f8fafc" }}
      data-storefront-layout="custom-canvas"
    >
      {sections.map((section, index) => {
        if (section.type === "CATEGORY_RAIL") {
          return (
            <CategoryRailLinked
              key={section.id}
              section={section}
              sellerId={sellerId}
              categories={categories}
              theme={theme}
              motionIndex={Math.min(index, 11)}
            />
          );
        }

        const sectionProducts =
          section.type === "PRODUCT_GRID"
            ? catalogProducts
            : section.type === "HOT_PRODUCTS" ||
                section.type === "FLASH_SALE" ||
                section.type === "PRODUCT_CAROUSEL"
              ? products
              : catalogProducts;

        return (
          <SectionRenderer
            key={section.id}
            section={section}
            products={sectionProducts}
            categories={categories}
            theme={theme}
            getProductHref={getProductHref}
            onProductClick={onProductClick}
            motionIndex={Math.min(index, 11)}
          />
        );
      })}
    </div>
  );
}

/** Category rail với Link store thật + scroll animation */
function CategoryRailLinked({
  section,
  sellerId,
  categories,
  theme,
  motionIndex = 0,
}: {
  section: Extract<LayoutSection, { type: "CATEGORY_RAIL" }>;
  sellerId: string;
  categories: StorefrontLayoutProps["categories"];
  theme: LayoutRenderTheme;
  motionIndex?: number;
}) {
  const accent = theme.accentColor ?? "#F59E0B";
  const realCats = categories.filter((c) => c.name?.trim());
  const isStories = section.data.style === "stories";

  if (realCats.length === 0) {
    return (
      <SectionRenderer
        section={section}
        categories={categories}
        theme={theme}
        motionIndex={motionIndex}
      />
    );
  }

  return (
    <SectionMotion
      animation={section.styling.animation}
      delay={motionIndex}
    >
      <section
        className="w-full py-4 sm:py-5"
        style={{
          background:
            section.styling.bgPreset === "dark"
              ? "#0c0a09"
              : section.styling.bgPreset === "surface"
                ? "#fff"
                : section.styling.bgPreset === "muted"
                  ? "#f3f4f6"
                  : "transparent",
          color: section.styling.bgPreset === "dark" ? "#fff" : undefined,
        }}
        data-section-type="CATEGORY_RAIL"
        data-section-id={section.id}
      >
        <div className={buildWidthFrameClass(section.widthPreset)}>
          {section.data.title ? (
            <p className="mb-2 text-xs font-bold uppercase tracking-wide opacity-60">
              {section.data.title}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Link
              href={buildStoreUrl(sellerId)}
              className={
                isStories
                  ? "flex w-16 flex-col items-center gap-1 no-underline"
                  : "inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold text-white no-underline transition hover:opacity-90"
              }
              style={!isStories ? { background: accent } : undefined}
            >
              {isStories ? (
                <>
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ background: accent }}
                  >
                    All
                  </span>
                  <span className="line-clamp-1 text-[10px] font-semibold">
                    Tất cả
                  </span>
                </>
              ) : (
                "Tất cả"
              )}
            </Link>
            {realCats.map((cat) => {
              const avt = cat.avt ? shopImageUrl(cat.avt) : "";
              const href = buildStoreCategoryUrl(sellerId, cat.id);
              if (isStories) {
                return (
                  <Link
                    key={cat.id}
                    href={href}
                    className="flex w-16 flex-col items-center gap-1 no-underline transition hover:opacity-90"
                  >
                    <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full ring-2 ring-gray-200 dark:ring-gray-600">
                      {avt ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={avt}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-bold opacity-50">
                          {cat.name.slice(0, 1)}
                        </span>
                      )}
                    </span>
                    <span className="line-clamp-1 text-[10px] font-semibold">
                      {cat.name}
                    </span>
                  </Link>
                );
              }
              return (
                <Link
                  key={cat.id}
                  href={href}
                  className="inline-flex items-center gap-1.5 rounded-full bg-black/5 px-3 py-1.5 text-xs font-semibold text-stone-700 no-underline transition hover:bg-black/10 dark:bg-white/10 dark:text-stone-200"
                >
                  {avt ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avt}
                      alt=""
                      className="h-5 w-5 rounded-full object-cover"
                    />
                  ) : null}
                  {cat.name}
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </SectionMotion>
  );
}
