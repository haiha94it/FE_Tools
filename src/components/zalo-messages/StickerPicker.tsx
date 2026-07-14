"use client";

import { zaloMessengerService } from "@/services/zalo-messenger.service";
import type { MessengerStickerItem } from "@/types/zalo-messenger";
import Image from "next/image";
import { memo, useEffect, useState } from "react";

interface StickerPickerProps {
  accountId: number;
  open: boolean;
  onClose: () => void;
  onSelect: (sticker: MessengerStickerItem) => void;
}

function StickerPicker({
  accountId,
  open,
  onClose,
  onSelect,
}: StickerPickerProps) {
  const [stickers, setStickers] = useState<MessengerStickerItem[]>([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !accountId) return undefined;

    let active = true;
    setLoading(true);

    const load = async () => {
      try {
        const data = keyword.trim()
          ? await zaloMessengerService.searchStickers(
              accountId,
              keyword.trim(),
            )
          : await zaloMessengerService.fetchStickerSuggest(accountId);
        if (active) setStickers(data);
      } catch {
        if (active) setStickers([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    const timer = window.setTimeout(() => {
      void load();
    }, keyword ? 300 : 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [accountId, keyword, open]);

  if (!open) return null;

  return (
    <div className="absolute bottom-full left-0 z-30 mb-2 w-[min(100vw-2rem,320px)] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2 dark:border-gray-800">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Tìm sticker..."
          className="h-8 flex-1 rounded-lg border border-gray-200 bg-gray-50 px-2.5 text-sm outline-none focus:border-brand-300 dark:border-gray-700 dark:bg-gray-800"
        />
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          Đóng
        </button>
      </div>

      <div className="custom-scrollbar grid max-h-52 grid-cols-4 gap-2 overflow-y-auto p-2">
        {loading ? (
          <div className="col-span-4 flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          </div>
        ) : stickers.length === 0 ? (
          <p className="col-span-4 py-6 text-center text-xs text-gray-500">
            Không có sticker
          </p>
        ) : (
          stickers.map((sticker) => {
            const src = sticker.thumb || sticker.url;
            return (
              <button
                key={`${sticker.catId ?? "c"}-${sticker.id}`}
                type="button"
                onClick={() => onSelect(sticker)}
                className="flex aspect-square items-center justify-center rounded-xl hover:bg-gray-50 dark:hover:bg-white/[0.03]"
              >
                {src ? (
                  <Image
                    src={src}
                    alt={sticker.name || "Sticker"}
                    width={64}
                    height={64}
                    unoptimized
                    className="h-14 w-14 object-contain"
                  />
                ) : (
                  <span className="text-[10px] text-gray-400">#{sticker.id}</span>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

export default memo(StickerPicker);