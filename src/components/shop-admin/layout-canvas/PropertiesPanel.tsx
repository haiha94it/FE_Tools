/**
 * PropertiesPanel — sidebar chỉnh section đang chọn trên LayoutCanvas.
 *
 * - Chỉ render khi có `section` (activeSectionId resolved).
 * - Content fields theo `section.type` (HERO, GRID, …).
 * - Layout/styling: visual presets (spacing / width / brand bg) — không nhập px/%.
 * - Mọi thay đổi → `onSectionUpdate(id, patch)` realtime.
 */

"use client";

import {
  CONTAINER_CHILD_META,
  createContainerChild,
  createSection,
  LAYOUT_SECTION_TYPE_META,
} from "@/lib/shop-layout-canvas";
import type {
  LayoutAlignItems,
  LayoutAnimationPreset,
  LayoutBgPreset,
  LayoutBlurPreset,
  LayoutBorderPreset,
  LayoutContainerChild,
  LayoutDisplayMode,
  LayoutFlexDirection,
  LayoutFlexGridConfig,
  LayoutFlexWrap,
  LayoutGapSize,
  LayoutGridCols,
  LayoutHoverPreset,
  LayoutJustify,
  LayoutRadiusPreset,
  LayoutSection,
  LayoutSectionStyling,
  LayoutSectionType,
  LayoutShadowPreset,
  LayoutSpacingPreset,
  LayoutTextTone,
  LayoutWidthPreset,
} from "@/types/shop-layout-canvas";
import { useCallback, useMemo, type ReactNode } from "react";
import { FiX } from "react-icons/fi";
import {
  getSectionTypeBadge,
  getSectionTypeLabel,
  WIDTH_PRESET_LABELS,
} from "./section-cards";
import { resolveShadow } from "./renderers/section-style-utils";

/* ─────────────────────────────────────────────────────────────
 * Public API
 * ───────────────────────────────────────────────────────────── */

/** Partial patch — merge vào section (data/styling deep-merge ở parent hoặc ở đây) */
export type LayoutSectionUpdate = {
  enabled?: boolean;
  widthPreset?: LayoutWidthPreset;
  widthPresetMobile?: LayoutWidthPreset;
  styling?: Partial<LayoutSectionStyling>;
  stylingMobile?: Partial<LayoutSectionStyling>;
  label?: string;
  groupId?: string | null;
  editorLocked?: boolean;
  /** Partial data — merge shallow với section.data hiện tại */
  data?: Record<string, unknown>;
};

export interface PropertiesPanelProps {
  /**
   * Section đang active. `null` → panel ẩn (return null).
   * Parent resolve: findSectionDeep (hỗ trợ nested trong Container)
   */
  section: LayoutSection | null;
  /** Realtime update — parent merge vào layout array (deep) */
  onSectionUpdate: (sectionId: string, update: LayoutSectionUpdate) => void;
  /** Đóng panel / clear selection */
  onClose?: () => void;
  className?: string;
  /** A11y issues cho section đang chọn */
  a11yIssues?: import("@/lib/layout-canvas-a11y").A11yIssue[];
  /** Device đang edit style (desktop / mobile override) */
  styleDevice?: "desktop" | "mobile";
  onStyleDeviceChange?: (d: "desktop" | "mobile") => void;
  /** Shop data for binding */
  products?: import("@/types/zalo-shop").ShopProduct[];
  categories?: import("@/types/zalo-shop").ShopCategory[];
  /** Chọn nested block từ danh sách trong Container */
  onSelectSection?: (id: string) => void;
}

/* ─────────────────────────────────────────────────────────────
 * Preset catalogs (visual only)
 * ───────────────────────────────────────────────────────────── */

/** Spacing → Tight / Normal / Loose (map paddingY) */
const SPACING_PRESETS: {
  value: LayoutSpacingPreset;
  label: string;
  hint: string;
}[] = [
  { value: "none", label: "None", hint: "0" },
  { value: "compact", label: "Tight", hint: "S" },
  { value: "normal", label: "Normal", hint: "M" },
  { value: "spacious", label: "Loose", hint: "L" },
  { value: "hero", label: "Hero", hint: "XL" },
];

/** Width — simplified groups + full list for power users */
const WIDTH_SIMPLE: {
  value: LayoutWidthPreset;
  label: string;
  icon: "full" | "box" | "narrow";
}[] = [
  { value: "FULL_BLEED", label: "Full width", icon: "full" },
  { value: "CONTAINER", label: "Boxed", icon: "box" },
  { value: "NARROW", label: "Boxed small", icon: "narrow" },
];

const WIDTH_LAYOUT: {
  value: LayoutWidthPreset;
  label: string;
}[] = [
  { value: "SPLIT_50_50", label: "50 / 50" },
  { value: "SPLIT_70_30", label: "70 / 30" },
  { value: "SPLIT_30_70", label: "30 / 70" },
  { value: "GRID_2", label: "Grid 2" },
  { value: "GRID_3", label: "Grid 3" },
  { value: "GRID_4", label: "Grid 4" },
  { value: "BENTO_FEATURE", label: "Bento" },
  { value: "MASONRY", label: "Masonry" },
];

/**
 * Brand color presets — không full color picker.
 * `custom` ẩn khỏi palette chính (chỉ inherit + brand tokens).
 */
const BG_BRAND_PRESETS: {
  value: LayoutBgPreset;
  label: string;
  /** Preview swatch */
  swatch: string;
}[] = [
  { value: "inherit", label: "Default", swatch: "transparent" },
  { value: "surface", label: "Surface", swatch: "#ffffff" },
  { value: "muted", label: "Muted", swatch: "#f3f4f6" },
  { value: "primary", label: "Primary", swatch: "#1d1d1f" },
  { value: "accent", label: "Accent", swatch: "#0071e3" },
  { value: "dark", label: "Dark", swatch: "#111827" },
  {
    value: "gradient-amber",
    label: "Amber",
    swatch: "linear-gradient(135deg,#f59e0b,#f43f5e)",
  },
  {
    value: "gradient-rose",
    label: "Rose",
    swatch: "linear-gradient(135deg,#f43f5e,#a855f7)",
  },
  {
    value: "gradient-emerald",
    label: "Emerald",
    swatch: "linear-gradient(135deg,#059669,#0891b2)",
  },
  {
    value: "gradient-brand",
    label: "Brand",
    swatch: "linear-gradient(135deg,#1d1d1f,#0071e3)",
  },
];

const TEXT_TONE_OPTIONS: { value: LayoutTextTone; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
  { value: "muted", label: "Muted" },
  { value: "brand", label: "Brand" },
];

const RADIUS_OPTIONS: { value: LayoutRadiusPreset; label: string }[] = [
  { value: "none", label: "None" },
  { value: "md", label: "MD" },
  { value: "xl", label: "XL" },
  { value: "2xl", label: "2XL" },
  { value: "pill", label: "Pill" },
];

const ANIMATION_OPTIONS: {
  value: LayoutAnimationPreset;
  label: string;
}[] = [
  { value: "none", label: "Tắt" },
  { value: "fade-up", label: "Fade↑" },
  { value: "fade", label: "Fade" },
  { value: "scale", label: "Scale" },
  { value: "slide-left", label: "←" },
  { value: "slide-right", label: "→" },
  { value: "blur-in", label: "Blur" },
  { value: "zoom-soft", label: "Zoom" },
];

const SHADOW_OPTIONS: { value: LayoutShadowPreset; label: string }[] = [
  { value: "none", label: "Tắt" },
  { value: "sm", label: "S" },
  { value: "md", label: "M" },
  { value: "lg", label: "L" },
  { value: "xl", label: "XL" },
  { value: "glow", label: "Glow" },
  { value: "inner", label: "In" },
];

const BLUR_OPTIONS: { value: LayoutBlurPreset; label: string }[] = [
  { value: "none", label: "Tắt" },
  { value: "sm", label: "S" },
  { value: "md", label: "M" },
  { value: "lg", label: "L" },
  { value: "glass", label: "Glass" },
  { value: "frosted", label: "Frost" },
];

const HOVER_OPTIONS: { value: LayoutHoverPreset; label: string }[] = [
  { value: "none", label: "Tắt" },
  { value: "lift", label: "Lift" },
  { value: "scale", label: "Scale" },
  { value: "glow", label: "Glow" },
  { value: "brightness", label: "Bright" },
  { value: "border-accent", label: "Border" },
];

