"use client";

import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/lib/toast";
import { resolveAttachmentPreviewUrl } from "@/lib/zalo-messenger-send-utils";
import { zaloMessengerService } from "@/services/zalo-messenger.service";
import Image from "next/image";
import { memo, useRef, useState } from "react";
import { HiOutlineX } from "react-icons/hi";

interface StrangerPhoneDialogProps {
  open: boolean;
  onClose: () => void;
  onSend: (payload: {
    phone: string;
    text: string;
    imageLink: string | null;
  }) => void;
}

/** Hiển thị form gửi text và một ảnh tới một số điện thoại Zalo chưa có hội thoại. */
function StrangerPhoneDialog({ open, onClose, onSend }: StrangerPhoneDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [phone, setPhone] = useState("");
  const [text, setText] = useState("");
  const [imageLink, setImageLink] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  /** Xóa dữ liệu nháp và đóng modal. */
  const resetAndClose = () => {
    setPhone("");
    setText("");
    setImageLink(null);
    onClose();
  };

  /** Tải ảnh đã chọn và thay ảnh xem trước hiện tại bằng link mới. */
  const handleUpload = async (files: File[]) => {
    if (!files.length) return;
    setUploading(true);
    try {
      setImageLink(await zaloMessengerService.uploadFile(files[0]));
    } catch {
      toast.error("Không tải được ảnh đính kèm.");
    } finally {
      setUploading(false);
    }
  };

  /** Xóa ảnh khỏi nội dung sẽ gửi. */
  const handleRemoveImage = () => {
    setImageLink(null);
  };

  /** Kiểm tra dữ liệu và gửi text cùng ảnh đã tải lên. */
  const handleSubmit = () => {
    if (!phone.trim()) {
      toast.error("Nhập số điện thoại người nhận.");
      return;
    }
    if (!text.trim() && !imageLink) {
      toast.error("Nhập nội dung hoặc đính kèm ảnh.");
      return;
    }
    onSend({ phone: phone.trim(), text: text.trim(), imageLink });
    resetAndClose();
  };

  return (
    <Modal isOpen={open} onClose={resetAndClose} className="max-w-lg" showCloseButton>
      <div className="p-5 sm:p-6">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          Gửi tin nhắn người lạ
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Gửi tin qua số điện thoại Zalo
        </p>

        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
              Số điện thoại người nhận
            </label>
            <Input
              type="text"
              value={phone}
              placeholder="VD: 09xxxxxxxx"
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
              Nội dung tin nhắn
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              placeholder="Nhập nội dung..."
              className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-brand-300 dark:border-gray-700 dark:bg-gray-800"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                e.target.value = "";
                void handleUpload(files);
              }}
            />
            <Button
              size="sm"
              variant="outline"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? "Đang tải..." : "Đính kèm ảnh"}
            </Button>
            {imageLink ? (
              <span className="truncate text-xs text-emerald-600">
                Đã chọn ảnh
              </span>
            ) : null}
          </div>

          {imageLink ? (
            <div className="relative aspect-square w-28 overflow-hidden rounded-lg border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800">
              <Image
                src={resolveAttachmentPreviewUrl(imageLink)}
                alt="Ảnh đính kèm"
                fill
                unoptimized
                className="object-cover"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                aria-label="Xóa ảnh đính kèm"
                className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/65 text-white shadow-sm transition hover:bg-error-500 focus:outline-none focus:ring-2 focus:ring-white"
              >
                <HiOutlineX className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ) : null}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={resetAndClose}>
            Hủy
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={uploading}>
            Gửi tin nhắn
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default memo(StrangerPhoneDialog);
