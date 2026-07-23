"use client";

import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";

interface ChatbotFormModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  name: string;
  isSaving?: boolean;
  confirmLabel?: string;
  onNameChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export default function ChatbotFormModal({
  isOpen,
  title,
  description,
  name,
  isSaving = false,
  confirmLabel = "Lưu",
  onNameChange,
  onClose,
  onSubmit,
}: ChatbotFormModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
      <div className="p-6 sm:p-8">
        <h2 className="pr-10 text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        ) : null}

        <div className="mt-5">
          <Label htmlFor="chatbot-name">Tên kịch bản</Label>
          <Input
            id="chatbot-name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Ví dụ: Kịch bản bán hàng"
            disabled={isSaving}
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSaving}
          >
            Hủy
          </Button>
          <Button
            size="sm"
            onClick={onSubmit}
            disabled={isSaving || !name.trim()}
          >
            {isSaving ? "Đang lưu…" : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