const BORDER_OPTIONS: { value: LayoutBorderPreset; label: string }[] = [
  { value: "none", label: "Tắt" },
  { value: "subtle", label: "Nhẹ" },
  { value: "solid", label: "Solid" },
  { value: "dashed", label: "Dash" },
  { value: "accent", label: "Accent" },
];

const DISPLAY_OPTIONS: { value: LayoutDisplayMode; label: string }[] = [
  { value: "block", label: "Block" },
  { value: "flex", label: "Flex" },
  { value: "grid", label: "Grid" },
];

const FLEX_DIR_OPTIONS: { value: LayoutFlexDirection; label: string }[] = [
  { value: "row", label: "Row →" },
  { value: "column", label: "Col ↓" },
  { value: "row-reverse", label: "← Row" },
  { value: "column-reverse", label: "↑ Col" },
];

const FLEX_WRAP_OPTIONS: { value: LayoutFlexWrap; label: string }[] = [
  { value: "nowrap", label: "No wrap" },
  { value: "wrap", label: "Wrap" },
  { value: "wrap-reverse", label: "Wrap ↺" },
];

const JUSTIFY_OPTIONS: { value: LayoutJustify; label: string }[] = [
  { value: "start", label: "Start" },
  { value: "center", label: "Center" },
  { value: "end", label: "End" },
  { value: "between", label: "Between" },
  { value: "around", label: "Around" },
  { value: "evenly", label: "Evenly" },
];

const ALIGN_OPTIONS: { value: LayoutAlignItems; label: string }[] = [
  { value: "start", label: "Start" },
  { value: "center", label: "Center" },
  { value: "end", label: "End" },
  { value: "stretch", label: "Stretch" },
  { value: "baseline", label: "Base" },
];

const GAP_OPTIONS: { value: LayoutGapSize; label: string }[] = [
  { value: "none", label: "0" },
  { value: "xs", label: "XS" },
  { value: "sm", label: "S" },
  { value: "md", label: "M" },
  { value: "lg", label: "L" },
  { value: "xl", label: "XL" },
];

const COLS_OPTIONS: { value: string; label: string }[] = [
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5" },
  { value: "6", label: "6" },
];

/* ─────────────────────────────────────────────────────────────
 * UI primitives
 * ───────────────────────────────────────────────────────────── */

function PanelSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2.5 border-b border-gray-100 pb-4 last:border-0 dark:border-gray-800">
      <h3 className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-gray-400">
        {title}
      </h3>
      {children}
    </section>
  );
}

