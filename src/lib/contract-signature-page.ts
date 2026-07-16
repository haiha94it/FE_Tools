import {
  CONTRACT_CONTENT_PAGE_COUNT,
  CONTRACT_SIGNATURE_PAGE_LAYOUT,
} from "@/constants/contract";
import { LEGAL_BRAND_NAME } from "@/constants/brand";
import type { PDFDocument } from "pdf-lib";

const RENDER_SCALE = 2;

function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1] ?? "";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Vẽ trang xác nhận ký (Bên A đã ký, Bên B có ô chữ ký) — dùng canvas để hiển thị tiếng Việt.
 */
export async function buildSignaturePagePng(): Promise<Uint8Array> {
  if (typeof document === "undefined") {
    throw new Error("Chỉ tạo trang chữ ký trên trình duyệt.");
  }

  const { pageWidth, pageHeight, partyBSignatureBox } =
    CONTRACT_SIGNATURE_PAGE_LAYOUT;
  const canvas = document.createElement("canvas");
  canvas.width = pageWidth * RENDER_SCALE;
  canvas.height = pageHeight * RENDER_SCALE;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Không tạo được canvas trang chữ ký.");
  }

  const scale = RENDER_SCALE;
  const px = (value: number) => value * scale;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const drawText = (
    text: string,
    x: number,
    y: number,
    size: number,
    options?: { bold?: boolean; color?: string; align?: "left" | "center" },
  ) => {
    const bold = options?.bold ? "bold " : "";
    ctx.font = `${bold}${size * scale}px Arial, "Segoe UI", sans-serif`;
    ctx.fillStyle = options?.color ?? "#111827";
    const measured = ctx.measureText(text);
    let drawX = px(x);
    if (options?.align === "center") {
      drawX = px(x) - measured.width / 2;
    }
    ctx.fillText(text, drawX, px(y));
  };

  drawText("XÁC NHẬN KÝ HỢP ĐỒNG", pageWidth / 2, 72, 15, {
    bold: true,
    align: "center",
  });
  drawText(
    "Hai bên xác nhận đã đọc, hiểu và đồng ý các điều khoản nêu trên.",
    pageWidth / 2,
    96,
    10,
    { align: "center", color: "#4b5563" },
  );

  // --- Bên A (trái) ---
  drawText(`BÊN A (${LEGAL_BRAND_NAME.toUpperCase()})`, 56, 140, 12, {
    bold: true,
  });
  drawText("Bên cung cấp dịch vụ phần mềm", 56, 162, 10, { color: "#4b5563" });
  drawText(`Công ty: ${LEGAL_BRAND_NAME}`, 56, 190, 10);
  drawText("Đại diện: Ban quản trị", 56, 212, 10);
  drawText("Chức vụ: Đại diện hợp pháp", 56, 234, 10);

  ctx.strokeStyle = "#1e3a5f";
  ctx.lineWidth = 2 * scale;
  ctx.beginPath();
  ctx.moveTo(px(56), px(278));
  ctx.bezierCurveTo(px(95), px(255), px(130), px(295), px(195), px(270));
  ctx.stroke();

  ctx.strokeStyle = "#dc2626";
  ctx.lineWidth = 2 * scale;
  ctx.beginPath();
  ctx.arc(px(215), px(310), px(30), 0, Math.PI * 2);
  ctx.stroke();
  drawText("ĐÃ KÝ", 198, 316, 9, { bold: true, color: "#dc2626" });
  drawText("Ngày ký: 19/06/2024", 56, 360, 10);
  drawText("(Đã ký, đóng dấu)", 56, 382, 9, { color: "#6b7280" });

  // --- Bên B (phải) ---
  drawText("BÊN B (NGƯỜI SỬ DỤNG PHẦN MỀM)", 320, 140, 12, {
    bold: true,
  });
  drawText("Bên sử dụng phần mềm", 320, 162, 10, { color: "#4b5563" });
  drawText("Họ và tên: ................................", 320, 210, 10);
  drawText("Ngày ký: ____/____/________", 320, 238, 10);

  const box = partyBSignatureBox;
  drawText("Ký tên (ô chữ ký Bên B)", box.x, box.y - 14, 10, {
    color: "#6b7280",
  });

  ctx.strokeStyle = "#64748b";
  ctx.lineWidth = 1.5 * scale;
  ctx.setLineDash([px(5), px(4)]);
  ctx.strokeRect(px(box.x), px(box.y), px(box.width), px(box.height));
  ctx.setLineDash([]);

  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 1 * scale;
  ctx.beginPath();
  ctx.moveTo(px(box.x + 12), px(box.y + box.height - 14));
  ctx.lineTo(px(box.x + box.width - 12), px(box.y + box.height - 14));
  ctx.stroke();

  return dataUrlToUint8Array(canvas.toDataURL("image/png"));
}

export async function ensureSignaturePage(pdfDoc: PDFDocument): Promise<void> {
  if (pdfDoc.getPageCount() > CONTRACT_CONTENT_PAGE_COUNT) {
    return;
  }

  const { pageWidth, pageHeight } = CONTRACT_SIGNATURE_PAGE_LAYOUT;
  const pngBytes = await buildSignaturePagePng();
  const png = await pdfDoc.embedPng(pngBytes);
  const page = pdfDoc.addPage([pageWidth, pageHeight]);
  page.drawImage(png, {
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
  });
}