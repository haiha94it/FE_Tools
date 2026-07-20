"use client";

import Button from "@/components/ui/button/Button";
import type { CampaignAttachType } from "@/types/message-media";
import Image from "next/image";
import { useRef } from "react";
import { HiOutlinePhotograph, HiOutlineTrash } from "react-icons/hi";
import CampaignMediaLibraryPicker from "./CampaignMediaLibraryPicker";

interface CampaignAttachmentFieldsProps {
  contentType: CampaignAttachType;
  images: string[];
  selectedMediaId: number | null;
  uploadingImage?: boolean;
  disabled?: boolean;
  resolveImageUrl: (path: string) => string;
  onContentTypeChange: (type: CampaignAttachType) => void;
  onImagesChange: (images: string[]) => void;
  onSelectedMediaIdChange: (id: number | null) => void;
  onUploadImage: (file: File) => Promise<string | null>;
}

const TYPE_OPTIONS: { value: CampaignAttachType; label: string }[] = [
  { value: "", label: "Không / chỉ text" },
  { value: "image", label: "1 ảnh" },
  { value: "video", label: "Gửi kèm video" },
  { value: "album", label: "Gửi kèm album" },
];

/**
 * Khối đính kèm chuẩn campaign mess: none | image | video | album.
 */
export default function CampaignAttachmentFields({
  contentType,
  images,
  selectedMediaId,
  uploadingImage = false,
  disabled = false,
  resolveImageUrl,
  onContentTypeChange,
  onImagesChange,
  onSelectedMediaIdChange,
  onUploadImage,
}: CampaignAttachmentFieldsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTypeChange = (next: CampaignAttachType) => {
    onContentTypeChange(next);
    if (next !== "image") onImagesChange([]);
    if (next !== "video" && next !== "album") onSelectedMediaIdChange(null);
  };

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (images.length >= 1) {
      return;
    }
    const path = await onUploadImage(file);
    if (path) onImagesChange([path]);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
        Đính kèm
      </p>
      <div className="flex flex-wrap gap-2">
        {TYPE_OPTIONS.map((opt) => {
          const active = contentType === opt.value;
          return (
            <button
              key={opt.value || "none"}
              type="button"
              disabled={disabled}
              onClick={() => handleTypeChange(opt.value)}
              className={`rounded-full px-3 py-1.5 text-theme-xs font-medium transition ${
                active
                  ? "bg-brand-500 text-white"
                  : "border border-gray-200 bg-white text-gray-600 hover:border-brand-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {contentType === "image" ? (
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Tối đa 1 ảnh. Từ 2 ảnh trở lên hãy dùng album.
            </p>
            <Button
              size="sm"
              variant="outline"
              disabled={disabled || uploadingImage || images.length >= 1}
              onClick={() => fileInputRef.current?.click()}
            >
              <HiOutlinePhotograph className="mr-1" size={14} />
              {uploadingImage ? "Đang tải..." : "Chọn ảnh"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              className="hidden"
              onChange={(e) => void handleFile(e)}
            />
          </div>
          {images[0] ? (
            <div className="relative inline-block">
              <span className="relative block h-24 w-24 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                <Image
                  src={resolveImageUrl(images[0])}
                  alt="attachment"
                  fill
                  unoptimized
                  className="object-cover"
                />
              </span>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onImagesChange([])}
                className="absolute -right-1 -top-1 rounded-full bg-error-500 p-0.5 text-white"
              >
                <HiOutlineTrash size={12} />
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {contentType === "video" ? (
        <CampaignMediaLibraryPicker
          mode="video"
          selectedId={selectedMediaId}
          disabled={disabled}
          onSelect={onSelectedMediaIdChange}
        />
      ) : null}

      {contentType === "album" ? (
        <CampaignMediaLibraryPicker
          mode="album"
          selectedId={selectedMediaId}
          disabled={disabled}
          onSelect={onSelectedMediaIdChange}
        />
      ) : null}
    </div>
  );
}
