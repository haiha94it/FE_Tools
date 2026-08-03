"use client";

import Checkbox from "@/components/form/input/Checkbox";
import ConsentRichTextEditor from "@/components/consent/ConsentRichTextEditor";

interface SettingsHtmlEditorProps {
  label?: string;
  value: string;
  active: boolean;
  onChange: (value: string) => void;
  onActiveChange: (active: boolean) => void;
  activeLabel?: string;
}

/**
 * Editor rich text (Quill) cho popup admin — bold/italic/header như ZaloCN Prime Editor.
 * Lưu HTML; không raw textarea.
 */
export default function SettingsHtmlEditor({
  label = "Nội dung",
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
        <ConsentRichTextEditor
          value={value}
          onChange={onChange}
          showPlaceholders={false}
          placeholder="Soạn nội dung — dùng toolbar in đậm, tiêu đề, danh sách…"
          className="settings-html-editor"
        />
      </div>
      <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
        <Checkbox checked={active} onChange={onActiveChange} />
        {activeLabel}
      </label>
    </div>
  );
}
