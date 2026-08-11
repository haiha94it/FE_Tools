/**
 * SectionRenderer — map one LayoutSection → typed production/preview renderer.
 */

"use client";

import type { LayoutSection } from "@/types/shop-layout-canvas";
import type { ShopCategory, ShopProduct } from "@/types/zalo-shop";
import { shopImageUrl } from "@/lib/shop-utils";
import SectionMotion from "@/components/shop-admin/layout-canvas/SectionMotion";
import {
  CouponsRenderer,
  CtaBannerRenderer,
  DividerRenderer,
  EditorialRenderer,
  FaqRenderer,
  FeatureGridRenderer,
  GalleryRenderer,
  ImageBannerRenderer,
  LogoCloudRenderer,
  NewsletterRenderer,
  ProductCarouselRenderer,
  ReviewsRenderer,
  SpacerRenderer,
  StatsRenderer,
  TextBlockRenderer,
  TrustBadgesRenderer,
  VideoBlockRenderer,
} from "./ExtraBlockRenderers";
import ContainerRenderer from "./ContainerRenderer";
import GridRenderer from "./GridRenderer";
import HeaderRenderer from "./HeaderRenderer";
import HeroRenderer from "./HeroRenderer";
import {
  buildSectionShellClasses,
  buildWidthFrameClass,
  mutedTextClass,
  radiusClass,
  type SectionRendererProps,
} from "./section-style-utils";
import { useState, type ReactNode } from "react";
import { toast } from "@/lib/toast";

export type SectionRendererExtraProps = {
  /** Toàn bộ SP shop (đã load). Rỗng → renderer dùng demo. */
  products?: ShopProduct[];
  /** Danh mục thật của shop */
  categories?: ShopCategory[];
  /** Link SP storefront */
  getProductHref?: (productId: number) => string;
  onProductClick?: (productId: number) => void;
  onCartClick?: () => void;
  /** Stagger delay 0–11 cho scroll reveal */
  motionIndex?: number;
  /** Animate ngay khi mount (builder) thay vì chờ IO */
  motionImmediate?: boolean;
  /** Tắt motion (vd. drag ghost) */
  motionDisabled?: boolean;
  /**
   * Builder canvas — header fixed map → sticky, không fixed viewport admin.
   */
  previewMode?: boolean;
  /** Bật inline edit (builder, section active) */
  inlineEdit?: boolean;
  /** Patch data section (inline / content) */
  onPatchData?: (partial: Record<string, unknown>) => void;
  /** Độ sâu lồng container (tránh nest vô hạn) */
  nestDepth?: number;
  /** Section đang chọn (top-level hoặc nested) */
  activeSectionId?: string | null;
  /** Click chọn nested block trong container */
  onSelectSection?: (id: string) => void;
};

function pickProductsForSection(
  section: LayoutSection,
  products: ShopProduct[] | undefined,
): ShopProduct[] | undefined {
  if (!products || products.length === 0) return products;

  if (section.type === "FLASH_SALE") {
    const flash = products.filter((p) => p.is_flash_sale);
    // Có flash thì dùng; không thì fallback toàn bộ catalog (vẫn là data thật)
    return flash.length > 0 ? flash : products;
  }

  if (section.type === "HOT_PRODUCTS" || section.type === "PRODUCT_CAROUSEL") {
    const hot = products.filter((p) => p.is_hot || p.is_flash_sale);
    return hot.length > 0 ? hot : products;
  }

  // PRODUCT_GRID: filter theo productIds / categoryId nếu có
  if (section.type === "PRODUCT_GRID") {
    let list = products;
    if (section.data.categoryId != null) {
      list = list.filter((p) => p.category === section.data.categoryId);
    }
    if (section.data.productIds && section.data.productIds.length > 0) {
      const set = new Set(section.data.productIds);
      list = list.filter((p) => set.has(p.id));
    }
    return list.length > 0 ? list : products;
  }

  return products;
}

/**
 * Fallback renderer for section types without a dedicated component yet.
 * Still respects styling presets so the stack looks coherent.
 */
