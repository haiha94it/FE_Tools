"use client";

import type { PDPGalleryAspect } from "@/types/pdp-template";
import type { ShopProduct } from "@/types/zalo-shop";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

interface ProductGalleryProps {
  images: string[];
  title: string;
  product?: ShopProduct | null;
  discountPct?: number;
  aspect?: PDPGalleryAspect;
  /** stacked vertical images — no thumb strip */
  layout?: "thumbs" | "stacked" | "mosaic-grid";
  sticky?: boolean;
  className?: string;
}

function aspectClass(aspect: PDPGalleryAspect, layout: string) {
  if (layout === "stacked") return "aspect-[3/4]";
  if (aspect === "square") return "aspect-square";
  if (aspect === "wide") return "aspect-[16/10]";
  return "aspect-[4/5] lg:aspect-[3/4]";
}

export default function ProductGallery({
  images,
  title,
  product,
  discountPct = 0,
  aspect = "portrait",
  layout = "thumbs",
  sticky = true,
  className = "",
}: ProductGalleryProps) {
  const [activeImage, setActiveImage] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [zoom, setZoom] = useState({ x: 50, y: 50, on: false });
  const count = images.length;

  const goTo = useCallback(
    (index: number) => {
      if (count === 0) return;
      setActiveImage((index + count) % count);
    },
    [count],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (lightbox) {
        if (e.key === "Escape") setLightbox(false);
        if (e.key === "ArrowLeft") goTo(activeImage - 1);
        if (e.key === "ArrowRight") goTo(activeImage + 1);
        return;
      }
      if (e.key === "ArrowLeft") goTo(activeImage - 1);
      if (e.key === "ArrowRight") goTo(activeImage + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeImage, goTo, lightbox]);

  if (count === 0) {
    return (
      <div className="store-pdp-gallery-main flex aspect-[4/5] items-center justify-center rounded-[2rem] bg-zinc-100">
        <svg className="h-16 w-16 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
        </svg>
      </div>
    );
  }

  const badges = (
    <div className="pointer-events-none absolute left-3 top-3 z-20 flex flex-col gap-1.5">
      {discountPct > 0 ? (
        <span className="store-badge-flash rounded-md px-2.5 py-1 text-[11px] font-extrabold">
          -{discountPct}% OFF
        </span>
      ) : null}
      {product?.is_hot ? (
        <span className="store-badge-hot rounded-md px-2.5 py-1 text-[11px] font-extrabold uppercase">
          Bestseller
        </span>
      ) : null}
      <span className="rounded-md bg-white/95 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-800 shadow-sm ring-1 ring-slate-200/80">
        Official Store
      </span>
    </div>
  );

  /* Mosaic 2×2 grid */
  if (layout === "mosaic-grid") {
    const grid = images.slice(0, 4);
    while (grid.length < 4 && images[0]) grid.push(images[0]);
    return (
      <div className={className}>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {grid.map((src, idx) => (
            <button
              key={`${src}-${idx}`}
              type="button"
              onClick={() => {
                setActiveImage(idx % count);
                setLightbox(true);
              }}
              className="relative aspect-square cursor-pointer overflow-hidden rounded-2xl bg-slate-100"
            >
              <Image src={src} alt={`${title} ${idx + 1}`} fill className="object-cover" unoptimized sizes="50vw" />
              {idx === 0 ? badges : null}
            </button>
          ))}
        </div>
        {lightbox ? (
          <Lightbox
            images={images}
            active={activeImage}
            title={title}
            onClose={() => setLightbox(false)}
            onPrev={() => goTo(activeImage - 1)}
            onNext={() => goTo(activeImage + 1)}
            onSelect={setActiveImage}
          />
        ) : null}
      </div>
    );
  }

  /* Clean 2-column Editorial Gallery (Max 4 images + "+N" overflow badge) */
  if (layout === "stacked") {
    const displayImages = images.slice(0, 4);
    const remainingCount = images.length - 4;

    return (
      <div className={className}>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {displayImages.map((src, idx) => {
            const isLastWithMore = idx === 3 && remainingCount > 0;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setActiveImage(idx);
                  setLightbox(true);
                }}
                className="group relative block aspect-square w-full cursor-pointer overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100/60 shadow-xs transition-all duration-300 hover:shadow-md hover:border-slate-300"
              >
                <Image
                  src={src}
                  alt={`${title} ${idx + 1}`}
                  fill
                  className="object-contain p-2 transition-transform duration-500 group-hover:scale-105"
                  unoptimized
                  sizes="(max-width: 640px) 50vw, 25vw"
                  priority={idx === 0}
                />
                {idx === 0 ? badges : null}

                {isLastWithMore ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/65 text-white backdrop-blur-xs transition-colors duration-200 group-hover:bg-black/75">
                    <span className="text-2xl font-black sm:text-3xl">+{remainingCount}</span>
                    <span className="mt-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-200">
                      Xem tất cả ảnh
                    </span>
                  </div>
                ) : (
                  <div className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm backdrop-blur-xs opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
        {lightbox ? (
          <Lightbox
            images={images}
            active={activeImage}
            title={title}
            onClose={() => setLightbox(false)}
            onPrev={() => goTo(activeImage - 1)}
            onNext={() => goTo(activeImage + 1)}
            onSelect={setActiveImage}
          />
        ) : null}
      </div>
    );
  }

  /* Default thumbs + main with zoom */
  return (
    <div
      className={`${sticky ? "lg:sticky lg:top-24 lg:self-start" : ""} ${className}`}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:gap-4">
        {count > 1 ? (
          <div className="order-2 flex gap-2 overflow-x-auto pb-1 lg:order-1 lg:w-16 lg:flex-col lg:overflow-visible lg:pb-0">
            {images.map((src, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImage(idx)}
                aria-label={`Ảnh ${idx + 1}`}
                aria-current={activeImage === idx}
                className={`relative h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-xl transition-all duration-200 lg:h-16 lg:w-full ${
                  activeImage === idx
                    ? "ring-2 ring-[var(--store-accent)] ring-offset-2"
                    : "opacity-60 ring-1 ring-slate-200 hover:opacity-100"
                }`}
              >
                <Image src={src} alt="" fill className="object-cover" sizes="64px" unoptimized />
              </button>
            ))}
          </div>
        ) : null}

        <div className="relative min-w-0 flex-1">
          <div
            className={`store-pdp-gallery-main group relative overflow-hidden rounded-[1.75rem] bg-slate-100 ${aspectClass(aspect, layout)}`}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = ((e.clientX - rect.left) / rect.width) * 100;
              const y = ((e.clientY - rect.top) / rect.height) * 100;
              setZoom({ x, y, on: true });
            }}
            onMouseLeave={() => setZoom((z) => ({ ...z, on: false }))}
          >
            <Image
              key={activeImage}
              src={images[activeImage]}
              alt={title}
              fill
              className={`object-cover transition duration-300 ${
                zoom.on ? "scale-150" : "scale-100"
              }`}
              style={
                zoom.on
                  ? { transformOrigin: `${zoom.x}% ${zoom.y}%` }
                  : undefined
              }
              priority
              sizes="(max-width: 1024px) 100vw, 55vw"
              unoptimized
            />
            {badges}
            <button
              type="button"
              onClick={() => setLightbox(true)}
              className="absolute bottom-3 right-3 z-20 flex h-10 cursor-pointer items-center gap-1.5 rounded-full bg-white/95 px-3 text-xs font-bold text-slate-800 shadow-md backdrop-blur transition hover:bg-white"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
              </svg>
              Phóng to
            </button>
            {count > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => goTo(activeImage - 1)}
                  className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/90 shadow opacity-0 transition group-hover:opacity-100"
                  aria-label="Ảnh trước"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => goTo(activeImage + 1)}
                  className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/90 shadow opacity-0 transition group-hover:opacity-100"
                  aria-label="Ảnh sau"
                >
                  ›
                </button>
              </>
            ) : null}
            {count > 1 ? (
              <div className="absolute bottom-3 left-3 z-10 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-medium text-white">
                {activeImage + 1}/{count}
              </div>
            ) : null}
          </div>
        </div>
      </div>

        {lightbox ? (
          <Lightbox
            images={images}
            active={activeImage}
            title={title}
            onClose={() => setLightbox(false)}
            onPrev={() => goTo(activeImage - 1)}
            onNext={() => goTo(activeImage + 1)}
            onSelect={setActiveImage}
          />
        ) : null}
    </div>
  );
}

