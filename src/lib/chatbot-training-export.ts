/**
 * Export Q&A training — port Care3 trainingDataExport.
 * API JSON → TXT (import-compatible) hoặc Excel (.xlsx).
 */
import * as XLSX from "xlsx";

export type TrainingExportFormat = "txt" | "excel";

export interface TrainingExportApiImage {
  id: number;
  file: string;
}

export interface TrainingExportApiItem {
  question: string;
  answer: string;
  image_send_mode?: string;
  images?: TrainingExportApiImage[];
}

export interface TrainingExportRow {
  question: string;
  answer: string;
  images: TrainingExportApiImage[];
}

function triggerFileDownload(
  content: BlobPart,
  filename: string,
  mimeType: string,
) {
  const blob =
    content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function getTrainingExportFilename(
  chatbotId: number | undefined,
  format: TrainingExportFormat,
): string {
  if (format === "excel") {
    return chatbotId
      ? `training-chatbot-${chatbotId}.xlsx`
      : "system-training-templates.xlsx";
  }
  return chatbotId
    ? `training-chatbot-${chatbotId}.txt`
    : "system-training-templates.txt";
}

/** Unwrap envelope / array raw từ API export. */
export function normalizeExportApiItems(data: unknown): TrainingExportApiItem[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as TrainingExportApiItem[];
  if (typeof data === "object") {
    const rec = data as { data?: unknown };
    if (Array.isArray(rec.data)) return rec.data as TrainingExportApiItem[];
  }
  return [];
}

export function mapTrainingExportApiItemsToRows(
  items: TrainingExportApiItem[],
): TrainingExportRow[] {
  return items
    .map((item) => ({
      question: item.question?.trim() ?? "",
      answer: item.answer?.trim() ?? "",
      images: (item.images ?? []).filter(
        (image) =>
          Boolean(image?.file) &&
          Number.isInteger(image.id) &&
          image.id > 0,
      ),
    }))
    .filter((row) => row.question && row.answer);
}

/**
 * Dòng ảnh TXT — cùng prefix ``- `` như dòng trả lời:
 * ``- https://…/file.png|52``
 */
export function formatTrainingImageLines(
  images: TrainingExportApiImage[],
): string[] {
  return images.map((image) => `- ${image.file}|${image.id}`);
}

/**
 * Cột Ảnh Excel (mẫu training-chatbot-182.xlsx):
 * ``https://…/a.jpg|645; https://…/b.jpg|646``
 */
export function formatTrainingImageColumnValue(
  images: TrainingExportApiImage[],
): string {
  return images.map((image) => `${image.file}|${image.id}`).join("; ");
}

/** Nhận diện dòng chỉ là ref ảnh: ``- url|id`` / ``+url|id`` / ``url|id`` */
const IMAGE_ONLY_LINE_RE =
  /^(?:[-+]\s*)?(https?:\/\/\S+?)\|(\d+)\s*$/i;

/**
 * Chuẩn hóa answer + images cho Excel (theo file mẫu):
 * - Nhiều câu trả lời → xuống dòng **trong cùng ô** (\\n), không prefix ``- ``
 * - Dòng chỉ là link ảnh bị nhét trong answer → chuyển sang cột Ảnh
 */
export function normalizeExcelAnswerAndImages(
  answer: string,
  images: TrainingExportApiImage[],
): { answer: string; images: TrainingExportApiImage[] } {
  const answerLines: string[] = [];
  const merged = [...images];
  const seen = new Set(merged.map((i) => i.id));

  for (const raw of answer.replace(/\r\n/g, "\n").split("\n")) {
    const line = raw.trim();
    if (!line) continue;

    const imgMatch = line.match(IMAGE_ONLY_LINE_RE);
    if (imgMatch) {
      const id = Number(imgMatch[2]);
      if (Number.isInteger(id) && id > 0 && !seen.has(id)) {
        merged.push({ file: imgMatch[1], id });
        seen.add(id);
      }
      continue;
    }

    // Bỏ bullet ``- `` nếu answer lưu kiểu TXT
    answerLines.push(line.replace(/^-\s+/, "").trim());
  }

  return {
    answer: answerLines.filter(Boolean).join("\n"),
    images: merged,
  };
}

/**
 * TXT (khớp mẫu user / import):
 * Câu hỏi
 * - Trả lời dòng 1
 * - https://…/img.png|id
 */
export function buildTrainingExportTxt(items: TrainingExportApiItem[]): string {
  const blocks = mapTrainingExportApiItemsToRows(items).map((row) => {
    const { answer, images } = normalizeExcelAnswerAndImages(
      row.answer,
      row.images,
    );
    const answerLines = answer
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => `- ${line.replace(/^\s*-\s?/, "")}`);

    const imageLines = formatTrainingImageLines(images);
    return [row.question, ...answerLines, ...imageLines].join("\n");
  });

  return blocks.join("\n\n").trim();
}

