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

import { useShopCartStore } from "@/stores/use-shop-cart-store";
import type { LayoutSection } from "@/types/shop-layout-canvas";
import { useState, type CSSProperties } from "react";
import {
  FiMenu,
  FiPhoneCall,
  FiSearch,
  FiShoppingBag,
  FiX,
} from "react-icons/fi";
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
  onCartClick?: () => void;
};

export default function HeaderRenderer({
  section,
  theme,
  className = "",
  previewMode = false,
  onCartClick,
}: SectionRendererProps<Extract<LayoutSection, { type: "HEADER" }>> &
  HeaderRendererExtra) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const openCartStore = useShopCartStore((s) => s.openCart);
  const cartStore = useShopCartStore((s) => s.cart);
  const cartCount =
    cartStore?.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) ?? 0;
  const handleCartClick = onCartClick || openCartStore;

  const { styling, widthPreset, data } = section;
  const accent = theme?.accentColor ?? "#0071E3";
  const primary = theme?.primaryColor ?? "#1D1D1F";
  const shopName = theme?.shopName?.trim() || "Store";
  const logoUrl = theme?.logoUrl?.trim() || "";
  const phone = theme?.contactPhone?.trim() || "";

  const isIsland = data.style === "island";
  const isCompact = data.style === "compact" || data.style === "utility";
  const isBranded = data.style === "branded";

  const requested = data.position ?? "static";
  /** Trong builder: fixed → sticky (an toàn) */
  const position =
    previewMode && requested === "fixed" ? "sticky" : requested;
  const isPinned = position === "sticky" || position === "fixed";

  /**
   * Header: luôn flush padding dọc shell + bỏ class `relative` (xung đột sticky/fixed).
   */
  const shell = buildSectionShellClasses(styling, { flush: true });
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

  const itemsRaw = (data as unknown as { items?: Array<{ label?: string; title?: string }> }).items;
  const navLinks =
    Array.isArray(itemsRaw) && itemsRaw.length > 0
      ? itemsRaw
          .map((it) => it.label || it.title || "")
          .filter(Boolean)
      : DEFAULT_NAV;

  const bar = (
    <header
      className={[
        shellWithoutRelative,
        "w-full",
        pinPositionClass,
        isPinned
          ? "border-b border-black/[0.08] shadow-xs dark:border-white/10"
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
            "flex w-full items-center justify-between gap-2 sm:gap-3",
            isCompact ? "py-1.5 sm:py-2" : "py-2.5 sm:py-3.5",
            isIsland
              ? `my-2 sm:my-3 border border-black/10 bg-white/95 px-3 py-1.5 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-stone-900/95 sm:px-4 ${radiusClass(
                  styling.radius === "none" ? "xl" : styling.radius,
                )}`
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-label="Main"
        >
          {/* Logo & Shop Title */}
          <a
            href="#top"
            className="group/logo flex min-w-0 max-w-[62%] shrink items-center gap-2 sm:max-w-none sm:shrink-0 sm:gap-2.5 no-underline"
          >
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={shopName}
                className={
                  isCompact
                    ? "h-7 w-7 shrink-0 rounded-lg object-cover shadow-xs sm:h-8 sm:w-8"
                    : "h-8 w-8 shrink-0 rounded-xl object-cover shadow-xs sm:h-9 sm:w-9"
                }
              />
            ) : (
              <span
                className={`flex shrink-0 items-center justify-center font-black tracking-tight text-white shadow-xs transition duration-200 group-hover/logo:scale-105 ${
                  isCompact
                    ? "h-7 w-7 rounded-lg text-[10px] sm:h-8 sm:w-8"
                    : "h-8 w-8 rounded-xl text-[11px] sm:h-9 sm:w-9 sm:text-xs"
                }`}
                style={{ background: isBranded ? accent : primary }}
              >
                {shopName.slice(0, 2).toUpperCase()}
              </span>
            )}
            <span
              className={`truncate font-bold tracking-tight text-gray-900 dark:text-white ${
                isCompact ? "text-xs sm:text-sm" : "text-xs sm:text-base"
              }`}
            >
              {shopName}
            </span>
          </a>

          {/* Navigation Links (Desktop) */}
          <ul className="hidden items-center gap-1.5 md:flex">
            {navLinks.map((item: string, i: number) => (
              <li key={item}>
                <a
                  href={`#${item}`}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold no-underline transition hover:bg-black/5 dark:hover:bg-white/10 ${
                    i === 0 ? "bg-black/5 dark:bg-white/10" : ""
                  } ${mutedTextClass(styling.textTone, styling.bgPreset)}`}
                  style={i === 0 ? { color: accent } : undefined}
                >
                  {item}
                </a>
              </li>
            ))}
          </ul>

          {/* Action Tools */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {phone ? (
              <a
                href={`tel:${phone}`}
                className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 lg:inline-flex"
              >
                <FiPhoneCall size={12} />
                <span>{phone}</span>
              </a>
            ) : null}

            {data.showSearch !== false ? (
              <>
                {/* Desktop Search bar */}
                <div
                  className={`hidden items-center gap-2 border border-gray-200 bg-gray-50/80 transition duration-200 hover:border-gray-300 sm:flex dark:border-gray-700 dark:bg-gray-800/80 ${
                    isCompact
                      ? "h-8 rounded-full px-3"
                      : "h-9 rounded-full px-3.5"
                  }`}
                >
                  <FiSearch className="h-3.5 w-3.5 text-gray-400" aria-hidden />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Tìm kiếm sản phẩm…
                  </span>
                </div>

                {/* Mobile Search Button */}
                <button
                  type="button"
                  onClick={() => setMobileSearchOpen((prev) => !prev)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-gray-100 sm:hidden dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  aria-label="Tìm kiếm"
                >
                  <FiSearch className="h-4 w-4" />
                </button>
              </>
            ) : null}

            {data.showCart !== false ? (
              <button
                type="button"
                onClick={handleCartClick}
                className={`relative inline-flex items-center justify-center rounded-full font-bold text-white shadow-xs transition duration-200 hover:scale-105 active:scale-95 ${
                  isCompact
                    ? "h-7.5 w-7.5 text-xs sm:h-8 sm:w-8"
                    : "h-8 w-8 text-xs sm:h-9 sm:w-9 sm:text-sm"
                }`}
                style={{ background: accent }}
                aria-label="Giỏ hàng"
              >
                <FiShoppingBag className="h-4 w-4" />
                {cartCount > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-extrabold text-white shadow-xs">
                    {cartCount}
                  </span>
                ) : null}
              </button>
            ) : null}

            {/* Mobile Hamburger Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 md:hidden"
              aria-label="Menu"
            >
              {mobileMenuOpen ? (
                <FiX className="h-4.5 w-4.5" />
              ) : (
                <FiMenu className="h-4.5 w-4.5" />
              )}
            </button>
          </div>
        </nav>

        {/* Mobile Search Field Drawer */}
        {mobileSearchOpen && data.showSearch !== false ? (
          <div className="border-t border-gray-100 py-2 sm:hidden dark:border-gray-800">
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50/90 px-3 py-1.5 dark:border-gray-700 dark:bg-gray-800/90">
              <FiSearch className="h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm…"
                className="w-full bg-transparent text-xs text-gray-900 outline-none dark:text-white placeholder:text-gray-400"
              />
            </div>
          </div>
        ) : null}

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen ? (
          <div className="border-t border-gray-100 py-3 md:hidden dark:border-gray-800">
            <ul className="flex flex-col gap-1">
              {navLinks.map((item: string, i: number) => (
                <li key={item}>
                  <a
                    href={`#${item}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block rounded-lg px-3 py-2 text-xs font-semibold no-underline transition ${
                      i === 0
                        ? "bg-black/5 font-bold text-brand-600 dark:bg-white/10 dark:text-brand-400"
                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                    }`}
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
            {phone ? (
              <div className="mt-3 border-t border-gray-100 pt-3 dark:border-gray-800">
                <a
                  href={`tel:${phone}`}
                  className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-xs"
                >
                  <FiPhoneCall size={14} />
                  <span>Hotline: {phone}</span>
                </a>
              </div>
            ) : null}
          </div>
        ) : null}
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
          minHeight: isCompact ? 48 : 56,
        }}
      >
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
