"use client";

import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { useZaloResourceStore } from "@/stores/use-zalo-resource-store";
import type { ZaloResourceItem } from "@/types/zalo-resource";
import { useEffect, useState } from "react";
import { HiOutlineLink, HiOutlinePencil } from "react-icons/hi";

interface ResourceFormModalProps {
  open: boolean;
  editingItem: ZaloResourceItem | null;
  onClose: () => void;
}

export default function ResourceFormModal({
  open,
  editingItem,
  onClose,
}: ResourceFormModalProps) {
  const createOrEditResource = useZaloResourceStore((s) => s.createOrEditResource);
  const saving = useZaloResourceStore((s) => s.saving);

  const [content, setContent] = useState("");
  const [link, setLink] = useState("");

  useEffect(() => {
    if (!open) return;
    setContent(editingItem?.content ?? "");
    setLink(editingItem?.link ?? "");
  }, [open, editingItem]);

  const handleSave = async () => {
    const trimmedContent = content.trim();
    const trimmedLink = link.trim();
    if (!trimmedContent) {
      toast.error("Vui lòng nhập nội dung.");
      return;
    }
    if (!trimmedLink) {
      toast.error("Vui lòng nhập link.");
      return;
    }
    try {
      await createOrEditResource({
        id: editingItem?.id ?? null,
        content: trimmedContent,
        link: trimmedLink,
      });
      toast.success(
        editingItem ? "Đã cập nhật tiện ích." : "Đã thêm tiện ích.",
      );
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} className="max-w-lg" showCloseButton>
      <div className="p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
            <HiOutlinePencil size={20} />
          </span>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {editingItem ? "Sửa tiện ích" : "Thêm tiện ích"}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Hiển thị trên carousel tiện ích
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
              Nội dung
            </label>
            <Input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Tiêu đề hoặc mô tả ngắn"
              disabled={saving}
            />
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
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Hủy
          </Button>
          <Button onClick={() => void handleSave()} disabled={saving}>
            {saving ? "Đang lưu..." : editingItem ? "Cập nhật" : "Tạo mới"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}