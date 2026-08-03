"use client";

import Label from "@/components/form/Label";
import type { SupportMedia } from "@/types/support-chatbot";
import { useMemo, useState } from "react";
import { FiEye, FiX } from "react-icons/fi";
import SupportImageLightbox from "./SupportImageLightbox";

interface SupportMediaPickerProps {
  media: SupportMedia[];
  mediaIds: number[];
  mediaLoading?: boolean;
  uploading?: boolean;
  disabled?: boolean;
  onToggle: (id: number) => void;
  onUpload: (file: File) => void | Promise<void>;
  onDeselect?: (id: number) => void;
}

export default function SupportMediaPicker({
  media,
  mediaIds,
  mediaLoading,
  uploading,
  disabled,
  onToggle,
  onUpload,
  onDeselect,
}: SupportMediaPickerProps) {
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  const selectedMedia = useMemo(() => {
    const byId = new Map(media.map((m) => [m.id, m]));
    return mediaIds
      .map((id) => byId.get(id))
      .filter((m): m is SupportMedia => Boolean(m));
  }, [media, mediaIds]);

  const openPreview = (url?: string | null) => {
    if (!url) return;
    setPreviewSrc(url);
  };

  const handleDeselect = (id: number) => {
    if (onDeselect) {
      onDeselect(id);
      return;
    }
    onToggle(id);
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <Label>Ảnh đính kèm</Label>
          <p className="mt-0.5 text-[11px] text-gray-500">
            Có ảnh thì bot gửi tất cả ảnh kèm câu trả lời. Click ảnh để phóng to
            (giữ đúng tỷ lệ).
          </p>
        </div>
        <label
          className={`cursor-pointer text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400 ${
            disabled || uploading ? "pointer-events-none opacity-50" : ""
          }`}
        >
          {uploading ? "Đang tải…" : "+ Upload ảnh"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading || disabled}
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              e.target.value = "";
              if (f) void onUpload(f);
            }}
          />
        </label>
      </div>

      {/* Ảnh đã chọn — xem lại đúng ratio */}
      {selectedMedia.length > 0 ? (
        <div className="mb-3 rounded-lg border border-brand-200 bg-brand-50/40 p-2 dark:border-brand-500/30 dark:bg-brand-500/5">
          <p className="mb-1.5 text-[11px] font-medium text-gray-600 dark:text-gray-400">
            Đã chọn {selectedMedia.length} ảnh — bấm ảnh để zoom
          </p>
          <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto">
            {selectedMedia.map((m) => (
              <div
                key={m.id}
                className="group relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
              >
                {m.url ? (
                  <button
                    type="button"
                    title="Phóng to"
                    onClick={() => openPreview(m.url)}
                    className="flex h-full w-full items-center justify-center p-1"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={m.url}
                      alt={`Ảnh #${m.id}`}
                      className="max-h-full max-w-full object-contain"
                    />
                  </button>
                ) : (
                  <span className="text-[10px] text-gray-400">#{m.id}</span>
                )}
                <button
                  type="button"
                  title="Bỏ chọn"
                  disabled={disabled}
                  onClick={() => handleDeselect(m.id)}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white opacity-90 transition hover:bg-black/75"
                >
                  <FiX size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {mediaLoading ? (
        <p className="text-xs text-gray-500">Đang tải thư viện ảnh…</p>
      ) : media.length === 0 ? (
        <p className="text-xs text-gray-500">
          Chưa có ảnh. Upload để gắn vào câu trả lời.
        </p>
      ) : (
        <div className="grid max-h-48 grid-cols-4 gap-2 overflow-y-auto">
          {media.map((m) => {
            const selected = mediaIds.includes(m.id);
            return (
              <div
                key={m.id}
                className={`relative overflow-hidden rounded-lg border-2 bg-gray-50 dark:bg-gray-900 ${
                  selected
                    ? "border-brand-500 ring-2 ring-brand-500/30"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                <button
                  type="button"
                  title={selected ? "Bỏ chọn" : "Chọn ảnh"}
                  disabled={disabled}
                  onClick={() => onToggle(m.id)}
                  className="flex aspect-square w-full items-center justify-center p-1"
                >
                  {m.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.url}
                      alt={`Thư viện #${m.id}`}
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-[10px] text-gray-400">#{m.id}</span>
                  )}
                </button>
                {m.url ? (
                  <button
                    type="button"
                    title="Phóng to"
                    onClick={() => openPreview(m.url)}
                    className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-md bg-black/55 text-white transition hover:bg-black/75"
                  >
                    <FiEye size={12} />
                  </button>
                ) : null}
                {selected ? (
                  <span className="absolute left-1 top-1 rounded bg-brand-500 px-1 text-[9px] font-semibold text-white">
                    ✓
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      <SupportImageLightbox
        src={previewSrc}
        onClose={() => setPreviewSrc(null)}
      />
    </div>
  );
}
