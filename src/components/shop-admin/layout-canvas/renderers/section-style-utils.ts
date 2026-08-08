/**
 * Map LayoutSection.styling + widthPreset → Tailwind / utility classes.
 * Single source for all section renderers (preview + production).
 */

import {
  widthPresetContentLayoutClass,
  widthPresetToClass,
} from "@/lib/shop-layout-canvas";
import type {
  LayoutBgPreset,
  LayoutBlurPreset,
  LayoutBorderPreset,
  LayoutHoverPreset,
  LayoutRadiusPreset,
  LayoutSection,
  LayoutSectionStyling,
  LayoutShadowPreset,
  LayoutSpacingPreset,
  LayoutTextTone,
  LayoutWidthPreset,
} from "@/types/shop-layout-canvas";
import type { CSSProperties } from "react";

export function spacingYClass(preset: LayoutSpacingPreset): string {
  switch (preset) {
    case "none":
      return "py-0";
    case "compact":
      return "py-3 sm:py-4";
    case "spacious":
      return "py-10 sm:py-14";
    case "hero":
      return "py-14 sm:py-20 md:py-24";
    case "normal":
    default:
      return "py-6 sm:py-8";
  }
}

export function spacingXClass(preset: LayoutSpacingPreset): string {
  switch (preset) {
    case "none":
      return "px-0";
    case "compact":
      return "px-3 sm:px-4";
    case "spacious":
      return "px-5 sm:px-8";
    case "hero":
      return "px-5 sm:px-8";
    case "normal":
    default:
      return "px-4 sm:px-6";
  }
}

export function radiusClass(preset: LayoutRadiusPreset): string {
  switch (preset) {
    case "none":
      return "rounded-none";
    case "md":
      return "rounded-md";
    case "2xl":
      return "rounded-2xl";
    case "pill":
      return "rounded-full";
    case "xl":
    default:
      return "rounded-xl";
  }
}

/** Resolve shadow: prefer `shadow`, fallback `elevation` */
export function resolveShadow(
  styling: LayoutSectionStyling,
): LayoutShadowPreset {
  return styling.shadow ?? styling.elevation ?? "none";
}

export function shadowClass(preset: LayoutShadowPreset | undefined): string {
  switch (preset) {
    case "sm":
      return "shadow-sm shadow-black/5";
    case "md":
      return "shadow-md shadow-black/8";
    case "lg":
      return "shadow-lg shadow-black/10";
    case "xl":
      return "shadow-xl shadow-black/12";
    case "glow":
      return "canvas-shadow-glow";
    case "inner":
      return "shadow-inner shadow-black/10";
    case "none":
    default:
      return "";
  }
}

/** @deprecated use shadowClass(resolveShadow(styling)) */
export function elevationClass(
  elevation: LayoutSectionStyling["elevation"],
): string {
  return shadowClass((elevation as LayoutShadowPreset) ?? "none");
}

export function blurClass(preset: LayoutBlurPreset | undefined): string {
  switch (preset) {
    case "sm":
      return "canvas-blur-sm";
    case "md":
      return "canvas-blur-md";
    case "lg":
      return "canvas-blur-lg";
    case "glass":
      return "canvas-blur-glass";
    case "frosted":
      return "canvas-blur-frosted";
    case "none":
    default:
      return "";
  }
}

export function hoverClass(preset: LayoutHoverPreset | undefined): string {
  switch (preset) {
    case "lift":
      return "canvas-hover-lift";
    case "scale":
      return "canvas-hover-scale";
    case "glow":
      return "canvas-hover-glow";
    case "brightness":
      return "canvas-hover-brightness";
    case "border-accent":
      return "canvas-hover-border";
    case "none":
    default:
      return "";
  }
}

export function borderClass(preset: LayoutBorderPreset | undefined): string {
  switch (preset) {
    case "subtle":
      return "border border-black/[0.06] dark:border-white/10";
    case "solid":
      return "border border-black/15 dark:border-white/20";
    case "dashed":
      return "border border-dashed border-black/20 dark:border-white/25";
    case "accent":
      return "border border-[color-mix(in_srgb,var(--store-accent,#3858e9)_45%,transparent)]";
    case "none":
    default:
      return "";
  }
}

/** Background + text color pair from brand presets */
export function bgPresetClasses(preset: LayoutBgPreset): {
  outer: string;
  text: string;
  style?: CSSProperties;
} {
  switch (preset) {
    case "surface":
      return { outer: "bg-white", text: "text-gray-900" };
    case "muted":
      return { outer: "bg-gray-100", text: "text-gray-900" };
    case "primary":
      return { outer: "bg-[#1D1D1F]", text: "text-white" };
    case "accent":
      return { outer: "bg-[#0071E3]", text: "text-white" };
    case "dark":
      return { outer: "bg-stone-950", text: "text-white" };
    case "gradient-amber":
      return {
        outer: "bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500",
        text: "text-white",
      };
    case "gradient-rose":
      return {
        outer: "bg-gradient-to-r from-rose-500 via-pink-600 to-fuchsia-600",
        text: "text-white",
      };
    case "gradient-emerald":
      return {
        outer: "bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600",
        text: "text-white",
      };
    case "gradient-brand":
      return {
        outer: "bg-gradient-to-br from-stone-900 via-stone-800 to-blue-900",
        text: "text-white",
      };
    case "custom":
      return { outer: "", text: "text-gray-900" };
    case "inherit":
    default:
      return { outer: "bg-transparent", text: "text-gray-900" };
  }
}

