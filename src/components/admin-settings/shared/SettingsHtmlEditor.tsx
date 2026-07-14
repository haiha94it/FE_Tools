"use client";

import Checkbox from "@/components/form/input/Checkbox";

interface SettingsHtmlEditorProps {
  label?: string;
  value: string;
  active: boolean;
  onChange: (value: string) => void;
  onActiveChange: (active: boolean) => void;
  activeLabel?: string;
}

const textareaClassName =
  "custom-scrollbar w-full min-h-[min(60vh,480px)] resize-y rounded-xl border border-gray-300 bg-transparent px-4 py-3 font-mono text-sm text-gray-800 shadow-theme-xs outline-none placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

export default function SettingsHtmlEditor({
  label = "Nội dung HTML",
  value,
  active,
  onChange,
  onActiveChange,
  activeLabel = "Bật thông báo",
}: SettingsHtmlEditorProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={textareaClassName}
          placeholder="Nhập nội dung HTML..."
        />
      </div>
      <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
        <Checkbox checked={active} onChange={onActiveChange} />
        {activeLabel}
      </label>
    </div>
  );
}