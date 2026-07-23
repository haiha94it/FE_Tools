"use client";

import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { confirm } from "@/lib/confirm";
import { getTrainingImageUrl, isValidImageFile } from "@/lib/chatbot-utils";
import { toast } from "@/lib/toast";
import { useChatbotTrainingStore } from "@/stores/use-chatbot-training-store";
import { useEffect, useRef } from "react";
import { FiCheck, FiImage, FiInfo, FiTrash2, FiUploadCloud } from "react-icons/fi";

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

  const isTrulyEmpty = imageCount === 0;

  return (
    <div className="space-y-4">
      {/* Header section with upload progress bar */}
      {!isTrulyEmpty && (
        <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-3.5 dark:border-gray-800">
          <div className="space-y-1.5">
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
            <div className="relative h-2 w-48 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-brand-500 transition-all duration-300"
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
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
              className="flex items-center gap-1.5 !px-3.5 !py-2 text-xs font-semibold"
            >
              <FiUploadCloud size={14} />
              {isUploading ? "Đang tải lên..." : "Upload ảnh"}
            </Button>
            
            {selectedImageIds.length > 0 ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void handleDeleteSelected()}
                  className="!text-error-600 flex items-center gap-1.5 !px-3 !py-2 text-xs font-medium"
                >
                  <FiTrash2 size={13} /> Xóa ảnh
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={clearSelectedImages}
                  className="!px-3 !py-2 text-xs font-medium"
                >
                  Bỏ chọn
                </Button>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Drag & drop upload zone */}
      <div
        className="group cursor-pointer rounded-2xl border-2 border-dashed border-gray-250 bg-gray-50/40 p-6 text-center hover:bg-gray-50 hover:border-brand-500/50 dark:border-gray-800 dark:bg-white/[0.005] dark:hover:bg-white/[0.01] dark:hover:border-brand-500/30 transition duration-150"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
      >
        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-500 group-hover:bg-brand-50 group-hover:text-brand-500 dark:bg-gray-800/80 dark:text-gray-400 dark:group-hover:bg-brand-500/10 dark:group-hover:text-brand-400 transition">
          <FiUploadCloud size={20} />
        </div>
        <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
          Kéo thả ảnh hoặc click để Upload
        </p>
        <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
          Hỗ trợ JPG, PNG, WEBP, GIF (Tối đa 10 MB / file)
        </p>
      </div>

      {/* Images view */}
      {isLoadingImages && images.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="relative mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
            <FiImage className="animate-pulse text-brand-500" size={20} />
          </div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Đang tải thư viện ảnh...
          </p>
        </div>
      ) : images.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
          <div className="mb-3.5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 text-gray-400 dark:bg-gray-800/50 dark:text-gray-500">
            <FiImage size={24} />
          </div>
          <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
            Thư viện ảnh trống
          </h5>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[280px]">
            Chưa có ảnh nào được tải lên. Ảnh trong thư viện được dùng để gửi đính kèm tin nhắn phản hồi hoặc nhắc nhở.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {images.map((image) => {
            const selected = selectedImageIds.includes(image.id);
            const src = getTrainingImageUrl(image);
            return (
              <button
                key={image.id}
                type="button"
                onClick={() => toggleSelectImage(image.id)}
                className={`group relative aspect-square cursor-pointer overflow-hidden rounded-xl border-2 bg-gray-50 dark:bg-gray-800 transition ${
                  selected
                    ? "border-brand-500 ring-2 ring-brand-500/20"
                    : "border-gray-150 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700"
                }`}
              >
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={src}
                    alt={`Ảnh #${image.id}`}
                    className="h-full w-full object-cover group-hover:scale-105 transition duration-200"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center text-xs text-gray-400 font-medium">
                    #{image.id}
                  </span>
                )}
                
                {/* Active Checkmark overlay */}
                <div
                  className={`absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-lg border shadow-xs transition duration-150 ${
                    selected
                      ? "bg-brand-500 border-brand-500 text-white opacity-100"
                      : "bg-black/40 border-white/20 text-white opacity-0 group-hover:opacity-100"
                  }`}
                >
                  <FiCheck size={11} className={selected ? "stroke-[3px]" : ""} />
                </div>
                
                {/* Image ID indicator */}
                <div className="absolute left-2 bottom-2 bg-black/60 backdrop-blur-xs px-1.5 py-0.5 rounded text-[8px] font-bold text-white tracking-wide">
                  ID #{image.id}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
