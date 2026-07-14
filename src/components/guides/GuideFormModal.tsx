"use client";

import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import {
  GUIDE_SYSTEM_OPTIONS,
  getZaloGuideImageUrl,
} from "@/lib/zalo-guide-utils";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { useZaloGuideStore } from "@/stores/use-zalo-guide-store";
import type { GuideSystemKey, ZaloGuideItem } from "@/types/zalo-guide";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { HiOutlineLink, HiOutlinePhotograph } from "react-icons/hi";

interface GuideFormModalProps {
  open: boolean;
  editingItem: ZaloGuideItem | null;
  onClose: () => void;
}

export default function GuideFormModal({
  open,
  editingItem,
  onClose,
}: GuideFormModalProps) {
  const createOrEditGuide = useZaloGuideStore((s) => s.createOrEditGuide);
  const uploadImage = useZaloGuideStore((s) => s.uploadImage);
  const saving = useZaloGuideStore((s) => s.saving);
  const uploadingImage = useZaloGuideStore((s) => s.uploadingImage);

  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [imagePath, setImagePath] = useState("");
  const [systems, setSystems] = useState<GuideSystemKey[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setTitle(editingItem?.title ?? "");
    setLink(editingItem?.link ?? "");
    setImagePath(editingItem?.image ?? "");
    setSystems(editingItem?.systems ?? []);
  }, [open, editingItem]);

  const toggleSystem = (value: GuideSystemKey) => {
    setSystems((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value],
    );
  };

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
    const trimmedLink = link.trim();
    if (!trimmedTitle) {
      toast.error("Vui lòng nhập tiêu đề.");
      return;
    }
    if (!trimmedLink) {
      toast.error("Vui lòng nhập link video.");
      return;
    }
    if (!imagePath) {
      toast.error("Vui lòng chọn ảnh thumbnail.");
      return;
    }
    if (!systems.length) {
      toast.error("Chọn ít nhất một hệ thống hiển thị.");
      return;
    }

    try {
      await createOrEditGuide({
        id: editingItem?.id ?? null,
        title: trimmedTitle,
        link: trimmedLink,
        image: imagePath,
        systems,
      });
      toast.success(editingItem ? "Đã cập nhật hướng dẫn." : "Đã thêm hướng dẫn.");
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const previewUrl = imagePath ? getZaloGuideImageUrl(imagePath) : "";

  return (
    <Modal isOpen={open} onClose={onClose} className="max-w-xl" showCloseButton>
      <div className="max-h-[min(90vh,720px)] overflow-y-auto p-5 sm:p-6">
        <h3 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
          {editingItem ? "Sửa hướng dẫn" : "Thêm hướng dẫn"}
        </h3>
        <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
          Tiêu đề, link video và thumbnail hiển thị trên carousel
        </p>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
              Tiêu đề
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tên bài hướng dẫn"
              disabled={saving}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
              Link video (YouTube, Vimeo, Facebook...)
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
            <p className="mb-2 text-xs font-medium text-gray-600 dark:text-gray-400">
              Hệ thống hiển thị
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {GUIDE_SYSTEM_OPTIONS.map((item) => (
                <label
                  key={item.value}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-300"
                >
                  <Checkbox
                    checked={systems.includes(item.value)}
                    onChange={() => toggleSystem(item.value)}
                    disabled={saving}
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-gray-600 dark:text-gray-400">
              Ảnh thumbnail
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
                <span className="relative block h-20 w-36 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                  <Image src={previewUrl} alt="Preview" fill unoptimized className="object-cover" />
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