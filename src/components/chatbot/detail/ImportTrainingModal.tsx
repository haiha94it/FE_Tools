"use client";

import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/lib/toast";
import { useChatbotTrainingStore } from "@/stores/use-chatbot-training-store";
import type { CreateTrainingDataPayload } from "@/types/chatbot";
import { useRef, useState } from "react";
import { FiAlertCircle, FiDownload, FiInfo, FiUploadCloud } from "react-icons/fi";

interface ImportTrainingModalProps {
  open: boolean;
  chatbotId: number;
  onClose: () => void;
}

interface ParsedQuestionRow {
  question: string;
  answer: string;
  categoryName?: string;
  categoryId?: number | null;
  rowNumber: number;
  status: "pending" | "success" | "error";
  error?: string;
}

function parseCsv(text: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let currentVal = "";

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentVal += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      row.push(currentVal.trim());
      currentVal = "";
    } else if ((char === "\r" || char === "\n") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        i++;
      }
      row.push(currentVal.trim());
      if (row.some((val) => val !== "")) {
        lines.push(row);
      }
      row = [];
      currentVal = "";
    } else {
      currentVal += char;
    }
  }

  if (currentVal !== "" || row.length > 0) {
    row.push(currentVal.trim());
    if (row.some((val) => val !== "")) {
      lines.push(row);
    }
  }

  return lines;
}

function parseTxtQnA(text: string): Array<{ question: string; answer: string; rowNumber: number }> {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const lines = normalized.split("\n");
  const items: Array<{ question: string; answer: string; rowNumber: number }> = [];
  
  let currentQuestion = "";
  let currentAnswers: string[] = [];
  let startRow = 1;

  const flushBlock = (currentRow: number) => {
    if (currentQuestion.trim() && currentAnswers.length > 0) {
      items.push({
        question: currentQuestion.trim(),
        answer: currentAnswers.join("\n").trim(),
        rowNumber: startRow,
      });
    }
    currentQuestion = "";
    currentAnswers = [];
    startRow = currentRow;
  };

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim();
    const rowNum = idx + 1;
    if (!line) {
      flushBlock(rowNum + 1);
      return;
    }

    if (line.startsWith("- ")) {
      if (!currentQuestion) return;
      currentAnswers.push(line.substring(2).trim());
    } else {
      if (currentQuestion && currentAnswers.length > 0) {
        flushBlock(rowNum);
      }
      currentQuestion = line;
    }
  });

  flushBlock(lines.length + 1);
  return items;
}

