/**
 * Merge desktop + mobile styling for device-aware preview / storefront.
 */

import type {
  LayoutSection,
  LayoutSectionStyling,
  LayoutWidthPreset,
} from "@/types/shop-layout-canvas";

export function resolveSectionForDevice(
  section: LayoutSection,
  device: "desktop" | "tablet" | "mobile",
): LayoutSection {
  if (device === "desktop" || device === "tablet") {
    return section;
  }

  const styling: LayoutSectionStyling = {
    ...section.styling,
    ...(section.stylingMobile ?? {}),
  };

  const widthPreset: LayoutWidthPreset =
    section.widthPresetMobile ??
    (section.widthPreset === "FULL_BLEED" ? "FULL_BLEED" : "CONTAINER");

  return {
    ...section,
    styling,
    widthPreset,
  } as LayoutSection;
}

export function isMobileDevicePreview(
  device: "desktop" | "tablet" | "mobile",
): boolean {
  return device === "mobile";
}
