"use client";

import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import type { TrainingExportFormat } from "@/lib/chatbot-training-export";
import { useEffect, useState } from "react";
import {
  FiDownload,
  FiFile,
  FiFileText,
} from "react-icons/fi";

interface ExportTrainingModalProps {
  open: boolean;
  chatbotId: number;
  chatbotName?: string;
  loading?: boolean;
  onClose: () => void;
  onExport: (format: TrainingExportFormat) => void | Promise<void>;
}

const FORMAT_OPTIONS: Array<{
  value: TrainingExportFormat;
  label: string;
  description: string;
  icon: typeof FiFileText;
}> = [
  {
    value: "txt",
    label: "File TXT",
    description: "Block câu hỏi, trả lời và dòng ảnh - link|id",
    icon: FiFileText,
  },
  {
    value: "excel",
    label: "File Excel",
    description: "3 cột: hỏi / trả lời / ảnh",
    icon: FiFile,
  },
];

/**
 * Modal chọn định dạng xuất Q&A — UI port Care3 TrainingExportFileDialog.
 */
export default function ExportTrainingModal({
  open,
  chatbotId,
  chatbotName,
  loading = false,
  onClose,
  onExport,
}: ExportTrainingModalProps) {
  const [exportFormat, setExportFormat] =
    useState<TrainingExportFormat>("txt");

  useEffect(() => {
    if (!open) setExportFormat("txt");
  }, [open]);

  if (!open) return null;

  return (
    <Modal
      isOpen={open}
      onClose={loading ? () => undefined : onClose}
      className="max-w-lg !p-0"
      showCloseButton={!loading}
    >
      <div className="flex flex-col gap-4 p-4 sm:p-5">
        <div>
          <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
            Xuất dữ liệu huấn luyện
          </h3>
        </div>

        <div className="rounded-xl border border-success-200 bg-success-50 px-4 py-3 dark:border-success-500/30 dark:bg-success-500/10">
          <p className="text-[11px] font-bold uppercase tracking-wide text-success-700 dark:text-success-400">
            Kịch bản xuất dữ liệu
          </p>
          <p className="mt-1 break-words text-sm font-bold text-gray-900 dark:text-white/90">
            {chatbotName?.trim() || `#${chatbotId}`}
          </p>
          <p className="mt-1 text-xs font-medium text-success-800 dark:text-success-300/90">
            Dữ liệu được lấy từ backend, sau đó xuất theo định dạng bạn chọn.
          </p>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            Định dạng xuất
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {FORMAT_OPTIONS.map((option) => {
              const active = exportFormat === option.value;
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={loading}
                  onClick={() => setExportFormat(option.value)}
                  className={`rounded-xl border px-3 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    active
                      ? "border-success-500 bg-success-50 text-success-800 dark:border-success-500/60 dark:bg-success-500/15 dark:text-success-300"
                      : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/[0.04]"
                  }`}
                >
                  <span className="flex items-center gap-2 text-xs font-bold">
                    <Icon size={14} aria-hidden />
                    {option.label}
                  </span>
                  <span className="mt-1 block text-[10px] font-medium leading-4 text-gray-500 dark:text-gray-400">
                    {option.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {exportFormat === "excel" ? (
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs font-medium leading-5 text-gray-600 dark:border-gray-700 dark:bg-white/[0.03] dark:text-gray-400">
            Excel 3 cột:{" "}
            <span className="font-bold text-gray-800 dark:text-white/80">
              Câu hỏi
            </span>
            ,{" "}
            <span className="font-bold text-gray-800 dark:text-white/80">
              Câu trả lời
            </span>{" "}
            (nhiều câu → xuống hàng trong cùng ô),{" "}
            <span className="font-bold text-gray-800 dark:text-white/80">
              Ảnh
            </span>{" "}
            (<code className="text-[10px]">url|id; url|id</code>).
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs font-medium leading-5 text-gray-600 dark:border-gray-700 dark:bg-white/[0.03] dark:text-gray-400">
            TXT giữ block câu hỏi; mỗi dòng trả lời và dòng ảnh bắt đầu bằng
            &quot;- &quot; (ảnh:{" "}
            <code className="text-[10px]">- https://…/file.png|id</code>
            ).
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end dark:border-gray-800">
          <Button
            size="sm"
            variant="outline"
            disabled={loading}
            onClick={onClose}
            className="!px-4"
          >
            Đóng
          </Button>
          <Button
            size="sm"
            disabled={loading}
            onClick={() => void onExport(exportFormat)}
            className="inline-flex items-center gap-1.5 !px-4"
          >
            <FiDownload size={14} aria-hidden />
            {loading
              ? "Đang xuất…"
              : exportFormat === "txt"
                ? "Xuất TXT"
                : "Xuất Excel"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
