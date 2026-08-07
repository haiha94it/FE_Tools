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
  /** inline — nhúng trong panel mobile; popover — nổi phía trên nút desktop */
  placement?: "inline" | "popover";
}

/** Shuffle in-place copy — random gợi ý khi không keyword */
function shuffleStickers(items: MessengerStickerItem[]): MessengerStickerItem[] {
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j]!;
    arr[j] = tmp!;
  }
  return arr;
}

/**
 * URL thumb picker — size nhỏ gọn, không phóng to vỡ nét.
 * Ưu tiên URL BE; fallback CDN Zalo eid size=64.
 */
function stickerPickerSrc(sticker: MessengerStickerItem): string | null {
  const raw = (sticker.thumb || sticker.url || "").trim();
  if (raw) return raw;
  if (sticker.id == null || sticker.id === "") return null;
  return `https://zalo-api.zadn.vn/api/emoticon/sticker/webpc?eid=${encodeURIComponent(String(sticker.id))}&size=64`;
}

function StickerPicker({
  accountId,
  open,
  onClose,
  onSelect,
  placement = "popover",
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
        // Không keyword → STICKERS_SEARCH (default pack + frequent), KHÔNG dùng suggest
        // (suggest bắt buộc keyword → empty "Không có sticker").
        // Search rỗng: shuffle random để picker tươi mỗi lần mở.
        const q = keyword.trim();
        const data = await zaloMessengerService.searchStickers(accountId, q, 48);
        if (!active) return;
        setStickers(q ? data : shuffleStickers(data));
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

  const panelClass =
    placement === "inline"
      ? "relative w-full overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
      : "absolute bottom-full left-0 z-30 mb-2 w-[min(100vw-2rem,320px)] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900";

  return (
    <div className={panelClass}>
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

      {/* grid 5 cột, cell compact — tránh sticker quá to/vỡ nét */}
      <div className="custom-scrollbar grid max-h-56 grid-cols-5 gap-1.5 overflow-y-auto p-2">
        {loading ? (
          <div className="col-span-5 flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          </div>
        ) : stickers.length === 0 ? (
          <p className="col-span-5 py-6 text-center text-xs text-gray-500">
            {keyword.trim() ? "Không có sticker" : "Đang tải sticker..."}
          </p>
        ) : (
          stickers.map((sticker) => {
            const src = stickerPickerSrc(sticker);
            return (
              <button
                key={`${sticker.catId ?? "c"}-${sticker.id}`}
                type="button"
                onClick={() => onSelect(sticker)}
                className="flex h-12 w-full items-center justify-center rounded-lg p-1 hover:bg-gray-50 dark:hover:bg-white/[0.03]"
              >
                {src ? (
                  <Image
                    src={src}
                    alt={sticker.name || "Sticker"}
                    width={40}
                    height={40}
                    unoptimized
                    className="h-10 w-10 object-contain"
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