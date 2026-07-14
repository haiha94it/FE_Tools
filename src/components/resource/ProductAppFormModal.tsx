"use client";

import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { getZaloResourceImageUrl } from "@/lib/zalo-resource-utils";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { useZaloResourceStore } from "@/stores/use-zalo-resource-store";
import type { ZaloProductAppItem } from "@/types/zalo-resource";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { HiOutlineLink, HiOutlinePhotograph, HiOutlineViewGrid } from "react-icons/hi";

interface ProductAppFormModalProps {
  open: boolean;
  editingItem: ZaloProductAppItem | null;
  onClose: () => void;
}

const MAX_CONTENT = 250;

export default function ProductAppFormModal({
  open,
  editingItem,
  onClose,
}: ProductAppFormModalProps) {
  const createOrEditProductApp = useZaloResourceStore((s) => s.createOrEditProductApp);
  const uploadImage = useZaloResourceStore((s) => s.uploadImage);
  const saving = useZaloResourceStore((s) => s.saving);
  const uploadingImage = useZaloResourceStore((s) => s.uploadingImage);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [link, setLink] = useState("");
  const [imagePath, setImagePath] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setTitle(editingItem?.title ?? "");
    setContent(editingItem?.content ?? "");
    setLink(editingItem?.link ?? "");
    setImagePath(editingItem?.image ?? "");
  }, [open, editingItem]);

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const path = await uploadImage(file);
      setImagePath(path);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      event.target.value = "";
    }
  };

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    const trimmedLink = link.trim();
    if (!trimmedTitle) {
      toast.error("Vui lòng nhập tiêu đề.");
      return;
    }
    if (!trimmedContent) {
      toast.error("Vui lòng nhập nội dung.");
      return;
    }
    if (!trimmedLink) {
      toast.error("Vui lòng nhập link.");
      return;
    }
    if (!imagePath) {
      toast.error("Vui lòng chọn ảnh minh họa.");
      return;
    }
    try {
      await createOrEditProductApp({
        id: editingItem?.id ?? null,
        title: trimmedTitle,
        content: trimmedContent,
        link: trimmedLink,
        image: imagePath,
      });
      toast.success(editingItem ? "Đã cập nhật sản phẩm." : "Đã thêm sản phẩm.");
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const previewUrl = imagePath ? getZaloResourceImageUrl(imagePath) : "";

  return (
    <Modal isOpen={open} onClose={onClose} className="max-w-xl" showCloseButton>
      <div className="p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
            <HiOutlineViewGrid size={20} />
          </span>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {editingItem ? "Sửa sản phẩm" : "Thêm sản phẩm"}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Thẻ sản phẩm / ứng dụng trên trang tài nguyên
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
              Tiêu đề
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tên sản phẩm hoặc dịch vụ"
              disabled={saving}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
              Nội dung
            </label>
            <textarea
              value={content}
              disabled={saving}
              onChange={(e) => setContent(e.target.value.slice(0, MAX_CONTENT))}
              rows={4}
              placeholder="Mô tả ngắn..."
              className="w-full resize-y rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-800 shadow-theme-xs outline-none placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
            <p className="mt-1 text-theme-xs text-gray-500">
              {content.length}/{MAX_CONTENT}
            </p>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
              Link
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <HiOutlineLink size={16} />
              </span>
              <Input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://..."
                disabled={saving}
                className="!pl-9"
              />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-xs font-medium text-gray-600 dark:text-gray-400">
              Ảnh minh họa
            </label>
            <div className="flex flex-wrap items-start gap-4">
              <Button
                size="sm"
                variant="outline"
                disabled={saving || uploadingImage}
                onClick={() => fileInputRef.current?.click()}
              >
                <HiOutlinePhotograph className="mr-1" size={14} />
                {uploadingImage ? "Đang tải..." : "Chọn ảnh"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => void handleImageSelect(e)}
              />
              {previewUrl ? (
                <span className="relative block h-28 w-44 overflow-hidden rounded-xl border border-gray-200 shadow-theme-xs dark:border-gray-700">
                  <Image
                    src={previewUrl}
                    alt="Preview"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Hủy
          </Button>
          <Button onClick={() => void handleSave()} disabled={saving || uploadingImage}>
            {saving ? "Đang lưu..." : editingItem ? "Cập nhật" : "Tạo mới"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}