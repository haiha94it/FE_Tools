"use client";

import { FiCommand, FiX } from "react-icons/fi";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function KeyboardShortcutsModal({
  isOpen,
  onClose,
}: KeyboardShortcutsModalProps) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: "Ctrl + S / ⌘S", label: "Lưu bản nháp ngay lập tức" },
    { key: "Ctrl + D / ⌘D", label: "Nhân đôi khối đang chọn" },
    { key: "Delete / Backspace", label: "Xóa khối đang chọn" },
    { key: "Ctrl + Z / ⌘Z", label: "Hoàn tác (Undo)" },
    { key: "Ctrl + Y / ⌘⇧Z", label: "Làm lại (Redo)" },
    { key: "Ctrl + Alt + C / ⌥⌘C", label: "Sao chép kiểu dáng khối (Copy Style)" },
    { key: "Ctrl + Alt + V / ⌥⌘V", label: "Dán kiểu dáng khối (Paste Style)" },
    { key: "Esc", label: "Bỏ chọn khối hiện tại" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative flex w-full max-w-lg flex-col rounded-2xl bg-white p-6 shadow-2xl dark:bg-stone-900 border border-gray-200 dark:border-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <FiCommand className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Bộ Phím Tắt Chuyên Nghiệp
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Thao tác nhanh trên Trình tạo trang như phần mềm Pro
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

        <div className="my-4 divide-y divide-gray-100 dark:divide-gray-800/60">
          {shortcuts.map((sc, i) => (
            <div key={i} className="flex items-center justify-between py-2.5 text-xs">
              <span className="font-medium text-gray-700 dark:text-gray-300">{sc.label}</span>
              <kbd className="inline-flex items-center rounded-md border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-stone-800 px-2.5 py-1 text-[11px] font-bold font-mono text-gray-800 dark:text-gray-200 shadow-sm">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-2 text-center text-[11px] text-gray-400">
          💡 Bạn có thể thực hiện phím tắt bất kỳ lúc nào khi đang thao tác trên Canvas.
        </div>
      </div>
    </div>
  );
}
