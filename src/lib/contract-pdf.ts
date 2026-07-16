import {
  CONTRACT_PDF_URL,
  CONTRACT_USER_SIGNATURE_SLOT,
} from "@/constants/contract";
import { ensureSignaturePage } from "@/lib/contract-signature-page";
import { PDFDocument, type PDFImage } from "pdf-lib";

export interface GenerateSignedContractOptions {
  signatureDataUrl: string;
}

function resolvePublicAssetUrl(path: string): string {
  if (typeof window === "undefined") return path;
  return new URL(path, window.location.origin).href;
}

function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1] ?? "";
  if (!base64) {
    throw new Error("Chữ ký không hợp lệ.");
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Không đọc được ảnh chữ ký."));
    image.src = src;
  });
}

function isInkPixel(r: number, g: number, b: number, a: number): boolean {
  if (a < 16) return false;
  return r < 235 || g < 235 || b < 235;
}

/**
 * Cắt vùng có nét ký, nền trong suốt — chỉ ghép ảnh chữ ký lên PDF mẫu.
 */
async function cropSignaturePng(signatureDataUrl: string): Promise<Uint8Array> {
  if (typeof document === "undefined") {
    throw new Error("Chỉ xử lý chữ ký trên trình duyệt.");
  }

  const image = await loadImage(signatureDataUrl);
  const source = document.createElement("canvas");
  source.width = image.width;
  source.height = image.height;
  const sourceCtx = source.getContext("2d");
  if (!sourceCtx) {
    throw new Error("Không đọc được canvas chữ ký.");
  }

  sourceCtx.drawImage(image, 0, 0);
  const { data, width, height } = sourceCtx.getImageData(0, 0, image.width, image.height);

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      if (isInkPixel(data[index], data[index + 1], data[index + 2], data[index + 3])) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (minX >= maxX || minY >= maxY) {
    throw new Error("Chưa có chữ ký trên vùng ký.");
  }

  const padding = 8;
  const cropX = Math.max(0, minX - padding);
  const cropY = Math.max(0, minY - padding);
  const cropW = Math.min(width - cropX, maxX - minX + 1 + padding * 2);
  const cropH = Math.min(height - cropY, maxY - minY + 1 + padding * 2);

  const cropped = document.createElement("canvas");
  cropped.width = cropW;
  cropped.height = cropH;
  const croppedCtx = cropped.getContext("2d");
  if (!croppedCtx) {
    throw new Error("Không tạo được ảnh chữ ký.");
  }

  croppedCtx.clearRect(0, 0, cropW, cropH);
  croppedCtx.drawImage(source, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

  const cropData = croppedCtx.getImageData(0, 0, cropW, cropH);
  for (let i = 0; i < cropData.data.length; i += 4) {
    const alpha = cropData.data[i + 3];
    if (
      !isInkPixel(
        cropData.data[i],
        cropData.data[i + 1],
        cropData.data[i + 2],
        alpha,
      )
    ) {
      cropData.data[i + 3] = 0;
    }
  }
  croppedCtx.putImageData(cropData, 0, 0);

  return dataUrlToUint8Array(cropped.toDataURL("image/png"));
}

/** Fit chữ ký vào ô Bên B — giữ tỷ lệ, căn giữa ngang, neo theo vạch ký trong ô */
function fitSignatureInSlot(
  image: PDFImage,
  slot: typeof CONTRACT_USER_SIGNATURE_SLOT,
) {
  const sidePadding = 10;
  const lineInset = 14;
  const { width: imgW, height: imgH } = image.scale(1);
  const maxW = slot.width - sidePadding * 2;
  const maxH = slot.height - lineInset - 6;
  const scale = Math.min(maxW / imgW, maxH / imgH);
  const drawW = imgW * scale;
  const drawH = imgH * scale;

  return {
    x: slot.x + (slot.width - drawW) / 2,
    y: slot.y + lineInset,
    width: drawW,
    height: drawH,
  };
}

export async function fetchContractTemplateBytes(): Promise<ArrayBuffer> {
  const response = await fetch(resolvePublicAssetUrl(CONTRACT_PDF_URL), {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Không tải được mẫu hợp đồng PDF (${response.status}).`);
  }
  return response.arrayBuffer();
}

/** Tải mẫu + ghép trang chữ ký Bên A/B (trang 15) để xem hoặc ký */
export async function prepareContractPdfBytes(): Promise<Uint8Array> {
  const templateBytes = await fetchContractTemplateBytes();
  const pdfDoc = await PDFDocument.load(templateBytes);
  await ensureSignaturePage(pdfDoc);
  return pdfDoc.save();
}

export async function generateSignedContractPdf(
  options: GenerateSignedContractOptions,
): Promise<Uint8Array> {
  const templateBytes = await fetchContractTemplateBytes();
  const pdfDoc = await PDFDocument.load(templateBytes);
  await ensureSignaturePage(pdfDoc);
  const pages = pdfDoc.getPages();
  const pageIndex = Math.max(
    0,
    pages.length - CONTRACT_USER_SIGNATURE_SLOT.pageFromEnd,
  );
  const page = pages[pageIndex];
  const slot = CONTRACT_USER_SIGNATURE_SLOT;

  const signaturePngBytes = await cropSignaturePng(options.signatureDataUrl);
  const signatureImage = await pdfDoc.embedPng(signaturePngBytes);

  page.drawImage(signatureImage, fitSignatureInSlot(signatureImage, slot));

  return pdfDoc.save();
}

export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

export function downloadContractPdf(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.click();
  URL.revokeObjectURL(url);
}

export function buildSignedContractFilename(username: string): string {
  const safeName = username.replace(/[^\w.-]+/g, "_").slice(0, 40) || "user";
  const stamp = new Date().toISOString().slice(0, 10);
  return `hop-dong-${safeName}-${stamp}.pdf`;
}