/**
 * Section “Card” previews for LayoutCanvas.
 * Mỗi type → 1 mini wireframe; dùng trong Draggable row.
 */

"use client";

import type { LayoutSection, LayoutSectionType } from "@/types/shop-layout-canvas";
import { LAYOUT_SECTION_TYPE_META } from "@/lib/shop-layout-canvas";
import type { ReactNode } from "react";

export function getSectionTypeLabel(type: LayoutSectionType): string {
  return LAYOUT_SECTION_TYPE_META.find((m) => m.type === type)?.label ?? type;
}

export function getSectionTypeBadge(type: LayoutSectionType): string | undefined {
  return LAYOUT_SECTION_TYPE_META.find((m) => m.type === type)?.badge;
}

/** Nhãn preset chiều ngang — hiển thị chip trên card */
export const WIDTH_PRESET_LABELS: Record<string, string> = {
  FULL_BLEED: "Full width",
  CONTAINER: "Container",
  NARROW: "Narrow",
  SPLIT_50_50: "50 / 50",
  SPLIT_70_30: "70 / 30",
  SPLIT_30_70: "30 / 70",
  SPLIT_40_60: "40 / 60",
  GRID_2: "Grid 2",
  GRID_3: "Grid 3",
  GRID_4: "Grid 4",
  BENTO_FEATURE: "Bento",
  MASONRY: "Masonry",
};

function CardShell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`min-h-[72px] w-full overflow-hidden rounded-lg border border-dashed border-gray-200/80 bg-gradient-to-b from-gray-50 to-white dark:border-gray-600/60 dark:from-gray-800/80 dark:to-gray-900 ${className}`}
    >
      {children}
    </div>
  );
}

function HeaderCard({ section }: { section: Extract<LayoutSection, { type: "HEADER" }> }) {
  return (
    <CardShell>
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900 text-[10px] font-black text-white dark:bg-white dark:text-gray-900">
            LOGO
          </span>
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
            Header · {section.data.style}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {section.data.showSearch ? (
            <span className="h-7 w-24 rounded-full bg-gray-200 dark:bg-gray-700" />
          ) : null}
          {section.data.showCart ? (
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500/15 text-[10px] font-bold text-brand-600">
              🛒
            </span>
          ) : null}
        </div>
      </div>
    </CardShell>
  );
}

function HeroCard({ section }: { section: Extract<LayoutSection, { type: "HERO" }> }) {
  return (
    <CardShell className="border-0 bg-gradient-to-br from-stone-800 via-stone-900 to-black text-white">
      <div className="flex min-h-[100px] flex-col justify-end gap-1 p-4 sm:min-h-[120px]">
        <span className="w-fit rounded-full bg-amber-400/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-200">
          {section.data.heroVariant ?? "banner"}
        </span>
        <p className="line-clamp-1 text-sm font-black leading-snug sm:text-base">
          {section.data.title || "Hero title"}
        </p>
        <p className="line-clamp-1 text-[11px] text-white/70">
          {section.data.subtitle || "Subtitle"}
        </p>
        <span className="mt-1 w-fit rounded-full bg-white px-3 py-1 text-[10px] font-bold text-stone-900">
          {section.data.ctaText || "CTA"}
        </span>
      </div>
    </CardShell>
  );
}

function AnnouncementCard({
  section,
}: {
  section: Extract<LayoutSection, { type: "ANNOUNCEMENT" }>;
}) {
  return (
    <CardShell className="border-amber-200/60 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10">
      <div className="flex items-center justify-center px-3 py-2.5 text-center text-[11px] font-semibold text-amber-900 dark:text-amber-100">
        📣 {section.data.text || "Announcement"}
      </div>
    </CardShell>
  );
}

function TrustBadgesCard({
  section,
}: {
  section: Extract<LayoutSection, { type: "TRUST_BADGES" }>;
}) {
  const items = section.data.items.slice(0, 4);
  return (
    <CardShell>
      <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-col items-center gap-1 rounded-lg bg-white px-2 py-2 text-center shadow-sm dark:bg-gray-800"
          >
            <span className="text-sm">✓</span>
            <span className="line-clamp-2 text-[9px] font-semibold text-gray-600 dark:text-gray-300">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </CardShell>
  );
}

