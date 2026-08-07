"use client";

import GuaranteeFooter from "@/components/storefront/GuaranteeFooter";
import StoreCartDrawer from "@/components/storefront/StoreCartDrawer";
import StoreCheckoutModal from "@/components/storefront/StoreCheckoutModal";
import StoreHeader from "@/components/storefront/StoreHeader";
import {
  personalizationToCssVars,
  resolveArchetypeId,
  resolvePersonalization,
} from "@/lib/shop-personalization";
import { formatVnd, shopImageUrl } from "@/lib/shop-utils";
import { useShopCartStore } from "@/stores/use-shop-cart-store";
import type {
  ShopCover,
  ShopPersonalizationData,
  ShopProduct,
} from "@/types/zalo-shop";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo } from "react";

interface StoreShellProps {
  sellerId: string;
  cover: ShopCover | null;
  children: React.ReactNode;
  headerVariant?: "light" | "dark";
  search?: string;
  onSearchChange?: (value: string) => void;
  products?: ShopProduct[];
  personalization?: ShopPersonalizationData | Record<string, unknown> | null;
}

/** Floating island navbar — High-end Tech (Apple-like glass) */
function IslandHeader({
  sellerId,
  cover,
  onCartClick,
  itemCount,
}: {
  sellerId: string;
  cover: ShopCover | null;
  onCartClick: () => void;
  itemCount: number;
}) {
  const logo = cover?.image_logo ? shopImageUrl(cover.image_logo) : null;
  return (
    <header className="store-header-enter sticky top-0 z-50 flex justify-center px-4 pt-3 sm:px-6 sm:pt-4">
      <div
        className="flex h-12 w-full max-w-[720px] items-center justify-between gap-4 rounded-full px-2 pl-3 shadow-[0_4px_24px_rgba(0,0,0,0.08)] backdrop-blur-2xl sm:h-[52px] sm:px-2 sm:pl-4"
        style={{
          backgroundColor: "rgba(255,255,255,0.82)",
          border: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        <Link
          href={`/store/${sellerId}`}
          className="flex min-w-0 cursor-pointer items-center gap-2.5"
        >
          {logo ? (
            <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full ring-1 ring-black/10">
              <Image src={logo} alt="" fill className="object-cover" unoptimized sizes="32px" />
            </span>
          ) : (
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold text-white"
              style={{ backgroundColor: "#1D1D1F" }}
            >
              {(cover?.name ?? "S").charAt(0)}
            </span>
          )}
          <span
            className="truncate text-[14px] font-semibold tracking-[-0.01em]"
            style={{ color: "#1D1D1F" }}
          >
            {cover?.name || "Store"}
          </span>
        </Link>
        <nav className="hidden items-center gap-6 sm:flex">
          <a
            href="#products"
            className="cursor-pointer text-[13px] font-medium transition hover:opacity-70"
            style={{ color: "#1D1D1F" }}
          >
            Sản phẩm
          </a>
          <a
            href="#reviews"
            className="cursor-pointer text-[13px] font-medium transition hover:opacity-70"
            style={{ color: "#1D1D1F" }}
          >
            Đánh giá
          </a>
        </nav>
        <button
          type="button"
          onClick={onCartClick}
          className="relative flex h-9 cursor-pointer items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold text-white transition hover:opacity-90"
          style={{ backgroundColor: "var(--store-accent, #0071E3)" }}
          aria-label={`Giỏ hàng${itemCount > 0 ? `, ${itemCount} sản phẩm` : ""}`}
        >
          Giỏ hàng
          {itemCount > 0 ? (
            <span
              className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
              style={{ backgroundColor: "#1D1D1F" }}
            >
              {itemCount > 99 ? "99+" : itemCount}
            </span>
          ) : null}
        </button>
      </div>
    </header>
  );
}

/** Ultra-compact mobile header */
function CompactHeader({
  sellerId,
  cover,
  onCartClick,
  itemCount,
  onSearchFocus,
}: {
  sellerId: string;
  cover: ShopCover | null;
  onCartClick: () => void;
  itemCount: number;
  onSearchFocus?: () => void;
}) {
  return (
    <header className="store-header-enter sticky top-0 z-50 flex h-12 items-center justify-between border-b border-slate-100 bg-white px-3">
      <Link href={`/store/${sellerId}`} className="truncate text-sm font-bold text-slate-900">
        {cover?.name || "Shop"}
      </Link>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onSearchFocus}
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-slate-600"
          aria-label="Tìm kiếm"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </button>
        <button
          type="button"
          onClick={onCartClick}
          className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-slate-600"
          aria-label="Giỏ hàng"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6z" />
            <path d="M3 6h18" />
          </svg>
          {itemCount > 0 ? (
            <span className="absolute right-0.5 top-0.5 h-4 min-w-4 rounded-full bg-pink-500 px-1 text-[9px] font-bold text-white">
              {itemCount}
            </span>
          ) : null}
        </button>
      </div>
    </header>
  );
}

export default function StoreShell({
  sellerId,
  cover,
  children,
  search,
  onSearchChange,
  products,
  personalization,
}: StoreShellProps) {
  const setSellerId = useShopCartStore((s) => s.setSellerId);
  const fetchCart = useShopCartStore((s) => s.fetchCart);
  const openCart = useShopCartStore((s) => s.openCart);
  const cart = useShopCartStore((s) => s.cart);
  const itemCount = cart?.items?.reduce((sum, i) => sum + i.quantity, 0) ?? 0;

  const config = useMemo(
    () => resolvePersonalization(personalization),
    [personalization],
  );

  const cssVars = useMemo(
    () => personalizationToCssVars(config) as React.CSSProperties,
    [config],
  );

  const archetype = resolveArchetypeId(config.templateId);

  useEffect(() => {
    setSellerId(sellerId);
    void fetchCart();
  }, [sellerId, setSellerId, fetchCart]);

  const isDark = config.themeMode === "dark";
  const hideChromeHeader =
    config.headerStyle === "hidden-for-sidebar" ||
    archetype === "sidebar-commerce";
  const useIsland = config.headerStyle === "island" || archetype === "bento-grid-tech";
  const useCompact =
    config.headerStyle === "compact" || archetype === "mobile-native";
  const useUtility =
    config.headerStyle === "utility" || archetype === "deal-wall-flash";
  const needsSafeFooter =
    archetype === "mobile-native" ||
    archetype === "sidebar-commerce" ||
    config.showBottomNav ||
    config.showPersistentCartStrip;

  return (
    <div
      className={`relative min-h-screen overflow-x-hidden ${
        isDark ? "store-theme-dark" : ""
      }`}
      style={{
        ...cssVars,
        backgroundColor: config.backgroundColor,
        color: isDark ? "#f8fafc" : undefined,
      }}
      data-store-template={archetype}
      data-store-archetype={archetype}
    >
      {config.showAnnouncement &&
      config.announcement.trim() &&
      !useCompact &&
      !hideChromeHeader ? (
        <div
          className="px-4 py-2 text-center text-xs font-semibold text-white sm:text-sm"
          style={{ backgroundColor: config.accentColor }}
        >
          {config.announcement}
        </div>
      ) : null}

      {hideChromeHeader ? null : useIsland ? (
        <IslandHeader
          sellerId={sellerId}
          cover={cover}
          onCartClick={openCart}
          itemCount={itemCount}
        />
      ) : useCompact ? (
        <CompactHeader
          sellerId={sellerId}
          cover={cover}
          onCartClick={openCart}
          itemCount={itemCount}
          onSearchFocus={() => {
            document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
          }}
        />
      ) : (
        <StoreHeader
          sellerId={sellerId}
          cover={cover}
          onCartClick={openCart}
          search={search}
          onSearchChange={onSearchChange}
          products={products}
          branded={config.headerStyle === "branded"}
          darkChrome={isDark || config.headerStyle === "branded"}
          accentColor={config.accentColor}
        />
      )}

      <main className="store-page-enter relative">{children}</main>
      <StoreCartDrawer />
      <StoreCheckoutModal />

      {/* Footer always themed — padding extra when bottom chrome (nav/cart strip) */}
      <div
        className={
          needsSafeFooter
            ? "store-footer-enter mt-8 pb-20 sm:mt-10 sm:pb-16"
            : "store-footer-enter mt-8 sm:mt-12"
        }
      >
        <GuaranteeFooter
          shopName={cover?.name}
          accentColor={config.accentColor}
          safeBottom={needsSafeFooter}
        />
      </div>

      {/* Debug-free total hint for utility header cart state */}
      {useUtility && itemCount > 0 ? (
        <div className="pointer-events-none fixed bottom-4 right-4 z-30 hidden rounded-full bg-orange-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-lg sm:block">
          {itemCount} · {formatVnd(cart?.total_amount ?? 0)}
        </div>
      ) : null}
    </div>
  );
}
