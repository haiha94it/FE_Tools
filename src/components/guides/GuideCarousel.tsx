"use client";

import Button from "@/components/ui/button/Button";
import { getZaloGuideImageUrl } from "@/lib/zalo-guide-utils";
import type { ZaloGuideItem } from "@/types/zalo-guide";
import Image from "next/image";
import { useCallback, useRef } from "react";
import {
  HiOutlineArrowLeft,
  HiOutlineArrowRight,
  HiOutlinePencil,
  HiOutlinePlay,
  HiOutlineTrash,
} from "react-icons/hi";

interface GuideCarouselProps {
  items: ZaloGuideItem[];
  isAdmin: boolean;
  onSelect: (item: ZaloGuideItem) => void;
  onEdit: (item: ZaloGuideItem) => void;
  onDelete: (item: ZaloGuideItem) => void;
}

export default function GuideCarousel({
  items,
  isAdmin,
  onSelect,
  onEdit,
  onDelete,
}: GuideCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  const scroll = useCallback((direction: "left" | "right") => {
    const track = trackRef.current;
    if (!track) return;
    const amount = Math.max(track.clientWidth * 0.8, 260);
    track.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  }, []);

  if (items.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 px-6 dark:border-gray-700 dark:bg-white/[0.02]">
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          Chưa có bài hướng dẫn nào.
          {isAdmin ? " Bấm Thêm hướng dẫn để tạo mục đầu tiên." : null}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-end gap-2 sm:hidden">
        {items.length > 1 ? (
          <>
            <button
              type="button"
              aria-label="Cuộn trái"
              onClick={() => scroll("left")}
              className="flex size-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-theme-xs dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
            >
              <HiOutlineArrowLeft size={16} />
            </button>
            <button
              type="button"
              aria-label="Cuộn phải"
              onClick={() => scroll("right")}
              className="flex size-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-theme-xs dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
            >
              <HiOutlineArrowRight size={16} />
            </button>
          </>
        ) : null}
      </div>

      <div className="relative min-w-0">
        {items.length > 1 ? (
          <>
            <button
              type="button"
              aria-label="Cuộn trái"
              onClick={() => scroll("left")}
              className="absolute left-0 top-1/2 z-10 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-gray-600 shadow-theme-md sm:flex dark:border-gray-700 dark:bg-gray-900/95 dark:text-gray-300"
            >
              <HiOutlineArrowLeft size={16} />
            </button>
            <button
              type="button"
              aria-label="Cuộn phải"
              onClick={() => scroll("right")}
              className="absolute right-0 top-1/2 z-10 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-gray-600 shadow-theme-md sm:flex dark:border-gray-700 dark:bg-gray-900/95 dark:text-gray-300"
            >
              <HiOutlineArrowRight size={16} />
            </button>
          </>
        ) : null}

        <div
          ref={trackRef}
          className="custom-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 scroll-smooth sm:px-10"
        >
          {items.map((item) => {
            const thumb = getZaloGuideImageUrl(item.image);
            return (
              <article
                key={item.id}
                className="w-[min(100%,280px)] shrink-0 snap-start sm:w-[300px]"
              >
                <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs transition duration-200 hover:border-brand-200 hover:shadow-theme-md dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-brand-500/30">
                  <button
                    type="button"
                    onClick={() => onSelect(item)}
                    className="group flex flex-1 flex-col text-left transition hover:bg-brand-50/40 dark:hover:bg-brand-500/5"
                  >
                    <div className="relative aspect-[2/1] overflow-hidden bg-gray-100 dark:bg-gray-900">
                      {thumb ? (
                        <Image
                          src={thumb}
                          alt={item.title}
                          fill
                          unoptimized
                          className="object-cover transition duration-300 group-hover:scale-[1.02]"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-gray-400">
                          <HiOutlinePlay size={32} />
                        </div>
                      )}
                      <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/20">
                        <span className="flex size-10 items-center justify-center rounded-full bg-white/90 text-brand-600 opacity-0 shadow-theme-sm transition group-hover:opacity-100">
                          <HiOutlinePlay size={18} />
                        </span>
                      </span>
                    </div>
                    <div className="p-4">
                      <p className="line-clamp-2 min-h-[2.75rem] text-sm font-semibold leading-snug text-gray-900 dark:text-white/90">
                        {item.title}
                      </p>
                    </div>
                  </button>
                  {isAdmin ? (
                    <div className="flex gap-1.5 border-t border-gray-100 px-3 py-2 dark:border-gray-800">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => onEdit(item)}
                      >
                        <HiOutlinePencil size={14} className="mr-1" />
                        Sửa
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="!border-error-200 !text-error-600 hover:!bg-error-50"
                        onClick={() => onDelete(item)}
                      >
                        <HiOutlineTrash size={14} />
                      </Button>
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}