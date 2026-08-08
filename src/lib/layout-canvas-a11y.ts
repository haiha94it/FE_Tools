/**
 * Accessibility checklist for layout canvas sections.
 */

import type { LayoutSection } from "@/types/shop-layout-canvas";

export type A11ySeverity = "error" | "warn" | "info";

export interface A11yIssue {
  id: string;
  sectionId: string;
  sectionLabel: string;
  severity: A11ySeverity;
  message: string;
  field?: string;
}

function labelOf(sec: LayoutSection): string {
  return sec.label?.trim() || sec.type.replace(/_/g, " ");
}

export function auditLayoutSections(sections: LayoutSection[]): A11yIssue[] {
  const issues: A11yIssue[] = [];

  for (const sec of sections) {
    if (!sec.enabled) continue;
    const base = {
      sectionId: sec.id,
      sectionLabel: labelOf(sec),
    };

    // Low contrast risk: light text on light bg
    if (
      sec.styling.textTone === "light" &&
      (sec.styling.bgPreset === "surface" ||
        sec.styling.bgPreset === "muted" ||
        sec.styling.bgPreset === "inherit")
    ) {
      issues.push({
        ...base,
        id: `${sec.id}-contrast`,
        severity: "warn",
        message: "Chữ sáng trên nền sáng — có thể kém contrast (WCAG).",
        field: "textTone",
      });
    }

    if (
      sec.styling.textTone === "dark" &&
      (sec.styling.bgPreset === "dark" ||
        sec.styling.bgPreset === "primary" ||
        sec.styling.bgPreset === "accent")
    ) {
      issues.push({
        ...base,
        id: `${sec.id}-contrast-dark`,
        severity: "warn",
        message: "Chữ tối trên nền tối — kiểm tra độ tương phản.",
        field: "textTone",
      });
    }

    if (sec.type === "IMAGE_BANNER") {
      if (!sec.data.imageUrl?.trim()) {
        issues.push({
          ...base,
          id: `${sec.id}-img-empty`,
          severity: "error",
          message: "Banner chưa có URL ảnh.",
          field: "imageUrl",
        });
      } else if (!sec.data.alt?.trim()) {
        issues.push({
          ...base,
          id: `${sec.id}-img-alt`,
          severity: "warn",
          message: "Thiếu alt text cho ảnh banner.",
          field: "alt",
        });
      }
    }

    if (sec.type === "GALLERY") {
      const missingAlt = sec.data.images.filter((i) => i.url && !i.alt?.trim());
      if (missingAlt.length > 0) {
        issues.push({
          ...base,
          id: `${sec.id}-gallery-alt`,
          severity: "warn",
          message: `${missingAlt.length} ảnh gallery thiếu alt.`,
        });
      }
    }

    if (sec.type === "HERO") {
      if (!sec.data.title?.trim()) {
        issues.push({
          ...base,
          id: `${sec.id}-hero-title`,
          severity: "warn",
          message: "Hero thiếu tiêu đề.",
          field: "title",
        });
      }
      if (!sec.data.ctaText?.trim()) {
        issues.push({
          ...base,
          id: `${sec.id}-hero-cta`,
          severity: "info",
          message: "Hero chưa có CTA text.",
          field: "ctaText",
        });
      }
    }

    if (sec.type === "CTA_BANNER") {
      if (!sec.data.ctaText?.trim()) {
        issues.push({
          ...base,
          id: `${sec.id}-cta`,
          severity: "error",
          message: "CTA Banner thiếu nút chính.",
          field: "ctaText",
        });
      }
    }

    if (sec.type === "TEXT_BLOCK" && !sec.data.body?.trim()) {
      issues.push({
        ...base,
        id: `${sec.id}-text-empty`,
        severity: "info",
        message: "Khối văn bản đang trống.",
        field: "body",
      });
    }

    // Tiny touch targets hint for dense product grids on mobile
    if (
      sec.type === "PRODUCT_GRID" &&
      sec.data.density === "dense" &&
      !sec.styling.hideOnMobile
    ) {
      issues.push({
        ...base,
        id: `${sec.id}-dense-mobile`,
        severity: "info",
        message: "Grid dense trên mobile có thể khó bấm — cân nhắc ẩn hoặc airy.",
      });
    }
  }

  if (!sections.some((s) => s.enabled && s.type === "PRODUCT_GRID")) {
    issues.push({
      id: "page-no-grid",
      sectionId: "",
      sectionLabel: "Trang",
      severity: "warn",
      message: "Trang chưa có Lưới sản phẩm (catalog chính).",
    });
  }

  return issues;
}

export function a11ySummary(issues: A11yIssue[]): {
  errors: number;
  warns: number;
  infos: number;
} {
  return {
    errors: issues.filter((i) => i.severity === "error").length,
    warns: issues.filter((i) => i.severity === "warn").length,
    infos: issues.filter((i) => i.severity === "info").length,
  };
}
