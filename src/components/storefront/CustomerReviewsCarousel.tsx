"use client";

import StoreReveal from "@/components/storefront/StoreReveal";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

interface ReviewItem {
  id: number;
  name: string;
  avatar: string;
  rating: number;
  date: string;
  comment: string;
  productTitle: string;
  productImage: string;
  verified: boolean;
}

const REVIEWS: ReviewItem[] = [
  {
    id: 1,
    name: "Trần Minh Hoàng",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    rating: 5,
    date: "2 ngày trước",
    comment:
      "Giao hàng siêu nhanh chỉ trong 2h! Hàng đóng gói nguyên seal tem mác chính hãng, chất lượng cực kỳ ưng ý.",
    productTitle: "Tai Nghe Wireless Pro Z1",
    productImage:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&auto=format&fit=crop&q=80",
    verified: true,
  },
  {
    id: 2,
    name: "Nguyễn Hương Giang",
    avatar:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80",
    rating: 5,
    date: "1 tuần trước",
    comment:
      "Shop hỗ trợ nhiệt tình qua Zalo. Kiểm hàng COD trước khi thanh toán. Sản phẩm đúng mô tả 100%.",
    productTitle: "Loa Bluetooth Ambient X",
    productImage:
      "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=200&auto=format&fit=crop&q=80",
    verified: true,
  },
  {
    id: 3,
    name: "Lê Quốc Bảo",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    rating: 5,
    date: "3 ngày trước",
    comment:
      "Giá hời đợt Flash Sale, chất âm bass uy lực vượt tầm giá. Sẽ tiếp tục ủng hộ shop lâu dài!",
    productTitle: "Đồng Hồ Thông Minh Sport V2",
    productImage:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=80",
    verified: true,
  },
  {
    id: 4,
    name: "Phạm Thu Hà",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80",
    rating: 5,
    date: "5 ngày trước",
    comment:
      "Đóng gói cẩn thận, nhân viên tư vấn chọn đúng model. Rất đáng tin cậy cho lần mua tiếp theo.",
    productTitle: "Cáp sạc nhanh USB-C Pro",
    productImage:
      "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=200&auto=format&fit=crop&q=80",
    verified: true,
  },
];

export type ReviewsVariant = "default" | "editorial" | "dense" | "minimal";

interface CustomerReviewsCarouselProps {
  variant?: ReviewsVariant;
  className?: string;
  /** Auto marquee speed in px/sec (default 36) */
  speed?: number;
}