function Lightbox({
  images,
  active,
  title,
  onClose,
  onPrev,
  onNext,
  onSelect,
}: {
  images: string[];
  active: number;
  title: string;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSelect: (index: number) => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[99999] flex flex-col justify-between bg-slate-950/95 p-4 sm:p-6 backdrop-blur-2xl animate-in fade-in-0 duration-200"
      role="dialog"
      aria-modal
      aria-label="Xem ảnh đầy đủ"
      onClick={onClose}
    >
      {/* Background Ambient Glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink-500/10 blur-[160px]" />

      {/* Top Header Bar */}
      <div
        className="relative z-10 flex items-center justify-between gap-4 border-b border-white/10 pb-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-extrabold text-white backdrop-blur-md">
            {active + 1} / {images.length}
          </span>
          <h3 className="truncate text-sm font-semibold text-slate-200 sm:text-base">
            {title}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className="store-press flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white text-slate-900 shadow-xl transition-all hover:scale-105 hover:bg-slate-100"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Main Image Stage & Nav */}
      <div className="relative z-10 flex flex-1 items-center justify-center py-4">
        {/* Prev Button */}
        {images.length > 1 ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            aria-label="Ảnh trước"
            className="store-press absolute left-2 sm:left-4 z-20 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-white text-slate-900 shadow-[0_10px_30px_rgba(0,0,0,0.5)] ring-1 ring-black/10 transition-all hover:scale-110 active:scale-95"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        ) : null}

        {/* Center Canvas Card with 3D Depth */}
        <div
          className="relative h-full max-h-[65vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 p-3 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-md"
          onClick={(e) => e.stopPropagation()}
        >
          <Image
            src={images[active]}
            alt={title}
            fill
            className="object-contain p-2"
            unoptimized
            priority
            sizes="100vw"
          />
        </div>

        {/* Next Button */}
        {images.length > 1 ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            aria-label="Ảnh tiếp theo"
            className="store-press absolute right-2 sm:right-4 z-20 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-white text-slate-900 shadow-[0_10px_30px_rgba(0,0,0,0.5)] ring-1 ring-black/10 transition-all hover:scale-110 active:scale-95"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : null}
      </div>

      {/* Bottom Thumbnail Strip */}
      {images.length > 1 ? (
        <div
          className="relative z-10 flex justify-center border-t border-white/10 pt-3"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex max-w-full gap-2 overflow-x-auto px-2 py-1 scrollbar-none">
            {images.map((src, i) => {
              const activeItem = i === active;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => onSelect(i)}
                  className={`relative h-14 w-14 shrink-0 cursor-pointer overflow-hidden rounded-xl border transition-all duration-200 ${
                    activeItem
                      ? "border-pink-500 ring-2 ring-pink-500 scale-105 shadow-lg shadow-pink-500/30"
                      : "border-white/20 opacity-50 hover:opacity-100 hover:scale-102"
                  }`}
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    className="object-cover"
                    unoptimized
                    sizes="56px"
                  />
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
