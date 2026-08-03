"use client";

import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { getApiErrorMessage } from "@/lib/errors";
import {
  buildSupportFaqCsvTemplate,
  buildSupportFaqTxtTemplate,
  rowsFromCsvText,
  rowsFromTxtText,
  triggerDownload,
  type SupportFaqImportFormat,
  type SupportFaqImportRow,
} from "@/lib/support-faq-io";
import { toast } from "@/lib/toast";
import { useSupportFaqStore } from "@/stores/use-support-faq-store";
import { useRef, useState } from "react";
import { FiAlertCircle, FiDownload, FiInfo, FiUploadCloud } from "react-icons/fi";

interface ImportSupportFaqModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ImportSupportFaqModal({
  open,
  onClose,
}: ImportSupportFaqModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importFaqs = useSupportFaqStore((s) => s.importFaqs);
  const saving = useSupportFaqStore((s) => s.saving);

  const [rows, setRows] = useState<SupportFaqImportRow[]>([]);
  const [importType, setImportType] = useState<SupportFaqImportFormat | null>(
    null,
  );

  const reset = () => {
    setRows([]);
    setImportType(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleDownloadCsvTemplate = () => {
    triggerDownload(
      `\uFEFF${buildSupportFaqCsvTemplate()}`,
      "Template_Import_Support_FAQ.csv",
      "text/csv;charset=utf-8;",
    );
  };

  const handleDownloadTxtTemplate = () => {
    triggerDownload(
      buildSupportFaqTxtTemplate(),
      "Template_Import_Support_FAQ.txt",
      "text/plain;charset=utf-8;",
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const isCsv =
      fileName.endsWith(".csv") ||
      fileName.endsWith(".xlsx") ||
      file.type.includes("csv") ||
      file.type.includes("excel") ||
      file.type.includes("spreadsheet");
    const isTxt = fileName.endsWith(".txt") || file.type === "text/plain";

    // .xlsx thật cần lib xlsx — chatbot dùng CSV gọi là Excel; từ chối binary xlsx
    if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
      toast.error(
        "Vui lòng lưu Excel dưới dạng CSV (File → Save As → CSV) rồi tải lên.",
      );
      e.target.value = "";
      return;
    }

    if (!isCsv && !isTxt) {
      toast.error("Vui lòng tải lên file .csv (Excel) hoặc .txt");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) {
        toast.error("Không đọc được dữ liệu file.");
        return;
      }

      if (isCsv) {
        const parsed = rowsFromCsvText(text);
        if (!parsed.length) {
          toast.error("File CSV trống hoặc chỉ có dòng tiêu đề.");
          return;
        }
        setImportType("csv");
        setRows(parsed);
      } else {
        const parsed = rowsFromTxtText(text);
        if (!parsed.length) {
          toast.error(
            "Không tìm thấy cặp câu hỏi - câu trả lời hợp lệ trong file TXT.",
          );
          return;
        }
        setImportType("txt");
        setRows(parsed);
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleStartImport = async () => {
    if (!rows.length) return;
    const errors = rows.filter((u) => u.error);
    if (errors.length > 0) {
      toast.error(
        `Vui lòng sửa các dòng bị lỗi trước khi import (${errors.length} dòng lỗi).`,
      );
      return;
    }

    try {
      const result = await importFaqs(
        rows.map((item) => ({
          question: item.question.trim(),
          answer: item.answer.trim(),
          is_active: true,
        })),
      );
      const created = result.created_count;
      const errCount = result.errors.length;
      if (created > 0 && errCount === 0) {
        toast.success(`Đã thêm ${created} FAQ.`);
        handleClose();
      } else if (created > 0) {
        toast.success(
          `Đã thêm ${created} FAQ. ${errCount} dòng lỗi (trùng / không hợp lệ).`,
        );
        handleClose();
      } else {
        toast.error(
          errCount
            ? `Không thêm được FAQ (${errCount} lỗi — có thể trùng câu hỏi/trả lời).`
            : "Không thêm được FAQ.",
        );
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <Modal isOpen={open} onClose={handleClose} className="max-w-4xl p-6 sm:p-8">
      <div className="flex flex-col gap-3 border-b border-gray-150 pb-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Import FAQ bot CSKH
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            Nạp hàng loạt câu hỏi – câu trả lời từ file Excel/CSV hoặc TXT
            (định dạng giống chatbot).
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:pr-10">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadCsvTemplate}
            className="gap-1.5 text-xs"
          >
            <FiDownload size={13} /> Mẫu Excel (.csv)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadTxtTemplate}
            className="gap-1.5 text-xs"
          >
            <FiDownload size={13} /> Mẫu Text (.txt)
          </Button>
        </div>
      </div>

      <div className="my-6 space-y-4">
        {rows.length === 0 ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-12 transition hover:bg-gray-100/50 dark:border-gray-800 dark:bg-white/[0.01] dark:hover:bg-white/[0.02]"
          >
            <FiUploadCloud size={48} className="mb-3 text-gray-400" />
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Nhấp để chọn file hoặc kéo thả file vào đây
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Hỗ trợ .csv (Excel) hoặc .txt
            </p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv,.txt,text/csv,text/plain"
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                Tìm thấy {rows.length} dòng (
                <span className="font-bold uppercase text-brand-600">
                  {importType}
                </span>
                )
              </span>
              <button
                type="button"
                disabled={saving}
                onClick={reset}
                className="font-semibold text-brand-600 hover:underline"
              >
                Chọn file khác
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto rounded-xl border border-gray-150 dark:border-gray-800">
              <table className="w-full border-collapse text-left text-xs">
                <thead className="sticky top-0 z-10 border-b border-gray-150 bg-gray-50 font-bold text-gray-700 dark:border-gray-800 dark:bg-white/[0.02] dark:text-gray-300">
                  <tr>
                    <th className="w-16 p-3">Dòng</th>
                    <th className="w-2/5 p-3">Câu hỏi</th>
                    <th className="w-2/5 p-3">Câu trả lời</th>
                    <th className="w-24 p-3">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 dark:divide-gray-800">
                  {rows.map((row, idx) => (
                    <tr
                      key={idx}
                      className={
                        row.error
                          ? "bg-red-500/5 text-red-600 dark:bg-red-500/10 dark:text-red-400"
                          : "text-gray-800 dark:text-gray-200"
                      }
                    >
                      <td className="p-3 font-mono font-medium">
                        {row.rowNumber}
                      </td>
                      <td className="max-w-xs whitespace-pre-wrap break-words p-3 font-semibold">
                        {row.question}
                      </td>
                      <td className="max-w-xs whitespace-pre-wrap break-words p-3">
                        {row.answer}
                      </td>
                      <td className="p-3">
                        {row.error ? (
                          <span className="flex items-center gap-1 text-[10px] font-medium text-red-600 dark:text-red-400">
                            <FiAlertCircle className="size-3.5 shrink-0" />
                            {row.error}
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-400">
                            Chờ nạp
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-3.5 text-xs leading-5 text-blue-800 dark:bg-blue-500/10 dark:text-blue-300">
          <FiInfo size={16} className="mt-0.5 shrink-0 text-blue-500" />
          <div>
            <p className="font-bold">Lưu ý khi nạp file:</p>
            <ul className="mt-1 list-disc space-y-1 pl-4 text-gray-500">
              <li>
                File TXT: dòng trống tách các cặp Q&amp;A. Dòng trả lời bắt đầu
                bằng{" "}
                <code className="rounded bg-blue-500/10 px-1 py-0.5 font-mono text-[11px]">
                  -{" "}
                </code>
                .
              </li>
              <li>
                File CSV (Excel): cột{" "}
                <strong>Câu hỏi</strong>, <strong>Câu trả lời</strong> (mở bằng
                Excel rồi Save As → CSV UTF-8).
              </li>
              <li>Câu hỏi / trả lời trùng FAQ hiện có sẽ bị bỏ qua (lỗi).</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 justify-end gap-3 border-t border-gray-150 pt-4 dark:border-gray-800">
        <Button variant="outline" onClick={handleClose} disabled={saving}>
          Hủy
        </Button>
        {rows.length > 0 ? (
          <Button
            onClick={() => void handleStartImport()}
            disabled={saving}
          >
            {saving ? "Đang nạp dữ liệu..." : "Bắt đầu nạp"}
          </Button>
        ) : null}
      </div>
    </Modal>
  );
}
