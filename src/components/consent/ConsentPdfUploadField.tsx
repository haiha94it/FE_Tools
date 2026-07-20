"use client";

import Button from "@/components/ui/button/Button";
import {
  formatConsentFileSize,
  resolveConsentMediaUrl,
  validateConsentPdfFile,
} from "@/lib/consent-utils";
import { memo, useRef } from "react";
import { HiOutlineDocumentText, HiOutlineTrash } from "react-icons/hi";

interface ConsentPdfUploadFieldProps {
  /** URL PDF đã lưu trên server */
  existingUrl?: string | null;
  /** File mới chọn (chưa upload) */
  file: File | null;
  /** Đã đánh dấu xóa PDF server */
  clearExisting: boolean;
  disabled?: boolean;
  onSelect: (file: File) => void;
  onClear: () => void;
  onError?: (message: string) => void;
}

function ConsentPdfUploadField({
  existingUrl,
  file,
  clearExisting,
  disabled = false,
  onSelect,
  onClear,
  onError,
}: ConsentPdfUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const resolvedUrl =
    !clearExisting && !file ? resolveConsentMediaUrl(existingUrl) : null;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.files?.[0];
    event.target.value = "";
    if (!next) return;
    const error = validateConsentPdfFile(next);
    if (error) {
      onError?.(error);
      return;
    }
    onSelect(next);
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Upload file PDF hợp đồng
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Soạn trên Word rồi “Lưu thành PDF” và chọn file tại đây. Tối đa 20MB.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        disabled={disabled}
        onChange={handleChange}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          startIcon={<HiOutlineDocumentText className="size-4" />}
        >
          Chọn file PDF
        </Button>
        {(file || resolvedUrl) && (
          <button
            type="button"
            disabled={disabled}
            onClick={onClear}
            className="inline-flex items-center gap-1 text-sm font-medium text-error-500 hover:underline disabled:opacity-50"
          >
            <HiOutlineTrash className="size-4" />
            Xóa PDF
          </button>
        )}
      </div>

      {file ? (
        <div className="rounded-xl border border-brand-200 bg-brand-50/50 px-3 py-2 text-sm dark:border-brand-500/30 dark:bg-brand-500/10">
          <p className="font-medium text-gray-800 dark:text-white/90">
            {file.name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {formatConsentFileSize(file.size)} — sẽ upload khi bấm Lưu
          </p>
        </div>
      ) : resolvedUrl ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-700 dark:bg-white/[0.03]">
          <p className="font-medium text-gray-800 dark:text-white/90">
            PDF đã lưu trên hệ thống
          </p>
          <a
            href={resolvedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
          >
            Mở PDF hiện tại
          </a>
          <div className="mt-2 hidden h-40 overflow-hidden rounded-lg border border-gray-200 bg-white sm:block dark:border-gray-700">
            <iframe
              src={resolvedUrl}
              title="Preview PDF hợp đồng"
              className="h-full w-full"
            />
          </div>
        </div>
      ) : clearExisting ? (
        <p className="text-xs text-warning-600 dark:text-warning-400">
          PDF sẽ bị xóa khi bạn bấm Lưu cấu hình.
        </p>
      ) : (
        <p className="text-xs text-gray-400">Chưa có file PDF (tùy chọn nếu đã soạn rich text).</p>
      )}
    </div>
  );
}

export default memo(ConsentPdfUploadField);
