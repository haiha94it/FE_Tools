"use client";

import Button from "@/components/ui/button/Button";
import { useRef, useState } from "react";
import { HiOutlinePlus, HiOutlineTrash } from "react-icons/hi";

interface SendMessMemberGrFirstMessageEditorProps {
  contents: string[];
  disabled?: boolean;
  onContentsChange: (contents: string[]) => void;
}

/** Guide mess-phone: first_messages ≤ 135 ký tự */
const MAX_LENGTH = 135;
const DEFAULT_TEMPLATE = "Xin chào [gender] [name] ! ...... Kết bạn nhé!";

const textareaClassName =
  "w-full resize-y rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-800 shadow-theme-xs outline-none placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

export default function SendMessMemberGrFirstMessageEditor({
  contents,
  disabled = false,
  onContentsChange,
}: SendMessMemberGrFirstMessageEditorProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState("");

  const insertPlaceholder = (token: string) => {
    const input = inputRef.current;
    if (!input) {
      setDraft((prev) => (prev + token).slice(0, MAX_LENGTH));
      return;
    }
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const next = `${draft.slice(0, start)}${token}${draft.slice(end)}`.slice(
      0,
      MAX_LENGTH,
    );
    setDraft(next);
  };

  const addContent = () => {
    const value = draft.trim();
    if (!value) return;
    onContentsChange([...contents, value]);
    setDraft("");
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
        Lời chào kết bạn
      </p>
      <div className="flex flex-wrap gap-2">
        {[
          { key: "[gender]", label: "Giới tính" },
          { key: "[name]", label: "Tên" },
          { key: "[r]", label: "Icon ngẫu nhiên" },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            disabled={disabled}
            onClick={() => insertPlaceholder(item.key)}
            className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-theme-xs font-medium text-brand-700 transition hover:bg-brand-100 disabled:opacity-50 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300"
          >
            {item.label} ({item.key})
          </button>
        ))}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setDraft(DEFAULT_TEMPLATE)}
          className="rounded-full border border-gray-200 px-3 py-1 text-theme-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
        >
          Mẫu
        </button>
      </div>
      <textarea
        ref={inputRef}
        value={draft}
        disabled={disabled}
        onChange={(e) => setDraft(e.target.value.slice(0, MAX_LENGTH))}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            addContent();
          }
        }}
        rows={3}
        placeholder="Nhập lời chào kết bạn... (Enter để thêm)"
        className={textareaClassName}
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-theme-xs text-gray-500">
          {draft.length}/{MAX_LENGTH}
        </span>
        <Button size="sm" disabled={disabled || !draft.trim()} onClick={addContent}>
          <HiOutlinePlus className="mr-1" size={14} />
          Thêm lời chào
        </Button>
      </div>
      {contents.length > 0 ? (
        <div className="space-y-2">
          {contents.map((item, index) => (
            <div
              key={`first-${index}`}
              className="flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-white/[0.02]"
            >
              <p className="min-w-0 flex-1 text-sm text-gray-700 dark:text-gray-300">
                {item}
              </p>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onContentsChange(contents.filter((_, i) => i !== index))}
                className="shrink-0 rounded-lg p-1.5 text-error-500 hover:bg-error-50 disabled:opacity-50"
              >
                <HiOutlineTrash size={16} />
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}