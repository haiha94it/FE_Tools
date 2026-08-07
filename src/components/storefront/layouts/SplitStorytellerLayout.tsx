"use client";

import CustomerReviewsCarousel from "@/components/storefront/CustomerReviewsCarousel";
import type { StorefrontLayoutProps } from "@/components/storefront/layouts/types";
import StoreReveal from "@/components/storefront/StoreReveal";
import {
  buildStoreProductUrl,
  formatPriceRange,
  isProductActive,
  shopImageUrl,
} from "@/lib/shop-utils";
import type { ShopProduct } from "@/types/zalo-shop";
import Image from "next/image";
import Link from "next/link";

/* ─────────────────────────────────────────────────────────────
 * Brand / D2C — Split Storyteller
 * Visual language: Nike / Glossier / Arc — dark editorial luxury
 * 8px rhythm · WCAG AA · handcrafted, no template feel
 * ───────────────────────────────────────────────────────────── */

const STORY_CHAPTERS = [
  { kicker: "01", label: "Featured" },
  { kicker: "02", label: "Selection" },
  { kicker: "03", label: "More" },
] as const;

function BrandProductCard({
  product,
  sellerId,
  index = 0,
  onQuickView,
  density = "standard",
}: {
  product: ShopProduct;
  sellerId: string;
  index?: number;
  onQuickView?: (p: ShopProduct) => void;
  density?: "standard" | "compact";
}) {
  if (!isProductActive(product)) return null;

  const img = product.images[0] ? shopImageUrl(product.images[0]) : null;
  const href = buildStoreProductUrl(sellerId, product.id, product.category);
  const isCompact = density === "compact";

  return (
    <article
      className={`brand-card store-card-enter store-delay-${Math.min(index, 11)} group relative flex h-full flex-col overflow-hidden`}
    >
      <Link
        href={href}
        className="relative block overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--brand-bg,#0A0A0A)]"
        style={{
          background:
            "linear-gradient(165deg, #1a1a1c 0%, #0e0e10 55%, #0a0a0a 100%)",
        }}
        aria-label={product.title}
      >
        <div
          className={`relative w-full overflow-hidden ${
            isCompact ? "aspect-square" : "aspect-[3/4]"
          }`}
        >
          {img ? (
            <Image
              src={img}
              alt={product.title}
              fill
              className="store-img-zoom object-contain p-5 sm:p-6"
              unoptimized
              sizes={
                isCompact
                  ? "(max-width: 640px) 50vw, 25vw"
                  : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              }
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-[11px] font-medium tracking-[0.12em] text-white/25 uppercase">
                No image
              </span>
            </div>
          )}

          {/* Soft vignette for depth */}
          <div
            className="pointer-events-none absolute inset-0 opacity-60 transition-opacity duration-300 group-hover:opacity-40"
            style={{
              background:
                "radial-gradient(ellipse 80% 70% at 50% 40%, transparent 40%, rgba(0,0,0,0.45) 100%)",
            }}
            aria-hidden
          />
        </div>
      </Link>

      <div
        className={`flex flex-1 flex-col ${isCompact ? "gap-1 p-3 sm:p-3.5" : "gap-1.5 p-4 sm:p-5"}`}
      >
        <Link
          href={href}
          className="focus-visible:outline-none focus-visible:underline focus-visible:decoration-white/40 focus-visible:underline-offset-4"
        >
          <h3
            className={`line-clamp-2 font-medium leading-snug tracking-[-0.01em] text-[var(--brand-ink,#FAFAFA)] transition-colors duration-200 group-hover:text-white ${
              isCompact ? "text-[13px]" : "text-[14px] sm:text-[15px]"
            }`}
          >
            {product.title}
          </h3>
        </Link>

        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <p
            className={`font-medium tracking-tight text-[var(--brand-muted,#A3A3A3)] ${
              isCompact ? "text-[12px]" : "text-[13px] sm:text-[14px]"
            }`}
          >
            {formatPriceRange(product)}
          </p>

          {onQuickView ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onQuickView(product);
              }}
              className="store-press brand-ghost-btn inline-flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-full px-2.5 text-[11px] font-semibold tracking-wide text-white/70 transition duration-200 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              aria-label={`Xem nhanh ${product.title}`}
            >
              Xem
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function StoryChapter({
  sellerId,
  chapterIndex,
  products,
  reverse,
  onQuickView,
}: {
  sellerId: string;
  chapterIndex: number;
  products: ShopProduct[];
  reverse?: boolean;
  onQuickView?: (p: ShopProduct) => void;
}) {
  const cover = products[0];
  const coverImg = cover?.images[0] ? shopImageUrl(cover.images[0]) : null;
  const meta = STORY_CHAPTERS[chapterIndex] ?? STORY_CHAPTERS[0];
  const gridProducts = products.slice(0, 4);
  const coverHref = cover
    ? buildStoreProductUrl(sellerId, cover.id, cover.category)
    : "#products";

  return (
    <section
      className="brand-story-section border-t border-white/[0.06]"
      aria-labelledby={`brand-chapter-${chapterIndex}`}
    >
      <div
        className={`mx-auto grid max-w-[1400px] grid-cols-1 lg:grid-cols-2 ${
          reverse ? "lg:[&>*:first-child]:order-2" : ""
        }`}
      >
        {/* Lifestyle / cover panel */}
        <div className="relative min-h-[320px] w-full overflow-hidden sm:min-h-[400px] lg:min-h-[520px]">
          {coverImg ? (
            <Image
              src={coverImg}
              alt=""
              fill
              className="object-cover transition duration-[1.2s] ease-out motion-safe:group-hover:scale-[1.02]"
              unoptimized
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(145deg, #1c1c1f 0%, #0a0a0a 70%, #12080c 100%)",
              }}
            />
          )}

          {/* Editorial scrim — readable text, not muddy flat overlay */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.25) 40%, rgba(0,0,0,0.78) 100%)",
            }}
            aria-hidden
          />

          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 lg:p-10">
            <p className="text-[11px] font-semibold tracking-[0.28em] text-white/55 uppercase">
              {meta.kicker} · {meta.label}
            </p>
            <h2
              id={`brand-chapter-${chapterIndex}`}
              className="store-display mt-3 max-w-md text-[1.5rem] leading-[1.15] tracking-[-0.02em] text-white sm:text-[1.75rem] lg:text-[2rem]"
            >
              {cover?.title ?? "Bộ sưu tập"}
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-white/65 sm:text-sm">
              {products.length} sản phẩm
              {cover ? ` · Từ ${formatPriceRange(cover)}` : ""}
            </p>
            {cover ? (
              <Link
                href={coverHref}
                className="store-press mt-5 inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-white/25 bg-white/[0.08] px-5 text-[12px] font-semibold tracking-wide text-white backdrop-blur-md transition duration-200 hover:border-white/40 hover:bg-white/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              >
                Khám phá
                <svg
                  className="h-3.5 w-3.5 opacity-70"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M3 8h10M9 4l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            ) : null}
          </div>
        </div>

        {/* Product mosaic — 2×2, 8px rhythm */}
        <div
          className="grid grid-cols-2 gap-2 p-4 sm:gap-3 sm:p-6 lg:gap-4 lg:p-8"
          style={{ backgroundColor: "var(--brand-bg, #0A0A0A)" }}
        >
          {Array.from({ length: 4 }, (_, i) => {
            const p = gridProducts[i];
            if (p) {
              return (
                <BrandProductCard
                  key={p.id}
                  product={p}
                  sellerId={sellerId}
                  index={i}
                  onQuickView={onQuickView}
                  density="compact"
                />
              );
            }
            return (
              <div
                key={`empty-${chapterIndex}-${i}`}
                className="aspect-square rounded-xl ring-1 ring-white/[0.04]"
                style={{
                  background:
                    "linear-gradient(165deg, #121214 0%, #0c0c0e 100%)",
                }}
                aria-hidden
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

function BrandSkeletonGrid() {
  return (
    <div
      className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5"
      aria-busy="true"
      aria-label="Đang tải sản phẩm"
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-xl">
          <div
            className="brand-skeleton aspect-[3/4] w-full"
            style={{ animationDelay: `${i * 60}ms` }}
          />
          <div className="space-y-2 p-4">
            <div
              className="brand-skeleton h-3.5 w-[85%] rounded"
              style={{ animationDelay: `${i * 60 + 40}ms` }}
            />
            <div
              className="brand-skeleton h-3 w-[40%] rounded"
              style={{ animationDelay: `${i * 60 + 80}ms` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function BrandEmptyState() {
  return (
    <div className="mx-auto mt-16 max-w-sm px-4 text-center">
      <div
        className="mx-auto flex h-16 w-16 items-center justify-center rounded-full ring-1 ring-white/10"
        style={{
          background:
            "linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
        }}
        aria-hidden
      >
        <svg
          className="h-7 w-7 text-white/40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path
            d="M6 7h12l-1 12H7L6 7zM9 7V5a3 3 0 016 0v2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <p className="store-display mt-6 text-xl tracking-tight text-white/90">
        Chưa có sản phẩm
      </p>
      <p className="mt-2 text-sm leading-relaxed text-white/45">
        Gian hàng đang được cập nhật. Quay lại sau nhé.
      </p>
    </div>
  );
}

/**
 * Brand / D2C — Split Storyteller (premium redesign)
 * Hero cinematic → featured spotlight → story chapters → product archive → reviews
 */
export default function SplitStorytellerLayout({
  sellerId,
  cover,
  products,
  filteredProducts,
  config,
  loading,
  onQuickView,
}: StorefrontLayoutProps) {
  const shopName = cover?.name?.trim() || "Cửa hàng";
  const customTitle = config.heroTitle?.trim() || "";
  const customSub = config.heroSubtitle?.trim() || "";
  const ctaLabel = config.ctaText?.trim() || "Xem sản phẩm";

  const activeProducts = products.filter(isProductActive);
  const heroProduct = activeProducts[0];
  const heroImg = cover?.image
    ? shopImageUrl(cover.image)
    : heroProduct?.images[0]
      ? shopImageUrl(heroProduct.images[0])
      : null;

  const chapterA = activeProducts.slice(0, 4);
  const chapterB = activeProducts.slice(4, 8);
  const list =
    filteredProducts.length > 0
      ? filteredProducts.filter(isProductActive)
      : activeProducts;

  const fromPrice = heroProduct ? formatPriceRange(heroProduct) : null;

  return (
    <div
      className="brand-storyteller pb-20 sm:pb-24"
      style={{
        ["--brand-bg" as string]: "var(--store-bg, #0A0A0A)",
        ["--brand-surface" as string]: "var(--store-surface, #171717)",
        ["--brand-ink" as string]: "var(--store-primary, #FAFAFA)",
        ["--brand-muted" as string]: "var(--store-muted, #A3A3A3)",
        ["--brand-accent" as string]: "var(--store-accent, #F43F5E)",
        color: "var(--brand-ink)",
        backgroundColor: "var(--brand-bg)",
      }}
    >
      {/* ═══ HERO — full-bleed cinematic ═══ */}
      <section
        className="relative flex min-h-[calc(100svh-3.5rem)] items-end overflow-hidden sm:min-h-[calc(100svh-4rem)] sm:items-center"
        aria-label="Giới thiệu gian hàng"
      >
        {heroImg ? (
          <Image
            src={heroImg}
            alt=""
            fill
            className="object-cover scale-[1.02]"
            unoptimized
            priority
            sizes="100vw"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 90% 70% at 50% 20%, #1a1218 0%, #0A0A0A 55%, #050505 100%)",
            }}
          />
        )}

        {/* Layered scrim — depth, not flat black */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.2) 35%, rgba(0,0,0,0.75) 100%),
              radial-gradient(ellipse 70% 50% at 50% 100%, rgba(244,63,94,0.12) 0%, transparent 55%)
            `,
          }}
          aria-hidden
        />

        {/* Film grain (CSS, zero assets) */}
        <div className="brand-grain pointer-events-none absolute inset-0 opacity-[0.35]" aria-hidden />

        <div className="relative z-10 mx-auto w-full max-w-[920px] px-5 pb-16 pt-28 text-center sm:px-8 sm:pb-20 sm:pt-24 lg:pb-24">
          <StoreReveal variant="up" immediate>
            <p className="text-[11px] font-semibold tracking-[0.32em] text-white/55 uppercase sm:text-[12px]">
              {customTitle ? shopName : "Gian hàng"}
            </p>

            <h1 className="store-display mt-5 text-[2.25rem] leading-[1.08] tracking-[-0.03em] text-white sm:mt-6 sm:text-[3.25rem] lg:text-[3.75rem]">
              {customTitle
                ? customTitle.split("\n").map((line, i) => (
                    <span key={i} className="block">
                      {line}
                    </span>
                  ))
                : shopName}
            </h1>

            {customSub ? (
              <p className="mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-white/75 sm:mt-6 sm:text-[17px]">
                {customSub}
              </p>
            ) : activeProducts.length > 0 ? (
              <p className="mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-white/65 sm:mt-6 sm:text-[16px]">
                {activeProducts.length} sản phẩm
                {fromPrice ? ` · Từ ${fromPrice}` : ""}
              </p>
            ) : null}

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:mt-10 sm:gap-4">
              <a
                href="#products"
                className="store-press brand-cta-primary inline-flex h-12 cursor-pointer items-center justify-center rounded-full px-8 text-[13px] font-semibold tracking-wide text-white transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black sm:h-[52px] sm:px-9 sm:text-[14px]"
                style={{ backgroundColor: "var(--brand-accent, #F43F5E)" }}
              >
                {ctaLabel}
              </a>

              {heroProduct ? (
                <Link
                  href={buildStoreProductUrl(
                    sellerId,
                    heroProduct.id,
                    heroProduct.category,
                  )}
                  className="store-press brand-cta-secondary inline-flex h-12 cursor-pointer items-center justify-center rounded-full border border-white/30 bg-white/[0.06] px-7 text-[13px] font-semibold tracking-wide text-white backdrop-blur-md transition duration-200 hover:border-white/45 hover:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 sm:h-[52px] sm:px-8 sm:text-[14px]"
                >
                  {heroProduct.title.length > 26
                    ? `${heroProduct.title.slice(0, 26)}…`
                    : heroProduct.title}
                </Link>
              ) : activeProducts.length > 0 ? (
                <a
                  href="#story"
                  className="store-press brand-cta-secondary inline-flex h-12 cursor-pointer items-center justify-center rounded-full border border-white/30 bg-white/[0.06] px-7 text-[13px] font-semibold tracking-wide text-white backdrop-blur-md transition duration-200 hover:border-white/45 hover:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 sm:h-[52px] sm:px-8 sm:text-[14px]"
                >
                  Khám phá
                </a>
              ) : null}
            </div>
          </StoreReveal>
        </div>

        {/* Scroll cue */}
        <a
          href="#story"
          className="brand-scroll-cue absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 cursor-pointer flex-col items-center gap-2 text-white/40 transition hover:text-white/70 sm:flex"
          aria-label="Cuộn xuống"
        >
          <span className="text-[10px] font-medium tracking-[0.2em] uppercase">
            Scroll
          </span>
          <span className="brand-scroll-line block h-8 w-px bg-gradient-to-b from-white/50 to-transparent" />
        </a>
      </section>

      {/* ═══ META STRIP — trust / scan anchors ═══ */}
      {activeProducts.length > 0 ? (
        <div className="border-y border-white/[0.06] bg-black/40">
          <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-center gap-x-8 gap-y-3 px-5 py-4 text-[12px] tracking-wide text-white/50 sm:gap-x-12 sm:px-8 sm:text-[13px]">
            <span className="font-medium text-white/70">
              {activeProducts.length} sản phẩm
            </span>
            <span className="hidden h-3 w-px bg-white/15 sm:block" aria-hidden />
            <span>{shopName}</span>
            {fromPrice ? (
              <>
                <span className="hidden h-3 w-px bg-white/15 sm:block" aria-hidden />
                <span>Từ {fromPrice}</span>
              </>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* ═══ STORY CHAPTERS ═══ */}
      <div id="story" className="scroll-mt-20">
        {chapterA.length > 0 ? (
          <StoryChapter
            sellerId={sellerId}
            chapterIndex={0}
            products={chapterA}
            onQuickView={onQuickView}
          />
        ) : null}
        {chapterB.length > 0 ? (
          <StoryChapter
            sellerId={sellerId}
            chapterIndex={1}
            products={chapterB}
            reverse
            onQuickView={onQuickView}
          />
        ) : null}
      </div>

      {/* ═══ FEATURED SPOTLIGHT (3rd product, if available) ═══ */}
      {activeProducts[2] ? (
        <section
          className="border-t border-white/[0.06]"
          aria-labelledby="brand-spotlight"
        >
          <div className="mx-auto grid max-w-[1400px] grid-cols-1 lg:grid-cols-12">
            <div className="relative min-h-[360px] lg:col-span-7 lg:min-h-[480px]">
              {activeProducts[2].images[0] ? (
                <Image
                  src={shopImageUrl(activeProducts[2].images[0])}
                  alt=""
                  fill
                  className="object-cover"
                  unoptimized
                  sizes="(max-width: 1024px) 100vw, 58vw"
                />
              ) : (
                <div className="absolute inset-0 bg-neutral-900" />
              )}
              <div
                className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent lg:from-transparent lg:via-transparent lg:to-black/40"
                aria-hidden
              />
            </div>
            <div
              className="flex flex-col justify-center px-6 py-12 sm:px-10 sm:py-16 lg:col-span-5 lg:px-12 lg:py-20"
              style={{ backgroundColor: "var(--brand-surface, #171717)" }}
            >
              <StoreReveal variant="up">
                <p className="text-[11px] font-semibold tracking-[0.28em] text-white/45 uppercase">
                  Spotlight
                </p>
                <h2
                  id="brand-spotlight"
                  className="store-display mt-4 text-[1.75rem] leading-[1.15] tracking-[-0.02em] text-white sm:text-[2.125rem]"
                >
                  {activeProducts[2].title}
                </h2>
                <p className="mt-4 text-[15px] leading-relaxed text-white/55">
                  {formatPriceRange(activeProducts[2])}
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href={buildStoreProductUrl(
                      sellerId,
                      activeProducts[2].id,
                      activeProducts[2].category,
                    )}
                    className="store-press inline-flex h-11 cursor-pointer items-center rounded-full px-6 text-[13px] font-semibold text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                    style={{
                      backgroundColor: "var(--brand-accent, #F43F5E)",
                    }}
                  >
                    Xem chi tiết
                  </Link>
                  {onQuickView ? (
                    <button
                      type="button"
                      onClick={() => onQuickView(activeProducts[2])}
                      className="store-press inline-flex h-11 cursor-pointer items-center rounded-full border border-white/20 px-6 text-[13px] font-semibold text-white/80 transition hover:border-white/35 hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                    >
                      Xem nhanh
                    </button>
                  ) : null}
                </div>
              </StoreReveal>
            </div>
          </div>
        </section>
      ) : null}

      {/* ═══ PRODUCT ARCHIVE ═══ */}
      <section
        id="products"
        className="scroll-mt-24 border-t border-white/[0.06] py-14 sm:py-20"
        style={{ backgroundColor: "var(--brand-bg, #0A0A0A)" }}
        aria-labelledby="brand-products-heading"
      >
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <StoreReveal variant="up">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-[11px] font-semibold tracking-[0.28em] text-white/40 uppercase">
                  Collection
                </p>
                <h2
                  id="brand-products-heading"
                  className="store-display mt-2 text-[1.75rem] tracking-[-0.02em] text-white sm:text-[2.25rem]"
                >
                  Sản phẩm
                </h2>
              </div>
              {!loading && list.length > 0 ? (
                <p className="text-[13px] text-white/45 sm:pb-1">
                  {list.length} sản phẩm
                </p>
              ) : null}
            </div>
          </StoreReveal>

          {loading ? (
            <BrandSkeletonGrid />
          ) : list.length === 0 ? (
            <BrandEmptyState />
          ) : (
            <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5 xl:gap-6">
              {list.map((p, i) => (
                <BrandProductCard
                  key={p.id}
                  product={p}
                  sellerId={sellerId}
                  index={i}
                  onQuickView={onQuickView}
                  density="standard"
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ═══ REVIEWS ═══ */}
      {config.showReviews ? (
        <div
          className="border-t border-white/[0.06]"
          style={{ backgroundColor: "var(--brand-bg, #0A0A0A)" }}
        >
          <CustomerReviewsCarousel
            variant="editorial"
            className="!border-t-0"
          />
        </div>
      ) : null}
    </div>
  );
}
