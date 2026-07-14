"use client";

import { Tooltip } from "@/components/ui/tooltip/Tooltip";
import { resolveZaloLabelColor } from "@/lib/zalo-label-utils";
import type { MessengerCategoryLabel } from "@/types/zalo-messenger";
import { memo, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface LabelFilterDropdownProps {
  disabled?: boolean;
  categories: MessengerCategoryLabel[];
  categoriesLoading: boolean;
  selectedCategoryId: number | null;
  onSelectCategory: (categoryId: number | null) => void;
  onOpenManageLabels?: () => void;
}

function LabelFilterDropdown({
  disabled = false,
  categories,
  categoriesLoading,
  selectedCategoryId,
  onSelectCategory,
  onOpenManageLabels,
}: LabelFilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selectedCategory =
    categories.find((item) => item.id === selectedCategoryId) ?? null;

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open || !rootRef.current) return;

    const triggerRect = rootRef.current.getBoundingClientRect();
    const menuWidth = menuRef.current?.offsetWidth ?? 220;
    const viewportWidth = window.innerWidth;
    const left = Math.min(
      Math.max(8, triggerRect.left),
      viewportWidth - menuWidth - 8,
    );

    setMenuPosition({
      top: triggerRect.bottom + 6,
      left,
    });
  }, [open, categories.length]);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        rootRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleSelect = (categoryId: number | null) => {
    onSelectCategory(categoryId);
    setOpen(false);
  };

  const handleManageLabels = () => {
    if (!onOpenManageLabels) return;
    setOpen(false);
    onOpenManageLabels();
  };

  return (
    <div ref={rootRef} className="relative shrink-0">
      <Tooltip content="Phân loại theo nhãn" side="top">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((current) => !current)}
          className={`inline-flex h-9 min-w-9 shrink-0 items-center justify-center gap-0.5 rounded-xl border px-1.5 transition disabled:cursor-not-allowed disabled:opacity-50 ${
            selectedCategoryId
              ? "border-brand-300 bg-brand-50 text-brand-700 dark:border-brand-500/40 dark:bg-brand-500/10 dark:text-brand-400"
              : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400"
          }`}
          aria-label="Phân loại theo nhãn"
          aria-expanded={open}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={
              selectedCategory
                ? { color: resolveZaloLabelColor(selectedCategory.color) }
                : undefined
            }
          >
            <path d="M12 2 2 7l10 5 10-5-10-5Z" />
            <path d="m2 17 10 5 10-5" />
            <path d="m2 12 10 5 10-5" />
          </svg>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`transition ${open ? "rotate-180" : ""}`}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </Tooltip>

      {open && mounted && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              className="fixed z-[120] flex w-[220px] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900"
              style={{ top: menuPosition.top, left: menuPosition.left }}
            >
              <div className="border-b border-gray-100 px-3 py-2 dark:border-gray-800">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Theo nhãn phân loại
                </p>
              </div>

              <div className="max-h-[240px] overflow-y-auto py-1">
                <button
                  type="button"
                  onClick={() => handleSelect(null)}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                >
                  <span className="inline-flex min-w-0 items-center gap-2">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-gray-300 dark:bg-gray-600" />
                    <span className="font-medium text-gray-700 dark:text-gray-200">
                      Tất cả
                    </span>
                  </span>
                  {!selectedCategoryId ? (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="shrink-0 text-brand-600"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  ) : null}
                </button>

                {categoriesLoading ? (
                  <div className="flex items-center justify-center gap-2 px-3 py-4 text-xs font-medium text-gray-500">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                    Đang tải nhãn...
                  </div>
                ) : categories.length === 0 ? (
                  <p className="px-3 py-3 text-xs text-gray-500 dark:text-gray-400">
                    Chưa có nhãn phân loại.
                  </p>
                ) : (
                  categories.map((category) => {
                    const active = selectedCategoryId === category.id;
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => handleSelect(active ? null : category.id)}
                        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                      >
                        <span className="inline-flex min-w-0 items-center gap-2">
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{
                              backgroundColor: resolveZaloLabelColor(
                                category.color,
                              ),
                            }}
                          />
                          <span className="truncate font-medium text-gray-700 dark:text-gray-200">
                            {category.name || `Nhãn #${category.id}`}
                          </span>
                        </span>
                        {active ? (
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="shrink-0 text-brand-600"
                          >
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                        ) : null}
                      </button>
                    );
                  })
                )}
              </div>

              {onOpenManageLabels ? (
                <button
                  type="button"
                  onClick={handleManageLabels}
                  disabled={disabled}
                  className="border-t border-gray-100 bg-brand-500 px-3 py-2.5 text-center text-[13px] font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800"
                >
                  Quản lý nhãn phân loại
                </button>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

export default memo(LabelFilterDropdown);