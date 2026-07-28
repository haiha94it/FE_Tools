"use client";

import { convertLeadingTabsToQuillIndent } from "@/lib/consent-utils";
import { memo, useEffect, useRef } from "react";

interface ConsentRichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

type QuillInstance = {
  root: HTMLElement;
  enable: (enabled: boolean) => void;
  getSelection: () => { index: number; length: number } | null;
  setSelection: (index: number, length?: number) => void;
  setContents: (delta: unknown, source?: string) => void;
  clipboard: {
    convert: (input: { html?: string; text?: string }) => unknown;
    dangerouslyPasteHTML: (html: string) => void;
  };
  on: (event: string, handler: () => void) => void;
};

/**
 * Nạp HTML vào Quill: tab đầu dòng → ql-indent-* rồi setContents
 * (dangerouslyPasteHTML thường nuốt `\t`).
 */
function loadHtmlIntoQuill(quill: QuillInstance, html: string) {
  const normalized = convertLeadingTabsToQuillIndent(html || "");
  if (!normalized.trim()) {
    quill.setContents([], "silent");
    return;
  }
  try {
    const delta = quill.clipboard.convert({ html: normalized });
    quill.setContents(delta, "silent");
  } catch {
    quill.clipboard.dangerouslyPasteHTML(normalized);
  }
}

/**
 * Rich text (Quill) — admin soạn điều khoản, export HTML vào body_html.
 * Không hiển thị raw HTML cho admin.
 */
function ConsentRichTextEditor({
  value,
  onChange,
  disabled = false,
  placeholder = "Soạn nội dung điều khoản như văn bản thường…",
  className = "",
}: ConsentRichTextEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<QuillInstance | null>(null);
  const onChangeRef = useRef(onChange);
  const lastHtmlRef = useRef(value);
  const disabledRef = useRef(disabled);
  /** Tránh onChange khi đang sync value từ props */
  const syncingRef = useRef(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    disabledRef.current = disabled;
    quillRef.current?.enable(!disabled);
  }, [disabled]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      if (!containerRef.current) return;

      const QuillModule = await import("quill");
      const Quill = QuillModule.default;
      await import("quill/dist/quill.snow.css");

      if (cancelled || !containerRef.current) return;

      containerRef.current.innerHTML = "";
      const editorHost = document.createElement("div");
      containerRef.current.appendChild(editorHost);

      const quill = new Quill(editorHost, {
        theme: "snow",
        placeholder,
        readOnly: disabledRef.current,
        modules: {
          toolbar: [
            [{ header: [1, 2, 3, false] }],
            ["bold", "italic", "underline"],
            [{ list: "ordered" }, { list: "bullet" }],
            // Thụt / nhô dòng — lưu class ql-indent-* vào HTML
            [{ indent: "-1" }, { indent: "+1" }],
            ["link"],
            ["clean"],
          ],
        },
      }) as unknown as QuillInstance;

      if (value) {
        syncingRef.current = true;
        loadHtmlIntoQuill(quill, value);
        const html = quill.root.innerHTML;
        lastHtmlRef.current = html;
        syncingRef.current = false;
        // Đồng bộ state parent sang ql-indent (tab đã convert) — Lưu sẽ giữ thụt dòng
        if (html && html !== value) {
          onChangeRef.current(html);
        }
      }

      quill.on("text-change", () => {
        if (syncingRef.current) return;
        const html = quill.root.innerHTML;
        lastHtmlRef.current = html;
        onChangeRef.current(html);
      });

      quillRef.current = quill;
    })();

    const host = containerRef.current;
    return () => {
      cancelled = true;
      quillRef.current = null;
      if (host) {
        host.innerHTML = "";
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once
  }, []);

  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) return;
    if (value === lastHtmlRef.current) return;

    syncingRef.current = true;
    const selection = quill.getSelection();
    loadHtmlIntoQuill(quill, value || "");
    const html = quill.root.innerHTML;
    lastHtmlRef.current = html;
    syncingRef.current = false;

    if (selection) {
      try {
        quill.setSelection(selection.index, selection.length);
      } catch {
        // ignore
      }
    }

    // Props còn tab thô → editor đã convert; đẩy lại parent
    if (html && html !== value) {
      onChangeRef.current(html);
    }
  }, [value]);

  const insertPlaceholder = (text: string) => {
    const quill = quillRef.current;
    if (!quill) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const q = quill as any;
    const range = q.getSelection();

    if (range) {
      q.insertText(range.index, text, "user");
      q.setSelection(range.index + text.length, 0, "user");
    } else {
      const length = q.getLength ? q.getLength() : 0;
      const index = Math.max(0, length - 1);
      q.insertText(index, text, "user");
      q.setSelection(index + text.length, 0, "user");
    }
  };

  return (
    <div className={`consent-quill-editor min-w-0 space-y-3 ${className}`.trim()}>
      <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Chèn nhanh các biến placeholder
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { label: "Tên đơn vị / Cá nhân", text: "{{ entity_name }}" },
            { label: "Mã số thuế", text: "{{ tax_code }}" },
            { label: "Người đại diện", text: "{{ representative_name }}" },
            { label: "Chức vụ", text: "{{ representative_title }}" },
            { label: "Địa chỉ", text: "{{ address }}" },
            { label: "Số điện thoại", text: "{{ phone }}" },
            { label: "Email", text: "{{ email }}" },
          ].map((btn) => (
            <button
              key={btn.text}
              type="button"
              onClick={() => insertPlaceholder(btn.text)}
              className="cursor-pointer rounded bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700 hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-300 dark:hover:bg-brand-500/20"
            >
              {btn.label}
            </button>
          ))}

          <div className="mx-1 h-4 w-px bg-gray-200 dark:bg-gray-800" />

          {[
            { label: "Ngày hiện tại", text: "{{ current_day }}" },
            { label: "Tháng hiện tại", text: "{{ current_month }}" },
            { label: "Năm hiện tại", text: "{{ current_year }}" },
          ].map((btn) => (
            <button
              key={btn.text}
              type="button"
              onClick={() => insertPlaceholder(btn.text)}
              className="cursor-pointer rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={containerRef}
        className="overflow-hidden rounded-xl border border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900"
      />
    </div>
  );
}

export default memo(ConsentRichTextEditor);