function CategoryRailCard({
  section,
}: {
  section: Extract<LayoutSection, { type: "CATEGORY_RAIL" }>;
}) {
  return (
    <CardShell>
      <div className="flex flex-col gap-2 p-3">
        {section.data.title ? (
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
            {section.data.title}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-1.5">
          {["All", "New", "Hot", "Sale", "More"].map((label, i) => (
            <span
              key={label}
              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                i === 0
                  ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
              }`}
            >
              {label}
            </span>
          ))}
        </div>
        <p className="text-[9px] text-gray-400">Style: {section.data.style}</p>
      </div>
    </CardShell>
  );
}

function FlashSaleCard({
  section,
}: {
  section: Extract<LayoutSection, { type: "FLASH_SALE" }>;
}) {
  return (
    <CardShell className="border-0 bg-gradient-to-r from-rose-500 via-pink-600 to-fuchsia-600 text-white">
      <div className="flex items-center justify-between gap-3 p-4">
        <div>
          <p className="text-sm font-black">{section.data.title || "Flash Sale"}</p>
          <p className="text-[11px] text-white/80">
            {section.data.subtitle || "Limited time"}
          </p>
        </div>
        <div className="flex gap-1 font-mono text-[10px] font-bold">
          {["02", "14", "59"].map((t) => (
            <span
              key={t}
              className="rounded bg-black/25 px-1.5 py-1 backdrop-blur-sm"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </CardShell>
  );
}

function CouponsCard({ section }: { section: Extract<LayoutSection, { type: "COUPONS" }> }) {
  return (
    <CardShell>
      <div className="flex flex-col gap-2 p-3">
        <p className="text-xs font-bold text-gray-800 dark:text-gray-100">
          {section.data.title || "Coupons"}
        </p>
        <div className="flex gap-2 overflow-hidden">
          {["-10%", "-50K", "Freeship"].map((code) => (
            <span
              key={code}
              className="shrink-0 rounded-lg border border-dashed border-brand-400/50 bg-brand-50 px-3 py-2 text-[10px] font-bold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
            >
              {code}
            </span>
          ))}
        </div>
      </div>
    </CardShell>
  );
}

function ProductTiles({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="aspect-[3/4] rounded-lg bg-gradient-to-b from-gray-200 to-gray-100 dark:from-gray-700 dark:to-gray-800"
        >
          <div className="flex h-full flex-col justify-end p-1.5">
            <span className="h-1.5 w-3/4 rounded bg-white/80 dark:bg-gray-600" />
            <span className="mt-1 h-1.5 w-1/2 rounded bg-brand-400/60" />
          </div>
        </div>
      ))}
    </div>
  );
}

function HotProductsCard({
  section,
}: {
  section: Extract<LayoutSection, { type: "HOT_PRODUCTS" }>;
}) {
  return (
    <CardShell>
      <div className="space-y-2 p-3">
        <div>
          <p className="text-xs font-bold text-gray-900 dark:text-white">
            🔥 {section.data.title || "Hot products"}
          </p>
          {section.data.subtitle ? (
            <p className="text-[10px] text-gray-500">{section.data.subtitle}</p>
          ) : null}
        </div>
        <ProductTiles count={4} />
      </div>
    </CardShell>
  );
}

function GridCard({ section }: { section: Extract<LayoutSection, { type: "PRODUCT_GRID" }> }) {
  return (
    <CardShell>
      <div className="space-y-2 p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-bold text-gray-900 dark:text-white">
            {section.data.title || "Product grid"}
          </p>
          <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[9px] font-semibold text-gray-500 dark:bg-gray-800">
            {section.data.density} · {section.data.cardStyle}
          </span>
        </div>
        <ProductTiles count={4} />
      </div>
    </CardShell>
  );
}

function EditorialCard({
  section,
}: {
  section: Extract<LayoutSection, { type: "EDITORIAL" }>;
}) {
  const mediaLeft = section.data.mediaSide !== "right";
  return (
    <CardShell>
      <div
        className={`grid min-h-[88px] grid-cols-1 sm:grid-cols-2 ${
          mediaLeft ? "" : "sm:[&>*:first-child]:order-2"
        }`}
      >
        <div className="min-h-[72px] bg-gradient-to-br from-stone-300 to-stone-400 dark:from-stone-600 dark:to-stone-700" />
        <div className="flex flex-col justify-center gap-1 p-3">
          <p className="line-clamp-1 text-xs font-bold text-gray-900 dark:text-white">
            {section.data.title || "Editorial"}
          </p>
          <p className="line-clamp-2 text-[10px] text-gray-500 dark:text-gray-400">
            {section.data.body || "Story body…"}
          </p>
        </div>
      </div>
    </CardShell>
  );
}

function ReviewsCard({ section }: { section: Extract<LayoutSection, { type: "REVIEWS" }> }) {
  return (
    <CardShell>
      <div className="space-y-2 p-3">
        <p className="text-xs font-bold text-gray-900 dark:text-white">
          ⭐ {section.data.title || "Reviews"}
        </p>
        <div className="flex gap-2 overflow-hidden">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="min-w-[120px] flex-1 rounded-xl border border-gray-100 bg-white p-2 shadow-sm dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="mb-1 text-[10px] text-amber-500">★★★★★</div>
              <div className="h-1.5 w-full rounded bg-gray-100 dark:bg-gray-700" />
              <div className="mt-1 h-1.5 w-2/3 rounded bg-gray-100 dark:bg-gray-700" />
            </div>
          ))}
        </div>
      </div>
    </CardShell>
  );
}

function ContactFooterCard({
  section,
}: {
  section: Extract<LayoutSection, { type: "CONTACT_FOOTER" }>;
}) {
  return (
    <CardShell className="border-0 bg-stone-900 text-white">
      <div className="grid gap-2 p-4 sm:grid-cols-3">
        <div>
          <p className="text-xs font-bold">{section.data.title || "Liên hệ"}</p>
          <p className="mt-1 text-[10px] text-white/60">
            {section.data.phone || "Hotline"} · {section.data.zalo || "Zalo"}
          </p>
        </div>
        <div className="text-[10px] text-white/50">
          {section.data.address || "Địa chỉ cửa hàng"}
        </div>
        <div className="flex items-end justify-end gap-1">
          <span className="h-6 w-6 rounded bg-white/10" />
          <span className="h-6 w-6 rounded bg-white/10" />
          <span className="h-6 w-6 rounded bg-white/10" />
        </div>
      </div>
    </CardShell>
  );
}

/**
 * Map `section.type` → card preview component.
 * Thêm type mới: bổ sung case + card component.
 */
export function renderSectionCard(section: LayoutSection): ReactNode {
  switch (section.type) {
    case "ANNOUNCEMENT":
      return <AnnouncementCard section={section} />;
    case "HEADER":
      return <HeaderCard section={section} />;
    case "HERO":
      return <HeroCard section={section} />;
    case "TRUST_BADGES":
      return <TrustBadgesCard section={section} />;
    case "CATEGORY_RAIL":
      return <CategoryRailCard section={section} />;
    case "FLASH_SALE":
      return <FlashSaleCard section={section} />;
    case "COUPONS":
      return <CouponsCard section={section} />;
    case "HOT_PRODUCTS":
      return <HotProductsCard section={section} />;
    case "PRODUCT_GRID":
      return <GridCard section={section} />;
    case "EDITORIAL":
      return <EditorialCard section={section} />;
    case "REVIEWS":
      return <ReviewsCard section={section} />;
    case "CONTACT_FOOTER":
      return <ContactFooterCard section={section} />;
    default: {
      const label = getSectionTypeLabel(section.type);
      return (
        <CardShell>
          <div className="flex min-h-[72px] flex-col justify-center gap-1 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              {section.type}
            </p>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              {label}
            </p>
            <p className="text-[11px] text-gray-400">
              Preview đầy đủ trên canvas Visual Editor
            </p>
          </div>
        </CardShell>
      );
    }
  }
}
