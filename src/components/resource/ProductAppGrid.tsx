"use client";

import Button from "@/components/ui/button/Button";
import { getZaloResourceImageUrl } from "@/lib/zalo-resource-utils";
import type { ZaloProductAppItem } from "@/types/zalo-resource";
import Image from "next/image";
import {
  HiOutlineExternalLink,
  HiOutlinePencil,
  HiOutlineTrash,
} from "react-icons/hi";

interface ProductAppGridProps {
  items: ZaloProductAppItem[];
  isAdmin: boolean;
  onEdit: (item: ZaloProductAppItem) => void;
  onDelete: (item: ZaloProductAppItem) => void;
}

export default function ProductAppGrid({
  items,
  isAdmin,
  onEdit,
  onDelete,
}: ProductAppGridProps) {
  if (items.length === 0) {
    return (
      <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 px-6 dark:border-gray-700 dark:bg-white/[0.02]">
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          Chưa có sản phẩm / ứng dụng nào.
          {isAdmin ? " Bấm Thêm sản phẩm để tạo mục đầu tiên." : null}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => {
        const imageUrl = getZaloResourceImageUrl(item.image);
        return (
          <article
            key={item.id}
            className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs transition duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-theme-md dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-brand-500/30"
          >
            <div className="relative aspect-[16/10] overflow-hidden bg-gray-100 dark:bg-gray-900">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={item.title}
                  fill
                  unoptimized
                  className="object-cover transition duration-300 group-hover:scale-[1.02]"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-gray-400">
                  Không có ảnh
                </div>
              )}
              {isAdmin ? (
                <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => onEdit(item)}
                    className="flex size-9 items-center justify-center rounded-lg border border-gray-200 bg-white/95 text-gray-700 shadow-theme-xs transition hover:text-brand-600 dark:border-gray-700 dark:bg-gray-900/95 dark:text-gray-200"
                    aria-label="Sửa"
                  >
                    <HiOutlinePencil size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(item)}
                    className="flex size-9 items-center justify-center rounded-lg border border-error-200 bg-white/95 text-error-600 shadow-theme-xs transition hover:bg-error-50 dark:border-error-500/30 dark:bg-gray-900/95"
                    aria-label="Xóa"
                  >
                    <HiOutlineTrash size={16} />
                  </button>
                </div>
              ) : null}
            </div>
            <div className="flex flex-1 flex-col p-5">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white/90">
                {item.title}
              </h3>
              <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {item.content}
              </p>
              <div className="mt-4">
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-medium text-brand-700 transition hover:bg-brand-100 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300"
                >
                  Xem ngay
                  <HiOutlineExternalLink size={14} />
                </a>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}