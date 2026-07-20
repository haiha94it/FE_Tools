"use client";

import Button from "@/components/ui/button/Button";
import { memo, useCallback, useState } from "react";
import ConsentSignaturePad, {
  type ConsentSignatureValue,
} from "./ConsentSignaturePad";

interface ConsentSignatureFullscreenProps {
  open: boolean;
  disabled?: boolean;
  onClose: () => void;
  onConfirm: (value: ConsentSignatureValue) => void;
}

/**
 * Phóng to khung ký — absolute trong vùng tin nhắn (không portal body).
 */
function ConsentSignatureFullscreen({
  open,
  disabled = false,
  onClose,
  onConfirm,
}: ConsentSignatureFullscreenProps) {
  const [value, setValue] = useState<ConsentSignatureValue>({
    hasSignature: false,
    dataUrl: null,
    strokeCount: 0,
    width: 0,
    height: 0,
  });

  const handleChange = useCallback((next: ConsentSignatureValue) => {
    setValue(next);
  }, []);

  const handleConfirm = () => {
    if (!value.hasSignature || value.strokeCount < 1 || !value.dataUrl) return;
    onConfirm(value);
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="absolute inset-0 z-40 flex flex-col overflow-hidden rounded-2xl bg-white dark:bg-gray-900"
      role="dialog"
      aria-modal="true"
      aria-label="Phóng to khung ký"
    >
      <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800 sm:px-6">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Phóng to khung ký
          </h2>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            Ký bằng ngón tay hoặc chuột, rồi bấm Dùng chữ ký này.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
          aria-label="Đóng"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M6.04 16.54a1 1 0 0 0 1.42 1.42L12 13.41l4.54 4.54a1 1 0 0 0 1.42-1.42L13.41 12l4.55-4.54a1 1 0 0 0-1.42-1.42L12 10.59 7.46 6.04a1 1 0 0 0-1.42 1.42L10.59 12l-4.55 4.54Z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>

      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
        <ConsentSignaturePad
          onChange={handleChange}
          disabled={disabled}
          heightClassName="h-[min(50dvh,380px)] min-h-[200px]"
          showToolbar
        />
      </div>

      <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-gray-100 px-4 py-3 dark:border-gray-800 sm:flex-row sm:justify-end sm:px-6">
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          Hủy
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={
            disabled ||
            !value.hasSignature ||
            value.strokeCount < 1 ||
            !value.dataUrl
          }
          onClick={handleConfirm}
        >
          Dùng chữ ký này
        </Button>
      </div>
    </div>
  );
}

export default memo(ConsentSignatureFullscreen);