function normalizeCompareString(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export default function ImportTrainingModal({
  open,
  chatbotId,
  onClose,
}: ImportTrainingModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const categories = useChatbotTrainingStore((s) => s.categories);
  const importTrainingData = useChatbotTrainingStore((s) => s.importTrainingData);
  const isSavingTraining = useChatbotTrainingStore((s) => s.isSavingTraining);

  const [questionsToImport, setQuestionsToImport] = useState<ParsedQuestionRow[]>([]);
  const [importType, setImportType] = useState<"txt" | "csv" | null>(null);

  const handleDownloadCsvTemplate = () => {
    const headers = ["Câu hỏi", "Câu trả lời", "Danh mục (Tùy chọn)"];
    const sampleRows = [
      ["Shop có mở cửa Chủ Nhật không?", "Dạ có ạ, shop mở cửa từ 8:00 đến 21:00 tất cả các ngày trong tuần.", "Giờ làm việc"],
      ["Địa chỉ shop ở đâu vậy?", "Dạ, cửa hàng tại số 123 Đường Nguyễn Trãi, Quận 1, TP. HCM ạ.", "Liên hệ"],
    ];
    const csvContent = [
      headers.join(","),
      ...sampleRows.map((row) => row.map((val) => `"${val}"`).join(",")),
    ].join("\n");

    const blob = new Blob([`\uFEFF${csvContent}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Template_Import_Huon_Luyen.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadTxtTemplate = () => {
    const txtContent = `Shop có mở cửa Chủ Nhật không?
- Dạ có ạ, shop mở cửa từ 8:00 đến 21:00 tất cả các ngày trong tuần.

Địa chỉ shop ở đâu vậy?
- Dạ, cửa hàng tại số 123 Đường Nguyễn Trãi, Quận 1, TP. HCM ạ.`;

    const blob = new Blob([txtContent], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Template_Import_Huon_Luyen.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const isCsv = fileName.endsWith(".csv");
    const isTxt = fileName.endsWith(".txt") || file.type === "text/plain";

    if (!isCsv && !isTxt) {
      toast.error("Vui lòng tải lên file định dạng .csv (Excel) hoặc .txt");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) {
        toast.error("Không đọc được dữ liệu file.");
        return;
      }

      const parsedList: ParsedQuestionRow[] = [];

      if (isCsv) {
        const rows = parseCsv(text);
        if (rows.length <= 1) {
          toast.error("File CSV trống hoặc chỉ có dòng tiêu đề.");
          return;
        }

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          const question = row[0] || "";
          const answer = row[1] || "";
          const categoryName = row[2] || "";

          let rowError = "";
          if (!question.trim()) rowError = "Thiếu câu hỏi.";
          if (!answer.trim()) rowError = rowError ? `${rowError} Thiếu câu trả lời.` : "Thiếu câu trả lời.";

          let matchedCatId: number | null = null;
          if (categoryName.trim()) {
            const normalizedName = normalizeCompareString(categoryName);
            const matched = categories.find((cat) => normalizeCompareString(cat.name) === normalizedName);
            if (matched) {
              matchedCatId = matched.id;
            }
          }

          parsedList.push({
            question,
            answer,
            categoryName: categoryName || undefined,
            categoryId: matchedCatId,
            rowNumber: i + 1,
            status: "pending",
            error: rowError || undefined,
          });
        }
        setImportType("csv");
      } else {
        // file .txt
        const txtItems = parseTxtQnA(text);
        if (!txtItems.length) {
          toast.error("Không tìm thấy cặp câu hỏi - câu trả lời hợp lệ trong file TXT.");
          return;
        }

        txtItems.forEach((item) => {
          parsedList.push({
            question: item.question,
            answer: item.answer,
            rowNumber: item.rowNumber,
            status: "pending",
          });
        });
        setImportType("txt");
      }

      setQuestionsToImport(parsedList);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleStartImport = async () => {
    if (!questionsToImport.length) return;
    const errors = questionsToImport.filter((u) => u.error);
    if (errors.length > 0) {
      toast.error(`Vui lòng sửa các dòng bị lỗi dữ liệu trước khi import (${errors.length} dòng lỗi).`);
      return;
    }

    const payload: CreateTrainingDataPayload[] = questionsToImport.map((item) => ({
      chatbot_id: chatbotId,
      question: item.question,
      answer: item.answer,
      category_id: item.categoryId ?? null,
    }));

    const ok = await importTrainingData(payload);
    if (ok) {
      toast.success(`Đã thêm thành công ${payload.length} câu hỏi vào kịch bản.`);
      onClose();
    } else {
      toast.error("Nhập dữ liệu thất bại.");
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} className="max-w-4xl p-6 sm:p-8">
      <div className="flex items-center justify-between border-b border-gray-150 pb-4 dark:border-gray-800">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Nhập dữ liệu huấn luyện Q&A
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Nạp hàng loạt câu hỏi - câu trả lời từ file Excel/CSV hoặc file TXT kịch bản.
          </p>
        </div>
        <div className="flex gap-2 pr-10 sm:pr-14">
          <Button variant="outline" size="sm" onClick={handleDownloadCsvTemplate} className="gap-1.5 text-xs">
            <FiDownload size={13} /> Mẫu Excel (.csv)
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadTxtTemplate} className="gap-1.5 text-xs">
            <FiDownload size={13} /> Mẫu Text (.txt)
          </Button>
        </div>
      </div>

      <div className="my-6 space-y-4">
        {questionsToImport.length === 0 ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-800 rounded-2xl p-12 bg-gray-50 dark:bg-white/[0.01] hover:bg-gray-100/50 dark:hover:bg-white/[0.02] cursor-pointer transition"
          >
            <FiUploadCloud size={48} className="text-gray-400 mb-3" />
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Nhấp để chọn file hoặc kéo thả file vào đây
            </p>
            <p className="text-xs text-gray-400 mt-1">Hỗ trợ định dạng .csv hoặc .txt</p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv,.txt"
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                Danh sách Q&A tìm thấy ({questionsToImport.length} dòng, định dạng:{" "}
                <span className="font-bold uppercase text-brand-600">{importType}</span>):
              </span>
              <button
                type="button"
                disabled={isSavingTraining}
                onClick={() => setQuestionsToImport([])}
                className="text-brand-600 hover:underline font-semibold"
              >
                Chọn file khác
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto border border-gray-150 dark:border-gray-800 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-gray-50 dark:bg-white/[0.02] text-gray-700 dark:text-gray-300 font-bold sticky top-0 border-b border-gray-150 dark:border-gray-800 z-10">
                  <tr>
                    <th className="p-3 w-16">Dòng</th>
                    <th className="p-3 w-2/5">Câu hỏi</th>
                    <th className="p-3 w-2/5">Câu trả lời</th>
                    {importType === "csv" && <th className="p-3 w-1/5">Danh mục nhận</th>
                    }
                    <th className="p-3 w-24">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 dark:divide-gray-800">
                  {questionsToImport.map((row, idx) => (
                    <tr
                      key={idx}
                      className={
                        row.error
                          ? "bg-red-500/5 dark:bg-red-500/10 text-red-600 dark:text-red-400"
                          : "text-gray-800 dark:text-gray-200"
                      }
                    >
                      <td className="p-3 font-mono font-medium">{row.rowNumber}</td>
                      <td className="p-3 font-semibold break-words whitespace-pre-wrap max-w-xs">{row.question}</td>
                      <td className="p-3 break-words whitespace-pre-wrap max-w-xs">{row.answer}</td>
                      {importType === "csv" && (
                        <td className="p-3">
                          {row.categoryName ? (
                            row.categoryId ? (
                              <span className="inline-block rounded-md bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                                {row.categoryName}
                              </span>
                            ) : (
                              <span className="inline-block rounded-md bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                                {row.categoryName} (Tạo mới)
                              </span>
                            )
                          ) : (
                            <span className="text-gray-400 italic">Mặc định</span>
                          )}
                        </td>
                      )}
                      <td className="p-3">
                        {row.error ? (
                          <span className="flex items-center gap-1 text-[10px] font-medium text-red-600 dark:text-red-400">
                            <FiAlertCircle className="shrink-0 size-3.5" />
                            {row.error}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-[10px]">Chờ nạp</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 text-blue-800 dark:text-blue-300 rounded-xl p-3.5 flex gap-3 text-xs leading-5">
          <FiInfo size={16} className="text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Lưu ý khi nạp file dữ liệu:</p>
            <ul className="list-disc pl-4 space-y-1 mt-1 text-gray-500">
              <li>File TXT: Xuống dòng đánh dấu kết thúc câu trả lời của câu hỏi trước, câu tiếp theo được hiểu là câu hỏi mới. Dòng trả lời bắt đầu bằng ký tự <code className="font-mono bg-blue-500/10 px-1 py-0.5 rounded text-[11px]">- </code>.</li>
              <li>File CSV (Excel): Phải đúng thứ tự các cột: <strong>Câu hỏi</strong>, <strong>Câu trả lời</strong>, <strong>Danh mục</strong>.</li>
              <li>Nếu Danh mục ghi trong file CSV trùng tên với danh mục hiện có trên hệ thống, câu hỏi sẽ tự động được gán vào danh mục đó.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-150 pt-4 dark:border-gray-800 flex justify-end gap-3 shrink-0">
        <Button variant="outline" onClick={onClose} disabled={isSavingTraining}>
          Hủy
        </Button>
        {questionsToImport.length > 0 && (
          <Button onClick={() => void handleStartImport()} disabled={isSavingTraining}>
            {isSavingTraining ? "Đang nạp dữ liệu..." : "Bắt đầu nạp"}
          </Button>
        )}
      </div>
    </Modal>
  );
}
