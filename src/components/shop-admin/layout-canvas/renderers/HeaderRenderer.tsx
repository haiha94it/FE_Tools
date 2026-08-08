/**
 * HeaderRenderer — navigation bar + position: static | sticky | fixed.
 *
 * Lưu ý:
 * - sticky hoạt động trên storefront (scroll window / page).
 * - fixed: luôn có spacer giữ chỗ; trong builder preview map → sticky
 *   (tránh fixed dính viewport admin và vỡ layout).
 * - Không bọc transform ancestor (animation tắt cho HEADER).
 */

"use client";

import type { LayoutSection } from "@/types/shop-layout-canvas";
import type { CSSProperties } from "react";
import {
  buildSectionShellClasses,
  buildWidthFrameClass,
  mutedTextClass,
  radiusClass,
  type SectionRendererProps,
} from "./section-style-utils";

const DEFAULT_NAV = ["Trang chủ", "Sản phẩm", "Flash sale", "Liên hệ"];

export type HeaderRendererExtra = {
  /**
   * true khi render trong LayoutCanvas builder.
   * fixed → sticky để không phủ admin shell.
   */
  previewMode?: boolean;
};

export default function HeaderRenderer({
  section,
  theme,
  className = "",
  previewMode = false,
}: SectionRendererProps<Extract<LayoutSection, { type: "HEADER" }>> &
  HeaderRendererExtra) {
  const { styling, widthPreset, data } = section;
  const accent = theme?.accentColor ?? "#0071E3";
  const primary = theme?.primaryColor ?? "#1D1D1F";
  const shopName = theme?.shopName?.trim() || "Store";
  const logoUrl = theme?.logoUrl?.trim() || "";

  const isIsland = data.style === "island";
  const isCompact = data.style === "compact" || data.style === "utility";
  const isBranded = data.style === "branded";

  const requested = data.position ?? "static";
  /** Trong builder: fixed → sticky (an toàn) */
  const position =
    previewMode && requested === "fixed" ? "sticky" : requested;
  const isPinned = position === "sticky" || position === "fixed";

  /**
   * Pinned: bỏ padding dọc shell + bỏ class `relative` (xung đột sticky/fixed).
   */
  const shell = buildSectionShellClasses(styling, { flush: isPinned });
  const shellWithoutRelative = shell.className
    .split(/\s+/)
    .filter((c) => c && c !== "relative")
    .join(" ");

  const surfaceBg =
    styling.bgPreset === "custom" && styling.customBg
      ? styling.customBg
      : styling.bgPreset === "dark" || styling.bgPreset === "primary"
        ? undefined // dùng class bg từ shell
        : styling.bgPreset === "accent"
          ? undefined
          : styling.bgPreset === "surface"
            ? "#ffffff"
            : styling.bgPreset === "muted"
              ? "#f3f4f6"
              : theme?.backgroundColor?.trim() || "#ffffff";

  const pinStyle: CSSProperties | undefined = isPinned
    ? {
        ...shell.style,
        ...(surfaceBg
          ? {
              backgroundColor: surfaceBg.startsWith("#")
                ? `color-mix(in srgb, ${surfaceBg} 96%, transparent)`
                : surfaceBg,
            }
          : {}),
        backdropFilter: "blur(12px) saturate(1.15)",
        WebkitBackdropFilter: "blur(12px) saturate(1.15)",
      }
    : shell.style;

  const pinPositionClass =
    position === "sticky"
      ? "sticky top-0 z-[60]"
      : position === "fixed"
        ? "fixed left-0 right-0 top-0 z-[60] w-full"
        : "";

  const bar = (
    <header
      className={[
        shellWithoutRelative,
        "w-full",
        pinPositionClass,
        isPinned
          ? "border-b border-black/[0.08] shadow-sm dark:border-white/10"
          : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={pinStyle}
      data-section-type="HEADER"
      data-section-id={section.id}
      data-header-position={position}
      data-header-requested={requested}
    >
      <div className={buildWidthFrameClass(widthPreset)}>
        <nav
          className={[
            "flex w-full items-center justify-between gap-3",
            isCompact ? "py-2.5" : "py-3 sm:py-3.5",
            isIsland
              ? `border border-black/5 bg-white/95 px-3 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-stone-900/95 ${radiusClass(
                  styling.radius === "none" ? "xl" : styling.radius,
                )}`
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-label="Main"
        >
          <a
            href="#top"
            className="flex min-w-0 shrink-0 items-center gap-2 no-underline"
          >
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={shopName}
                className={
                  isCompact
                    ? "h-8 w-8 rounded-lg object-cover"
                    : "h-9 w-9 rounded-xl object-cover"
                }
              />
            ) : (
              <span
                className={`flex shrink-0 items-center justify-center font-black tracking-tight text-white ${
                  isCompact
                    ? "h-8 w-8 rounded-lg text-[10px]"
                    : "h-9 w-9 rounded-xl text-xs"
                }`}
                style={{ background: isBranded ? accent : primary }}
              >
                {shopName.slice(0, 2).toUpperCase()}
              </span>
            )}
            <span
              className={`truncate font-bold tracking-tight ${
                isCompact ? "text-sm" : "text-base"
              }`}
            >
              {shopName}
            </span>
          </a>

          <ul className="hidden items-center gap-1 md:flex">
            {DEFAULT_NAV.map((item, i) => (
              <li key={item}>
                <a
                  href={`#${item}`}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium no-underline transition hover:opacity-80 ${
                    i === 0 ? "font-semibold" : ""
                  } ${mutedTextClass(styling.textTone, styling.bgPreset)}`}
                  style={i === 0 ? { color: accent } : undefined}
                >
                  {item}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex shrink-0 items-center gap-2">
            {data.showSearch !== false ? (
              <div
                className={`hidden items-center gap-2 border border-current/10 bg-black/5 sm:flex dark:bg-white/10 ${
                  isCompact
                    ? "h-8 rounded-full px-3"
                    : "h-9 rounded-full px-3.5"
                }`}
              >
                <span className="text-xs opacity-50" aria-hidden>
                  ⌕
                </span>
                <span
                  className={`text-xs ${mutedTextClass(styling.textTone, styling.bgPreset)}`}
                >
                  Tìm kiếm…
                </span>
              </div>
            ) : null}

            {data.showCart !== false ? (
              <button
                type="button"
                className={`relative inline-flex items-center justify-center rounded-full font-semibold text-white ${
                  isCompact ? "h-8 w-8 text-xs" : "h-9 w-9 text-sm"
                }`}
                style={{ background: accent }}
                aria-label="Giỏ hàng"
              >
                🛒
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                  2
                </span>
              </button>
            ) : null}

            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-current/10 text-sm md:hidden"
              aria-label="Menu"
            >
              ☰
            </button>
          </div>
        </nav>
      </div>
    </header>
  );

  /**
   * fixed: spacer trong flow + header fixed.
   * Một wrapper duy nhất (không Fragment) — an toàn cho parent/DnD.
   */
  if (position === "fixed") {
    return (
      <div
        className="relative w-full"
        data-header-fixed-wrap="true"
        style={{
          // Chiều cao giữ chỗ ≈ nav bar (không double padding shell)
          minHeight: isCompact ? 48 : 56,
        }}
      >
        {/* Invisible spacer — cùng kích thước với bar */}
        <div
          className={isCompact ? "h-12" : "h-14"}
          aria-hidden
        />
        {bar}
      </div>
    );
  }

  return bar;
}