/**
 * Excel theo mẫu ``training-chatbot-182.xlsx``:
 * | Câu hỏi | Câu trả lời (xuống dòng trong ô) | Ảnh (url\|id; …) |
 */
export function buildTrainingExportWorkbook(
  rows: TrainingExportRow[],
  sheetName = "Dữ liệu huấn luyện",
) {
  const header = ["Câu hỏi", "Câu trả lời", "Ảnh"];
  const body = rows.map((row) => {
    const { answer, images } = normalizeExcelAnswerAndImages(
      row.answer,
      row.images,
    );
    return [row.question, answer, formatTrainingImageColumnValue(images)];
  });

  const worksheet = XLSX.utils.aoa_to_sheet([header, ...body]);

  // Cột rộng giống mẫu; hàng cao theo số dòng trả lời để thấy xuống hàng
  worksheet["!cols"] = [{ wch: 42 }, { wch: 72 }, { wch: 48 }];
  worksheet["!rows"] = [
    { hpt: 20 },
    ...body.map((cells) => {
      const answerLines = String(cells[1] ?? "")
        .split("\n")
        .filter(Boolean).length;
      const hpt = Math.min(18 + Math.max(0, answerLines - 1) * 14, 120);
      return { hpt };
    }),
  ];

  // Đánh dấu cell string có \\n (Excel/LibreOffice hiện xuống hàng khi bật wrap)
  const range = XLSX.utils.decode_range(worksheet["!ref"] ?? "A1");
  for (let R = range.s.r; R <= range.e.r; R += 1) {
    for (let C = range.s.c; C <= range.e.c; C += 1) {
      const addr = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = worksheet[addr];
      if (!cell || cell.t !== "s" || typeof cell.v !== "string") continue;
      if (cell.v.includes("\n")) {
        cell.w = cell.v;
        // sheetjs community: set alignment wrap khi lib hỗ trợ
        cell.s = {
          ...(typeof cell.s === "object" && cell.s ? cell.s : {}),
          alignment: { wrapText: true, vertical: "top" },
        };
      }
    }
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  return workbook;
}

export function downloadTrainingExportFromItems(
  items: TrainingExportApiItem[],
  opts: {
    chatbotId?: number;
    format: TrainingExportFormat;
    sheetName?: string;
  },
): void {
  const rows = mapTrainingExportApiItemsToRows(items);
  if (!rows.length) {
    throw new Error("EMPTY_EXPORT");
  }

  if (opts.format === "excel") {
    const workbook = buildTrainingExportWorkbook(
      rows,
      opts.sheetName ?? "Dữ liệu huấn luyện",
    );
    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    triggerFileDownload(
      buffer,
      getTrainingExportFilename(opts.chatbotId, "excel"),
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    return;
  }

  const text = buildTrainingExportTxt(items);
  if (!text.trim()) {
    throw new Error("EMPTY_EXPORT");
  }
  triggerFileDownload(
    text,
    getTrainingExportFilename(opts.chatbotId, "txt"),
    "text/plain;charset=utf-8",
  );
}