export function textToneClass(
  tone: LayoutTextTone,
  bgPreset: LayoutBgPreset,
): string {
  if (tone === "auto") {
    return bgPresetClasses(bgPreset).text;
  }
  switch (tone) {
    case "dark":
      return "text-gray-900";
    case "light":
      return "text-white";
    case "muted":
      return "text-gray-500";
    case "brand":
      return "text-[#0071E3]";
    default:
      return "text-gray-900";
  }
}

export function mutedTextClass(
  tone: LayoutTextTone,
  bgPreset: LayoutBgPreset,
): string {
  const base = textToneClass(tone, bgPreset);
  if (base.includes("white") || tone === "light") return "text-white/75";
  if (tone === "brand") return "text-[#0071E3]/80";
  return "text-gray-500";
}

/**
 * Outer section shell: bg + padding + radius + shadow + blur + hover + border.
 */
export function buildSectionShellClasses(
  styling: LayoutSectionStyling,
  options?: { flush?: boolean; omitRelative?: boolean },
): { className: string; style?: CSSProperties } {
  const bg = bgPresetClasses(styling.bgPreset);
  let style: CSSProperties | undefined =
    styling.bgPreset === "custom" && styling.customBg
      ? { background: styling.customBg }
      : undefined;

  const hide = [
    styling.hideOnMobile ? "max-md:hidden" : "",
    styling.hideOnDesktop ? "md:hidden" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const shadow = resolveShadow(styling);
  const blur = styling.blur ?? "none";
  const hover = styling.hover ?? "none";
  const border = styling.border ?? "none";
  const radius = styling.radius ?? "xl";

  // Glass/frosted cần nền bán trong suốt nếu inherit
  if (
    (blur === "glass" || blur === "frosted") &&
    styling.bgPreset === "inherit" &&
    !style
  ) {
    style = {
      backgroundColor: "rgba(255,255,255,0.55)",
    };
  }

  const className = [
    options?.omitRelative ? "w-full" : "relative w-full",
    options?.flush ? "" : spacingYClass(styling.paddingY),
    options?.flush ? "" : spacingXClass(styling.paddingX),
    bg.outer,
    textToneClass(styling.textTone, styling.bgPreset),
    radiusClass(radius),
    shadowClass(shadow),
    blurClass(blur),
    hoverClass(hover),
    borderClass(border),
    // isolation giúp blur/shadow không “chảy” sang section khác
    blur !== "none" || shadow === "glow" ? "isolate" : "",
    hide,
  ]
    .filter(Boolean)
    .join(" ");

  return { className, style };
}

/**
 * Khung width section — CÙNG preset → CÙNG max-width + gutter (thẳng hàng).
 */
export function buildWidthFrameClass(widthPreset: LayoutWidthPreset): string {
  return widthPresetToClass(widthPreset);
}

export function buildContentLayoutClass(widthPreset: LayoutWidthPreset): string {
  return widthPresetContentLayoutClass(widthPreset);
}

export function productGridClass(
  widthPreset: LayoutWidthPreset,
  density: "cozy" | "comfortable" | "dense" | "airy",
): string {
  const gap =
    density === "dense"
      ? "gap-2"
      : density === "airy"
        ? "gap-5 sm:gap-6"
        : density === "cozy"
          ? "gap-3"
          : "gap-4";

  if (widthPreset === "GRID_2" || widthPreset === "SPLIT_50_50") {
    return `grid w-full grid-cols-2 ${gap}`;
  }
  if (widthPreset === "GRID_4") {
    return `grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 ${gap}`;
  }
  if (
    widthPreset === "GRID_3" ||
    widthPreset === "BENTO_FEATURE" ||
    widthPreset === "SPLIT_70_30" ||
    widthPreset === "SPLIT_30_70"
  ) {
    return `grid w-full grid-cols-2 md:grid-cols-3 ${gap}`;
  }
  if (widthPreset === "NARROW") {
    return `grid w-full grid-cols-2 ${gap}`;
  }
  return `grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 ${gap}`;
}

export type LayoutRenderTheme = {
  primaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  shopName?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  contactPhone?: string;
  contactZalo?: string;
  contactFacebook?: string;
  contactWebsite?: string;
  contactAddress?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  ctaText?: string;
  announcement?: string;
};

export type SectionRendererProps<T extends LayoutSection = LayoutSection> = {
  section: T;
  theme?: LayoutRenderTheme;
  className?: string;
};
