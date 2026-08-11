"use client";

import { PAGE_TEMPLATES, type PageTemplateDefinition } from "@/lib/layout-canvas-templates";
import type { LayoutSection } from "@/types/shop-layout-canvas";
import { useState } from "react";
import { FiCheck, FiGrid, FiLayout, FiZap, FiX } from "react-icons/fi";

interface PageTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTemplate: (sections: LayoutSection[], templateName: string) => void;
}

export default function PageTemplateModal({
  isOpen,
  onClose,
  onApplyTemplate,
}: PageTemplateModalProps) {
  const [selectedCat, setSelectedCat] = useState<string>("all");
  const [confirmingTemplate, setConfirmingTemplate] = useState<PageTemplateDefinition | null>(null);

  if (!isOpen) return null;

  const filteredTemplates =
    selectedCat === "all"
      ? PAGE_TEMPLATES
      : PAGE_TEMPLATES.filter((t) => t.category === selectedCat);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative flex w-full max-w-4xl max-h-[85vh] flex-col rounded-2xl bg-white shadow-2xl dark:bg-stone-900 border border-gray-200 dark:border-gray-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 dark:border-gray-800 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <FiZap className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Thư viện Mẫu Trang 1-Click
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Chọn mẫu trang dựng sẵn theo ngành hàng để áp dụng ngay lập tức
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

        {/* Category Tabs */}
        <div className="flex shrink-0 items-center gap-2 border-b border-gray-100 dark:border-gray-800/60 bg-gray-50/50 dark:bg-stone-950/40 px-6 py-2.5 overflow-x-auto">
          {[
            { id: "all", label: "Tất cả mẫu" },
            { id: "fashion", label: "Thời trang & Mỹ phẩm" },
            { id: "flash", label: "Flash Sale Bùng nổ" },
            { id: "tech", label: "Công nghệ & Điện máy" },
            { id: "lead", label: "Tư vấn & Lead" },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCat(cat.id)}
              className={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                selectedCat === cat.id
                  ? "bg-stone-900 text-white dark:bg-white dark:text-stone-900 shadow-sm"
                  : "bg-white text-gray-600 hover:bg-gray-200 dark:bg-stone-800 dark:text-gray-300 dark:hover:bg-stone-700"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Template Grid */}
        <div className="custom-scrollbar flex-1 overflow-y-auto p-6">
          <div className="grid gap-6 md:grid-cols-2">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-stone-900 shadow-sm transition hover:shadow-xl hover:border-amber-500/50"
              >
                {/* Gradient Banner Preview */}
                <div
                  className={`relative h-28 w-full bg-gradient-to-r ${template.previewGradient} p-4 flex flex-col justify-between`}
                >
                  <span className="self-start rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
                    {template.badge}
                  </span>
                  <div className="flex items-center gap-1.5 text-white/90 text-xs font-semibold">
                    <FiLayout className="h-3.5 w-3.5" />
                    {template.build().length} khối cấu trúc
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col p-4 justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                      {template.name}
                    </h4>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                      {template.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-gray-400">
                      {template.subtitle}
                    </span>
                    <button
                      type="button"
                      onClick={() => setConfirmingTemplate(template)}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-md transition hover:bg-amber-600 active:scale-95"
                    >
                      <FiCheck className="h-3.5 w-3.5" />
                      Dùng mẫu này
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Confirmation Overlay Dialog */}
        {confirmingTemplate ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-stone-900 shadow-2xl border border-gray-200 dark:border-gray-800 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 mb-3">
                <FiGrid className="h-6 w-6" />
              </div>
              <h4 className="text-base font-bold text-gray-900 dark:text-white">
                Xác nhận áp dụng mẫu "{confirmingTemplate.name}"?
              </h4>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Hành động này sẽ thay thế các khối hiện tại trên trang bằng bộ {confirmingTemplate.build().length} khối mẫu chuẩn. Bạn vẫn có thể dùng phím tắt Hoàn tác (`Ctrl+Z`) để quay lại nếu muốn.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmingTemplate(null)}
                  className="cursor-pointer rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-stone-800"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onApplyTemplate(confirmingTemplate.build(), confirmingTemplate.name);
                    setConfirmingTemplate(null);
                    onClose();
                  }}
                  className="cursor-pointer rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-amber-600 active:scale-95"
                >
                  Đồng ý áp dụng
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
