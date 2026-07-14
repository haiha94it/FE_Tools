"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

interface ProductGalleryProps {
  images: string[];
  title: string;
}

export default function ProductGallery({ images, title }: ProductGalleryProps) {
  const [activeImage, setActiveImage] = useState(0);
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
      if (e.key === "ArrowLeft") goTo(activeImage - 1);
      if (e.key === "ArrowRight") goTo(activeImage + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeImage, goTo]);

  if (count === 0) {
    return (
      <div className="store-pdp-gallery-main flex aspect-[4/5] items-center justify-center rounded-[2rem] bg-zinc-100 lg:aspect-[3/4]">
        <svg className="h-16 w-16 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
        </svg>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:gap-5">
      {count > 1 ? (
        <div className="order-2 flex gap-2.5 overflow-x-auto pb-1 lg:order-1 lg:w-[4.5rem] lg:flex-col lg:overflow-x-visible lg:pb-0">
          {images.map((src, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveImage(idx)}
              aria-label={`Ảnh ${idx + 1}`}
              aria-current={activeImage === idx}
              className={`store-pdp-thumb relative h-[4.5rem] w-[4.5rem] shrink-0 cursor-pointer overflow-hidden rounded-2xl transition-all duration-300 lg:h-[4.5rem] lg:w-full ${
                activeImage === idx ? "store-pdp-thumb-active" : "opacity-55 hover:opacity-100"
              }`}
            >
              <Image src={src} alt="" fill className="object-cover" sizes="72px" unoptimized />
            </button>
          ))}
        </div>
      ) : null}

      <div className="relative min-w-0 flex-1">
        <div className="store-pdp-gallery-main group relative aspect-[4/5] overflow-hidden rounded-[2rem] lg:aspect-[3/4] lg:rounded-[2.25rem]">
          <Image
            key={activeImage}
            src={images[activeImage]}
            alt={title}
            fill
            className="object-cover transition duration-700 ease-out"
            priority
            sizes="(max-width: 1024px) 100vw, 55vw"
            unoptimized
          />

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          {count > 1 ? (
            <>
              <button
                type="button"
                onClick={() => goTo(activeImage - 1)}
                className="absolute left-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/90 text-[var(--store-primary)] opacity-0 shadow-lg backdrop-blur-sm transition-all duration-300 hover:bg-white group-hover:opacity-100"
                aria-label="Ảnh trước"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => goTo(activeImage + 1)}
                className="absolute right-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/90 text-[var(--store-primary)] opacity-0 shadow-lg backdrop-blur-sm transition-all duration-300 hover:bg-white group-hover:opacity-100"
                aria-label="Ảnh sau"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </>
          ) : null}

          {count > 1 ? (
            <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/50 px-3.5 py-1.5 text-xs font-medium tracking-wide text-white backdrop-blur-md">
              {activeImage + 1} / {count}
            </div>
          ) : null}
        </div>

        {count > 1 ? (
          <div className="mt-4 hidden justify-center gap-1.5 sm:flex lg:hidden">
            {images.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImage(idx)}
                aria-label={`Ảnh ${idx + 1}`}
                className={`h-1.5 cursor-pointer rounded-full transition-all duration-300 ${
                  activeImage === idx
                    ? "w-6 bg-[var(--store-accent)]"
                    : "w-1.5 bg-[var(--store-primary)]/20 hover:bg-[var(--store-primary)]/40"
                }`}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}