function GenericSectionRenderer({
  section,
  theme,
  className = "",
}: SectionRendererProps) {
  const shell = buildSectionShellClasses(section.styling);
  const accent = theme?.accentColor ?? "#0071E3";
  const title =
    "title" in section.data && typeof section.data.title === "string"
      ? section.data.title
      : section.type.replace(/_/g, " ");

  return (
    <section
      className={`${shell.className} ${className}`}
      style={shell.style}
      data-section-type={section.type}
      data-section-id={section.id}
    >
      <div className={buildWidthFrameClass(section.widthPreset)}>
        <div
          className={`border border-dashed border-current/15 bg-black/[0.03] p-6 dark:bg-white/[0.04] ${radiusClass(section.styling.radius)}`}
        >
          <p
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: accent }}
          >
            {section.type}
          </p>
          <h2 className="mt-1 text-lg font-bold">{title}</h2>
          <p
            className={`mt-1 text-sm ${mutedTextClass(section.styling.textTone, section.styling.bgPreset)}`}
          >
            Renderer chi tiết sẽ được bổ sung — preset styling đã áp dụng.
          </p>
        </div>
      </div>
    </section>
  );
}

function FlashSaleRenderer({
  section,
  theme,
  products,
  getProductHref,
  onProductClick,
  className = "",
}: SectionRendererProps<Extract<LayoutSection, { type: "FLASH_SALE" }>> & {
  products?: ShopProduct[];
  getProductHref?: (productId: number) => string;
  onProductClick?: (productId: number) => void;
}) {
  const shell = buildSectionShellClasses(section.styling);
  const accent = theme?.accentColor ?? "#fff";

  // Tái dùng GridRenderer shell nhẹ: map sang HOT shape tạm — dùng tiles inline
  const maxItems = section.data.maxItems ?? 8;
  const hasReal = Boolean(products && products.length > 0);

  return (
    <section
      className={`${shell.className} ${className}`}
      style={shell.style}
      data-section-type="FLASH_SALE"
      data-section-id={section.id}
    >
      <div className={buildWidthFrameClass(section.widthPreset)}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black sm:text-2xl">
              {section.data.title}
            </h2>
            {section.data.subtitle ? (
              <p className="mt-1 text-sm opacity-80">{section.data.subtitle}</p>
            ) : null}
            {!hasReal ? (
              <p className="mt-1 text-[11px] font-medium text-amber-200">
                Shop chưa có SP — countdown demo
              </p>
            ) : null}
          </div>
          <div className="flex gap-1.5 font-mono text-sm font-bold">
            {["02", "18", "44"].map((t) => (
              <span
                key={t}
                className="rounded-lg bg-black/20 px-2.5 py-1.5 backdrop-blur-sm"
                style={{ color: accent }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* SP flash / catalog thật hoặc demo qua GridRenderer helper */}
        <GridRenderer
          section={{
            ...section,
            type: "HOT_PRODUCTS",
            // Inner grid: full width trong frame Flash (tránh double container)
            widthPreset: "FULL_BLEED",
            data: {
              title: "",
              subtitle: undefined,
              productIds: section.data.productIds,
              maxItems,
            },
            styling: {
              ...section.styling,
              bgPreset: "inherit",
              paddingY: "none",
              paddingX: "none",
              elevation: "none",
            },
          }}
          theme={theme}
          products={products}
          maxItems={maxItems}
          getProductHref={getProductHref}
          onProductClick={onProductClick}
        />
      </div>
    </section>
  );
}

function ContactFooterRenderer({
  section,
  theme,
  className = "",
}: SectionRendererProps<Extract<LayoutSection, { type: "CONTACT_FOOTER" }>>) {
  const shell = buildSectionShellClasses(section.styling);
  const d = section.data;
  const phone = d.phone?.trim() || theme?.contactPhone?.trim() || "";
  const zalo = d.zalo?.trim() || theme?.contactZalo?.trim() || "";
  const facebook = d.facebook?.trim() || theme?.contactFacebook?.trim() || "";
  const website = d.website?.trim() || theme?.contactWebsite?.trim() || "";
  const address = d.address?.trim() || theme?.contactAddress?.trim() || "";

  return (
    <footer
      className={`${shell.className} ${className}`}
      style={shell.style}
      data-section-type="CONTACT_FOOTER"
      data-section-id={section.id}
    >
      <div
        className={`${buildWidthFrameClass(section.widthPreset)} grid gap-6 sm:grid-cols-3`}
      >
        <div>
          <h2 className="text-base font-bold">
            {d.title || theme?.shopName || "Liên hệ"}
          </h2>
          <p className="mt-2 text-sm opacity-75">
            {[phone, zalo].filter(Boolean).join(" · ") || "Hotline · Zalo"}
          </p>
        </div>
        <div className="text-sm opacity-75">
          <p>{address || "Địa chỉ cửa hàng"}</p>
          {website ? (
            <a href={website} className="mt-1 inline-block underline">
              {website}
            </a>
          ) : null}
        </div>
        <div className="flex items-start gap-2 sm:justify-end">
          {(
            [
              { key: "FB", href: facebook },
              { key: "ZL", href: zalo ? `https://zalo.me/${zalo}` : "" },
              { key: "WEB", href: website },
            ] as const
          ).map((s) =>
            s.href ? (
              <a
                key={s.key}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold no-underline"
              >
                {s.key}
              </a>
            ) : (
              <span
                key={s.key}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold opacity-40"
              >
                {s.key}
              </span>
            ),
          )}
        </div>
      </div>
    </footer>
  );
}

function CategoryRailRenderer({
  section,
  theme,
  categories,
  className = "",
}: SectionRendererProps<Extract<LayoutSection, { type: "CATEGORY_RAIL" }>> & {
  categories?: ShopCategory[];
}) {
  const shell = buildSectionShellClasses(section.styling);
  const accent = theme?.accentColor ?? "#0071E3";
  const realCats = (categories ?? []).filter((c) => c.name?.trim());
  const usingDemo = realCats.length === 0;
  const labels = usingDemo
    ? ["Tất cả", "Mới", "Hot", "Sale", "Khác"]
    : ["Tất cả", ...realCats.slice(0, 8).map((c) => c.name)];

  return (
    <section
      className={`${shell.className} ${className}`}
      style={shell.style}
      data-section-type="CATEGORY_RAIL"
      data-section-id={section.id}
    >
      <div className={buildWidthFrameClass(section.widthPreset)}>
        {section.data.title ? (
          <p className="mb-2 text-xs font-bold uppercase tracking-wide opacity-60">
            {section.data.title}
          </p>
        ) : null}
        {usingDemo ? (
          <p className="mb-2 text-[11px] font-medium text-amber-600 dark:text-amber-400">
            Chưa có danh mục — hiển thị demo
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {labels.map((label, i) => {
            const cat = !usingDemo && i > 0 ? realCats[i - 1] : null;
            const avt = cat?.avt ? shopImageUrl(cat.avt) : "";
            const isStories = section.data.style === "stories";
            if (isStories) {
              return (
                <div
                  key={`${label}-${i}`}
                  className="flex w-16 flex-col items-center gap-1"
                >
                  <span
                    className={`flex h-12 w-12 items-center justify-center overflow-hidden rounded-full ring-2 ${
                      i === 0 ? "ring-offset-2" : "ring-gray-200 dark:ring-gray-600"
                    }`}
                    style={
                      i === 0
                        ? { boxShadow: `0 0 0 2px ${accent}` }
                        : undefined
                    }
                  >
                    {avt ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avt} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold opacity-50">
                        {label.slice(0, 1)}
                      </span>
                    )}
                  </span>
                  <span className="line-clamp-1 text-[10px] font-semibold">
                    {label}
                  </span>
                </div>
              );
            }
            return (
              <span
                key={`${label}-${i}`}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                  i === 0 ? "text-white" : "bg-black/5 dark:bg-white/10"
                }`}
                style={i === 0 ? { background: accent } : undefined}
              >
                {avt ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avt}
                    alt=""
                    className="h-5 w-5 rounded-full object-cover"
                  />
                ) : null}
                {label}
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function AnnouncementRenderer({
  section,
  theme,
  className = "",
}: SectionRendererProps<Extract<LayoutSection, { type: "ANNOUNCEMENT" }>>) {
  const shell = buildSectionShellClasses(section.styling);
  const text =
    section.data.text?.trim() ||
    theme?.announcement?.trim() ||
    "Thông báo cửa hàng";

  return (
    <section
      className={`${shell.className} ${className}`}
      style={shell.style}
      data-section-type="ANNOUNCEMENT"
      data-section-id={section.id}
    >
      <div className={`${buildWidthFrameClass(section.widthPreset)} text-center`}>
        <p className="text-xs font-semibold sm:text-sm">📣 {text}</p>
      </div>
    </section>
  );
}

function LeadFormRenderer({
  section,
  theme,
  className = "",
}: SectionRendererProps<Extract<LayoutSection, { type: "LEAD_FORM" }>>) {
  const shell = buildSectionShellClasses(section.styling);
  const accent = theme?.accentColor ?? "#0071E3";
  const [submitted, setSubmitted] = useState(false);

  return (
    <section
      className={`${shell.className} ${className}`}
      style={shell.style}
      data-section-type="LEAD_FORM"
      data-section-id={section.id}
    >
      <div className={`${buildWidthFrameClass(section.widthPreset)} max-w-xl mx-auto py-4`}>
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold sm:text-2xl">{section.data.title}</h3>
          {section.data.subtitle ? (
            <p className="mt-1 text-sm opacity-80">{section.data.subtitle}</p>
          ) : null}
        </div>

        {submitted ? (
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-6 text-center text-emerald-600 dark:text-emerald-400">
            <p className="font-semibold text-sm">✓ {section.data.successMessage || "Đã gửi thông tin thành công!"}</p>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(true);
              toast.success("Đã nhận thông tin tư vấn!");
            }}
            className="space-y-3"
          >
            {(section.data.fields ?? ["name", "phone", "note"]).includes("name") ? (
              <input
                type="text"
                required
                placeholder="Họ và tên của bạn"
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[color:var(--store-accent)]"
              />
            ) : null}
            {(section.data.fields ?? ["name", "phone", "note"]).includes("phone") ? (
              <input
                type="tel"
                required
                placeholder="Số điện thoại Zalo *"
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[color:var(--store-accent)]"
              />
            ) : null}
            {(section.data.fields ?? ["name", "phone", "note"]).includes("note") ? (
              <textarea
                rows={2}
                placeholder="Sản phẩm / Nhu cầu cần tư vấn…"
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[color:var(--store-accent)]"
              />
            ) : null}
            <button
              type="submit"
              className="w-full cursor-pointer rounded-xl px-5 py-3 text-sm font-bold text-white shadow-md transition hover:opacity-90 active:scale-[0.99]"
              style={{ backgroundColor: accent }}
            >
              {section.data.buttonText || "Gửi đăng ký ngay"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

function ShortVideoRenderer({
  section,
  theme,
  className = "",
}: SectionRendererProps<Extract<LayoutSection, { type: "SHORT_VIDEO" }>>) {
  const shell = buildSectionShellClasses(section.styling);
  const accent = theme?.accentColor ?? "#0071E3";

  return (
    <section
      className={`${shell.className} ${className}`}
      style={shell.style}
      data-section-type="SHORT_VIDEO"
      data-section-id={section.id}
    >
      <div className={`${buildWidthFrameClass(section.widthPreset)} max-w-lg mx-auto py-2`}>
        {section.data.title ? (
          <div className="text-center mb-3">
            {section.data.badge ? (
              <span
                className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white mb-1"
                style={{ backgroundColor: accent }}
              >
                {section.data.badge}
              </span>
            ) : null}
            <h3 className="text-lg font-bold sm:text-xl">{section.data.title}</h3>
            {section.data.subtitle ? (
              <p className="text-xs opacity-75">{section.data.subtitle}</p>
            ) : null}
          </div>
        ) : null}
        <div className="relative aspect-[9/16] w-full overflow-hidden rounded-2xl bg-black shadow-xl">
          <video
            src={section.data.videoUrl}
            poster={section.data.coverImageUrl}
            autoPlay={section.data.autoplay !== false}
            loop
            muted
            playsInline
            controls
            className="h-full w-full object-cover"
          />
          {section.data.ctaText ? (
            <div className="absolute bottom-4 inset-x-4 z-10 flex justify-center">
              <a
                href={section.data.ctaHref || "#products"}
                className="cursor-pointer rounded-full px-6 py-2.5 text-xs font-bold text-white shadow-lg backdrop-blur-md transition hover:scale-105"
                style={{ backgroundColor: accent }}
              >
                {section.data.ctaText} →
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function SpinWheelRenderer({
  section,
  theme,
  className = "",
}: SectionRendererProps<Extract<LayoutSection, { type: "SPIN_WHEEL" }>>) {
  const shell = buildSectionShellClasses(section.styling);
  const [spinning, setSpinning] = useState(false);
  const [wonPrize, setWonPrize] = useState<{ label: string; code: string } | null>(null);

  const prizes = section.data.prizes ?? [];

  const handleSpin = () => {
    if (spinning || prizes.length === 0) return;
    setSpinning(true);
    setTimeout(() => {
      const random = prizes[Math.floor(Math.random() * prizes.length)];
      setWonPrize(random);
      setSpinning(false);
      toast.success(`🎉 Chúc mừng bạn trúng: ${random.label}! Mã: ${random.code}`);
    }, 2000);
  };

  return (
    <section
      className={`${shell.className} ${className}`}
      style={shell.style}
      data-section-type="SPIN_WHEEL"
      data-section-id={section.id}
    >
      <div className={`${buildWidthFrameClass(section.widthPreset)} text-center py-4`}>
        <h3 className="text-xl font-black sm:text-2xl">{section.data.title}</h3>
        {section.data.subtitle ? (
          <p className="mt-1 text-sm opacity-90">{section.data.subtitle}</p>
        ) : null}

        <div className="my-6 mx-auto flex flex-col items-center">
          <div
            className={`relative flex h-56 w-56 items-center justify-center rounded-full border-4 border-amber-300 shadow-2xl transition-transform duration-[2000ms] ${
              spinning ? "rotate-[1440deg] ease-out" : ""
            }`}
            style={{
              background: "conic-gradient(#F59E0B 0deg 60deg, #10B981 60deg 120deg, #EF4444 120deg 180deg, #3B82F6 180deg 240deg, #8B5CF6 240deg 300deg, #EC4899 300deg 360deg)",
            }}
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-amber-200 bg-white shadow-lg dark:bg-stone-900">
              <span className="text-xs font-extrabold uppercase text-gray-800 dark:text-white">
                {spinning ? "Đang quay…" : "QUAY"}
              </span>
            </div>
          </div>

          {wonPrize ? (
            <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/90 px-4 py-2 text-sm font-bold text-stone-900 shadow-lg dark:bg-stone-800 dark:text-white">
              🎉 Bạn nhận được: <span className="text-amber-600 dark:text-amber-400">{wonPrize.label}</span> (Mã: <code className="rounded bg-gray-200 px-1 py-0.5 dark:bg-gray-700">{wonPrize.code}</code>)
            </div>
          ) : null}

          <button
            type="button"
            disabled={spinning}
            onClick={handleSpin}
            className="mt-5 cursor-pointer rounded-full bg-white px-8 py-3 text-sm font-black text-stone-900 shadow-xl transition hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            {spinning ? "Đang quay may mắn…" : section.data.buttonText || "Quay Ngay Mới Đơn"}
          </button>
        </div>
      </div>
    </section>
  );
}

export default function SectionRenderer({
  section,
  theme,
  products,
  categories,
  getProductHref,
  onProductClick,
  onCartClick,
  className,
  motionIndex = 0,
  motionImmediate = false,
  motionDisabled = false,
  previewMode = false,
  inlineEdit = false,
  onPatchData,
  nestDepth = 0,
  activeSectionId = null,
  onSelectSection,
}: SectionRendererProps & SectionRendererExtraProps) {
  const sectionProducts = pickProductsForSection(section, products);

  let body: ReactNode;

  switch (section.type) {
    case "HEADER":
      body = (
        <HeaderRenderer
          section={section}
          theme={theme}
          className={className}
          previewMode={previewMode}
          onCartClick={onCartClick}
        />
      );
      break;
    case "HERO":
      body = (
        <HeroRenderer
          section={section}
          theme={theme}
          products={products}
          className={className}
          inlineEdit={inlineEdit}
          onPatchData={onPatchData}
        />
      );
      break;
    case "ANNOUNCEMENT":
      body = (
        <AnnouncementRenderer
          section={section}
          theme={theme}
          className={className}
        />
      );
      break;
    case "CATEGORY_RAIL":
      body = (
        <CategoryRailRenderer
          section={section}
          theme={theme}
          categories={categories}
          className={className}
        />
      );
      break;
    case "PRODUCT_GRID":
      body = (
        <GridRenderer
          section={section}
          theme={theme}
          products={sectionProducts}
          getProductHref={getProductHref}
          onProductClick={onProductClick}
          className={className}
        />
      );
      break;
    case "HOT_PRODUCTS":
      body = (
        <GridRenderer
          section={section}
          theme={theme}
          products={sectionProducts}
          maxItems={section.data.maxItems ?? 8}
          getProductHref={getProductHref}
          onProductClick={onProductClick}
          className={className}
        />
      );
      break;
    case "FLASH_SALE":
      body = (
        <FlashSaleRenderer
          section={section}
          theme={theme}
          products={sectionProducts}
          getProductHref={getProductHref}
          onProductClick={onProductClick}
          className={className}
        />
      );
      break;
    case "CONTACT_FOOTER":
      body = (
        <ContactFooterRenderer
          section={section}
          theme={theme}
          className={className}
        />
      );
      break;
    case "TRUST_BADGES":
      body = (
        <TrustBadgesRenderer
          section={section}
          theme={theme}
          className={className}
        />
      );
      break;
    case "COUPONS":
      body = (
        <CouponsRenderer
          section={section}
          theme={theme}
          className={className}
        />
      );
      break;
    case "EDITORIAL":
      body = (
        <EditorialRenderer
          section={section}
          theme={theme}
          products={products}
          className={className}
        />
      );
      break;
    case "REVIEWS":
      body = (
        <ReviewsRenderer
          section={section}
          theme={theme}
          className={className}
        />
      );
      break;
    case "PRODUCT_CAROUSEL":
      body = (
        <ProductCarouselRenderer
          section={section}
          theme={theme}
          products={sectionProducts}
          getProductHref={getProductHref}
          onProductClick={onProductClick}
          className={className}
        />
      );
      break;
    case "IMAGE_BANNER":
      body = (
        <ImageBannerRenderer
          section={section}
          theme={theme}
          className={className}
        />
      );
      break;
    case "VIDEO_BLOCK":
      body = (
        <VideoBlockRenderer
          section={section}
          theme={theme}
          className={className}
        />
      );
      break;
    case "TEXT_BLOCK":
      body = (
        <TextBlockRenderer
          section={section}
          theme={theme}
          className={className}
          inlineEdit={inlineEdit}
          onPatchData={onPatchData}
        />
      );
      break;
    case "CTA_BANNER":
      body = (
        <CtaBannerRenderer
          section={section}
          theme={theme}
          className={className}
          inlineEdit={inlineEdit}
          onPatchData={onPatchData}
        />
      );
      break;
    case "FEATURE_GRID":
      body = (
        <FeatureGridRenderer
          section={section}
          theme={theme}
          className={className}
        />
      );
      break;
    case "STATS":
      body = (
        <StatsRenderer section={section} theme={theme} className={className} />
      );
      break;
    case "GALLERY":
      body = (
        <GalleryRenderer
          section={section}
          theme={theme}
          products={products}
          className={className}
        />
      );
      break;
    case "LOGO_CLOUD":
      body = (
        <LogoCloudRenderer
          section={section}
          theme={theme}
          className={className}
        />
      );
      break;
    case "FAQ":
      body = (
        <FaqRenderer section={section} theme={theme} className={className} />
      );
      break;
    case "NEWSLETTER":
      body = (
        <NewsletterRenderer
          section={section}
          theme={theme}
          className={className}
        />
      );
      break;
    case "LEAD_FORM":
      body = (
        <LeadFormRenderer
          section={section}
          theme={theme}
          className={className}
        />
      );
      break;
    case "SHORT_VIDEO":
      body = (
        <ShortVideoRenderer
          section={section}
          theme={theme}
          className={className}
        />
      );
      break;
    case "SPIN_WHEEL":
      body = (
        <SpinWheelRenderer
          section={section}
          theme={theme}
          className={className}
        />
      );
      break;
    case "SPACER":
      body = <SpacerRenderer section={section} className={className} />;
      break;
    case "DIVIDER":
      body = (
        <DividerRenderer
          section={section}
          theme={theme}
          className={className}
        />
      );
      break;
    case "CONTAINER":
      body = (
        <ContainerRenderer
          section={section}
          theme={theme}
          className={className}
          isBuilder={previewMode || Boolean(onSelectSection)}
          nestDepth={nestDepth}
          products={products}
          categories={categories}
          getProductHref={getProductHref}
          onProductClick={onProductClick}
          activeSectionId={activeSectionId}
          onSelectSection={onSelectSection}
        />
      );
      break;
    default:
      body = (
        <GenericSectionRenderer
          section={section}
          theme={theme}
          className={className}
        />
      );
  }

  /**
   * HEADER + sticky/fixed: không bọc transform animation
   * (transform ancestor phá position:sticky/fixed).
   */
  const isPinnedHeader =
    section.type === "HEADER" &&
    (section.data.position === "sticky" ||
      section.data.position === "fixed");

  const forceNoMotion =
    previewMode ||
    motionDisabled ||
    section.type === "HEADER" ||
    section.type === "SPACER" ||
    isPinnedHeader;

  return (
    <SectionMotion
      animation={
        forceNoMotion ? "none" : section.styling.animation
      }
      delay={motionIndex}
      immediate={motionImmediate}
      disabled={forceNoMotion}
    >
      {body}
    </SectionMotion>
  );
}