function ReviewCard({
  review,
  isEditorial,
  isDense,
  isMinimal,
}: {
  review: ReviewItem;
  isEditorial: boolean;
  isDense: boolean;
  isMinimal: boolean;
}) {
  return (
    <article
      className={`flex w-[min(300px,82vw)] shrink-0 flex-col p-4 sm:w-[300px] sm:p-5 ${
        isMinimal
          ? "rounded-none border border-[color-mix(in_srgb,var(--store-primary)_12%,transparent)]"
          : isEditorial
            ? "rounded-none border border-[color-mix(in_srgb,var(--store-primary)_12%,transparent)] bg-[var(--store-surface)]"
            : isDense
              ? "rounded-xl border border-[color-mix(in_srgb,var(--store-accent)_20%,transparent)] shadow-sm"
              : "rounded-2xl border border-[color-mix(in_srgb,var(--store-primary)_8%,transparent)] shadow-sm"
      }`}
      style={{
        backgroundColor: isMinimal
          ? "var(--store-surface)"
          : isDense
            ? "color-mix(in srgb, var(--store-accent) 4%, var(--store-surface))"
            : "var(--store-surface)",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full"
          style={{
            backgroundColor:
              "color-mix(in srgb, var(--store-primary) 8%, var(--store-bg))",
            boxShadow: "0 0 0 2px var(--store-surface)",
          }}
        >
          <Image
            src={review.avatar}
            alt=""
            fill
            className="object-cover"
            unoptimized
            sizes="44px"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-bold text-[var(--store-primary)]">
              {review.name}
            </p>
            {review.verified ? (
              <span
                className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold"
                style={{
                  backgroundColor:
                    "color-mix(in srgb, #10b981 12%, var(--store-surface))",
                  color: "#047857",
                }}
              >
                Đã mua
              </span>
            ) : null}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5">
            <div className="flex text-amber-400" aria-label={`${review.rating} sao`}>
              {Array.from({ length: review.rating }).map((_, i) => (
                <svg key={i} className="h-3 w-3 fill-current" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-[11px] text-[var(--store-muted)]">
              {review.date}
            </span>
          </div>
        </div>
      </div>

      <p
        className={`mt-3 flex-1 text-sm leading-relaxed text-[var(--store-primary)]/80 ${
          isEditorial ? "italic" : ""
        }`}
      >
        &ldquo;{review.comment}&rdquo;
      </p>

      <div
        className="mt-4 flex items-center gap-2.5 border-t pt-3"
        style={{
          borderColor:
            "color-mix(in srgb, var(--store-primary) 10%, transparent)",
        }}
      >
        <div
          className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg"
          style={{
            backgroundColor: "var(--store-bg)",
            boxShadow:
              "0 0 0 1px color-mix(in srgb, var(--store-primary) 10%, transparent)",
          }}
        >
          <Image
            src={review.productImage}
            alt=""
            fill
            className="object-cover"
            unoptimized
            sizes="40px"
          />
        </div>
        <p className="truncate text-xs font-semibold text-[var(--store-muted)]">
          {review.productTitle}
        </p>
      </div>
    </article>
  );
}

/**
 * Auto-scrolling review marquee — pauses on hover / focus / touch.
 * Loop vô hạn bằng duplicate track + CSS transform.
 */
export default function CustomerReviewsCarousel({
  variant = "default",
  className = "",
  speed = 36,
}: CustomerReviewsCarouselProps) {
  const isEditorial = variant === "editorial";
  const isDense = variant === "dense";
  const isMinimal = variant === "minimal";

  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const pausedRef = useRef(false);
  const rafRef = useRef(0);
  const lastTsRef = useRef(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Duplicate list for seamless loop
  const loopItems = [...REVIEWS, ...REVIEWS];

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  const tick = useCallback(
    (ts: number) => {
      const track = trackRef.current;
      if (!track) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      if (!lastTsRef.current) lastTsRef.current = ts;
      const dt = Math.min(48, ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;

      if (!pausedRef.current) {
        offsetRef.current += speed * dt;
        // Half width = one full set of reviews
        const half = track.scrollWidth / 2;
        if (half > 0 && offsetRef.current >= half) {
          offsetRef.current -= half;
        }
        track.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;
      }

      rafRef.current = requestAnimationFrame(tick);
    },
    [speed],
  );

  useEffect(() => {
    if (reducedMotion) return;
    lastTsRef.current = 0;
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [tick, reducedMotion]);

  const pause = () => setPaused(true);
  const resume = () => setPaused(false);

  const step = (dir: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    const cardW = 316; // ~300 + gap
    offsetRef.current += dir * cardW;
    const half = track.scrollWidth / 2;
    if (half > 0) {
      if (offsetRef.current < 0) offsetRef.current += half;
      if (offsetRef.current >= half) offsetRef.current -= half;
    }
    track.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;
    track.style.transition = "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)";
    window.setTimeout(() => {
      if (track) track.style.transition = "";
    }, 420);
  };

  return (
    <section
      id="reviews"
      className={`border-t py-10 sm:py-14 ${className}`}
      style={{
        borderColor: "color-mix(in srgb, var(--store-primary) 10%, transparent)",
        backgroundColor:
          isEditorial || isMinimal
            ? "transparent"
            : "color-mix(in srgb, var(--store-surface) 92%, var(--store-bg))",
      }}
      aria-labelledby="reviews-heading"
    >
      <div
        className={`mx-auto px-4 sm:px-6 ${
          isEditorial || isMinimal ? "max-w-6xl" : "max-w-7xl"
        }`}
      >
        <StoreReveal
          variant="up"
          className={`mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between ${
            isEditorial || isMinimal ? "sm:flex-col sm:items-center sm:text-center" : ""
          }`}
        >
          <div className={isEditorial || isMinimal ? "text-center" : ""}>
            <div
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold"
              style={{
                borderColor:
                  "color-mix(in srgb, var(--store-accent) 35%, transparent)",
                backgroundColor:
                  "color-mix(in srgb, var(--store-accent) 10%, var(--store-surface))",
                color: "var(--store-accent)",
              }}
            >
              <svg
                className="h-3.5 w-3.5 fill-current"
                viewBox="0 0 20 20"
                aria-hidden
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              4.9/5 · +5.000 khách hài lòng
            </div>
            <h2
              id="reviews-heading"
              className={`store-display mt-2.5 text-[var(--store-primary)] ${
                isEditorial
                  ? "text-2xl sm:text-4xl"
                  : isMinimal
                    ? "text-2xl font-normal tracking-tight sm:text-3xl"
                    : "text-2xl sm:text-3xl"
              }`}
            >
              Khách hàng nói gì?
            </h2>
            <p
              className={`mt-1 text-sm text-[var(--store-muted)] ${
                isEditorial || isMinimal ? "mx-auto max-w-md" : ""
              }`}
            >
              Đánh giá thật từ đơn hàng đã xác thực
              {!reducedMotion ? " · Tự động cuộn" : ""}
            </p>
          </div>

          {!reducedMotion ? (
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => step(-1)}
                className="store-press flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border text-[var(--store-primary)] transition hover:bg-[var(--store-surface)]"
                style={{
                  borderColor:
                    "color-mix(in srgb, var(--store-primary) 14%, transparent)",
                  backgroundColor: "var(--store-surface)",
                }}
                aria-label="Đánh giá trước"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => setPaused((p) => !p)}
                className="store-press flex h-10 min-w-10 cursor-pointer items-center justify-center rounded-full border px-3 text-xs font-bold text-[var(--store-primary)]"
                style={{
                  borderColor:
                    "color-mix(in srgb, var(--store-primary) 14%, transparent)",
                  backgroundColor: "var(--store-surface)",
                }}
                aria-label={paused ? "Tiếp tục cuộn" : "Tạm dừng"}
              >
                {paused ? "▶" : "❚❚"}
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                className="store-press flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border text-[var(--store-primary)] transition hover:bg-[var(--store-surface)]"
                style={{
                  borderColor:
                    "color-mix(in srgb, var(--store-primary) 14%, transparent)",
                  backgroundColor: "var(--store-surface)",
                }}
                aria-label="Đánh giá sau"
              >
                ›
              </button>
            </div>
          ) : null}
        </StoreReveal>

        {/* Auto marquee track */}
        <div
          className="relative -mx-4 overflow-hidden sm:mx-0"
          onMouseEnter={pause}
          onMouseLeave={resume}
          onFocusCapture={pause}
          onBlurCapture={resume}
          onTouchStart={pause}
          onTouchEnd={resume}
        >
          {/* Edge fade */}
          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 sm:w-12"
            style={{
              background:
                "linear-gradient(90deg, color-mix(in srgb, var(--store-bg, #0a0a0a) 95%, transparent), transparent)",
            }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 sm:w-12"
            style={{
              background:
                "linear-gradient(270deg, color-mix(in srgb, var(--store-bg, #0a0a0a) 95%, transparent), transparent)",
            }}
            aria-hidden
          />

          {reducedMotion ? (
            <div className="store-scroll-x flex gap-3 px-4 pb-1 sm:gap-4 sm:px-0">
              {REVIEWS.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  isEditorial={isEditorial}
                  isDense={isDense}
                  isMinimal={isMinimal}
                />
              ))}
            </div>
          ) : (
            <div
              ref={trackRef}
              className="flex w-max gap-3 px-4 will-change-transform sm:gap-4 sm:px-0"
              style={{ transform: "translate3d(0,0,0)" }}
            >
              {loopItems.map((review, idx) => (
                <ReviewCard
                  key={`${review.id}-${idx}`}
                  review={review}
                  isEditorial={isEditorial}
                  isDense={isDense}
                  isMinimal={isMinimal}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
