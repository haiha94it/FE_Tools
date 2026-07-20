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
      // @ts-expect-error CSS side-effect import
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

  return (
    <div className={`consent-quill-editor min-w-0 ${className}`.trim()}>
      <div
        ref={containerRef}
        className="overflow-hidden rounded-xl border border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900"
      />
    </div>
  );
}

export default memo(ConsentRichTextEditor);
