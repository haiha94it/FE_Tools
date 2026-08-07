"use client";

import {
  buildStoreProductUrl,
  formatPriceRange,
  formatVnd,
  shopImageUrl,
} from "@/lib/shop-utils";
import { useShopCartStore } from "@/stores/use-shop-cart-store";
import type { ShopCover, ShopProduct } from "@/types/zalo-shop";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

interface StoreHeaderProps {
  sellerId: string;
  cover: ShopCover | null;
  onCartClick: () => void;
  search?: string;
  onSearchChange?: (value: string) => void;
  products?: ShopProduct[];
  searchPlaceholder?: string;
  /** Prefer dark chrome (dark store theme / branded) */
  branded?: boolean;
  accentColor?: string;
  /** Explicit dark header surface — overrides branded when set */
  darkChrome?: boolean;
}

const HOT_KEYWORDS = [
  "Tai nghe",
  "Loa Bluetooth",
  "Đồng hồ",
  "Cáp sạc",
  "Chính hãng",
];

/**
 * Store header — surfaces cố định (#0B0F19 / #fff), không dùng --store-primary làm nền
 * (tránh theme dark gán primary = trắng → chữ trắng trên nền trắng).
 */
export default function StoreHeader({
  sellerId,
  cover,
  onCartClick,
  search = "",
  onSearchChange,
  products = [],
  searchPlaceholder = "Tìm sản phẩm, danh mục, thương hiệu...",
  branded = false,
  accentColor,
  darkChrome,
}: StoreHeaderProps) {
  const cart = useShopCartStore((s) => s.cart);
  const itemCount = cart?.items?.reduce((sum, i) => sum + i.quantity, 0) ?? 0;
  const total = cart?.total_amount ?? 0;
  const logo = cover?.image_logo ? shopImageUrl(cover.image_logo) : null;

  const [focused, setFocused] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [badgeKey, setBadgeKey] = useState(0);
  const prevCount = useRef(itemCount);
  const inputRef = useRef<HTMLInputElement>(null);

  /** Dark chrome = dark theme store OR branded style */
  const dark = darkChrome === true || (darkChrome !== false && branded);

  useEffect(() => {
    let isScrolled = false;
    const handleScroll = () => {
      const y = window.scrollY;
      if (!isScrolled && y > 80) {
        isScrolled = true;
        setScrolled(true);
      } else if (isScrolled && y < 15) {
        isScrolled = false;
        setScrolled(false);
      }
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (itemCount !== prevCount.current) {
      if (itemCount > prevCount.current) {
        setBadgeKey((k) => k + 1);
      }
      prevCount.current = itemCount;
    }
  }, [itemCount]);

  const suggestions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return products.filter((p) => p.title.toLowerCase().includes(q)).slice(0, 6);
  }, [products, search]);

  const showDropdown =
    focused && onSearchChange && (search.trim() ? suggestions.length > 0 : true);

  const accent = accentColor || "var(--store-accent, #ec4899)";

  return (
    <header
      className={`store-header-enter sticky top-0 z-50 w-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        scrolled ? "shadow-[0_12px_32px_rgba(0,0,0,0.12)]" : ""
      }`}
    >
      {/* Top bar — solid surfaces only */}
      <div
        className="border-b transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={
          dark
            ? {
                backgroundColor: scrolled
                  ? "rgba(11, 15, 25, 0.98)"
                  : "rgba(11, 15, 25, 0.92)",
                borderColor: scrolled
                  ? "rgba(255,255,255,0.14)"
                  : "rgba(255,255,255,0.08)",
                color: "#F8FAFC",
                backdropFilter: "blur(20px)",
              }
            : {
                backgroundColor: scrolled
                  ? "rgba(255,255,255,0.98)"
                  : "rgba(255,255,255,0.92)",
                borderColor: scrolled
                  ? "rgba(15,23,42,0.12)"
                  : "rgba(15,23,42,0.06)",
                color: "#0F172A",
                backdropFilter: "blur(20px)",
              }
        }
      >
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-2.5 px-4 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] sm:h-16 sm:gap-4 sm:px-6 lg:px-8">
          <Link
            href={`/store/${sellerId}`}
            className="group flex min-w-0 flex-1 sm:flex-none cursor-pointer items-center gap-2 sm:gap-2.5"
          >
            {logo ? (
              <div
                className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full ring-2 transition-transform duration-200 group-hover:scale-105 sm:h-10 sm:w-10"
                style={{
                  boxShadow: dark
                    ? "0 0 0 2px rgba(255,255,255,0.25)"
                    : "0 0 0 2px rgba(15,23,42,0.1)",
                }}
              >
                <Image
                  src={logo}
                  alt=""
                  fill
                  className="object-cover"
                  unoptimized
                  sizes="40px"
                />
              </div>
            ) : (
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs sm:text-sm font-bold text-white shadow-sm transition-transform duration-200 group-hover:scale-105 sm:h-10 sm:w-10"
                style={{
                  backgroundColor: dark
                    ? "rgba(255,255,255,0.15)"
                    : accent.startsWith("#")
                      ? accent
                      : "#0F172A",
                }}
              >
                {(cover?.name ?? "S").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <p
                  className="truncate text-xs font-bold sm:text-base"
                  style={{ color: dark ? "#F8FAFC" : "#0F172A" }}
                >
                  {cover?.name || "Cửa hàng"}
                </p>
                <svg
                  className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0"
                  style={{ color: "#3B82F6" }}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-label="Đã xác thực"
                >
                  <path
                    fillRule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <p
                className="hidden truncate text-[11px] font-medium sm:block"
                style={{ color: dark ? "rgba(248,250,252,0.65)" : "#64748B" }}
              >
                Gian hàng chính hãng
              </p>
            </div>
          </Link>

          <div className="flex shrink-0 items-center gap-2">
            {scrolled && onSearchChange ? (
              <button
                type="button"
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                  setTimeout(() => inputRef.current?.focus(), 300);
                }}
                aria-label="Mở tìm kiếm"
                className="flex h-9 w-9 sm:h-10 sm:w-10 cursor-pointer items-center justify-center rounded-xl border transition-all duration-200"
                style={
                  dark
                    ? {
                        borderColor: "rgba(255,255,255,0.18)",
                        backgroundColor: "rgba(255,255,255,0.1)",
                        color: "#F8FAFC",
                      }
                    : {
                        borderColor: "rgba(15,23,42,0.12)",
                        backgroundColor: "#F1F5F9",
                        color: "#0F172A",
                      }
                }
              >
                <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
              </button>
            ) : null}

            {/* Cart — always high contrast */}
            <button
              type="button"
              onClick={onCartClick}
              aria-label={`Giỏ hàng${itemCount > 0 ? `, ${itemCount} sản phẩm` : ""}`}
              className="store-press group relative flex h-9 min-w-9 sm:h-10 sm:min-w-10 cursor-pointer items-center gap-2 rounded-xl px-2.5 sm:px-3.5 shadow-sm transition-all duration-200"
              style={
                dark
                  ? {
                      border: "1px solid rgba(255,255,255,0.18)",
                      backgroundColor: "rgba(255,255,255,0.1)",
                      color: "#F8FAFC",
                    }
                  : {
                      border: "1px solid rgba(15,23,42,0.12)",
                      backgroundColor: "#0F172A",
                      color: "#FFFFFF",
                    }
              }
            >
              <div className="relative flex items-center justify-center">
                <svg
                  className="h-4 w-4 sm:h-5 sm:w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6z" />
                  <path d="M3 6h18M16 10a4 4 0 01-8 0" />
                </svg>
                {itemCount > 0 ? (
                  <span
                    key={badgeKey}
                    className="store-cart-badge-pop absolute -right-2 -top-2 flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1 text-[9px] sm:text-[10px] font-extrabold text-white shadow-md ring-2 ring-white"
                    style={{
                      backgroundColor: accent.startsWith("#")
                        ? accent
                        : "#EC4899",
                    }}
                  >
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                ) : null}
              </div>
              <div className="hidden flex-col items-start md:flex">
                <span
                  className="text-[9px] font-medium uppercase tracking-wide"
                  style={{
                    color: dark ? "rgba(248,250,252,0.6)" : "rgba(255,255,255,0.7)",
                  }}
                >
                  Giỏ hàng
                </span>
                <span className="text-xs font-bold leading-none">
                  {total > 0 ? formatVnd(total) : "Trống"}
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Search — smooth sliding + fade animation on scroll */}
      {onSearchChange ? (
        <div
          className={`grid border-b backdrop-blur-md transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            scrolled
              ? "grid-rows-[0fr] opacity-0 border-b-0 pointer-events-none"
              : "grid-rows-[1fr] opacity-100"
          }`}
          style={
            dark
              ? {
                  backgroundColor: "rgba(11, 15, 25, 0.94)",
                  borderColor: "rgba(255,255,255,0.08)",
                }
              : {
                  backgroundColor: "rgba(255,255,255,0.96)",
                  borderColor: "rgba(15,23,42,0.08)",
                }
          }
        >
          <div className="overflow-hidden">
            <div className="mx-auto max-w-7xl px-4 py-2.5 sm:px-6 lg:px-8 sm:py-3">
            <div className="relative z-50">
              <div
                className="relative flex items-center rounded-xl border transition-all duration-200 focus-within:ring-2 focus-within:ring-[color-mix(in_srgb,var(--store-accent,#ec4899)_25%,transparent)]"
                style={{
                  borderColor: dark
                    ? "rgba(255,255,255,0.12)"
                    : "rgba(15,23,42,0.12)",
                  backgroundColor: dark ? "rgba(255,255,255,0.08)" : "#F8FAFC",
                }}
              >
                <svg
                  className="pointer-events-none absolute left-3.5 h-4 w-4"
                  style={{ color: dark ? "rgba(248,250,252,0.45)" : "#94A3B8" }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                <input
                  ref={inputRef}
                  type="search"
                  value={search}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setTimeout(() => setFocused(false), 180)}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={searchPlaceholder}
                  aria-label="Tìm kiếm sản phẩm"
                  className="h-11 w-full cursor-text bg-transparent py-2 pl-10 pr-20 text-sm focus:outline-none"
                  style={{
                    color: dark ? "#F8FAFC" : "#0F172A",
                  }}
                />
                {search ? (
                  <button
                    type="button"
                    onClick={() => {
                      onSearchChange("");
                      inputRef.current?.focus();
                    }}
                    className="absolute right-2 cursor-pointer rounded-lg px-2 py-1 text-xs font-semibold transition"
                    style={{
                      color: dark ? "rgba(248,250,252,0.65)" : "#64748B",
                    }}
                  >
                    Xóa
                  </button>
                ) : (
                  <a
                    href="#products"
                    className="absolute right-2 hidden cursor-pointer rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-white transition hover:opacity-90 sm:inline"
                    style={{
                      backgroundColor: dark ? accent.startsWith("#") ? accent : "#F43F5E" : "#0F172A",
                    }}
                  >
                    Tìm
                  </a>
                )}
              </div>

              {showDropdown ? (
                <div
                  className="absolute left-0 right-0 top-[calc(100%+6px)] z-[100] overflow-hidden rounded-xl border shadow-2xl animate-in fade-in-0 zoom-in-95"
                  style={{
                    backgroundColor: dark ? "#111827" : "#FFFFFF",
                    borderColor: dark
                      ? "rgba(255,255,255,0.1)"
                      : "rgba(15,23,42,0.1)",
                  }}
                >
                  {!search.trim() ? (
                    <div className="p-3">
                      <p
                        className="text-[11px] font-bold uppercase tracking-wider"
                        style={{
                          color: dark ? "rgba(248,250,252,0.45)" : "#94A3B8",
                        }}
                      >
                        Gợi ý tìm kiếm
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {HOT_KEYWORDS.map((kw) => (
                          <button
                            key={kw}
                            type="button"
                            onMouseDown={() => onSearchChange(kw)}
                            className="cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-semibold transition"
                            style={{
                              backgroundColor: dark
                                ? "rgba(255,255,255,0.08)"
                                : "#F1F5F9",
                              color: dark ? "#F8FAFC" : "#334155",
                            }}
                          >
                            {kw}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <ul className="max-h-72 overflow-y-auto py-1">
                      {suggestions.map((prod) => {
                        const img = prod.images[0]
                          ? shopImageUrl(prod.images[0])
                          : null;
                        return (
                          <li key={prod.id}>
                            <Link
                              href={buildStoreProductUrl(
                                sellerId,
                                prod.id,
                                prod.category,
                              )}
                              className="flex cursor-pointer items-center gap-3 px-3 py-2.5 transition"
                              style={{ color: dark ? "#F8FAFC" : "#0F172A" }}
                              onMouseDown={(e) => e.preventDefault()}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = dark
                                  ? "rgba(255,255,255,0.06)"
                                  : "#F8FAFC";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  "transparent";
                              }}
                            >
                              <div
                                className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg"
                                style={{
                                  backgroundColor: dark
                                    ? "rgba(255,255,255,0.08)"
                                    : "#F1F5F9",
                                }}
                              >
                                {img ? (
                                  <Image
                                    src={img}
                                    alt=""
                                    fill
                                    className="object-cover"
                                    unoptimized
                                    sizes="40px"
                                  />
                                ) : null}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold">
                                  {prod.title}
                                </p>
                                <p
                                  className="text-xs font-bold"
                                  style={{
                                    color: accent.startsWith("#")
                                      ? accent
                                      : "#EC4899",
                                  }}
                                >
                                  {formatPriceRange(prod)}
                                </p>
                              </div>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      ) : null}
    </header>
  );
}
