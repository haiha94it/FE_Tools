/**
 * Layout patterns — bộ section preset (1 click chèn nhiều khối).
 */

import { createSection } from "@/lib/shop-layout-canvas";
import type { LayoutPatternDefinition, LayoutSection } from "@/types/shop-layout-canvas";

function withIds(sections: LayoutSection[]): LayoutSection[] {
  // createSection already generates unique ids
  return sections;
}

export const LAYOUT_PATTERNS: LayoutPatternDefinition[] = [
  {
    id: "hero-usp-cta",
    name: "Hero + USP + CTA",
    description: "Hero bento, 4 cam kết, dải CTA chuyển đổi",
    tags: ["conversion", "starter"],
    build: () =>
      withIds([
        createSection("HERO", {
          widthPreset: "FULL_BLEED",
          data: {
            title: "Bộ sưu tập mới",
            subtitle: "Chất lượng · Giao nhanh · Đổi trả dễ",
            ctaText: "Mua ngay",
            heroVariant: "bento",
          },
        }),
        createSection("FEATURE_GRID", {
          data: {
            title: "Vì sao chọn chúng tôi",
            columns: 4,
          },
        }),
        createSection("CTA_BANNER", {
          widthPreset: "FULL_BLEED",
          data: {
            title: "Sẵn sàng đặt hàng?",
            subtitle: "Ưu đãi dành riêng khách Zalo",
            ctaText: "Xem sản phẩm",
            ctaHref: "#products",
            variant: "gradient",
          },
        }),
      ]),
  },
  {
    id: "flash-wall",
    name: "Flash Sale Wall",
    description: "Announcement + countdown flash + mã giảm + grid",
    tags: ["deal", "urgency"],
    build: () =>
      withIds([
        createSection("ANNOUNCEMENT", {
          widthPreset: "FULL_BLEED",
          data: { text: "⚡ Flash Sale hôm nay — số lượng có hạn" },
        }),
        createSection("FLASH_SALE", {
          data: {
            title: "Giờ vàng săn deal",
            subtitle: "Đếm ngược kết thúc",
            maxItems: 8,
          },
        }),
        createSection("COUPONS"),
        createSection("PRODUCT_GRID", {
          data: {
            title: "Tất cả deal",
            density: "dense",
            cardStyle: "compact",
            showFilters: true,
          },
        }),
      ]),
  },
  {
    id: "brand-story",
    name: "Brand Story",
    description: "Editorial + gallery lookbook + reviews + FAQ",
    tags: ["brand", "d2c"],
    build: () =>
      withIds([
        createSection("TEXT_BLOCK", {
          widthPreset: "NARROW",
          data: {
            eyebrow: "Our story",
            title: "Thương hiệu vì trải nghiệm",
            body: "Chúng tôi tin vào chất lượng và sự minh bạch.",
            align: "center",
            size: "lg",
          },
        }),
        createSection("EDITORIAL", {
          widthPreset: "SPLIT_50_50",
        }),
        createSection("GALLERY", {
          data: { title: "Lookbook", columns: 3 },
        }),
        createSection("REVIEWS"),
        createSection("FAQ"),
      ]),
  },
  {
    id: "catalog-first",
    name: "Catalog First",
    description: "Danh mục + hot products + full grid + footer",
    tags: ["catalog"],
    build: () =>
      withIds([
        createSection("HEADER", {
          data: {
            style: "island",
            position: "sticky",
            showSearch: true,
            showCart: true,
          },
          styling: { animation: "none" },
        }),
        createSection("CATEGORY_RAIL"),
        createSection("HOT_PRODUCTS"),
        createSection("PRODUCT_CAROUSEL"),
        createSection("PRODUCT_GRID"),
        createSection("NEWSLETTER"),
        createSection("CONTACT_FOOTER"),
      ]),
  },
  {
    id: "trust-convert",
    name: "Trust & Convert",
    description: "Stats + trust badges + newsletter + CTA",
    tags: ["trust", "conversion"],
    build: () =>
      withIds([
        createSection("STATS"),
        createSection("TRUST_BADGES"),
        createSection("LOGO_CLOUD"),
        createSection("NEWSLETTER"),
        createSection("CTA_BANNER"),
      ]),
  },
  {
    id: "media-rich",
    name: "Media Rich",
    description: "Banner ảnh + video + gallery + text",
    tags: ["media"],
    build: () =>
      withIds([
        createSection("IMAGE_BANNER", { widthPreset: "FULL_BLEED" }),
        createSection("TEXT_BLOCK"),
        createSection("VIDEO_BLOCK"),
        createSection("GALLERY"),
        createSection("DIVIDER"),
        createSection("FEATURE_GRID"),
      ]),
  },
];

export function getPatternById(id: string): LayoutPatternDefinition | undefined {
  return LAYOUT_PATTERNS.find((p) => p.id === id);
}
