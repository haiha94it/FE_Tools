"use client";

import Button from "@/components/ui/button/Button";
import type { ZaloResourceItem } from "@/types/zalo-resource";
import { useCallback, useRef } from "react";
import {
  HiOutlineArrowLeft,
  HiOutlineArrowRight,
  HiOutlineExternalLink,
  HiOutlinePencil,
  HiOutlineTrash,
} from "react-icons/hi";

interface ResourceCarouselProps {
  items: ZaloResourceItem[];
  isAdmin: boolean;
  onEdit: (item: ZaloResourceItem) => void;
  onDelete: (item: ZaloResourceItem) => void;
}

export default function ResourceCarousel({
  items,
  isAdmin,
  onEdit,
  onDelete,
}: ResourceCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  const scroll = useCallback((direction: "left" | "right") => {
    const track = trackRef.current;
    if (!track) return;
    const amount = Math.max(track.clientWidth * 0.85, 280);
    track.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  }, []);

  if (items.length === 0) {
    return (
      <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gradient-to-br from-brand-50/40 to-white px-6 dark:border-gray-700 dark:from-brand-500/5 dark:to-transparent">
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          Chưa có banner tài nguyên nào.
          {isAdmin ? " Bấm Thêm banner để tạo mục đầu tiên." : null}
        </p>
      </div>
    );
  }

  return (
    <div className="group/carousel">
      <div className="mb-3 flex items-center justify-end gap-2 sm:hidden">
        {items.length > 1 ? (
          <>
            <button
              type="button"
              aria-label="Cuộn trái"
              onClick={() => scroll("left")}
              className="flex size-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-theme-xs transition hover:border-brand-200 hover:text-brand-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
            >
              <HiOutlineArrowLeft size={16} />
            </button>
            <button
              type="button"
              aria-label="Cuộn phải"
              onClick={() => scroll("right")}
              className="flex size-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-theme-xs transition hover:border-brand-200 hover:text-brand-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
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
              className="absolute left-0 top-1/2 z-10 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-gray-600 shadow-theme-md transition hover:border-brand-200 hover:text-brand-600 sm:flex dark:border-gray-700 dark:bg-gray-900/95 dark:text-gray-300"
            >
              <HiOutlineArrowLeft size={16} />
            </button>
            <button
              type="button"
              aria-label="Cuộn phải"
              onClick={() => scroll("right")}
              className="absolute right-0 top-1/2 z-10 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-gray-600 shadow-theme-md transition hover:border-brand-200 hover:text-brand-600 sm:flex dark:border-gray-700 dark:bg-gray-900/95 dark:text-gray-300"
            >
              <HiOutlineArrowRight size={16} />
            </button>
          </>
        ) : null}

        <div
          ref={trackRef}
          className="custom-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-0 pb-2 scroll-smooth sm:px-10"
        >
        {items.map((item) => (
          <article
            key={item.id}
            className="group/card relative min-w-[min(100%,320px)] flex-1 snap-start sm:min-w-[340px] sm:max-w-[380px]"
          >
            <div className="flex h-full flex-col justify-between rounded-2xl border border-gray-200/80 bg-gradient-to-br from-white via-white to-brand-50/30 p-5 shadow-theme-xs transition duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-theme-md dark:border-gray-800 dark:from-white/[0.04] dark:via-white/[0.02] dark:to-brand-500/5 dark:hover:border-brand-500/30">
              <div>
                <p className="line-clamp-3 text-base font-semibold leading-snug text-gray-900 dark:text-white/90">
                  {item.content}
                </p>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600"
                >
                  Xem ngay
                  <HiOutlineExternalLink size={14} />
                </a>
                {isAdmin ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit(item)}
                      className="!px-2.5"
                    >
                      <HiOutlinePencil size={14} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="!border-error-200 !text-error-600 hover:!bg-error-50 !px-2.5"
                      onClick={() => onDelete(item)}
                    >
                      <HiOutlineTrash size={14} />
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
          </article>
        ))}
        </div>
      </div>
    </div>
  );
}