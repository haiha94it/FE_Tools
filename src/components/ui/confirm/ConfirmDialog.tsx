"use client";

import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import type { ConfirmOptions, ConfirmVariant } from "@/types/confirm";

interface ConfirmDialogProps extends ConfirmOptions {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const alertVariantMap: Record<ConfirmVariant, "error" | "warning" | "info"> = {
  danger: "error",
  warning: "warning",
  primary: "info",
};

const confirmButtonClassMap: Record<ConfirmVariant, string> = {
  danger: "!bg-error-500 hover:!bg-error-600",
  warning: "!bg-warning-500 hover:!bg-warning-600",
  primary: "",
};

export default function ConfirmDialog({
  isOpen,
  title = "Xác nhận",
  message,
  description,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  variant = "primary",
  onClose,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      layer="top"
      showCloseButton={false}
      className="max-w-[480px] p-5 sm:p-6"
    >
      <h4 className="pr-2 text-lg font-semibold text-gray-800 dark:text-white/90">
        {title}
      </h4>

      <div className="mt-4">
        {description ? (
          <Alert
            variant={alertVariantMap[variant]}
            title={message}
            message={description}
          />
        ) : (
          <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            {message}
          </p>
        )}
      </div>

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
        <Button size="sm" variant="outline" onClick={onClose}>
          {cancelText}
        </Button>
        <Button
          size="sm"
          onClick={onConfirm}
          className={confirmButtonClassMap[variant]}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
}