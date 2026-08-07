"use client";

import CustomerReviewsCarousel from "@/components/storefront/CustomerReviewsCarousel";
import type { StorefrontLayoutProps } from "@/components/storefront/layouts/types";
import StoreLoading from "@/components/storefront/StoreLoading";
import StoreReveal from "@/components/storefront/StoreReveal";
import { useShopCartStore } from "@/stores/use-shop-cart-store";
import {
  buildStoreProductUrl,
  formatPriceRange,
  shopImageUrl,
} from "@/lib/shop-utils";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const CARD =
  "overflow-hidden rounded-[1.25rem] bg-white ring-1 ring-black/[0.06] shadow-[0_2px_16px_rgba(0,0,0,0.04)] transition duration-300 hover:shadow-[0_8px_28px_rgba(0,0,0,0.08)] hover:ring-black/[0.1]";

/**
 * High-end Tech layout — copy chỉ từ shop/sản phẩm thật, không headline marketing generic.
 */
export default function BentoGridTechLayout({
  sellerId,
  cover,
  products,
  filteredProducts,
  config,
  loading,
  onQuickView,
}: StorefrontLayoutProps) {
  const featured = products[0];
  const side = products.slice(1, 4);
  const openCart = useShopCartStore((s) => s.openCart);
  const [showBuyBar, setShowBuyBar] = useState(false);

  const shopName = cover?.name?.trim() || "Cửa hàng";
  // Chỉ dùng text user cấu hình; không fallback marketing “mù ngành hàng”
  const customTitle = config.heroTitle?.trim() || "";
  const customSub = config.heroSubtitle?.trim() || "";
  const ctaLabel = config.ctaText?.trim() || "Xem sản phẩm";

  useEffect(() => {
    if (!config.showStickyBuyBar) return;
    const onScroll = () => setShowBuyBar(window.scrollY > 480);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [config.showStickyBuyBar]);

  return (
    <div
      className="pb-28"
      style={{
        ["--tech-ink" as string]: "#1D1D1F",
        ["--tech-muted" as string]: "#6E6E73",
        ["--tech-faint" as string]: "#86868B",
        ["--tech-line" as string]: "rgba(0,0,0,0.08)",
        ["--tech-blue" as string]: config.accentColor || "#0071E3",
      }}
    >
      {/* Intro: tên shop + (tuỳ chọn) copy user tự ghi */}
      <section className="mx-auto max-w-[1120px] px-5 pt-10 sm:px-8 sm:pt-14">
        <StoreReveal variant="up" immediate className="mx-auto max-w-3xl text-center">
          <p
            className="text-[12px] font-semibold tracking-[0.04em]"
            style={{ color: "var(--tech-blue)" }}
          >
            Gian hàng chính hãng
          </p>
          <h1
            className="mt-3 text-[2rem] font-semibold leading-[1.15] tracking-[-0.02em] sm:text-[2.75rem] lg:text-[3rem]"
            style={{ color: "var(--tech-ink)" }}
          >
            {customTitle
              ? customTitle.split("\n").map((line, i) => (
                  <span key={i} className="block">
                    {line}
                  </span>
                ))
              : shopName}
          </h1>
          {customSub ? (
            <p
              className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed sm:text-[17px]"
              style={{ color: "var(--tech-muted)" }}
            >
              {customSub}
            </p>
          ) : featured ? (
            <p
              className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed sm:text-[17px]"
              style={{ color: "var(--tech-muted)" }}
            >
              {filteredProducts.length > 0
                ? `${filteredProducts.length} sản phẩm · Bắt đầu từ ${formatPriceRange(featured)}`
                : null}
            </p>
          ) : null}

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#products"
              className="store-press inline-flex h-11 cursor-pointer items-center rounded-full px-6 text-[14px] font-semibold text-white transition hover:opacity-90"
              style={{ backgroundColor: "var(--tech-blue)" }}
            >
              {ctaLabel}
            </a>
            {featured ? (
              <Link
                href={buildStoreProductUrl(
                  sellerId,
                  featured.id,
                  featured.category,
                )}
                className="store-press inline-flex h-11 cursor-pointer items-center rounded-full border px-6 text-[14px] font-semibold transition hover:bg-black/[0.03]"
                style={{
                  color: "var(--tech-blue)",
                  borderColor:
                    "color-mix(in srgb, var(--tech-blue) 35%, transparent)",
                }}
              >
                {featured.title.length > 28
                  ? `${featured.title.slice(0, 28)}…`
                  : featured.title}
              </Link>
            ) : null}
          </div>
        </StoreReveal>

        {/* Bento — 100% data sản phẩm */}
        <div className="mt-12 grid grid-cols-1 gap-3 sm:mt-14 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 lg:grid-rows-2 lg:gap-4">
          {featured ? (
            <Link
              href={buildStoreProductUrl(
                sellerId,
                featured.id,
                featured.category,
              )}
              className={`${CARD} store-anim-scale-in store-delay-1 group relative min-h-[320px] sm:col-span-2 sm:row-span-2 sm:min-h-[420px]`}
            >
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, #fafafa 0%, #e8e8ed 100%)",
                }}
              />
              {featured.images[0] ? (
                <Image
                  src={shopImageUrl(featured.images[0])}
                  alt={featured.title}
                  fill
                  className="object-contain p-8 transition duration-500 group-hover:scale-[1.03] sm:p-12"
                  unoptimized
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              ) : null}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white via-white/95 to-transparent px-6 pb-6 pt-16 sm:px-8 sm:pb-8">
                <h2
                  className="line-clamp-2 text-[1.25rem] font-semibold leading-snug tracking-[-0.01em] sm:text-[1.5rem]"
                  style={{ color: "var(--tech-ink)" }}
                >
                  {featured.title}
                </h2>
                <p
                  className="mt-2 text-[15px] font-medium"
                  style={{ color: "var(--tech-muted)" }}
                >
                  {formatPriceRange(featured)}
                </p>
              </div>
            </Link>
          ) : (
            <div
              className={`${CARD} flex min-h-[280px] items-center justify-center sm:col-span-2 sm:row-span-2`}
            >
              <p className="text-sm" style={{ color: "var(--tech-faint)" }}>
                Chưa có sản phẩm
              </p>
            </div>
          )}

          {side.map((p, i) => (
            <Link
              key={p.id}
              href={buildStoreProductUrl(sellerId, p.id, p.category)}
              className={`${CARD} store-anim-fade-up store-delay-${Math.min(i + 2, 11)} group flex flex-col ${
                i === 0 ? "lg:col-span-2" : ""
              }`}
            >
              <div
                className={`relative w-full overflow-hidden ${
                  i === 0 ? "aspect-[2/1] sm:aspect-[21/9]" : "aspect-[4/3]"
                }`}
                style={{
                  background:
                    "linear-gradient(160deg, #f5f5f7 0%, #e8e8ed 100%)",
                }}
              >
                {p.images[0] ? (
                  <Image
                    src={shopImageUrl(p.images[0])}
                    alt={p.title}
                    fill
                    className="object-contain p-5 transition duration-500 group-hover:scale-[1.04] sm:p-6"
                    unoptimized
                    sizes="(max-width: 1024px) 50vw, 25vw"
                  />
                ) : null}
              </div>
              <div className="flex flex-1 flex-col px-4 py-3.5 sm:px-5 sm:py-4">
                <p
                  className="line-clamp-2 text-[14px] font-semibold leading-snug sm:text-[15px]"
                  style={{ color: "var(--tech-ink)" }}
                >
                  {p.title}
                </p>
                <p
                  className="mt-auto pt-2 text-[13px] font-medium"
                  style={{ color: "var(--tech-muted)" }}
                >
                  {formatPriceRange(p)}
                </p>
              </div>
            </Link>
          ))}

          {side.length === 0 && featured
            ? null
            : side.length < 3 && featured
              ? Array.from({ length: Math.max(0, 3 - side.length) }).map(
                  (_, n) => (
                    <div
                      key={`empty-${n}`}
                      className={`${CARD} hidden min-h-[120px] lg:block ${
                        side.length === 0 && n === 0 ? "lg:col-span-2" : ""
                      }`}
                      aria-hidden
                    />
                  ),
                )
              : null}
        </div>
      </section>

      {/* Danh sách SP */}
      <section
        id="products"
        className="mx-auto max-w-[1120px] scroll-mt-28 px-5 py-16 sm:px-8 sm:py-20"
      >
        <StoreReveal variant="up">
          <div>
            <h2
              className="text-[1.75rem] font-semibold tracking-[-0.02em] sm:text-[2rem]"
              style={{ color: "var(--tech-ink)" }}
            >
              Sản phẩm
            </h2>
            <p
              className="mt-1.5 text-[14px]"
              style={{ color: "var(--tech-muted)" }}
            >
              {filteredProducts.length} sản phẩm
            </p>
          </div>
        </StoreReveal>

        {loading ? (
          <StoreLoading />
        ) : filteredProducts.length === 0 ? (
          <p
            className="mt-12 text-center text-sm"
            style={{ color: "var(--tech-muted)" }}
          >
            Chưa có sản phẩm
          </p>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-14">
            {filteredProducts.map((p, idx) => (
              <Link
                key={p.id}
                href={buildStoreProductUrl(sellerId, p.id, p.category)}
                className={`store-card-enter store-hover-lift group block store-delay-${Math.min(idx, 11)}`}
              >
                <div
                  className="relative aspect-square overflow-hidden rounded-[1.25rem] ring-1 ring-black/[0.05] transition duration-300 group-hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] group-hover:ring-black/[0.1]"
                  style={{
                    background:
                      "linear-gradient(165deg, #fbfbfd 0%, #f0f0f5 100%)",
                  }}
                >
                  {p.images[0] ? (
                    <Image
                      src={shopImageUrl(p.images[0])}
                      alt={p.title}
                      fill
                      className="store-img-zoom object-contain p-6 sm:p-8"
                      unoptimized
                      sizes="(max-width: 640px) 100vw, 33vw"
                    />
                  ) : null}
                </div>
                <div className="mt-4 space-y-1 px-0.5">
                  <h3
                    className="line-clamp-2 text-[15px] font-semibold leading-snug tracking-[-0.01em]"
                    style={{ color: "var(--tech-ink)" }}
                  >
                    {p.title}
                  </h3>
                  <p
                    className="text-[14px] font-medium"
                    style={{ color: "var(--tech-muted)" }}
                  >
                    {formatPriceRange(p)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {config.showReviews ? (
        <div className="border-t" style={{ borderColor: "var(--tech-line)" }}>
          <CustomerReviewsCarousel variant="minimal" />
        </div>
      ) : null}

      {config.showStickyBuyBar && showBuyBar && featured ? (
        <div
          className="fixed inset-x-0 bottom-0 z-40 px-3 sm:px-6"
          style={{
            paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
          }}
        >
          <div
            className="mx-auto flex max-w-[1120px] items-center justify-between gap-4 rounded-2xl border px-4 py-3 shadow-[0_8px_40px_rgba(0,0,0,0.12)] backdrop-blur-2xl sm:px-6 sm:py-3.5"
            style={{
              backgroundColor: "rgba(255,255,255,0.92)",
              borderColor: "rgba(0,0,0,0.08)",
            }}
          >
            <div className="flex min-w-0 items-center gap-3">
              {featured.images[0] ? (
                <div
                  className="relative hidden h-12 w-12 shrink-0 overflow-hidden rounded-xl ring-1 ring-black/5 sm:block"
                  style={{ background: "#f5f5f7" }}
                >
                  <Image
                    src={shopImageUrl(featured.images[0])}
                    alt=""
                    fill
                    className="object-contain p-1"
                    unoptimized
                    sizes="48px"
                  />
                </div>
              ) : null}
              <div className="min-w-0">
                <p
                  className="truncate text-[13px] font-semibold sm:text-[14px]"
                  style={{ color: "var(--tech-ink)" }}
                >
                  {featured.title}
                </p>
                <p
                  className="text-[13px] font-medium"
                  style={{ color: "var(--tech-muted)" }}
                >
                  {formatPriceRange(featured)}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => onQuickView(featured)}
                className="hidden h-10 cursor-pointer items-center rounded-full border px-4 text-[13px] font-semibold transition hover:bg-black/[0.03] sm:inline-flex"
                style={{
                  color: "var(--tech-ink)",
                  borderColor: "rgba(0,0,0,0.12)",
                }}
              >
                Xem nhanh
              </button>
              <Link
                href={buildStoreProductUrl(
                  sellerId,
                  featured.id,
                  featured.category,
                )}
                className="inline-flex h-10 cursor-pointer items-center rounded-full px-5 text-[13px] font-semibold text-white transition hover:opacity-90"
                style={{ backgroundColor: "var(--tech-blue)" }}
              >
                {ctaLabel}
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
