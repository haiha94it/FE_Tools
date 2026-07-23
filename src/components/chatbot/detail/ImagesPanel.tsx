"use client";

import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { confirm } from "@/lib/confirm";
import { getTrainingImageUrl, isValidImageFile } from "@/lib/chatbot-utils";
import { toast } from "@/lib/toast";
import { useChatbotTrainingStore } from "@/stores/use-chatbot-training-store";
import { useEffect, useRef } from "react";

interface ImagesPanelProps {
  chatbotId: number;
}

export default function ImagesPanel({ chatbotId }: ImagesPanelProps) {
  const setChatbotId = useChatbotTrainingStore((s) => s.setChatbotId);
  const images = useChatbotTrainingStore((s) => s.images);
  const imageCount = useChatbotTrainingStore((s) => s.imageCount);
  const maxUpload = useChatbotTrainingStore((s) => s.maxUpload);
  const isLoadingImages = useChatbotTrainingStore((s) => s.isLoadingImages);
  const isUploading = useChatbotTrainingStore((s) => s.isUploading);
  const selectedImageIds = useChatbotTrainingStore((s) => s.selectedImageIds);
  const fetchImages = useChatbotTrainingStore((s) => s.fetchImages);
  const uploadImages = useChatbotTrainingStore((s) => s.uploadImages);
  const deleteImages = useChatbotTrainingStore((s) => s.deleteImages);
  const toggleSelectImage = useChatbotTrainingStore((s) => s.toggleSelectImage);
  const clearSelectedImages = useChatbotTrainingStore(
    (s) => s.clearSelectedImages,
  );

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setChatbotId(chatbotId);
    void fetchImages();
  }, [chatbotId, setChatbotId, fetchImages]);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList?.length) return;
    const files = Array.from(fileList);
    const valid: File[] = [];
    for (const file of files) {
      const check = isValidImageFile(file);
      if (!check.ok) {
        toast.error(`${file.name}: ${check.reason}`);
        continue;
      }
      valid.push(file);
    }
    if (!valid.length) return;
    if (imageCount + valid.length > maxUpload) {
      toast.error(`Tối đa ${maxUpload} ảnh. Còn ${maxUpload - imageCount} slot.`);
      return;
    }
    await uploadImages(valid);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleDeleteSelected = async () => {
    if (!selectedImageIds.length) return;
    const ok = await confirm({
      title: "Xóa ảnh đã chọn",
      message: `Xóa ${selectedImageIds.length} ảnh?`,
      description: "Không thể xóa ảnh đang được Q&A sử dụng.",
      confirmText: "Xóa",
      variant: "danger",
    });
    if (!ok) return;
    await deleteImages(selectedImageIds);
  };

  const usagePercent = Math.min(
    100,
    Math.round((imageCount / Math.max(1, maxUpload)) * 100),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge size="sm" color="primary" variant="light">
              {imageCount} / {maxUpload} ảnh
            </Badge>
            {selectedImageIds.length > 0 ? (
              <Badge size="sm" color="info" variant="light">
                Đã chọn {selectedImageIds.length}
              </Badge>
            ) : null}
          </div>
          <div className="mt-2 h-2 w-48 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
            <div
              className="h-full rounded-full bg-brand-500 transition-all"
              style={{ width: `${usagePercent}%` }}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={(e) => void handleFiles(e.target.files)}
          />
          <Button
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading || imageCount >= maxUpload}
          >
            {isUploading ? "Đang tải…" : "Upload ảnh"}
          </Button>
          {selectedImageIds.length > 0 ? (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void handleDeleteSelected()}
                className="!text-error-600"
              >
                Xóa đã chọn
              </Button>
              <Button size="sm" variant="outline" onClick={clearSelectedImages}>
                Bỏ chọn
              </Button>
            </>
          ) : null}
        </div>
      </div>

      <div
        className="rounded-2xl border border-dashed border-gray-300 bg-gray-50/60 p-6 text-center dark:border-gray-700 dark:bg-white/[0.02]"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void handleFiles(e.dataTransfer.files);
        }}
      >
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Kéo thả ảnh vào đây hoặc bấm Upload. Tối đa 10 MB / file (JPG, PNG,
          WEBP, GIF).
        </p>
      </div>

      {isLoadingImages && images.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-500">
          Đang tải thư viện ảnh…
        </p>
      ) : images.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-500">
          Thư viện trống. Upload ảnh để dùng trong Q&A và nhắc nhở.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {images.map((image) => {
            const selected = selectedImageIds.includes(image.id);
            const src = getTrainingImageUrl(image);
            return (
              <button
                key={image.id}
                type="button"
                onClick={() => toggleSelectImage(image.id)}
                className={`group relative aspect-square cursor-pointer overflow-hidden rounded-xl border-2 bg-gray-100 transition dark:bg-gray-800 ${
                  selected
                    ? "border-brand-500 ring-2 ring-brand-500/30"
                    : "border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={src}
                    alt={`Ảnh #${image.id}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center text-xs text-gray-400">
                    #{image.id}
                  </span>
                )}
                <span
                  className={`absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold ${
                    selected
                      ? "bg-brand-500 text-white"
                      : "bg-black/40 text-white opacity-0 group-hover:opacity-100"
                  }`}
                >
                  {selected ? "✓" : ""}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
