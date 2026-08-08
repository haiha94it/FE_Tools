/**
 * Renderers cho các khối tuỳ biến mở rộng (banner, FAQ, CTA, gallery…).
 */

"use client";

import type { LayoutSection } from "@/types/shop-layout-canvas";
import type { ShopProduct } from "@/types/zalo-shop";
import InlineEditable from "@/components/shop-admin/layout-canvas/InlineEditable";
import { staggerChildClass } from "@/components/shop-admin/layout-canvas/SectionMotion";
import {
  buildSectionShellClasses,
  buildWidthFrameClass,
  mutedTextClass,
  type LayoutRenderTheme,
  type SectionRendererProps,
} from "./section-style-utils";
import GridRenderer from "./GridRenderer";

type InlinePatch = {
  inlineEdit?: boolean;
  onPatchData?: (partial: Record<string, unknown>) => void;
};

const ICON_GLYPH: Record<string, string> = {
  truck: "🚚",
  shield: "🛡",
  clock: "⏱",
  phone: "📞",
  gift: "🎁",
  star: "★",
  heart: "♥",
  zap: "⚡",
};

function youtubeEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.slice(1);
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
  } catch {
    /* ignore */
  }
  return null;
}

const HEIGHT_CLASS = {
  sm: "min-h-[120px] sm:min-h-[160px]",
  md: "min-h-[180px] sm:min-h-[240px]",
  lg: "min-h-[240px] sm:min-h-[320px]",
  xl: "min-h-[320px] sm:min-h-[420px]",
} as const;

const SPACER_H = {
  xs: "h-4",
  sm: "h-8",
  md: "h-12",
  lg: "h-20",
  xl: "h-28",
  "2xl": "h-40",
} as const;

