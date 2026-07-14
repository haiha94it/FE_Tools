"use client";

import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import { Modal } from "@/components/ui/modal";
import type { PromptOptions } from "@/types/confirm";
import { useEffect, useState } from "react";

interface PromptDialogProps extends PromptOptions {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value: string) => void;
}

export default function PromptDialog({
  isOpen,
  title = "Nhập thông tin",
  message,
  defaultValue = "",
  placeholder,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  onClose,
  onConfirm,
}: PromptDialogProps) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
    }
  }, [isOpen, defaultValue]);

  const handleConfirm = () => {
    onConfirm(value.trim());
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      layer="top"
      className="max-w-[480px] p-5 sm:p-6"
    >
      <h4 className="pr-8 text-lg font-semibold text-gray-800 dark:text-white/90">
        {title}
      </h4>

      {message ? (
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{message}</p>
      ) : null}

      <div className="mt-4">
        <Input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
        />
      </div>

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
        <Button size="sm" variant="outline" onClick={onClose}>
          {cancelText}
        </Button>
        <Button size="sm" onClick={handleConfirm}>
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
}