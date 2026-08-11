"use client";

import {
  getStoredApiKey,
  parseHtmlContentWithAi,
  parseScreenshotWithAi,
  setStoredApiKey,
} from "@/services/ai-ui-importer.service";
import type { LayoutSection } from "@/types/shop-layout-canvas";
import { useEffect, useState } from "react";
import {
  FiCheck,
  FiCode,
  FiImage,
  FiKey,
  FiLoader,
  FiZap,
  FiUploadCloud,
  FiX,
} from "react-icons/fi";
import { toast } from "@/lib/toast";

interface AiUiImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSections: (sections: LayoutSection[]) => void;
}

export default function AiUiImporterModal({
  isOpen,
  onClose,
  onImportSections,
}: AiUiImporterModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [activeTab, setActiveTab] = useState<"image" | "html">("image");

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [htmlInput, setHtmlInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [parsedResult, setParsedResult] = useState<LayoutSection[] | null>(null);

  useEffect(() => {
    if (isOpen) {
      const savedKey = getStoredApiKey();
      setApiKey(savedKey);
      if (!savedKey) setShowKeyInput(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveKey = () => {
    setStoredApiKey(apiKey);
    setShowKeyInput(false);
    toast.success("Đã lưu Gemini API Key thành công!");
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Vui lòng chọn ảnh nhỏ hơn 5MB!");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setParsedResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRunAiImport = async () => {
    if (!apiKey.trim()) {
      setShowKeyInput(true);
      toast.error("Vui lòng nhập Gemini API Key để sử dụng tính năng này!");
      return;
    }

    setLoading(true);
    setParsedResult(null);

    try {
      if (activeTab === "image") {
        if (!selectedImage) {
          toast.error("Vui lòng tải lên ảnh chụp màn hình UI!");
          setLoading(false);
          return;
        }
        const res = await parseScreenshotWithAi(selectedImage, apiKey);
        if (!res.success) {
          toast.error(res.error || "Phân tích ảnh thất bại!");
        } else {
          setParsedResult(res.sections);
          toast.success(`🎉 AI đã tạo thành công ${res.sections.length} khối giao diện!`);
        }
      } else {
        if (!htmlInput.trim()) {
          toast.error("Vui lòng dán đoạn mã HTML hoặc nội dung UI!");
          setLoading(false);
          return;
        }
        const res = await parseHtmlContentWithAi(htmlInput, apiKey);
        if (!res.success) {
          toast.error(res.error || "Phân tích mã thất bại!");
        } else {
          setParsedResult(res.sections);
          toast.success(`🎉 AI đã tạo thành công ${res.sections.length} khối giao diện!`);
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Đã xảy ra lỗi khi phân tích!");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToCanvas = () => {
    if (!parsedResult || parsedResult.length === 0) return;
    onImportSections(parsedResult);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative flex w-full max-w-2xl max-h-[90vh] flex-col rounded-2xl bg-white shadow-2xl dark:bg-stone-900 border border-gray-200 dark:border-gray-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 dark:border-gray-800 px-6 py-4 bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-purple-600 text-white shadow-md">
              <FiZap className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                🪄 AI Magic UI Importer
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                  Gemini Vision 2.5
                </span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Tự động bóc tách ảnh chụp UI hoặc mã HTML thành các khối Visual Builder
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        {/* API Key Bar */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-stone-950/60 px-6 py-2.5 text-xs">
          <div className="flex items-center gap-2">
            <FiKey className="h-4 w-4 text-amber-500" />
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              API Key:
            </span>
            <span className="font-mono text-gray-500 dark:text-gray-400">
              {apiKey ? `${apiKey.slice(0, 8)}••••••••` : "Chưa thiết lập"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowKeyInput((v) => !v)}
            className="cursor-pointer text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
          >
            {showKeyInput ? "Đóng cài đặt" : "Cấu hình Key"}
          </button>
        </div>

        {/* API Key Drawer Input */}
        {showKeyInput ? (
          <div className="border-b border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 p-4 animate-in slide-in-from-top-2 duration-150">
            <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-1">
              Google Gemini API Key (Hoàn toàn miễn phí từ AI Studio)
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="AIzaSy..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-stone-900 px-3 py-2 text-xs font-mono outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={handleSaveKey}
                className="cursor-pointer rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-600 shrink-0"
              >
                Lưu Key
              </button>
            </div>
            <p className="mt-1.5 text-[11px] text-gray-500 dark:text-gray-400">
              💡 Bạn có thể lấy API Key miễn phí tại{" "}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-amber-600 underline font-semibold"
              >
                Google AI Studio
              </a>
              . Key được lưu an toàn trên Trình duyệt của bạn.
            </p>
          </div>
        ) : null}

        {/* Mode Tabs */}
        <div className="flex shrink-0 gap-2 border-b border-gray-200 dark:border-gray-800 px-6 pt-3 bg-white dark:bg-stone-900">
          <button
            type="button"
            onClick={() => {
              setActiveTab("image");
              setParsedResult(null);
            }}
            className={`flex cursor-pointer items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-bold transition ${
              activeTab === "image"
                ? "border-amber-500 text-amber-600 dark:text-amber-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <FiImage className="h-4 w-4" />
            1. Ảnh Chụp Màn Hình UI (Vision AI)
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("html");
              setParsedResult(null);
            }}
            className={`flex cursor-pointer items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-bold transition ${
              activeTab === "html"
                ? "border-amber-500 text-amber-600 dark:text-amber-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <FiCode className="h-4 w-4" />
            2. Mã HTML / Tailwind / Web Link
          </button>
        </div>

        {/* Content Body */}
        <div className="custom-scrollbar flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === "image" ? (
            <div>
              <label className="flex flex-col items-center justify-center h-44 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-stone-950/50 hover:bg-gray-100 dark:hover:bg-stone-950 transition cursor-pointer relative overflow-hidden">
                {selectedImage ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={selectedImage}
                    alt="Preview UI"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-4 text-center">
                    <FiUploadCloud className="h-8 w-8 text-amber-500 mb-2" />
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
                      Nhấp để chọn hoặc kéo thả Ảnh UI vào đây
                    </span>
                    <span className="text-[11px] text-gray-400 mt-1">
                      Hỗ trợ PNG, JPG, WEBP (Tối đa 5MB)
                    </span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-1.5">
                Dán mã HTML thô, mã Tailwind UI hoặc nội dung văn bản UI:
              </label>
              <textarea
                rows={6}
                value={htmlInput}
                onChange={(e) => setHtmlInput(e.target.value)}
                placeholder="<div class='hero'><h1>Têu đề banner</h1><button>Mua ngay</button></div>..."
                className="w-full rounded-2xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-stone-950 p-3.5 text-xs font-mono outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          )}

          {/* Parsed Result Preview */}
          {parsedResult ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <FiCheck className="h-4 w-4" />
                  Đã tạo thành công {parsedResult.length} khối giao diện:
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {parsedResult.map((sec, i) => (
                  <span
                    key={sec.id || i}
                    className="rounded-lg bg-emerald-500/15 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300"
                  >
                    #{i + 1} {sec.type}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="flex shrink-0 items-center justify-between border-t border-gray-200 dark:border-gray-800 px-6 py-4 bg-gray-50/50 dark:bg-stone-950/40">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-stone-800"
          >
            Đóng
          </button>

          <div className="flex gap-2">
            {parsedResult ? (
              <button
                type="button"
                onClick={handleApplyToCanvas}
                className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-700 active:scale-95 transition"
              >
                <FiCheck className="h-4 w-4" />
                Áp dụng {parsedResult.length} khối vào Canvas
              </button>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={handleRunAiImport}
                className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-purple-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg hover:opacity-95 active:scale-95 disabled:opacity-50 transition"
              >
                {loading ? (
                  <FiLoader className="h-4 w-4 animate-spin" />
                ) : (
                  <FiZap className="h-4 w-4" />
                )}
                {loading ? "AI đang bóc tách giao diện…" : "Bắt đầu bóc tách AI"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
