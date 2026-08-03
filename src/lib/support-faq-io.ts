/** Parse / build file import-export FAQ bot CSKH — giống chatbot training (TXT + CSV/Excel). */

export type SupportFaqImportFormat = "txt" | "csv";

export interface SupportFaqImportRow {
  question: string;
  answer: string;
  rowNumber: number;
  status: "pending" | "success" | "error";
  error?: string;
}

export function parseSupportFaqCsv(text: string): string[][] {
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
      if (char === "\r" && nextChar === "\n") i++;
      row.push(currentVal.trim());
      if (row.some((val) => val !== "")) lines.push(row);
      row = [];
      currentVal = "";
    } else {
      currentVal += char;
    }
  }

  if (currentVal !== "" || row.length > 0) {
    row.push(currentVal.trim());
    if (row.some((val) => val !== "")) lines.push(row);
  }

  return lines;
}

/** TXT kịch bản: câu hỏi + các dòng trả lời bắt đầu bằng "- " */
export function parseSupportFaqTxt(
  text: string,
): Array<{ question: string; answer: string; rowNumber: number }> {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const lines = normalized.split("\n");
  const items: Array<{ question: string; answer: string; rowNumber: number }> =
    [];

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

export function rowsFromCsvText(text: string): SupportFaqImportRow[] {
  const rows = parseSupportFaqCsv(text);
  if (rows.length <= 1) return [];

  const parsed: SupportFaqImportRow[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const question = row[0] || "";
    const answer = row[1] || "";
    let rowError = "";
    if (!question.trim()) rowError = "Thiếu câu hỏi.";
    if (!answer.trim()) {
      rowError = rowError
        ? `${rowError} Thiếu câu trả lời.`
        : "Thiếu câu trả lời.";
    }
    parsed.push({
      question,
      answer,
      rowNumber: i + 1,
      status: "pending",
      error: rowError || undefined,
    });
  }
  return parsed;
}

export function rowsFromTxtText(text: string): SupportFaqImportRow[] {
  return parseSupportFaqTxt(text).map((item) => ({
    question: item.question,
    answer: item.answer,
    rowNumber: item.rowNumber,
    status: "pending" as const,
  }));
}

export function buildSupportFaqCsvTemplate(): string {
  const headers = ["Câu hỏi", "Câu trả lời"];
  const sampleRows = [
    [
      "Shop có mở cửa Chủ Nhật không?",
      "Dạ có ạ, shop mở cửa từ 8:00 đến 21:00 tất cả các ngày trong tuần.",
    ],
    [
      "Địa chỉ shop ở đâu vậy?",
      "Dạ, cửa hàng tại số 123 Đường Nguyễn Trãi, Quận 1, TP. HCM ạ.",
    ],
  ];
  return [
    headers.join(","),
    ...sampleRows.map((row) =>
      row.map((val) => `"${val.replace(/"/g, '""')}"`).join(","),
    ),
  ].join("\n");
}

export function buildSupportFaqTxtTemplate(): string {
  return `Shop có mở cửa Chủ Nhật không?
- Dạ có ạ, shop mở cửa từ 8:00 đến 21:00 tất cả các ngày trong tuần.

Địa chỉ shop ở đâu vậy?
- Dạ, cửa hàng tại số 123 Đường Nguyễn Trãi, Quận 1, TP. HCM ạ.
`;
}

export function triggerDownload(
  content: BlobPart,
  filename: string,
  mimeType: string,
) {
  const blob =
    content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
