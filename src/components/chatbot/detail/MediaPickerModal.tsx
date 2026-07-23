"use client";

import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { getTrainingImageUrl } from "@/lib/chatbot-utils";
import type { TrainingImage } from "@/types/chatbot";

interface MediaPickerModalProps {
  isOpen: boolean;
  images: TrainingImage[];
  selectedIds: number[];
  maxSelect?: number;
  isLoading?: boolean;
  onClose: () => void;
  onToggle: (id: number) => void;
  onConfirm: () => void;
  onClear: () => void;
}

export default function MediaPickerModal({
  isOpen,
  images,
  selectedIds,
  maxSelect,
  isLoading = false,
  onClose,
  onToggle,
  onConfirm,
  onClear,
}: MediaPickerModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl">
      <div className="flex max-h-[80dvh] flex-col p-6 sm:p-8">
        <div className="pr-10">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Chọn ảnh từ thư viện
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Đã chọn {selectedIds.length}
            {maxSelect != null ? ` / ${maxSelect}` : ""} ảnh
          </p>
        </div>

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
          {isLoading ? (
            <p className="py-10 text-center text-sm text-gray-500">
              Đang tải ảnh…
            </p>
          ) : images.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-500">
              Thư viện trống. Hãy upload ảnh ở tab Thư viện ảnh.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {images.map((image) => {
                const selected = selectedIds.includes(image.id);
                const atMax =
                  maxSelect != null &&
                  !selected &&
                  selectedIds.length >= maxSelect;
                const src = getTrainingImageUrl(image);
                return (
                  <button
                    key={image.id}
                    type="button"
                    disabled={atMax}
                    onClick={() => onToggle(image.id)}
                    className={`relative aspect-square cursor-pointer overflow-hidden rounded-xl border-2 transition ${
                      selected
                        ? "border-brand-500 ring-2 ring-brand-500/30"
                        : "border-transparent opacity-90 hover:opacity-100"
                    } ${atMax ? "cursor-not-allowed opacity-40" : ""}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`Ảnh #${image.id}`}
                      className="h-full w-full object-cover"
                    />
                    {selected ? (
                      <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
                        ✓
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
          <Button size="sm" variant="outline" onClick={onClear}>
            Bỏ chọn
          </Button>
          <Button size="sm" variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button size="sm" onClick={onConfirm}>
            Xác nhận
          </Button>
        </div>
      </div>
    </Modal>
  );
}
