"use client";

import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/lib/toast";
import { zaloMessengerService } from "@/services/zalo-messenger.service";
import { memo, useRef, useState } from "react";

interface StrangerPhoneDialogProps {
  open: boolean;
  onClose: () => void;
  onSend: (payload: {
    phone: string;
    text: string;
    imageLink: string | null;
  }) => void;
}

function StrangerPhoneDialog({ open, onClose, onSend }: StrangerPhoneDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [phone, setPhone] = useState("");
  const [text, setText] = useState("");
  const [imageLink, setImageLink] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const resetAndClose = () => {
    setPhone("");
    setText("");
    setImageLink(null);
    onClose();
  };

  const handleUpload = async (files: File[]) => {
    if (!files.length) return;
    setUploading(true);
    try {
      const link = await zaloMessengerService.uploadFile(files[0]);
      setImageLink(link);
    } catch {
      toast.error("Không tải được ảnh đính kèm.");
    } finally {
      setUploading(false);
    }
  };

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
              <span className="truncate text-xs text-emerald-600">Đã chọn ảnh</span>
            ) : null}
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={resetAndClose}>
            Hủy
          </Button>
          <Button size="sm" onClick={handleSubmit}>
            Gửi tin nhắn
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default memo(StrangerPhoneDialog);