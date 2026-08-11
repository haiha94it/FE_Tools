"use client";

import { toast } from "@/lib/toast";
import { useState } from "react";
import { FiCheck, FiCopy, FiExternalLink, FiCode, FiSmartphone, FiX } from "react-icons/fi";

interface QRCodePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  sellerId?: string;
}

export default function QRCodePreviewModal({
  isOpen,
  onClose,
  sellerId = "demo",
}: QRCodePreviewModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const previewUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/shop/${sellerId || "demo"}`
      : `http://localhost:3000/shop/${sellerId || "demo"}`;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    previewUrl,
  )}`;

  const handleCopyLink = () => {
    void navigator.clipboard.writeText(previewUrl);
    setCopied(true);
    toast.success("Đã sao chép liên kết Storefront!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative flex w-full max-w-md flex-col rounded-2xl bg-white p-6 shadow-2xl dark:bg-stone-900 border border-gray-200 dark:border-gray-800 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
        >
          <FiX className="h-4 w-4" />
        </button>

        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 mb-3">
          <FiCode className="h-6 w-6" />
        </div>

        <h3 className="text-base font-bold text-gray-900 dark:text-white">
          Quét QR xem Live Preview trên Zalo
        </h3>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Mở ứng dụng Zalo trên điện thoại quét mã bên dưới để trải nghiệm gian hàng trực tiếp
        </p>

        {/* QR Code Container */}
        <div className="my-5 mx-auto rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-stone-950 p-4 shadow-inner">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrImageUrl}
            alt="Storefront QR Code"
            className="h-48 w-48 rounded-xl object-contain mx-auto shadow-sm bg-white p-2"
          />
          <div className="mt-2 flex items-center justify-center gap-1 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
            <FiSmartphone className="h-3.5 w-3.5 text-blue-500" />
            Zalo App Camera / Barcode Scanner
          </div>
        </div>

        {/* Copy Link Input */}
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-stone-950 p-1.5">
          <input
            type="text"
            readOnly
            value={previewUrl}
            className="w-full bg-transparent px-2 text-xs text-gray-600 dark:text-gray-300 outline-none truncate"
          />
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-stone-800 dark:bg-white dark:text-stone-900 dark:hover:bg-gray-200 active:scale-95"
          >
            {copied ? <FiCheck className="h-3.5 w-3.5 text-emerald-400" /> : <FiCopy className="h-3.5 w-3.5" />}
            {copied ? "Đã chép" : "Sao chép"}
          </button>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2">
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            Mở tab Storefront mới <FiExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