export function TrustBadgesRenderer({
  section,
  theme,
  className = "",
}: SectionRendererProps<Extract<LayoutSection, { type: "TRUST_BADGES" }>>) {
  const shell = buildSectionShellClasses(section.styling);
  const accent = theme?.accentColor ?? "#0071E3";

  return (
    <section
      className={`${shell.className} ${className}`}
      style={shell.style}
      data-section-type="TRUST_BADGES"
      data-section-id={section.id}
    >
      <div
        className={`${buildWidthFrameClass(section.widthPreset)} grid grid-cols-2 gap-3 sm:grid-cols-4`}
      >
        {section.data.items.map((item, i) => (
          <div
            key={item.id}
            className={`canvas-hover-lift flex flex-col items-center gap-2 rounded-xl bg-black/[0.03] px-3 py-4 text-center dark:bg-white/[0.05] ${staggerChildClass(i)}`}
          >
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full text-base"
              style={{
                backgroundColor: `color-mix(in srgb, ${accent} 14%, transparent)`,
              }}
            >
              {ICON_GLYPH[item.icon ?? "star"] ?? "★"}
            </span>
            <p className="text-xs font-bold leading-snug sm:text-[13px]">
              {item.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function CouponsRenderer({
  section,
  theme,
  className = "",
}: SectionRendererProps<Extract<LayoutSection, { type: "COUPONS" }>>) {
  const shell = buildSectionShellClasses(section.styling);
  const accent = theme?.accentColor ?? "#0071E3";
  const demos = [
    { code: "SALE10", desc: "Giảm 10% đơn từ 200K" },
    { code: "FREESHIP", desc: "Miễn phí vận chuyển" },
    { code: "NEW50", desc: "Giảm 50K khách mới" },
  ];

  return (
    <section
      className={`${shell.className} ${className}`}
      style={shell.style}
      data-section-type="COUPONS"
      data-section-id={section.id}
    >
      <div className={buildWidthFrameClass(section.widthPreset)}>
        <h2 className="mb-4 text-lg font-bold sm:text-xl">{section.data.title}</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {demos.map((c) => (
            <div
              key={c.code}
              className="relative overflow-hidden rounded-xl border border-dashed border-current/20 bg-black/[0.02] p-4 dark:bg-white/[0.04]"
            >
              <p
                className="font-mono text-sm font-black tracking-wider"
                style={{ color: accent }}
              >
                {c.code}
              </p>
              <p className="mt-1 text-xs opacity-70">{c.desc}</p>
              <span
                className="mt-3 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold text-white"
                style={{ backgroundColor: accent }}
              >
                Lưu mã
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function EditorialRenderer({
  section,
  theme,
  className = "",
}: SectionRendererProps<Extract<LayoutSection, { type: "EDITORIAL" }>>) {
  const shell = buildSectionShellClasses(section.styling);
  const accent = theme?.accentColor ?? "#0071E3";
  const side = section.data.mediaSide ?? "left";
  const img =
    section.data.mediaUrl ||
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80";

  return (
    <section
      className={`${shell.className} ${className}`}
      style={shell.style}
      data-section-type="EDITORIAL"
      data-section-id={section.id}
    >
      <div
        className={`${buildWidthFrameClass(section.widthPreset)} grid items-center gap-6 lg:grid-cols-2`}
      >
        <div className={side === "right" ? "lg:order-2" : ""}>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img} alt="" className="h-full w-full object-cover" />
          </div>
        </div>
        <div className={side === "right" ? "lg:order-1" : ""}>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {section.data.title}
          </h2>
          <p
            className={`mt-3 text-sm leading-relaxed sm:text-base ${mutedTextClass(section.styling.textTone, section.styling.bgPreset)}`}
          >
            {section.data.body}
          </p>
          {section.data.ctaText ? (
            <span
              className="mt-5 inline-flex rounded-full px-5 py-2.5 text-xs font-bold text-white"
              style={{ backgroundColor: accent }}
            >
              {section.data.ctaText}
            </span>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function ReviewsRenderer({
  section,
  className = "",
}: SectionRendererProps<Extract<LayoutSection, { type: "REVIEWS" }>>) {
  const shell = buildSectionShellClasses(section.styling);
  const demos = [
    {
      name: "Minh Anh",
      text: "Giao nhanh, đóng gói cẩn thận. Sẽ ủng hộ tiếp!",
    },
    {
      name: "Hoàng Long",
      text: "Tư vấn Zalo nhiệt tình, sản phẩm đúng mô tả.",
    },
    {
      name: "Thu Hà",
      text: "Giá tốt hơn shopee, chất lượng ổn trong tầm giá.",
    },
  ];

  return (
    <section
      className={`${shell.className} ${className}`}
      style={shell.style}
      data-section-type="REVIEWS"
      data-section-id={section.id}
    >
      <div className={buildWidthFrameClass(section.widthPreset)}>
        <div className="mb-5 text-center">
          <h2 className="text-xl font-bold sm:text-2xl">{section.data.title}</h2>
          {section.data.subtitle ? (
            <p className="mt-1 text-sm opacity-70">{section.data.subtitle}</p>
          ) : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {demos.map((r) => (
            <article
              key={r.name}
              className="rounded-2xl border border-current/10 bg-black/[0.02] p-4 dark:bg-white/[0.04]"
            >
              <div className="flex text-amber-400" aria-hidden>
                {"★★★★★".split("").map((s, i) => (
                  <span key={i} className="text-xs">
                    {s}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-sm leading-relaxed opacity-80">
                “{r.text}”
              </p>
              <p className="mt-3 text-xs font-bold">{r.name}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ImageBannerRenderer({
  section,
  className = "",
}: SectionRendererProps<Extract<LayoutSection, { type: "IMAGE_BANNER" }>>) {
  const shell = buildSectionShellClasses(section.styling);
  const h = HEIGHT_CLASS[section.data.height ?? "md"];
  const fit = section.data.objectFit ?? "cover";

  return (
    <section
      className={`${shell.className} ${className}`}
      style={shell.style}
      data-section-type="IMAGE_BANNER"
      data-section-id={section.id}
    >
      <div className={buildWidthFrameClass(section.widthPreset)}>
        <div
          className={`group relative w-full overflow-hidden rounded-xl ${h}`}
        >
          {section.data.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={section.data.imageUrl}
              alt={section.data.alt || ""}
              className={`canvas-img-zoom absolute inset-0 h-full w-full ${
                fit === "contain" ? "object-contain" : "object-cover"
              }`}
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gray-100 text-xs text-gray-400">
              Chưa có ảnh — dán URL trong Properties
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function VideoBlockRenderer({
  section,
  className = "",
}: SectionRendererProps<Extract<LayoutSection, { type: "VIDEO_BLOCK" }>>) {
  const shell = buildSectionShellClasses(section.styling);
  const embed = youtubeEmbed(section.data.videoUrl);

  return (
    <section
      className={`${shell.className} ${className}`}
      style={shell.style}
      data-section-type="VIDEO_BLOCK"
      data-section-id={section.id}
    >
      <div className={buildWidthFrameClass(section.widthPreset)}>
        {section.data.title ? (
          <h2 className="mb-4 text-lg font-bold sm:text-xl">
            {section.data.title}
          </h2>
        ) : null}
        <div className="relative aspect-video overflow-hidden rounded-2xl bg-black/90">
          {embed ? (
            <iframe
              title={section.data.title || "Video"}
              src={embed}
              className="absolute inset-0 h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-white/70">
              <span className="text-3xl">▶</span>
              <p className="text-sm font-semibold">Video preview</p>
              <p className="max-w-sm break-all text-[11px] opacity-60">
                {section.data.videoUrl || "Dán URL YouTube trong Properties"}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function TextBlockRenderer({
  section,
  className = "",
  inlineEdit,
  onPatchData,
}: SectionRendererProps<Extract<LayoutSection, { type: "TEXT_BLOCK" }>> &
  InlinePatch) {
  const shell = buildSectionShellClasses(section.styling);
  const align =
    section.data.align === "right"
      ? "text-right"
      : section.data.align === "left"
        ? "text-left"
        : "text-center";
  const titleSize =
    section.data.size === "lg"
      ? "text-3xl sm:text-4xl"
      : section.data.size === "sm"
        ? "text-xl sm:text-2xl"
        : "text-2xl sm:text-3xl";
  const canEdit = Boolean(inlineEdit && onPatchData && !section.editorLocked);
  const bodyCls = `mx-auto mt-3 max-w-2xl text-sm leading-relaxed sm:text-base ${mutedTextClass(section.styling.textTone, section.styling.bgPreset)}`;

  return (
    <section
      className={`${shell.className} ${className}`}
      style={shell.style}
      data-section-type="TEXT_BLOCK"
      data-section-id={section.id}
    >
      <div className={`${buildWidthFrameClass(section.widthPreset)} ${align}`}>
        {canEdit ? (
          <InlineEditable
            as="p"
            value={section.data.eyebrow ?? ""}
            onChange={(eyebrow) => onPatchData!({ eyebrow })}
            className="text-[11px] font-bold uppercase tracking-[0.2em] opacity-50"
            placeholder="Eyebrow…"
          />
        ) : section.data.eyebrow ? (
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] opacity-50">
            {section.data.eyebrow}
          </p>
        ) : null}
        {canEdit ? (
          <InlineEditable
            as="h2"
            value={section.data.title}
            onChange={(title) => onPatchData!({ title })}
            className={`mt-2 font-bold tracking-tight ${titleSize}`}
            placeholder="Tiêu đề…"
          />
        ) : (
          <h2 className={`mt-2 font-bold tracking-tight ${titleSize}`}>
            {section.data.title}
          </h2>
        )}
        {canEdit ? (
          <InlineEditable
            as="p"
            value={section.data.body}
            onChange={(body) => onPatchData!({ body })}
            className={bodyCls}
            placeholder="Nội dung…"
            multiline
          />
        ) : (
          <p className={bodyCls}>{section.data.body}</p>
        )}
      </div>
    </section>
  );
}

export function CtaBannerRenderer({
  section,
  theme,
  className = "",
  inlineEdit,
  onPatchData,
}: SectionRendererProps<Extract<LayoutSection, { type: "CTA_BANNER" }>> &
  InlinePatch) {
  const shell = buildSectionShellClasses(section.styling);
  const accent = theme?.accentColor ?? "#0071E3";
  const canEdit = Boolean(inlineEdit && onPatchData && !section.editorLocked);

  return (
    <section
      className={`${shell.className} ${className}`}
      style={shell.style}
      data-section-type="CTA_BANNER"
      data-section-id={section.id}
    >
      <div
        className={`${buildWidthFrameClass(section.widthPreset)} flex flex-col items-center gap-4 py-2 text-center sm:flex-row sm:justify-between sm:text-left`}
      >
        <div className="min-w-0 flex-1">
          {canEdit ? (
            <InlineEditable
              as="h2"
              value={section.data.title}
              onChange={(title) => onPatchData!({ title })}
              className="text-xl font-black sm:text-2xl"
              placeholder="Tiêu đề CTA…"
            />
          ) : (
            <h2 className="text-xl font-black sm:text-2xl">
              {section.data.title}
            </h2>
          )}
          {canEdit ? (
            <InlineEditable
              as="p"
              value={section.data.subtitle ?? ""}
              onChange={(subtitle) => onPatchData!({ subtitle })}
              className="mt-1 text-sm opacity-80"
              placeholder="Phụ đề…"
            />
          ) : section.data.subtitle ? (
            <p className="mt-1 text-sm opacity-80">{section.data.subtitle}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {canEdit ? (
            <InlineEditable
              as="span"
              value={section.data.ctaText}
              onChange={(ctaText) => onPatchData!({ ctaText })}
              className="inline-flex rounded-full px-5 py-2.5 text-xs font-bold text-white shadow-sm"
              style={{ backgroundColor: accent }}
              placeholder="Nút chính…"
            />
          ) : (
            <span
              className="inline-flex rounded-full px-5 py-2.5 text-xs font-bold text-white shadow-sm"
              style={{ backgroundColor: accent }}
            >
              {section.data.ctaText || "CTA"}
            </span>
          )}
          {canEdit ? (
            <InlineEditable
              as="span"
              value={section.data.secondaryText ?? ""}
              onChange={(secondaryText) => onPatchData!({ secondaryText })}
              className="inline-flex rounded-full border border-current/25 px-5 py-2.5 text-xs font-bold"
              placeholder="Nút phụ…"
            />
          ) : section.data.secondaryText ? (
            <span className="inline-flex rounded-full border border-current/25 px-5 py-2.5 text-xs font-bold">
              {section.data.secondaryText}
            </span>
          ) : null}
        </div>
      </div>
    </section>
  );
}

/** Empty state chuẩn cho block thiếu data */
export function BlockEmptyState({
  title,
  hint,
}: {
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50/80 px-4 py-10 text-center dark:border-gray-600 dark:bg-gray-900/40">
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
        {title}
      </p>
      {hint ? (
        <p className="max-w-xs text-[11px] leading-relaxed text-gray-400">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function FeatureGridRenderer({
  section,
  theme,
  className = "",
}: SectionRendererProps<Extract<LayoutSection, { type: "FEATURE_GRID" }>>) {
  const shell = buildSectionShellClasses(section.styling);
  const accent = theme?.accentColor ?? "#0071E3";
  const cols = section.data.columns ?? 4;
  const grid =
    cols === 2
      ? "sm:grid-cols-2"
      : cols === 3
        ? "sm:grid-cols-3"
        : "sm:grid-cols-2 lg:grid-cols-4";

  return (
    <section
      className={`${shell.className} ${className}`}
      style={shell.style}
      data-section-type="FEATURE_GRID"
      data-section-id={section.id}
    >
      <div className={buildWidthFrameClass(section.widthPreset)}>
        {(section.data.title || section.data.subtitle) && (
          <div className="mb-6 text-center">
            {section.data.title ? (
              <h2 className="text-xl font-bold sm:text-2xl">
                {section.data.title}
              </h2>
            ) : null}
            {section.data.subtitle ? (
              <p className="mt-1 text-sm opacity-70">{section.data.subtitle}</p>
            ) : null}
          </div>
        )}
        <div className={`grid grid-cols-1 gap-4 ${grid}`}>
          {section.data.items.map((item, i) => (
            <div
              key={item.id}
              className={`canvas-hover-lift rounded-2xl border border-current/8 bg-black/[0.02] p-5 dark:bg-white/[0.04] ${staggerChildClass(i)}`}
            >
              <span
                className="flex h-11 w-11 items-center justify-center rounded-xl text-lg"
                style={{
                  backgroundColor: `color-mix(in srgb, ${accent} 12%, transparent)`,
                }}
              >
                {ICON_GLYPH[item.icon ?? "star"] ?? "★"}
              </span>
              <h3 className="mt-3 text-sm font-bold">{item.title}</h3>
              {item.body ? (
                <p className="mt-1 text-xs leading-relaxed opacity-70">
                  {item.body}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function StatsRenderer({
  section,
  theme,
  className = "",
}: SectionRendererProps<Extract<LayoutSection, { type: "STATS" }>>) {
  const shell = buildSectionShellClasses(section.styling);
  const accent = theme?.accentColor ?? "#0071E3";

  return (
    <section
      className={`${shell.className} ${className}`}
      style={shell.style}
      data-section-type="STATS"
      data-section-id={section.id}
    >
      <div className={buildWidthFrameClass(section.widthPreset)}>
        {section.data.title ? (
          <h2 className="mb-6 text-center text-xl font-bold">
            {section.data.title}
          </h2>
        ) : null}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {section.data.items.map((item, i) => (
            <div
              key={item.id}
              className={`text-center ${staggerChildClass(i)}`}
            >
              <p
                className="text-2xl font-black tracking-tight sm:text-3xl"
                style={{ color: accent }}
              >
                {item.value}
              </p>
              <p className="mt-1 text-xs font-semibold opacity-70">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function GalleryRenderer({
  section,
  className = "",
}: SectionRendererProps<Extract<LayoutSection, { type: "GALLERY" }>>) {
  const shell = buildSectionShellClasses(section.styling);
  const cols = section.data.columns ?? 3;
  const grid =
    cols === 2
      ? "sm:grid-cols-2"
      : cols === 4
        ? "grid-cols-2 sm:grid-cols-4"
        : "grid-cols-2 sm:grid-cols-3";

  return (
    <section
      className={`${shell.className} ${className}`}
      style={shell.style}
      data-section-type="GALLERY"
      data-section-id={section.id}
    >
      <div className={buildWidthFrameClass(section.widthPreset)}>
        {section.data.title ? (
          <h2 className="mb-4 text-lg font-bold sm:text-xl">
            {section.data.title}
          </h2>
        ) : null}
        <div className={`grid gap-2 sm:gap-3 ${grid}`}>
          {section.data.images.map((img, i) => (
            <div
              key={img.id}
              className={`group relative aspect-square overflow-hidden rounded-xl bg-gray-100 ${staggerChildClass(i)}`}
            >
              {img.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={img.url}
                  alt={img.alt || ""}
                  className="canvas-img-zoom h-full w-full object-cover"
                />
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LogoCloudRenderer({
  section,
  className = "",
}: SectionRendererProps<Extract<LayoutSection, { type: "LOGO_CLOUD" }>>) {
  const shell = buildSectionShellClasses(section.styling);

  return (
    <section
      className={`${shell.className} ${className}`}
      style={shell.style}
      data-section-type="LOGO_CLOUD"
      data-section-id={section.id}
    >
      <div className={buildWidthFrameClass(section.widthPreset)}>
        {section.data.title ? (
          <p className="mb-4 text-center text-xs font-bold uppercase tracking-wider opacity-50">
            {section.data.title}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
          {section.data.logos.map((logo) => (
            <div
              key={logo.id}
              className="flex h-12 min-w-[88px] items-center justify-center rounded-lg bg-black/[0.04] px-4 text-xs font-bold opacity-60 dark:bg-white/[0.06]"
            >
              {logo.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logo.imageUrl}
                  alt={logo.name}
                  className="max-h-8 max-w-[100px] object-contain"
                />
              ) : (
                logo.name
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FaqRenderer({
  section,
  className = "",
}: SectionRendererProps<Extract<LayoutSection, { type: "FAQ" }>>) {
  const shell = buildSectionShellClasses(section.styling);

  return (
    <section
      className={`${shell.className} ${className}`}
      style={shell.style}
      data-section-type="FAQ"
      data-section-id={section.id}
    >
      <div className={buildWidthFrameClass(section.widthPreset)}>
        {(section.data.title || section.data.subtitle) && (
          <div className="mb-5 text-center">
            {section.data.title ? (
              <h2 className="text-xl font-bold sm:text-2xl">
                {section.data.title}
              </h2>
            ) : null}
            {section.data.subtitle ? (
              <p className="mt-1 text-sm opacity-70">{section.data.subtitle}</p>
            ) : null}
          </div>
        )}
        <div className="space-y-2">
          {section.data.items.map((item, i) => (
            <details
              key={item.id}
              open={i === 0}
              className="group rounded-xl border border-current/10 bg-black/[0.02] open:bg-black/[0.04] dark:bg-white/[0.03]"
            >
              <summary className="cursor-pointer list-none px-4 py-3 text-sm font-bold marker:content-none">
                <span className="flex items-center justify-between gap-3">
                  {item.question}
                  <span className="text-xs opacity-40 transition group-open:rotate-180">
                    ▾
                  </span>
                </span>
              </summary>
              <p className="border-t border-current/8 px-4 py-3 text-sm leading-relaxed opacity-75">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function NewsletterRenderer({
  section,
  theme,
  className = "",
}: SectionRendererProps<Extract<LayoutSection, { type: "NEWSLETTER" }>>) {
  const shell = buildSectionShellClasses(section.styling);
  const accent = theme?.accentColor ?? "#0071E3";

  return (
    <section
      className={`${shell.className} ${className}`}
      style={shell.style}
      data-section-type="NEWSLETTER"
      data-section-id={section.id}
    >
      <div
        className={`${buildWidthFrameClass(section.widthPreset)} mx-auto max-w-xl text-center`}
      >
        <h2 className="text-xl font-bold sm:text-2xl">{section.data.title}</h2>
        {section.data.subtitle ? (
          <p className="mt-2 text-sm opacity-70">{section.data.subtitle}</p>
        ) : null}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <div className="flex h-11 flex-1 items-center rounded-full border border-current/15 bg-white/80 px-4 text-left text-xs text-gray-400 dark:bg-black/20">
            {section.data.placeholder || "Email / SĐT…"}
          </div>
          <span
            className="inline-flex h-11 items-center justify-center rounded-full px-6 text-xs font-bold text-white"
            style={{ backgroundColor: accent }}
          >
            {section.data.buttonText || "Đăng ký"}
          </span>
        </div>
      </div>
    </section>
  );
}

export function SpacerRenderer({
  section,
  className = "",
}: SectionRendererProps<Extract<LayoutSection, { type: "SPACER" }>>) {
  return (
    <div
      className={`${SPACER_H[section.data.size] ?? "h-12"} w-full ${className}`}
      data-section-type="SPACER"
      data-section-id={section.id}
      aria-hidden
    >
      <div className="flex h-full items-center justify-center border border-dashed border-transparent group-hover/block:border-gray-300">
        <span className="hidden text-[10px] font-medium uppercase tracking-wider text-gray-300 group-hover/block:inline">
          Spacer · {section.data.size}
        </span>
      </div>
    </div>
  );
}

export function DividerRenderer({
  section,
  className = "",
}: SectionRendererProps<Extract<LayoutSection, { type: "DIVIDER" }>>) {
  const shell = buildSectionShellClasses(section.styling);
  const style = section.data.style ?? "line";

  return (
    <section
      className={`${shell.className} ${className}`}
      style={shell.style}
      data-section-type="DIVIDER"
      data-section-id={section.id}
    >
      <div
        className={`${buildWidthFrameClass(section.widthPreset)} flex items-center gap-4`}
      >
        <div
          className={`h-px flex-1 ${
            style === "dashed"
              ? "border-t border-dashed border-current/25"
              : style === "dots"
                ? "border-t border-dotted border-current/30"
                : "bg-current/15"
          }`}
        />
        {section.data.label ? (
          <span className="text-[11px] font-semibold uppercase tracking-wider opacity-50">
            {section.data.label}
          </span>
        ) : null}
        <div
          className={`h-px flex-1 ${
            style === "dashed"
              ? "border-t border-dashed border-current/25"
              : style === "dots"
                ? "border-t border-dotted border-current/30"
                : "bg-current/15"
          }`}
        />
      </div>
    </section>
  );
}

export function ProductCarouselRenderer({
  section,
  theme,
  products,
  getProductHref,
  onProductClick,
  className = "",
}: SectionRendererProps<Extract<LayoutSection, { type: "PRODUCT_CAROUSEL" }>> & {
  products?: ShopProduct[];
  getProductHref?: (productId: number) => string;
  onProductClick?: (productId: number) => void;
  theme?: LayoutRenderTheme;
}) {
  const shell = buildSectionShellClasses(section.styling);
  const maxItems = section.data.maxItems ?? 10;

  return (
    <section
      className={`${shell.className} ${className}`}
      style={shell.style}
      data-section-type="PRODUCT_CAROUSEL"
      data-section-id={section.id}
    >
      <div className={buildWidthFrameClass(section.widthPreset)}>
        {(section.data.title || section.data.subtitle) && (
          <div className="mb-4">
            {section.data.title ? (
              <h2 className="text-lg font-bold sm:text-xl">
                {section.data.title}
              </h2>
            ) : null}
            {section.data.subtitle ? (
              <p className="mt-0.5 text-sm opacity-70">{section.data.subtitle}</p>
            ) : null}
          </div>
        )}
        <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:thin]">
          <div className="min-w-0 flex-1">
            <GridRenderer
              section={{
                id: section.id,
                type: "HOT_PRODUCTS",
                enabled: true,
                widthPreset: "FULL_BLEED",
                styling: {
                  ...section.styling,
                  bgPreset: "inherit",
                  paddingY: "none",
                  paddingX: "none",
                  elevation: "none",
                },
                data: {
                  title: "",
                  productIds: section.data.productIds,
                  maxItems,
                },
              }}
              theme={theme}
              products={products}
              maxItems={maxItems}
              getProductHref={getProductHref}
              onProductClick={onProductClick}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
