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
          />
        ) : null}
      </div>
    );
  }

  /* Stacked editorial images */
  if (layout === "stacked") {
    return (
      <div className={`space-y-3 sm:space-y-4 ${className}`}>
        {images.map((src, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setActiveImage(idx);
              setLightbox(true);
            }}
            className="relative block w-full cursor-pointer overflow-hidden rounded-none bg-slate-100"
          >
            <div className="relative aspect-[3/4] w-full">
              <Image
                src={src}
                alt={`${title} ${idx + 1}`}
                fill
                className="object-cover"
                unoptimized
                sizes="(max-width: 1024px) 100vw, 55vw"
                priority={idx === 0}
              />
              {idx === 0 ? badges : null}
            </div>
          </button>
        ))}
        {lightbox ? (
          <Lightbox
            images={images}
            active={activeImage}
            title={title}
            onClose={() => setLightbox(false)}
            onPrev={() => goTo(activeImage - 1)}
            onNext={() => goTo(activeImage + 1)}
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
}: {
  images: string[];
  active: number;
  title: string;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/90 p-4"
      role="dialog"
      aria-modal
      aria-label="Xem ảnh đầy đủ"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
        aria-label="Đóng"
      >
        ✕
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onPrev();
        }}
        className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/15 text-xl text-white"
      >
        ‹
      </button>
      <div
        className="relative h-[80vh] w-full max-w-4xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={images[active]}
          alt={title}
          fill
          className="object-contain"
          unoptimized
          sizes="100vw"
        />
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onNext();
        }}
        className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/15 text-xl text-white"
      >
        ›
      </button>
      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/80">
        {active + 1} / {images.length}
      </p>
    </div>
  );
}