function FieldLabel({
  children,
  hint,
}: {
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between gap-2">
      <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
        {children}
      </span>
      {hint ? (
        <span className="text-[10px] text-gray-400">{hint}</span>
      ) : null}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  multiline,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  hint?: string;
}) {
  const cls =
    "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white";
  return (
    <label className="block">
      <FieldLabel hint={hint}>{label}</FieldLabel>
      {multiline ? (
        <textarea
          value={value}
          rows={3}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`${cls} resize-y min-h-[72px]`}
        />
      ) : (
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={cls}
        />
      )}
    </label>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50/80 px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800/50">
      <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition ${
          checked ? "bg-brand-500" : "bg-gray-300 dark:bg-gray-600"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
            checked ? "translate-x-5" : ""
          }`}
        />
      </button>
    </label>
  );
}

/** Segmented control — spacing / tone / density */
function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string; hint?: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`min-h-8 flex-1 cursor-pointer rounded-lg px-2 py-1.5 text-[11px] font-bold transition sm:flex-none sm:px-2.5 ${
              active
                ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                : "text-gray-500 hover:text-gray-800 dark:text-gray-400"
            }`}
            title={opt.hint}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function WidthIcon({ kind }: { kind: "full" | "box" | "narrow" }) {
  if (kind === "full") {
    return (
      <svg viewBox="0 0 32 20" className="h-5 w-8" aria-hidden>
        <rect
          x="1"
          y="3"
          width="30"
          height="14"
          rx="2"
          className="fill-current opacity-80"
        />
      </svg>
    );
  }
  if (kind === "narrow") {
    return (
      <svg viewBox="0 0 32 20" className="h-5 w-8" aria-hidden>
        <rect
          x="9"
          y="3"
          width="14"
          height="14"
          rx="2"
          className="fill-current opacity-80"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 32 20" className="h-5 w-8" aria-hidden>
      <rect
        x="5"
        y="3"
        width="22"
        height="14"
        rx="2"
        className="fill-current opacity-80"
      />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
 * Content fields by type
 * ───────────────────────────────────────────────────────────── */

function ContentFields({
  section,
  patchData,
  products = [],
  categories = [],
  onSelectSection,
}: {
  section: LayoutSection;
  patchData: (partial: Record<string, unknown>) => void;
  products?: import("@/types/zalo-shop").ShopProduct[];
  categories?: import("@/types/zalo-shop").ShopCategory[];
  onSelectSection?: (id: string) => void;
}) {
  switch (section.type) {
    case "HERO":
      return (
        <div className="space-y-3">
          <TextField
            label="Hero title"
            value={section.data.title}
            onChange={(title) => patchData({ title })}
            placeholder="Bộ sưu tập 2026"
          />
          <TextField
            label="Subtitle"
            value={section.data.subtitle}
            onChange={(subtitle) => patchData({ subtitle })}
            multiline
            placeholder="Mô tả ngắn…"
          />
          <TextField
            label="CTA text"
            value={section.data.ctaText}
            onChange={(ctaText) => patchData({ ctaText })}
          />
          <TextField
            label="CTA link"
            value={section.data.ctaHref ?? ""}
            onChange={(ctaHref) => patchData({ ctaHref })}
            placeholder="/store/…"
            hint="URL"
          />
          <TextField
            label="Hero image URL"
            value={section.data.mediaUrl ?? ""}
            onChange={(mediaUrl) =>
              patchData({
                mediaUrl,
                mediaType: mediaUrl ? "image" : "none",
              })
            }
            placeholder="https://…"
            hint="Ảnh cover"
          />
          <div>
            <FieldLabel>Hero variant</FieldLabel>
            <SegmentedControl
              value={section.data.heroVariant ?? "banner"}
              options={[
                { value: "banner", label: "Banner" },
                { value: "bento", label: "Bento" },
                { value: "split", label: "Split" },
                { value: "full-viewport", label: "Full" },
                { value: "minimal-focus", label: "Minimal" },
                { value: "video-reel", label: "Video" },
              ]}
              onChange={(heroVariant) => patchData({ heroVariant })}
            />
          </div>
        </div>
      );

    case "ANNOUNCEMENT":
      return (
        <div className="space-y-3">
          <TextField
            label="Nội dung thông báo"
            value={section.data.text}
            onChange={(text) => patchData({ text })}
            multiline
          />
          <TextField
            label="Link (tuỳ chọn)"
            value={section.data.linkHref ?? ""}
            onChange={(linkHref) => patchData({ linkHref })}
          />
          <ToggleField
            label="Cho phép đóng"
            checked={Boolean(section.data.dismissible)}
            onChange={(dismissible) => patchData({ dismissible })}
          />
        </div>
      );

    case "HEADER":
      return (
        <div className="space-y-3">
          <div>
            <FieldLabel>Header style</FieldLabel>
            <SegmentedControl
              value={section.data.style}
              options={[
                { value: "minimal", label: "Minimal" },
                { value: "branded", label: "Branded" },
                { value: "island", label: "Island" },
                { value: "utility", label: "Utility" },
                { value: "compact", label: "Compact" },
              ]}
              onChange={(style) => patchData({ style })}
            />
          </div>
          <div>
            <FieldLabel hint="Khi cuộn trang">Vị trí header</FieldLabel>
            <SegmentedControl
              value={section.data.position ?? "static"}
              options={[
                { value: "static", label: "Cuộn theo" },
                { value: "sticky", label: "Cố định" },
                { value: "fixed", label: "Fixed" },
              ]}
              onChange={(position) => patchData({ position })}
            />
            <p className="mt-1.5 text-[10px] leading-relaxed text-gray-400">
              <strong className="font-semibold text-gray-500">Cố định</strong>
              {" — "}
              dính mép trên khi cuộn (khuyến nghị).{" "}
              <strong className="font-semibold text-gray-500">Fixed</strong>
              {" — "}
              neo viewport + giữ chỗ layout. Xem đúng trên trang gian hàng
              (cuộn /store/…); trong builder, Fixed hiển thị như Cố định.
            </p>
          </div>
          <ToggleField
            label="Hiện ô tìm kiếm"
            checked={section.data.showSearch !== false}
            onChange={(showSearch) => patchData({ showSearch })}
          />
          <ToggleField
            label="Hiện giỏ hàng"
            checked={section.data.showCart !== false}
            onChange={(showCart) => patchData({ showCart })}
          />
        </div>
      );

    case "TRUST_BADGES":
      return (
        <div className="space-y-3">
          <p className="text-[11px] text-gray-500">
            Chỉnh nhãn từng badge (tối đa 4 hiển thị trên canvas).
          </p>
          {section.data.items.map((item, index) => (
            <TextField
              key={item.id}
              label={`Badge ${index + 1}`}
              value={item.label}
              onChange={(label) => {
                const items = section.data.items.map((it, i) =>
                  i === index ? { ...it, label } : it,
                );
                patchData({ items });
              }}
            />
          ))}
        </div>
      );

    case "CATEGORY_RAIL":
      return (
        <div className="space-y-3">
          <TextField
            label="Tiêu đề"
            value={section.data.title ?? ""}
            onChange={(title) => patchData({ title })}
          />
          <div>
            <FieldLabel>Kiểu danh mục</FieldLabel>
            <SegmentedControl
              value={section.data.style}
              options={[
                { value: "pills", label: "Pills" },
                { value: "chips", label: "Chips" },
                { value: "icons", label: "Icons" },
                { value: "underline", label: "Line" },
                { value: "stories", label: "Stories" },
                { value: "tree", label: "Tree" },
              ]}
              onChange={(style) => patchData({ style })}
            />
          </div>
          <p className="text-[10px] text-gray-400">
            {categories.length > 0
              ? `${categories.length} danh mục shop — hiển thị trên storefront.`
              : "Chưa có danh mục — canvas dùng demo chips."}
          </p>
        </div>
      );

    case "FLASH_SALE":
      return (
        <div className="space-y-3">
          <TextField
            label="Tiêu đề"
            value={section.data.title}
            onChange={(title) => patchData({ title })}
          />
          <TextField
            label="Phụ đề"
            value={section.data.subtitle ?? ""}
            onChange={(subtitle) => patchData({ subtitle })}
          />
          <TextField
            label="Kết thúc (ISO)"
            value={section.data.endsAt ?? ""}
            onChange={(endsAt) => patchData({ endsAt: endsAt || null })}
            placeholder="2026-12-31T23:59:00"
            hint="Countdown"
          />
          <TextField
            label="Số SP tối đa"
            value={String(section.data.maxItems ?? 8)}
            onChange={(v) => {
              const n = Number(v);
              if (Number.isFinite(n) && n > 0) patchData({ maxItems: n });
            }}
            hint="Preset count"
          />
        </div>
      );

    case "COUPONS":
      return (
        <div className="space-y-3">
          <TextField
            label="Tiêu đề"
            value={section.data.title}
            onChange={(title) => patchData({ title })}
          />
        </div>
      );

    case "HOT_PRODUCTS":
      return (
        <div className="space-y-3">
          <TextField
            label="Tiêu đề"
            value={section.data.title}
            onChange={(title) => patchData({ title })}
          />
          <TextField
            label="Phụ đề"
            value={section.data.subtitle ?? ""}
            onChange={(subtitle) => patchData({ subtitle })}
          />
          <TextField
            label="Số SP tối đa"
            value={String(section.data.maxItems ?? 8)}
            onChange={(v) => {
              const n = Number(v);
              if (Number.isFinite(n) && n > 0) patchData({ maxItems: n });
            }}
          />
        </div>
      );

    case "PRODUCT_GRID":
      return (
        <div className="space-y-3">
          <TextField
            label="Tiêu đề lưới"
            value={section.data.title ?? ""}
            onChange={(title) => patchData({ title })}
          />
          <TextField
            label="Phụ đề"
            value={section.data.subtitle ?? ""}
            onChange={(subtitle) => patchData({ subtitle })}
          />
          <div>
            <FieldLabel>Mật độ (density)</FieldLabel>
            <SegmentedControl
              value={section.data.density}
              options={[
                { value: "dense", label: "Dense" },
                { value: "cozy", label: "Cozy" },
                { value: "comfortable", label: "Normal" },
                { value: "airy", label: "Airy" },
              ]}
              onChange={(density) => patchData({ density })}
            />
          </div>
          <div>
            <FieldLabel>Kiểu card</FieldLabel>
            <SegmentedControl
              value={section.data.cardStyle}
              options={[
                { value: "compact", label: "Compact" },
                { value: "comfortable", label: "Default" },
                { value: "bordered", label: "Border" },
                { value: "overlay", label: "Overlay" },
                { value: "editorial", label: "Edit" },
                { value: "list", label: "List" },
              ]}
              onChange={(cardStyle) => patchData({ cardStyle })}
            />
          </div>
          <ToggleField
            label="Hiện bộ lọc"
            checked={section.data.showFilters !== false}
            onChange={(showFilters) => patchData({ showFilters })}
          />
          {categories.length > 0 ? (
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                Lọc theo danh mục
              </span>
              <select
                value={section.data.categoryId ?? ""}
                onChange={(e) =>
                  patchData({
                    categoryId: e.target.value
                      ? Number(e.target.value)
                      : null,
                  })
                }
                className="h-10 cursor-pointer rounded-lg border border-gray-200 bg-white px-2 text-xs dark:border-gray-700 dark:bg-gray-900"
              >
                <option value="">Toàn bộ catalog</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {products.length > 0 ? (
            <p className="text-[10px] text-gray-400">
              Shop có {products.length} SP — grid dùng data thật trên storefront.
            </p>
          ) : (
            <p className="rounded-lg bg-amber-50 px-2 py-1.5 text-[10px] text-amber-800">
              Shop chưa có SP — canvas hiển thị demo.
            </p>
          )}
        </div>
      );

    case "EDITORIAL":
      return (
        <div className="space-y-3">
          <TextField
            label="Tiêu đề"
            value={section.data.title}
            onChange={(title) => patchData({ title })}
          />
          <TextField
            label="Nội dung"
            value={section.data.body}
            onChange={(body) => patchData({ body })}
            multiline
          />
          <TextField
            label="Ảnh URL"
            value={section.data.mediaUrl ?? ""}
            onChange={(mediaUrl) => patchData({ mediaUrl })}
            placeholder="https://…"
          />
          <TextField
            label="CTA text"
            value={section.data.ctaText ?? ""}
            onChange={(ctaText) => patchData({ ctaText })}
          />
          <div>
            <FieldLabel>Vị trí ảnh</FieldLabel>
            <SegmentedControl
              value={section.data.mediaSide ?? "left"}
              options={[
                { value: "left", label: "Trái" },
                { value: "right", label: "Phải" },
              ]}
              onChange={(mediaSide) => patchData({ mediaSide })}
            />
          </div>
        </div>
      );

    case "REVIEWS":
      return (
        <div className="space-y-3">
          <TextField
            label="Tiêu đề"
            value={section.data.title}
            onChange={(title) => patchData({ title })}
          />
          <TextField
            label="Phụ đề"
            value={section.data.subtitle ?? ""}
            onChange={(subtitle) => patchData({ subtitle })}
          />
          <div>
            <FieldLabel>Nguồn review</FieldLabel>
            <SegmentedControl
              value={section.data.reviewSource ?? "demo"}
              options={[
                { value: "demo", label: "Demo" },
                { value: "api", label: "API" },
              ]}
              onChange={(reviewSource) => patchData({ reviewSource })}
            />
          </div>
        </div>
      );

    case "CONTACT_FOOTER":
      return (
        <div className="space-y-3">
          <TextField
            label="Tiêu đề"
            value={section.data.title ?? ""}
            onChange={(title) => patchData({ title })}
          />
          <TextField
            label="Hotline"
            value={section.data.phone ?? ""}
            onChange={(phone) => patchData({ phone })}
          />
          <TextField
            label="Zalo"
            value={section.data.zalo ?? ""}
            onChange={(zalo) => patchData({ zalo })}
          />
          <TextField
            label="Facebook"
            value={section.data.facebook ?? ""}
            onChange={(facebook) => patchData({ facebook })}
          />
          <TextField
            label="Website"
            value={section.data.website ?? ""}
            onChange={(website) => patchData({ website })}
          />
          <TextField
            label="Địa chỉ"
            value={section.data.address ?? ""}
            onChange={(address) => patchData({ address })}
            multiline
          />
          <ToggleField
            label="Hiện bản đồ"
            checked={Boolean(section.data.showMap)}
            onChange={(showMap) => patchData({ showMap })}
          />
        </div>
      );

    case "PRODUCT_CAROUSEL":
      return (
        <div className="space-y-3">
          <TextField
            label="Tiêu đề"
            value={section.data.title ?? ""}
            onChange={(title) => patchData({ title })}
          />
          <TextField
            label="Phụ đề"
            value={section.data.subtitle ?? ""}
            onChange={(subtitle) => patchData({ subtitle })}
          />
          <TextField
            label="Số SP tối đa"
            value={String(section.data.maxItems ?? 10)}
            onChange={(v) => {
              const n = Number(v);
              if (Number.isFinite(n) && n > 0) patchData({ maxItems: n });
            }}
          />
        </div>
      );

    case "IMAGE_BANNER":
      return (
        <div className="space-y-3">
          <TextField
            label="URL ảnh"
            value={section.data.imageUrl}
            onChange={(imageUrl) => patchData({ imageUrl })}
            placeholder="https://…"
          />
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
              Upload ảnh (local preview)
            </span>
            <input
              type="file"
              accept="image/*"
              className="text-[11px]"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  if (typeof reader.result === "string") {
                    patchData({ imageUrl: reader.result });
                  }
                };
                reader.readAsDataURL(file);
              }}
            />
            <span className="text-[10px] text-gray-400">
              Data URL lưu trong personalization JSON — nên dùng URL CDN khi
              production.
            </span>
          </label>
          <TextField
            label="Alt text"
            value={section.data.alt ?? ""}
            onChange={(alt) => patchData({ alt })}
          />
          <TextField
            label="Link khi click"
            value={section.data.href ?? ""}
            onChange={(href) => patchData({ href })}
          />
          <div>
            <FieldLabel>Chiều cao</FieldLabel>
            <SegmentedControl
              value={section.data.height ?? "md"}
              options={[
                { value: "sm", label: "S" },
                { value: "md", label: "M" },
                { value: "lg", label: "L" },
                { value: "xl", label: "XL" },
              ]}
              onChange={(height) => patchData({ height })}
            />
          </div>
          <div>
            <FieldLabel>Object fit</FieldLabel>
            <SegmentedControl
              value={section.data.objectFit ?? "cover"}
              options={[
                { value: "cover", label: "Cover" },
                { value: "contain", label: "Contain" },
              ]}
              onChange={(objectFit) => patchData({ objectFit })}
            />
          </div>
        </div>
      );

    case "VIDEO_BLOCK":
      return (
        <div className="space-y-3">
          <TextField
            label="Tiêu đề"
            value={section.data.title ?? ""}
            onChange={(title) => patchData({ title })}
          />
          <TextField
            label="URL video (YouTube…)"
            value={section.data.videoUrl}
            onChange={(videoUrl) => patchData({ videoUrl })}
            placeholder="https://youtube.com/watch?v=…"
          />
          <TextField
            label="Poster URL"
            value={section.data.posterUrl ?? ""}
            onChange={(posterUrl) => patchData({ posterUrl })}
          />
        </div>
      );

    case "TEXT_BLOCK":
      return (
        <div className="space-y-3">
          <TextField
            label="Eyebrow"
            value={section.data.eyebrow ?? ""}
            onChange={(eyebrow) => patchData({ eyebrow })}
          />
          <TextField
            label="Tiêu đề"
            value={section.data.title}
            onChange={(title) => patchData({ title })}
          />
          <TextField
            label="Nội dung"
            value={section.data.body}
            onChange={(body) => patchData({ body })}
            multiline
          />
          <div>
            <FieldLabel>Căn lề</FieldLabel>
            <SegmentedControl
              value={section.data.align ?? "center"}
              options={[
                { value: "left", label: "Trái" },
                { value: "center", label: "Giữa" },
                { value: "right", label: "Phải" },
              ]}
              onChange={(align) => patchData({ align })}
            />
          </div>
          <div>
            <FieldLabel>Cỡ chữ</FieldLabel>
            <SegmentedControl
              value={section.data.size ?? "md"}
              options={[
                { value: "sm", label: "S" },
                { value: "md", label: "M" },
                { value: "lg", label: "L" },
              ]}
              onChange={(size) => patchData({ size })}
            />
          </div>
        </div>
      );

    case "CTA_BANNER":
      return (
        <div className="space-y-3">
          <TextField
            label="Tiêu đề"
            value={section.data.title}
            onChange={(title) => patchData({ title })}
          />
          <TextField
            label="Phụ đề"
            value={section.data.subtitle ?? ""}
            onChange={(subtitle) => patchData({ subtitle })}
          />
          <TextField
            label="Nút chính"
            value={section.data.ctaText}
            onChange={(ctaText) => patchData({ ctaText })}
          />
          <TextField
            label="Link nút chính"
            value={section.data.ctaHref ?? ""}
            onChange={(ctaHref) => patchData({ ctaHref })}
          />
          <TextField
            label="Nút phụ"
            value={section.data.secondaryText ?? ""}
            onChange={(secondaryText) => patchData({ secondaryText })}
          />
          <TextField
            label="Link nút phụ"
            value={section.data.secondaryHref ?? ""}
            onChange={(secondaryHref) => patchData({ secondaryHref })}
          />
          <div>
            <FieldLabel>Kiểu</FieldLabel>
            <SegmentedControl
              value={section.data.variant ?? "gradient"}
              options={[
                { value: "solid", label: "Solid" },
                { value: "gradient", label: "Gradient" },
                { value: "outline", label: "Outline" },
              ]}
              onChange={(variant) => patchData({ variant })}
            />
          </div>
        </div>
      );

    case "FEATURE_GRID":
      return (
        <div className="space-y-3">
          <TextField
            label="Tiêu đề"
            value={section.data.title ?? ""}
            onChange={(title) => patchData({ title })}
          />
          <TextField
            label="Phụ đề"
            value={section.data.subtitle ?? ""}
            onChange={(subtitle) => patchData({ subtitle })}
          />
          <div>
            <FieldLabel>Số cột</FieldLabel>
            <SegmentedControl
              value={String(section.data.columns ?? 4)}
              options={[
                { value: "2", label: "2" },
                { value: "3", label: "3" },
                { value: "4", label: "4" },
              ]}
              onChange={(v) =>
                patchData({ columns: Number(v) as 2 | 3 | 4 })
              }
            />
          </div>
          <p className="text-[11px] text-gray-500">
            Chỉnh từng feature (tối đa {section.data.items.length}):
          </p>
          {section.data.items.map((item, index) => (
            <div
              key={item.id}
              className="space-y-2 rounded-lg border border-gray-100 p-2 dark:border-gray-800"
            >
              <TextField
                label={`Feature ${index + 1} — tiêu đề`}
                value={item.title}
                onChange={(title) => {
                  const items = section.data.items.map((it, i) =>
                    i === index ? { ...it, title } : it,
                  );
                  patchData({ items });
                }}
              />
              <TextField
                label="Mô tả"
                value={item.body ?? ""}
                onChange={(body) => {
                  const items = section.data.items.map((it, i) =>
                    i === index ? { ...it, body } : it,
                  );
                  patchData({ items });
                }}
              />
            </div>
          ))}
        </div>
      );

    case "STATS":
      return (
        <div className="space-y-3">
          <TextField
            label="Tiêu đề"
            value={section.data.title ?? ""}
            onChange={(title) => patchData({ title })}
          />
          {section.data.items.map((item, index) => (
            <div
              key={item.id}
              className="grid grid-cols-2 gap-2 rounded-lg border border-gray-100 p-2 dark:border-gray-800"
            >
              <TextField
                label={`Số ${index + 1}`}
                value={item.value}
                onChange={(value) => {
                  const items = section.data.items.map((it, i) =>
                    i === index ? { ...it, value } : it,
                  );
                  patchData({ items });
                }}
              />
              <TextField
                label="Nhãn"
                value={item.label}
                onChange={(label) => {
                  const items = section.data.items.map((it, i) =>
                    i === index ? { ...it, label } : it,
                  );
                  patchData({ items });
                }}
              />
            </div>
          ))}
        </div>
      );

    case "GALLERY":
      return (
        <div className="space-y-3">
          <TextField
            label="Tiêu đề"
            value={section.data.title ?? ""}
            onChange={(title) => patchData({ title })}
          />
          <div>
            <FieldLabel>Số cột</FieldLabel>
            <SegmentedControl
              value={String(section.data.columns ?? 3)}
              options={[
                { value: "2", label: "2" },
                { value: "3", label: "3" },
                { value: "4", label: "4" },
              ]}
              onChange={(v) =>
                patchData({ columns: Number(v) as 2 | 3 | 4 })
              }
            />
          </div>
          {section.data.images.map((img, index) => (
            <TextField
              key={img.id}
              label={`Ảnh ${index + 1} URL`}
              value={img.url}
              onChange={(url) => {
                const images = section.data.images.map((it, i) =>
                  i === index ? { ...it, url } : it,
                );
                patchData({ images });
              }}
            />
          ))}
        </div>
      );

    case "LOGO_CLOUD":
      return (
        <div className="space-y-3">
          <TextField
            label="Tiêu đề"
            value={section.data.title ?? ""}
            onChange={(title) => patchData({ title })}
          />
          {section.data.logos.map((logo, index) => (
            <div
              key={logo.id}
              className="space-y-2 rounded-lg border border-gray-100 p-2 dark:border-gray-800"
            >
              <TextField
                label={`Logo ${index + 1} — tên`}
                value={logo.name}
                onChange={(name) => {
                  const logos = section.data.logos.map((it, i) =>
                    i === index ? { ...it, name } : it,
                  );
                  patchData({ logos });
                }}
              />
              <TextField
                label="URL ảnh (tuỳ chọn)"
                value={logo.imageUrl ?? ""}
                onChange={(imageUrl) => {
                  const logos = section.data.logos.map((it, i) =>
                    i === index ? { ...it, imageUrl } : it,
                  );
                  patchData({ logos });
                }}
              />
            </div>
          ))}
        </div>
      );

    case "FAQ":
      return (
        <div className="space-y-3">
          <TextField
            label="Tiêu đề"
            value={section.data.title ?? ""}
            onChange={(title) => patchData({ title })}
          />
          <TextField
            label="Phụ đề"
            value={section.data.subtitle ?? ""}
            onChange={(subtitle) => patchData({ subtitle })}
          />
          {section.data.items.map((item, index) => (
            <div
              key={item.id}
              className="space-y-2 rounded-lg border border-gray-100 p-2 dark:border-gray-800"
            >
              <TextField
                label={`Câu hỏi ${index + 1}`}
                value={item.question}
                onChange={(question) => {
                  const items = section.data.items.map((it, i) =>
                    i === index ? { ...it, question } : it,
                  );
                  patchData({ items });
                }}
              />
              <TextField
                label="Trả lời"
                value={item.answer}
                onChange={(answer) => {
                  const items = section.data.items.map((it, i) =>
                    i === index ? { ...it, answer } : it,
                  );
                  patchData({ items });
                }}
                multiline
              />
            </div>
          ))}
        </div>
      );

    case "NEWSLETTER":
      return (
        <div className="space-y-3">
          <TextField
            label="Tiêu đề"
            value={section.data.title}
            onChange={(title) => patchData({ title })}
          />
          <TextField
            label="Phụ đề"
            value={section.data.subtitle ?? ""}
            onChange={(subtitle) => patchData({ subtitle })}
          />
          <TextField
            label="Placeholder input"
            value={section.data.placeholder ?? ""}
            onChange={(placeholder) => patchData({ placeholder })}
          />
          <TextField
            label="Nút đăng ký"
            value={section.data.buttonText ?? ""}
            onChange={(buttonText) => patchData({ buttonText })}
          />
        </div>
      );

    case "SPACER":
      return (
        <div className="space-y-3">
          <div>
            <FieldLabel>Độ cao khoảng trống</FieldLabel>
            <SegmentedControl
              value={section.data.size}
              options={[
                { value: "xs", label: "XS" },
                { value: "sm", label: "S" },
                { value: "md", label: "M" },
                { value: "lg", label: "L" },
                { value: "xl", label: "XL" },
                { value: "2xl", label: "2XL" },
              ]}
              onChange={(size) => patchData({ size })}
            />
          </div>
        </div>
      );

    case "DIVIDER":
      return (
        <div className="space-y-3">
          <div>
            <FieldLabel>Kiểu đường kẻ</FieldLabel>
            <SegmentedControl
              value={section.data.style}
              options={[
                { value: "line", label: "Line" },
                { value: "dashed", label: "Dashed" },
                { value: "dots", label: "Dots" },
              ]}
              onChange={(style) => patchData({ style })}
            />
          </div>
          <TextField
            label="Nhãn giữa (tuỳ chọn)"
            value={section.data.label ?? ""}
            onChange={(label) => patchData({ label })}
          />
        </div>
      );

    case "CONTAINER":
      return (
        <ContainerContentFields
          section={section}
          patchData={patchData}
          onSelectSection={onSelectSection}
        />
      );

    default:
      return (
        <p className="text-xs text-gray-500">
          Section này chưa có form nội dung riêng.
        </p>
      );
  }
}

/** Block types cho phép lồng trong CONTAINER (trừ HEADER locked-only) */
const NESTABLE_BLOCK_TYPES: LayoutSectionType[] =
  LAYOUT_SECTION_TYPE_META.filter(
    (m) => m.type !== "HEADER" || !m.lockedByDefault,
  ).map((m) => m.type);

function FlexGridInspector({
  flexGrid,
  styleDevice,
  onChange,
}: {
  flexGrid?: LayoutFlexGridConfig;
  styleDevice: "desktop" | "mobile";
  onChange: (next: LayoutFlexGridConfig) => void;
}) {
  const fg = flexGrid ?? {};
  const isMobileTab = styleDevice === "mobile";

  /** Giá trị đang edit theo tab */
  const display: LayoutDisplayMode = isMobileTab
    ? (fg.mobile?.display ?? fg.display ?? "block")
    : (fg.display ?? "block");
  const direction: LayoutFlexDirection = isMobileTab
    ? (fg.mobile?.direction ?? fg.direction ?? "row")
    : (fg.direction ?? "row");
  const wrap: LayoutFlexWrap = isMobileTab
    ? (fg.mobile?.wrap ?? fg.wrap ?? "nowrap")
    : (fg.wrap ?? "nowrap");
  const justify: LayoutJustify = isMobileTab
    ? (fg.mobile?.justify ?? fg.justify ?? "start")
    : (fg.justify ?? "start");
  const align: LayoutAlignItems = isMobileTab
    ? (fg.mobile?.align ?? fg.align ?? "stretch")
    : (fg.align ?? "stretch");
  const gap: LayoutGapSize = isMobileTab
    ? (fg.mobile?.gap ?? fg.gap ?? "md")
    : (fg.gap ?? "md");
  const cols: LayoutGridCols = isMobileTab
    ? (fg.mobile?.cols ?? fg.cols ?? 1)
    : (fg.cols ?? 1);

  const patchDesktop = (partial: Partial<LayoutFlexGridConfig>) => {
    onChange({ ...fg, ...partial });
  };

  const patchMobile = (
    partial: NonNullable<LayoutFlexGridConfig["mobile"]>,
  ) => {
    onChange({
      ...fg,
      // đảm bảo desktop có display nếu mobile bật flex/grid
      display: fg.display ?? "block",
      mobile: { ...(fg.mobile ?? {}), ...partial },
    });
  };

  const setField = <K extends keyof LayoutFlexGridConfig>(
    key: K,
    value: LayoutFlexGridConfig[K],
  ) => {
    if (isMobileTab) {
      if (key === "colsMd" || key === "colsLg") return;
      patchMobile({ [key]: value } as NonNullable<LayoutFlexGridConfig["mobile"]>);
    } else {
      patchDesktop({ [key]: value });
    }
  };

  return (
    <PanelSection title="Flex / Grid · Responsive">
      <p className="mb-2 text-[10px] leading-relaxed text-gray-400">
        {isMobileTab
          ? "Đang chỉnh override cho mobile (&lt; md). Kế thừa desktop nếu không đổi."
          : "Cấu hình display desktop. Chuyển tab Mobile để override responsive."}
      </p>

      <div className="space-y-3">
        <div>
          <FieldLabel>Display</FieldLabel>
          <SegmentedControl
            value={display}
            options={DISPLAY_OPTIONS}
            onChange={(v) => setField("display", v)}
          />
        </div>

        {(display === "flex" || display === "grid") && (
          <>
            {display === "flex" ? (
              <>
                <div>
                  <FieldLabel>Hướng (direction)</FieldLabel>
                  <SegmentedControl
                    value={direction}
                    options={FLEX_DIR_OPTIONS}
                    onChange={(v) => setField("direction", v)}
                  />
                </div>
                <div>
                  <FieldLabel>Wrap</FieldLabel>
                  <SegmentedControl
                    value={wrap}
                    options={FLEX_WRAP_OPTIONS}
                    onChange={(v) => setField("wrap", v)}
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <FieldLabel>
                    {isMobileTab ? "Cột (mobile)" : "Cột (base)"}
                  </FieldLabel>
                  <SegmentedControl
                    value={String(cols)}
                    options={COLS_OPTIONS}
                    onChange={(v) =>
                      setField("cols", Number(v) as LayoutGridCols)
                    }
                  />
                </div>
                {!isMobileTab ? (
                  <>
                    <div>
                      <FieldLabel hint="≥ md">Cột tablet+</FieldLabel>
                      <SegmentedControl
                        value={String(fg.colsMd ?? cols)}
                        options={COLS_OPTIONS}
                        onChange={(v) =>
                          patchDesktop({
                            colsMd: Number(v) as LayoutGridCols,
                          })
                        }
                      />
                    </div>
                    <div>
                      <FieldLabel hint="≥ lg">Cột desktop large</FieldLabel>
                      <SegmentedControl
                        value={String(fg.colsLg ?? fg.colsMd ?? cols)}
                        options={COLS_OPTIONS}
                        onChange={(v) =>
                          patchDesktop({
                            colsLg: Number(v) as LayoutGridCols,
                          })
                        }
                      />
                    </div>
                  </>
                ) : null}
              </>
            )}

            <div>
              <FieldLabel>Justify</FieldLabel>
              <SegmentedControl
                value={justify}
                options={JUSTIFY_OPTIONS}
                onChange={(v) => setField("justify", v)}
              />
            </div>
            <div>
              <FieldLabel>Align items</FieldLabel>
              <SegmentedControl
                value={align}
                options={ALIGN_OPTIONS}
                onChange={(v) => setField("align", v)}
              />
            </div>
            <div>
              <FieldLabel>Gap</FieldLabel>
              <SegmentedControl
                value={gap}
                options={GAP_OPTIONS}
                onChange={(v) => setField("gap", v)}
              />
            </div>
          </>
        )}

        {isMobileTab && display === "block" && fg.display && fg.display !== "block" ? (
          <p className="text-[10px] text-amber-600">
            Mobile đang Block — ghi đè desktop {fg.display}. Đổi Display để
            bật flex/grid trên mobile.
          </p>
        ) : null}

        {!isMobileTab && (fg.mobile?.display || fg.mobile?.cols) ? (
          <p className="text-[10px] text-gray-400">
            Đã có override mobile: display=
            {fg.mobile?.display ?? "—"}, cols={fg.mobile?.cols ?? "—"}.
          </p>
        ) : null}
      </div>
    </PanelSection>
  );
}

function ContainerContentFields({
  section,
  patchData,
  onSelectSection,
}: {
  section: Extract<LayoutSection, { type: "CONTAINER" }>;
  patchData: (partial: Record<string, unknown>) => void;
  onSelectSection?: (id: string) => void;
}) {
  const children = section.data.children ?? [];
  const nestedBlocks = section.data.nestedBlocks ?? [];

  const setChildren = (next: LayoutContainerChild[]) => {
    patchData({ children: next });
  };

  const setNested = (next: LayoutSection[]) => {
    patchData({ nestedBlocks: next });
  };

  const updateChild = (id: string, data: Record<string, unknown>) => {
    setChildren(
      children.map((c) =>
        c.id === id
          ? ({ ...c, data: { ...c.data, ...data } } as LayoutContainerChild)
          : c,
      ),
    );
  };

  const removeChild = (id: string) => {
    setChildren(children.filter((c) => c.id !== id));
  };

  const moveChild = (id: string, delta: number) => {
    const i = children.findIndex((c) => c.id === id);
    if (i < 0) return;
    const j = i + delta;
    if (j < 0 || j >= children.length) return;
    const next = [...children];
    const [item] = next.splice(i, 1);
    next.splice(j, 0, item);
    setChildren(next);
  };

  const moveNested = (id: string, delta: number) => {
    const i = nestedBlocks.findIndex((b) => b.id === id);
    if (i < 0) return;
    const j = i + delta;
    if (j < 0 || j >= nestedBlocks.length) return;
    const next = [...nestedBlocks];
    const [item] = next.splice(i, 1);
    next.splice(j, 0, item);
    setNested(next);
  };

  const removeNested = (id: string) => {
    setNested(nestedBlocks.filter((b) => b.id !== id));
  };

  const addNestedBlock = (type: LayoutSectionType) => {
    const block = createSection(type);
    // Nested không giữ locked page-level (PRODUCT_GRID/FOOTER vẫn xóa được trong container)
    const unlocked = { ...block, locked: false } as LayoutSection;
    setNested([...nestedBlocks, unlocked]);
  };

  return (
    <div className="space-y-3">
      <TextField
        label="Nhãn container (builder)"
        value={section.data.title ?? ""}
        onChange={(title) => patchData({ title })}
        placeholder="vd: Hero nội dung phụ"
      />
      <div>
        <FieldLabel>Layout widget con</FieldLabel>
        <SegmentedControl
          value={section.data.layout}
          options={[
            { value: "stack", label: "Stack" },
            { value: "row", label: "Row" },
            { value: "grid-2", label: "2 cột" },
            { value: "grid-3", label: "3 cột" },
          ]}
          onChange={(layout) => patchData({ layout })}
        />
      </div>
      <div>
        <FieldLabel>Khoảng cách widget</FieldLabel>
        <SegmentedControl
          value={section.data.gap ?? "md"}
          options={[
            { value: "none", label: "0" },
            { value: "sm", label: "S" },
            { value: "md", label: "M" },
            { value: "lg", label: "L" },
          ]}
          onChange={(gap) => patchData({ gap })}
        />
      </div>
      <div>
        <FieldLabel>Cao tối thiểu (khi rỗng)</FieldLabel>
        <SegmentedControl
          value={section.data.minHeight ?? "md"}
          options={[
            { value: "sm", label: "S" },
            { value: "md", label: "M" },
            { value: "lg", label: "L" },
          ]}
          onChange={(minHeight) => patchData({ minHeight })}
        />
      </div>

      {/* ── Widgets ── */}
      <div>
        <FieldLabel hint="Text · ảnh · nút">Thêm thành phần</FieldLabel>
        <div className="grid grid-cols-2 gap-1.5">
          {CONTAINER_CHILD_META.map((m) => (
            <button
              key={m.type}
              type="button"
              onClick={() =>
                setChildren([...children, createContainerChild(m.type)])
              }
              className="cursor-pointer rounded-lg border border-gray-200 bg-gray-50 px-2 py-2 text-left transition hover:border-brand-400 hover:bg-white dark:border-gray-700 dark:bg-gray-900"
            >
              <span className="block text-[11px] font-bold text-gray-800 dark:text-gray-100">
                + {m.label}
              </span>
              <span className="block text-[9px] text-gray-400">
                {m.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Full blocks ── */}
      <div>
        <FieldLabel hint="Hero · Grid · FAQ…">Thêm block</FieldLabel>
        <p className="mb-1.5 text-[10px] text-gray-400">
          Chèn block đầy đủ vào trong container (giống section ngoài).
        </p>
        <div className="grid max-h-48 grid-cols-2 gap-1 overflow-y-auto pr-0.5">
          {NESTABLE_BLOCK_TYPES.map((type) => {
            const meta = LAYOUT_SECTION_TYPE_META.find((m) => m.type === type);
            return (
              <button
                key={type}
                type="button"
                onClick={() => addNestedBlock(type)}
                className="cursor-pointer rounded-lg border border-brand-200/80 bg-brand-50/40 px-2 py-2 text-left transition hover:border-brand-400 hover:bg-brand-50 dark:border-brand-500/30 dark:bg-brand-500/10"
              >
                <span className="block text-[11px] font-bold text-gray-800 dark:text-gray-100">
                  + {meta?.label ?? type}
                </span>
                <span className="block text-[9px] text-gray-400">
                  {meta?.badge ?? "Block"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* List widgets */}
      {children.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Thành phần ({children.length})
          </p>
          {children.map((child, i) => (
            <div
              key={child.id}
              className="space-y-2 rounded-xl border border-gray-200 p-2.5 dark:border-gray-700"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-bold uppercase text-brand-600">
                  {child.type}
                </span>
                <div className="flex gap-0.5">
                  <button
                    type="button"
                    disabled={i === 0}
                    onClick={() => moveChild(child.id, -1)}
                    className="cursor-pointer rounded px-1.5 py-0.5 text-[10px] font-bold disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={i === children.length - 1}
                    onClick={() => moveChild(child.id, 1)}
                    className="cursor-pointer rounded px-1.5 py-0.5 text-[10px] font-bold disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeChild(child.id)}
                    className="cursor-pointer rounded px-1.5 py-0.5 text-[10px] font-bold text-rose-600"
                  >
                    Xóa
                  </button>
                </div>
              </div>

              {child.type === "heading" || child.type === "text" ? (
                <TextField
                  label={child.type === "heading" ? "Tiêu đề" : "Nội dung"}
                  value={child.data.text}
                  onChange={(text) => updateChild(child.id, { text })}
                  multiline={child.type === "text"}
                />
              ) : null}
              {child.type === "heading" ? (
                <SegmentedControl
                  value={String(child.data.level ?? 2)}
                  options={[
                    { value: "1", label: "H1" },
                    { value: "2", label: "H2" },
                    { value: "3", label: "H3" },
                  ]}
                  onChange={(v) =>
                    updateChild(child.id, { level: Number(v) as 1 | 2 | 3 })
                  }
                />
              ) : null}
              {child.type === "image" ? (
                <>
                  <TextField
                    label="URL ảnh"
                    value={child.data.url}
                    onChange={(url) => updateChild(child.id, { url })}
                  />
                  <TextField
                    label="Alt"
                    value={child.data.alt ?? ""}
                    onChange={(alt) => updateChild(child.id, { alt })}
                  />
                </>
              ) : null}
              {child.type === "button" ? (
                <>
                  <TextField
                    label="Nhãn nút"
                    value={child.data.label}
                    onChange={(label) => updateChild(child.id, { label })}
                  />
                  <TextField
                    label="Link"
                    value={child.data.href ?? ""}
                    onChange={(href) => updateChild(child.id, { href })}
                  />
                </>
              ) : null}
              {child.type === "badge" ? (
                <TextField
                  label="Text badge"
                  value={child.data.text}
                  onChange={(text) => updateChild(child.id, { text })}
                />
              ) : null}
              {child.type === "html" ? (
                <TextField
                  label="HTML"
                  value={child.data.html}
                  onChange={(html) => updateChild(child.id, { html })}
                  multiline
                />
              ) : null}
              {child.type === "divider" ? (
                <TextField
                  label="Nhãn (tuỳ chọn)"
                  value={child.data.label ?? ""}
                  onChange={(label) => updateChild(child.id, { label })}
                />
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {/* List nested blocks */}
      {nestedBlocks.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Block lồng ({nestedBlocks.length})
          </p>
          {nestedBlocks.map((block, i) => (
            <div
              key={block.id}
              className="flex items-center justify-between gap-2 rounded-xl border border-brand-200/60 bg-brand-50/30 px-2.5 py-2 dark:border-brand-500/25 dark:bg-brand-500/10"
            >
              <button
                type="button"
                onClick={() => onSelectSection?.(block.id)}
                className="min-w-0 flex-1 cursor-pointer text-left"
                title="Click để mở Properties block này"
              >
                <p className="truncate text-[11px] font-bold text-gray-800 dark:text-gray-100">
                  {block.label?.trim() || getSectionTypeLabel(block.type)}
                </p>
                <p className="font-mono text-[9px] text-brand-600">
                  {block.type} · Click để sửa
                </p>
              </button>
              <div className="flex shrink-0 gap-0.5">
                <button
                  type="button"
                  disabled={i === 0}
                  onClick={() => moveNested(block.id, -1)}
                  className="cursor-pointer rounded px-1.5 py-0.5 text-[10px] font-bold disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={i === nestedBlocks.length - 1}
                  onClick={() => moveNested(block.id, 1)}
                  className="cursor-pointer rounded px-1.5 py-0.5 text-[10px] font-bold disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeNested(block.id)}
                  className="cursor-pointer rounded px-1.5 py-0.5 text-[10px] font-bold text-rose-600"
                >
                  Xóa
                </button>
              </div>
            </div>
          ))}
          <p className="text-[10px] text-gray-400">
            Click tên block → mở Properties đầy đủ (nội dung + style). Hoặc
            click block trên canvas (nhãn “Click để sửa”).
          </p>
        </div>
      ) : null}

      {children.length === 0 && nestedBlocks.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-200 px-3 py-4 text-center text-[11px] text-gray-400 dark:border-gray-700">
          Container trống — thêm thành phần nhỏ hoặc block đầy đủ.
        </p>
      ) : null}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
 * PropertiesPanel
 * ───────────────────────────────────────────────────────────── */

export default function PropertiesPanel({
  section,
  onSectionUpdate,
  onClose,
  className = "",
  a11yIssues = [],
  styleDevice = "desktop",
  onStyleDeviceChange,
  products = [],
  categories = [],
  onSelectSection,
}: PropertiesPanelProps) {
  // Hooks luôn chạy (tránh early-return trước hooks)
  const sectionId = section?.id ?? null;

  const emit = useCallback(
    (update: LayoutSectionUpdate) => {
      if (!sectionId) return;
      onSectionUpdate(sectionId, update);
    },
    [onSectionUpdate, sectionId],
  );

  const patchData = useCallback(
    (partial: Record<string, unknown>) => {
      emit({ data: partial });
    },
    [emit],
  );

  const patchStyling = useCallback(
    (partial: Partial<LayoutSectionStyling>) => {
      if (styleDevice === "mobile") {
        emit({
          stylingMobile: {
            ...(section?.stylingMobile ?? {}),
            ...partial,
          },
        });
        return;
      }
      emit({ styling: partial });
    },
    [emit, styleDevice, section?.stylingMobile],
  );

  const widthIsSimple = useMemo(
    () =>
      section
        ? WIDTH_SIMPLE.some((w) => w.value === section.widthPreset)
        : true,
    [section],
  );

  // Context aware — không có selection thì ẩn panel
  if (!section) return null;

  const typeLabel = getSectionTypeLabel(section.type);
  const badge = getSectionTypeBadge(section.type);
  /** Style đang edit (desktop full / mobile overlay) */
  const activeStyling: LayoutSectionStyling =
    styleDevice === "mobile"
      ? { ...section.styling, ...(section.stylingMobile ?? {}) }
      : section.styling;
  const spacingValue = activeStyling.paddingY;
  const sectionA11y = a11yIssues.filter((i) => i.sectionId === section.id);

  return (
    <aside
      className={`flex h-full min-h-0 w-full flex-col overflow-hidden border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-950 ${className}`}
      aria-label="Block settings"
      style={{ ["--wp-blue" as string]: "#3858e9" }}
    >
      {/* Header — WordPress Block Inspector */}
      <div className="flex shrink-0 items-start justify-between gap-2 border-b border-gray-200 px-4 py-3 dark:border-gray-800">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
            Block
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            <h2 className="truncate text-sm font-bold text-gray-900 dark:text-white">
              {typeLabel}
            </h2>
            {badge ? (
              <span className="rounded-md bg-[color:var(--wp-blue)]/10 px-1.5 py-0.5 text-[9px] font-bold text-[color:var(--wp-blue)]">
                {badge}
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 truncate text-[10px] text-gray-400">
            Cài đặt khối · Inspector
          </p>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng panel"
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
          >
            <FiX className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {/* Scrollable body */}
      <div className="custom-scrollbar flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
        {/* Identity */}
        <PanelSection title="Khối">
          <TextField
            label="Tên hiển thị (Layers)"
            value={section.label ?? ""}
            onChange={(label) => emit({ label })}
            placeholder={typeLabel}
          />
          <TextField
            label="Group ID (tuỳ chọn)"
            value={section.groupId ?? ""}
            onChange={(groupId) => emit({ groupId: groupId || null })}
            placeholder="vd: hero-zone"
            hint="Gộp section cùng group"
          />
          <ToggleField
            label="Khoá chỉnh sửa nội dung"
            checked={Boolean(section.editorLocked)}
            onChange={(editorLocked) => emit({ editorLocked })}
          />
        </PanelSection>

        {/* Style device */}
        {onStyleDeviceChange ? (
          <PanelSection title="Thiết bị style">
            <SegmentedControl
              value={styleDevice}
              options={[
                { value: "desktop", label: "Desktop" },
                { value: "mobile", label: "Mobile" },
              ]}
              onChange={(d) => onStyleDeviceChange(d as "desktop" | "mobile")}
            />
            <p className="mt-1 text-[10px] text-gray-400">
              Mobile = override style khi &lt; md. Để trống = kế thừa desktop.
            </p>
          </PanelSection>
        ) : null}

        {sectionA11y.length > 0 ? (
          <PanelSection title="A11y">
            <ul className="space-y-1">
              {sectionA11y.map((i) => (
                <li
                  key={i.id}
                  className={`rounded-lg px-2 py-1.5 text-[11px] ${
                    i.severity === "error"
                      ? "bg-rose-50 text-rose-700"
                      : i.severity === "warn"
                        ? "bg-amber-50 text-amber-800"
                        : "bg-sky-50 text-sky-800"
                  }`}
                >
                  {i.message}
                </li>
              ))}
            </ul>
          </PanelSection>
        ) : null}

        {/* Visibility */}
        <PanelSection title="Hiển thị">
          <ToggleField
            label="Bật section trên storefront"
            checked={section.enabled}
            onChange={(enabled) => emit({ enabled })}
          />
          <ToggleField
            label="Ẩn trên mobile"
            checked={Boolean(activeStyling.hideOnMobile)}
            onChange={(hideOnMobile) => patchStyling({ hideOnMobile })}
          />
          <ToggleField
            label="Ẩn trên desktop"
            checked={Boolean(activeStyling.hideOnDesktop)}
            onChange={(hideOnDesktop) => patchStyling({ hideOnDesktop })}
          />
        </PanelSection>

        {/* Width presets */}
        <PanelSection title="Chiều ngang (width preset)">
          <FieldLabel hint="Không nhập %">Boxed model</FieldLabel>
          <div className="grid grid-cols-3 gap-1.5">
            {WIDTH_SIMPLE.map((opt) => {
              const active =
                (styleDevice === "mobile"
                  ? section.widthPresetMobile ?? section.widthPreset
                  : section.widthPreset) === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    styleDevice === "mobile"
                      ? emit({ widthPresetMobile: opt.value })
                      : emit({ widthPreset: opt.value })
                  }
                  className={`flex cursor-pointer flex-col items-center gap-1 rounded-xl border px-2 py-2.5 transition ${
                    active
                      ? "border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300"
                      : "border-gray-200 text-gray-500 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500"
                  }`}
                >
                  <WidthIcon kind={opt.icon} />
                  <span className="text-[10px] font-bold">{opt.label}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-3">
            <FieldLabel hint="Split / grid">Layout rhythm</FieldLabel>
            <div className="flex flex-wrap gap-1">
              {WIDTH_LAYOUT.map((opt) => {
                const active =
                  (styleDevice === "mobile"
                    ? section.widthPresetMobile ?? section.widthPreset
                    : section.widthPreset) === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      styleDevice === "mobile"
                        ? emit({ widthPresetMobile: opt.value })
                        : emit({ widthPreset: opt.value })
                    }
                    className={`cursor-pointer rounded-lg border px-2 py-1.5 text-[10px] font-bold transition ${
                      active
                        ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
                        : "border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-600 dark:text-gray-300"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            {!widthIsSimple &&
            !WIDTH_LAYOUT.some((w) => w.value === section.widthPreset) ? (
              <p className="mt-1.5 text-[10px] text-gray-400">
                Đang dùng:{" "}
                {WIDTH_PRESET_LABELS[section.widthPreset] ??
                  section.widthPreset}
              </p>
            ) : null}
          </div>
        </PanelSection>

        {/* Flex / Grid display + responsive */}
        <FlexGridInspector
          flexGrid={
            // Luôn edit flexGrid trên desktop styling; mobile = nested .mobile
            styleDevice === "mobile"
              ? section.styling.flexGrid
              : activeStyling.flexGrid
          }
          styleDevice={styleDevice}
          onChange={(flexGrid) => {
            // Ghi vào styling desktop (kể cả khi tab Mobile — override nằm trong flexGrid.mobile)
            emit({
              styling: {
                ...section.styling,
                flexGrid,
              },
            });
          }}
        />

        {/* Spacing */}
        <PanelSection title="Khoảng đệm (spacing)">
          <FieldLabel hint="Tight · Normal · Loose">Padding dọc</FieldLabel>
          <SegmentedControl
            value={spacingValue}
            options={SPACING_PRESETS.map((s) => ({
              value: s.value,
              label: s.label,
              hint: s.hint,
            }))}
            onChange={(paddingY) =>
              patchStyling({
                paddingY,
                // Đồng bộ X theo Y cho UX đơn giản (có thể tách sau)
                paddingX:
                  paddingY === "hero"
                    ? "normal"
                    : paddingY === "none"
                      ? "none"
                      : paddingY,
              })
            }
          />
        </PanelSection>

        {/* Effects: animation · shadow · blur · hover · border · radius */}
        <PanelSection title="Hiệu ứng (effects)">
          <div className="space-y-3">
            <div>
              <FieldLabel hint="Scroll reveal">Animation</FieldLabel>
              <SegmentedControl
                value={activeStyling.animation ?? "fade-up"}
                options={ANIMATION_OPTIONS}
                onChange={(animation) => patchStyling({ animation })}
              />
            </div>
            <div>
              <FieldLabel hint="Đổ bóng">Shadow</FieldLabel>
              <SegmentedControl
                value={resolveShadow(activeStyling)}
                options={SHADOW_OPTIONS}
                onChange={(shadow) =>
                  patchStyling({ shadow, elevation: shadow })
                }
              />
            </div>
            <div>
              <FieldLabel hint="Backdrop">Blur / Glass</FieldLabel>
              <SegmentedControl
                value={activeStyling.blur ?? "none"}
                options={BLUR_OPTIONS}
                onChange={(blur) => patchStyling({ blur })}
              />
            </div>
            <div>
              <FieldLabel hint="Khi di chuột">Hover</FieldLabel>
              <SegmentedControl
                value={activeStyling.hover ?? "none"}
                options={HOVER_OPTIONS}
                onChange={(hover) => patchStyling({ hover })}
              />
            </div>
            <div>
              <FieldLabel>Viền</FieldLabel>
              <SegmentedControl
                value={activeStyling.border ?? "none"}
                options={BORDER_OPTIONS}
                onChange={(border) => patchStyling({ border })}
              />
            </div>
            <div>
              <FieldLabel>Bo góc</FieldLabel>
              <SegmentedControl
                value={activeStyling.radius}
                options={RADIUS_OPTIONS}
                onChange={(radius) => patchStyling({ radius })}
              />
            </div>
            <p className="text-[10px] leading-relaxed text-gray-400">
              Glass / Frosted hoạt động rõ trên nền ảnh hoặc gradient. Hover
              áp dụng cả khối. Animation tôn trọng prefers-reduced-motion.
            </p>
          </div>
        </PanelSection>

        {/* Brand background palette */}
        <PanelSection title="Nền (brand colors)">
          <FieldLabel hint="Không color picker tự do">Palette</FieldLabel>
          <div className="grid grid-cols-5 gap-1.5">
            {BG_BRAND_PRESETS.map((opt) => {
              const active = section.styling.bgPreset === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  title={opt.label}
                  onClick={() => patchStyling({ bgPreset: opt.value })}
                  className={`flex cursor-pointer flex-col items-center gap-1 rounded-lg p-1 transition ${
                    active ? "ring-2 ring-brand-500 ring-offset-1" : ""
                  }`}
                >
                  <span
                    className={`h-8 w-full rounded-md border border-gray-200 dark:border-gray-600 ${
                      opt.value === "inherit"
                        ? "bg-[length:8px_8px] bg-[linear-gradient(45deg,#e5e7eb_25%,transparent_25%,transparent_75%,#e5e7eb_75%),linear-gradient(45deg,#e5e7eb_25%,transparent_25%,transparent_75%,#e5e7eb_75%)] bg-position-[0_0,4px_4px]"
                        : ""
                    }`}
                    style={
                      opt.value === "inherit"
                        ? undefined
                        : { background: opt.swatch }
                    }
                  />
                  <span className="max-w-full truncate text-[8px] font-semibold text-gray-500">
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-3">
            <FieldLabel>Tone chữ</FieldLabel>
            <SegmentedControl
              value={section.styling.textTone}
              options={TEXT_TONE_OPTIONS}
              onChange={(textTone) => patchStyling({ textTone })}
            />
          </div>
        </PanelSection>

        {/* Type-specific content */}
        <PanelSection title="Nội dung">
          {section.editorLocked ? (
            <p className="text-[11px] text-amber-700">
              Khối đang khoá chỉnh sửa — tắt “Khoá chỉnh sửa nội dung” để sửa.
            </p>
          ) : (
            <ContentFields
              section={section}
              patchData={patchData}
              products={products}
              categories={categories}
              onSelectSection={onSelectSection}
            />
          )}
        </PanelSection>
      </div>
    </aside>
  );
}
