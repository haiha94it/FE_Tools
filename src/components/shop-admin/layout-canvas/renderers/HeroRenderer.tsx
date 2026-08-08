/**
 * HeroRenderer — large hero with title, subtitle, CTA, optional media/bg presets.
 *
 * Width preset (Boxed model) bọc CẢ block visual (ảnh + nền + content):
 * - FULL_BLEED: tràn full viewport
 * - CONTAINER / GRID_* / SPLIT_*: max-w-7xl + gutter (cùng Boxed)
 * - NARROW: max-w-3xl + cùng gutter
 */

"use client";

import InlineEditable from "@/components/shop-admin/layout-canvas/InlineEditable";
import type {
  LayoutSection,
  LayoutSectionStyling,
  LayoutWidthPreset,
} from "@/types/shop-layout-canvas";
import {
  bgPresetClasses,
  buildWidthFrameClass,
  radiusClass,
  spacingYClass,
  textToneClass,
  type SectionRendererProps,
} from "./section-style-utils";

const FALLBACK_HERO_IMG =
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&auto=format&fit=crop&q=80";

function isFullBleedWidth(preset: LayoutWidthPreset): boolean {
  return preset === "FULL_BLEED";
}

export default function HeroRenderer({
  section,
  theme,
  className = "",
  inlineEdit = false,
  onPatchData,
}: SectionRendererProps<Extract<LayoutSection, { type: "HERO" }>> & {
  inlineEdit?: boolean;
  onPatchData?: (partial: Record<string, unknown>) => void;
}) {
  const { styling, widthPreset, data } = section;
  const accent = theme?.accentColor ?? "#0071E3";
  const variant = data.heroVariant ?? "banner";
  const fullBleed = isFullBleedWidth(widthPreset);

  const mediaUrl =
    data.mediaType === "none"
      ? null
      : data.mediaUrl?.trim() ||
        theme?.coverImageUrl?.trim() ||
        FALLBACK_HERO_IMG;

  const title =
    data.title?.trim() || theme?.heroTitle?.trim() || "Hero title";
  const subtitle =
    data.subtitle?.trim() || theme?.heroSubtitle?.trim() || "";
  const ctaText =
    data.ctaText?.trim() || theme?.ctaText?.trim() || "Xem sản phẩm";

  const isSplit = variant === "split";
  const isBento = variant === "bento";
  const isMinimal = variant === "minimal-focus";
  const isFullViewport = variant === "full-viewport";

  const needsOverlay =
    styling.bgPreset === "inherit" || Boolean(mediaUrl && !isSplit);

  const bg = bgPresetClasses(styling.bgPreset);
  const customBgStyle =
    styling.bgPreset === "custom" && styling.customBg
      ? { background: styling.customBg }
      : undefined;

  const hide = [
    styling.hideOnMobile ? "max-md:hidden" : "",
    styling.hideOnDesktop ? "md:hidden" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const minH = isFullViewport
    ? "min-h-[70vh]"
    : "min-h-[280px] sm:min-h-[340px]";

  const padY =
    styling.paddingY === "none"
      ? "py-10 sm:py-14"
      : styling.paddingY === "compact"
        ? "py-8 sm:py-10"
        : styling.paddingY === "spacious" || styling.paddingY === "hero"
          ? "py-16 sm:py-24"
          : "py-12 sm:py-16";

  const round = radiusClass(styling.radius);

  /** Khối visual hero (ảnh + nền + copy) — width do outer frame quyết định */
  const visual = (
    <div
      className={`relative overflow-hidden ${minH} ${
        fullBleed ? "" : round
      } ${mediaUrl && !isSplit ? "" : bg.outer} ${textToneClass(styling.textTone, styling.bgPreset)}`}
      style={customBgStyle}
    >
      {/* Media nền — fill 100% khối visual (không tràn ngoài Boxed) */}
      {mediaUrl && !isSplit ? (
        <div className="absolute inset-0" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mediaUrl}
            alt=""
            className="h-full w-full object-cover"
          />
          {needsOverlay ? (
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-black/25" />
          ) : (
            <div className="absolute inset-0 bg-black/25" />
          )}
        </div>
      ) : null}

      {/* Full bleed: gutter trên content. Boxed: frame đã có gutter; pad nhẹ trong card */}
      <div
        className={`relative w-full ${padY} ${
          fullBleed ? "px-4 sm:px-6 lg:px-8" : "px-4 sm:px-6"
        }`}
      >
        {isSplit ? (
          <div className="grid items-center gap-8 md:grid-cols-2">
            <HeroCopy
              title={title}
              subtitle={subtitle}
              ctaText={ctaText}
              ctaHref={data.ctaHref}
              styling={styling}
              accent={accent}
              isMinimal={isMinimal}
              inlineEdit={inlineEdit && !section.editorLocked}
              onPatchData={onPatchData}
            />
            {mediaUrl ? (
              <div
                className={`relative aspect-[4/3] overflow-hidden ${round}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={mediaUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div
                className={`aspect-[4/3] bg-gradient-to-br from-stone-200 to-stone-400 ${round}`}
              />
            )}
          </div>
        ) : isBento ? (
          <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
            <HeroCopy
              title={title}
              subtitle={subtitle}
              ctaText={ctaText}
              ctaHref={data.ctaHref}
              styling={styling}
              accent={accent}
              isMinimal={isMinimal}
              forceLight={Boolean(mediaUrl)}
              inlineEdit={inlineEdit && !section.editorLocked}
              onPatchData={onPatchData}
            />
            <div className="hidden grid-cols-2 gap-3 md:grid">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className={`aspect-square bg-white/10 backdrop-blur-sm ring-1 ring-white/15 ${radiusClass("xl")}`}
                />
              ))}
            </div>
          </div>
        ) : (
          <div
            className={isMinimal ? "mx-auto max-w-xl text-center" : "max-w-xl"}
          >
            <HeroCopy
              title={title}
              subtitle={subtitle}
              ctaText={ctaText}
              ctaHref={data.ctaHref}
              styling={styling}
              accent={accent}
              isMinimal={isMinimal}
              forceLight={Boolean(mediaUrl)}
              centered={isMinimal}
              inlineEdit={inlineEdit && !section.editorLocked}
              onPatchData={onPatchData}
            />
          </div>
        )}
      </div>
    </div>
  );

  // ── FULL_BLEED: visual tràn 100% section ──
  if (fullBleed) {
    return (
      <section
        className={`relative w-full overflow-hidden ${hide} ${className}`}
        data-section-type="HERO"
        data-section-id={section.id}
        data-width-preset={widthPreset}
      >
        {visual}
      </section>
    );
  }

  // ── BOXED / NARROW / GRID_*: visual nằm trong khung max-w + gutter ──
  // Outer chỉ spacing dọc — KHÔNG full-bleed bg
  return (
    <section
      className={`relative w-full ${spacingYClass(styling.paddingY === "none" ? "normal" : styling.paddingY)} ${hide} ${className}`}
      data-section-type="HERO"
      data-section-id={section.id}
      data-width-preset={widthPreset}
    >
      <div className={`${buildWidthFrameClass(widthPreset)} w-full`}>
        {/*
          Frame đã có px gutter. Visual fill 100% content box bên trong gutter
          → mép hero thẳng với Header/Grid cùng Boxed model.
        */}
        <div className="-mx-0 w-full">{visual}</div>
      </div>
    </section>
  );
}

function HeroCopy({
  title,
  subtitle,
  ctaText,
  ctaHref,
  styling,
  accent,
  isMinimal,
  forceLight,
  centered,
  inlineEdit,
  onPatchData,
}: {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaHref?: string;
  styling: LayoutSectionStyling;
  accent: string;
  isMinimal?: boolean;
  forceLight?: boolean;
  centered?: boolean;
  inlineEdit?: boolean;
  onPatchData?: (partial: Record<string, unknown>) => void;
}) {
  const onImage = Boolean(forceLight);
  const hClass = onImage
    ? "text-white"
    : styling.textTone === "light" ||
        styling.bgPreset === "dark" ||
        styling.bgPreset === "primary" ||
        styling.bgPreset === "accent" ||
        styling.bgPreset.startsWith("gradient")
      ? "text-white"
      : "text-gray-900";
  const subClass = onImage
    ? "text-white/80"
    : hClass === "text-white"
      ? "text-white/75"
      : "text-gray-600";

  const titleCls = `font-black tracking-tight ${hClass} ${
    isMinimal
      ? "text-3xl sm:text-4xl"
      : "text-3xl leading-[1.1] sm:text-4xl md:text-5xl"
  }`;
  const subCls = `mt-3 max-w-lg text-sm leading-relaxed sm:text-base ${subClass}`;

  return (
    <div className={centered ? "flex flex-col items-center text-center" : ""}>
      <p
        className={`mb-3 inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
          onImage || hClass === "text-white"
            ? "bg-white/15 text-white ring-1 ring-white/20"
            : "bg-black/5 text-gray-700"
        }`}
      >
        New collection
      </p>
      {inlineEdit && onPatchData ? (
        <InlineEditable
          as="h1"
          value={title}
          onChange={(t) => onPatchData({ title: t })}
          className={titleCls}
          placeholder="Tiêu đề hero…"
        />
      ) : (
        <h1 className={titleCls}>{title}</h1>
      )}
      {inlineEdit && onPatchData ? (
        <InlineEditable
          as="p"
          value={subtitle}
          onChange={(s) => onPatchData({ subtitle: s })}
          className={subCls}
          placeholder="Phụ đề…"
          multiline
        />
      ) : subtitle ? (
        <p className={subCls}>{subtitle}</p>
      ) : null}
      {inlineEdit && onPatchData ? (
        <InlineEditable
          as="span"
          value={ctaText}
          onChange={(t) => onPatchData({ ctaText: t })}
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full px-6 text-sm font-bold text-white shadow-lg"
          style={{ background: accent }}
          placeholder="CTA…"
        />
      ) : ctaText ? (
        <a
          href={ctaHref || "#products"}
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full px-6 text-sm font-bold text-white no-underline shadow-lg transition hover:brightness-110"
          style={{ background: accent }}
        >
          {ctaText}
        </a>
      ) : null}
    </div>
  );
}
