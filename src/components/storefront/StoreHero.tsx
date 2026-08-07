"use client";

import {
  buildStoreProductUrl,
  formatPriceRange,
  shopImageUrl,
} from "@/lib/shop-utils";
import { toast } from "@/lib/toast";
import type {
  ShopCover,
  ShopHeroLayout,
  ShopProduct,
} from "@/types/zalo-shop";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

interface StoreHeroProps {
  cover: ShopCover | null;
  featuredProducts?: ShopProduct[];
  sellerId?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  ctaText?: string;
  showTrustBadges?: boolean;
  heroLayout?: ShopHeroLayout;
}

const TRUST = [
  {
    label: "Giao hỏa tốc",
    sub: "Nội thành 2H",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    label: "Chính hãng 100%",
    sub: "Hoàn 200% nếu giả",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    ),
  },
  {
    label: "Đánh giá 4.9+",
    sub: "Khách hàng thực",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ),
  },
];

function ShareButton({ onShare }: { onShare: () => void }) {
  return (
    <button
      type="button"
      onClick={onShare}
      className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-white hover:text-slate-900"
    >
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
        />
      </svg>
      Chia sẻ
    </button>
  );
}

export default function StoreHero({
  cover,
  featuredProducts = [],
  sellerId = "",
  heroTitle = "",
  heroSubtitle = "",
  ctaText = "Xem sản phẩm",
  showTrustBadges = true,
  heroLayout = "split",
}: StoreHeroProps) {
  const heroProducts = featuredProducts.slice(0, 6);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    if (heroProducts.length <= 1) return;
    const id = window.setInterval(() => {
      setSlide((s) => (s + 1) % Math.min(heroProducts.length, 4));
    }, 4200);
    return () => window.clearInterval(id);
  }, [heroProducts.length]);

  const active = heroProducts[slide] ?? null;
  const activeImg = active?.images[0] ? shopImageUrl(active.images[0]) : null;

  const title =
    heroTitle.trim() ||
    (cover?.name?.trim() ? cover.name : "Cửa hàng");
  const subtitle = heroSubtitle.trim();
  const cta = ctaText.trim() || "Xem sản phẩm";

  const handleShare = () => {
    if (typeof window === "undefined") return;
    void navigator.clipboard.writeText(window.location.href);
    toast.success("Đã sao chép liên kết cửa hàng!");
  };

  const badge = (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--store-accent)_30%,transparent)] bg-[color-mix(in_srgb,var(--store-accent)_10%,transparent)] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--store-accent)]">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--store-accent)]" />
       Store
    </span>
  );

  const ctaRow = (centered?: boolean) => (
    <div className={`mt-5 flex flex-wrap items-center gap-2.5 ${centered ? "justify-center" : ""}`}>
      <a
        href="#products"
        className="store-btn-shimmer inline-flex cursor-pointer items-center gap-2 rounded-full px-6 py-3 text-xs font-extrabold uppercase tracking-wider shadow-lg"
      >
        {cta}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </a>
      <a
        href="#categories"
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
      >
        Xem danh mục
      </a>
    </div>
  );

  const trustRow = (centered?: boolean) =>
    showTrustBadges ? (
      <ul
        className={`mt-6 grid grid-cols-1 gap-2 border-t border-slate-100 pt-5 sm:grid-cols-3 sm:gap-2 ${
          centered ? "w-full max-w-xl" : ""
        }`}
      >
        {TRUST.map((item) => (
          <li
            key={item.label}
            className={`flex items-center gap-2.5 rounded-xl bg-slate-50/80 px-2.5 py-2 sm:px-3 sm:py-2.5 ${
              centered ? "sm:flex-col sm:items-center sm:text-center" : "sm:flex-col sm:items-start"
            }`}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-800 shadow-sm ring-1 ring-slate-200/80">
              {item.icon}
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-900 sm:text-xs">{item.label}</p>
              <p className="text-[10px] text-slate-500">{item.sub}</p>
            </div>
          </li>
        ))}
      </ul>
    ) : null;

  /** Minimal strip — 1 hàng mỏng */
  if (heroLayout === "minimal-strip") {
    return (
      <section className="relative">
        <div className="mx-auto max-w-7xl px-4 pt-3 sm:px-6 sm:pt-4">
          <div
            className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
            style={{ backgroundColor: "var(--store-surface, #fff)" }}
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {badge}
                <ShareButton onShare={handleShare} />
              </div>
              <h1 className="store-display mt-2 truncate text-xl text-[var(--store-primary)] sm:text-2xl">
                {title}
              </h1>
              {subtitle ? (
                <p className="mt-0.5 line-clamp-1 text-sm text-[var(--store-muted)]">
                  {subtitle}
                </p>
              ) : null}
            </div>
            <a
              href="#products"
              className="store-btn-shimmer inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider"
            >
              {cta}
            </a>
          </div>
        </div>
      </section>
    );
  }

  /** Full-bleed — full width dark hero */
  if (heroLayout === "full-bleed") {
    return (
      <section className="relative">
        <div className="relative overflow-hidden">
          <div className="store-showcase-glow absolute inset-0" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent to-black/40" />
          <div className="relative mx-auto flex min-h-[320px] max-w-7xl flex-col items-center justify-center px-4 py-14 text-center sm:min-h-[380px] sm:px-6 sm:py-20">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-white/90 backdrop-blur">
                 Store
              </span>
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/90 backdrop-blur transition hover:bg-white/20"
              >
                Chia sẻ
              </button>
            </div>
            <h1 className="store-display mt-5 max-w-3xl text-3xl font-normal leading-tight text-white sm:text-4xl lg:text-5xl">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/75 sm:text-base">
                {subtitle}
              </p>
            ) : null}
            <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
              <a
                href="#products"
                className="store-btn-shimmer inline-flex cursor-pointer items-center gap-2 rounded-full px-7 py-3.5 text-xs font-extrabold uppercase tracking-wider shadow-lg"
              >
                {cta}
              </a>
              <a
                href="#categories"
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-5 py-3.5 text-xs font-bold text-white backdrop-blur transition hover:bg-white/20"
              >
                Xem danh mục
              </a>
            </div>
            {showTrustBadges ? (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-white/80">
                {TRUST.map((t) => (
                  <span key={t.label} className="inline-flex items-center gap-1.5">
                    <span className="opacity-80">{t.icon}</span>
                    {t.label}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    );
  }

  /** Mosaic — product grid in hero */
  if (heroLayout === "mosaic") {
    const mosaic = heroProducts.slice(0, 5);
    return (
      <section className="relative">
        <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 sm:pt-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
            <div
              className="flex flex-col justify-center rounded-2xl border border-slate-200/80 p-5 shadow-sm sm:p-7 lg:col-span-4"
              style={{ backgroundColor: "var(--store-surface, #fff)" }}
            >
              <div className="flex flex-wrap items-center gap-2">
                {badge}
                <ShareButton onShare={handleShare} />
              </div>
              <h1 className="store-display mt-4 text-2xl text-[var(--store-primary)] sm:text-3xl">
                {title}
              </h1>
              {subtitle ? (
                <p className="mt-3 text-sm text-[var(--store-muted)]">{subtitle}</p>
              ) : null}
              {ctaRow()}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:col-span-8">
              {mosaic.length > 0
                ? mosaic.map((p, i) => {
                    const img = p.images[0] ? shopImageUrl(p.images[0]) : null;
                    const href = sellerId
                      ? buildStoreProductUrl(sellerId, p.id, p.category)
                      : "#products";
                    return (
                      <Link
                        key={p.id}
                        href={href}
                        className={`group relative overflow-hidden rounded-xl bg-slate-100 ${
                          i === 0 ? "col-span-2 row-span-2 aspect-[4/3] sm:aspect-auto sm:min-h-[220px]" : "aspect-square"
                        }`}
                      >
                        {img ? (
                          <Image
                            src={img}
                            alt={p.title}
                            fill
                            className="object-cover transition duration-300 group-hover:scale-105"
                            unoptimized
                            sizes="(max-width: 1024px) 50vw, 25vw"
                          />
                        ) : null}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2.5">
                          <p className="line-clamp-1 text-xs font-bold text-white">{p.title}</p>
                          <p className="text-[11px] font-extrabold text-[var(--store-accent)]">
                            {formatPriceRange(p)}
                          </p>
                        </div>
                      </Link>
                    );
                  })
                : (
                  <div className="col-span-full flex min-h-[200px] items-center justify-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-400">
                    Chưa có sản phẩm showcase
                  </div>
                )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  const brandBlock = (opts?: { centered?: boolean; className?: string }) => (
    <div
      className={`flex flex-col justify-center rounded-2xl border border-slate-200/80 p-5 shadow-sm sm:p-7 ${
        opts?.centered ? "items-center text-center" : ""
      } ${opts?.className ?? ""}`}
      style={{ backgroundColor: "var(--store-surface, #fff)" }}
    >
      <div className={`flex flex-wrap items-center gap-2 ${opts?.centered ? "justify-center" : ""}`}>
        {badge}
        <ShareButton onShare={handleShare} />
      </div>
      <h1
        className={`store-display mt-4 font-normal leading-[1.15] text-[var(--store-primary)] ${
          heroLayout === "banner"
            ? "text-xl sm:text-2xl lg:text-3xl"
            : "text-2xl sm:text-3xl lg:text-[2rem] xl:text-[2.35rem]"
        } ${opts?.centered ? "max-w-xl" : ""}`}
      >
        {title}
      </h1>
      {subtitle ? (
        <p
          className={`mt-3 text-sm leading-relaxed text-[var(--store-muted)] ${
            opts?.centered ? "max-w-lg" : "max-w-md"
          }`}
        >
          {subtitle}
        </p>
      ) : null}
      {ctaRow(opts?.centered)}
      {trustRow(opts?.centered)}
    </div>
  );

  const showcaseBlock = (opts?: { reverse?: boolean; compact?: boolean }) => (
    <div
      className={`relative overflow-hidden rounded-2xl ${
        opts?.compact ? "min-h-[200px] sm:min-h-[220px]" : "min-h-[280px] lg:min-h-[340px]"
      }`}
    >
      <div className="store-showcase-glow absolute inset-0" />
      <div className="pointer-events-none absolute -left-16 top-1/4 h-48 w-48 rounded-full bg-[var(--store-accent)]/25 blur-3xl" />
      <div className="relative flex h-full flex-col p-4 sm:p-5 lg:p-6">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--store-accent)] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--store-accent)]" />
            </span>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-white/80">
              Nổi bật hôm nay
            </span>
          </div>
          <a href="#products" className="text-[11px] font-bold text-slate-300 transition hover:text-white">
            Xem tất cả
          </a>
        </div>

        {active ? (
          <div
            className={`grid flex-1 items-center gap-4 ${
              opts?.compact
                ? "grid-cols-1 sm:grid-cols-[120px_1fr]"
                : opts?.reverse
                  ? "grid-cols-1 sm:grid-cols-2"
                  : "grid-cols-1 sm:grid-cols-2"
            }`}
          >
            <div
              className={`relative mx-auto aspect-square w-full ${
                opts?.compact ? "max-w-[120px] sm:mx-0" : "max-w-[240px] sm:max-w-none"
              } ${opts?.reverse ? "sm:order-2" : ""}`}
            >
              <div className="absolute inset-6 rounded-full bg-[var(--store-accent)]/20 blur-2xl" />
              <div className="relative h-full w-full overflow-hidden rounded-2xl bg-slate-900/40 ring-1 ring-white/10">
                {activeImg ? (
                  <Image
                    src={activeImg}
                    alt={active.title}
                    fill
                    className="object-cover"
                    priority
                    unoptimized
                    sizes="(max-width: 640px) 70vw, 320px"
                  />
                ) : null}
              </div>
            </div>
            <div className={`flex flex-col justify-center text-white ${opts?.reverse ? "sm:order-1" : ""}`}>
              <p className="line-clamp-2 text-lg font-bold leading-snug sm:text-xl">{active.title}</p>
              <p className="mt-2 text-xl font-extrabold text-[var(--store-accent)] sm:text-2xl">
                {formatPriceRange(active)}
              </p>
              {sellerId ? (
                <Link
                  href={buildStoreProductUrl(sellerId, active.id, active.category)}
                  className="store-btn-shimmer mt-4 inline-flex w-fit cursor-pointer items-center gap-2 rounded-full px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider"
                >
                  Xem chi tiết
                </Link>
              ) : (
                <a
                  href="#products"
                  className="store-btn-shimmer mt-4 inline-flex w-fit cursor-pointer items-center gap-2 rounded-full px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider"
                >
                  Khám phá ngay
                </a>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-slate-600 text-sm text-slate-400">
            Sản phẩm nổi bật đang được cập nhật
          </div>
        )}

        {heroProducts.length > 1 && !opts?.compact ? (
          <div className="mt-4 flex items-center gap-2">
            {heroProducts.slice(0, 4).map((p, i) => {
              const thumb = p.images[0] ? shopImageUrl(p.images[0]) : null;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSlide(i)}
                  aria-label={`Sản phẩm ${i + 1}`}
                  className={`relative h-11 w-11 shrink-0 cursor-pointer overflow-hidden rounded-lg ring-2 transition duration-200 ${
                    i === slide
                      ? "ring-[var(--store-accent)] opacity-100"
                      : "ring-transparent opacity-50 hover:opacity-80"
                  }`}
                >
                  {thumb ? (
                    <Image src={thumb} alt="" fill className="object-cover" unoptimized sizes="44px" />
                  ) : (
                    <span className="block h-full w-full bg-slate-700" />
                  )}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );

  return (
    <section className="relative">
      <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 sm:pt-6">
        {heroLayout === "centered" ? (
          <div className="mx-auto max-w-3xl space-y-4">
            {brandBlock({ centered: true })}
            {showcaseBlock()}
          </div>
        ) : heroLayout === "showcase-left" ? (
          <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-12 lg:gap-5">
            <div className="lg:col-span-7">{showcaseBlock({ reverse: true })}</div>
            <div className="lg:col-span-5">{brandBlock()}</div>
          </div>
        ) : heroLayout === "banner" ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-stretch">
            <div className="lg:col-span-5">{brandBlock()}</div>
            <div className="lg:col-span-7">{showcaseBlock({ compact: true })}</div>
          </div>
        ) : (
          /* split (default) */
          <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-12 lg:gap-5">
            <div className="lg:col-span-5">{brandBlock()}</div>
            <div className="lg:col-span-7">{showcaseBlock()}</div>
          </div>
        )}
      </div>
    </section>
  );
}
