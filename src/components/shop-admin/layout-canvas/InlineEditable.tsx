/**
 * Inline editable text for canvas WYSIWYG (contentEditable).
 */

"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";

interface InlineEditableProps {
  value: string;
  onChange: (next: string) => void;
  className?: string;
  style?: CSSProperties;
  as?: "span" | "p" | "h1" | "h2" | "h3" | "div";
  placeholder?: string;
  multiline?: boolean;
  disabled?: boolean;
  /** Stop propagation so section select doesn't steal focus */
  stopClick?: boolean;
}

export default function InlineEditable({
  value,
  onChange,
  className = "",
  style,
  as: Tag = "span",
  placeholder = "Nhập nội dung…",
  multiline = false,
  disabled = false,
  stopClick = true,
}: InlineEditableProps) {
  const ref = useRef<HTMLElement>(null);
  const lastValue = useRef(value);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (document.activeElement === el) return;
    if (el.innerText !== value) {
      el.innerText = value || "";
      lastValue.current = value;
    }
  }, [value]);

  const commit = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const next = (el.innerText || "").replace(/\u00a0/g, " ").trimEnd();
    if (next !== lastValue.current) {
      lastValue.current = next;
      onChange(next);
    }
  }, [onChange]);

  const onKeyDown = (e: KeyboardEvent) => {
    if (!multiline && e.key === "Enter") {
      e.preventDefault();
      (e.target as HTMLElement).blur();
    }
    if (e.key === "Escape") {
      const el = ref.current;
      if (el) el.innerText = lastValue.current || "";
      (e.target as HTMLElement).blur();
    }
    e.stopPropagation();
  };

  if (disabled) {
    return (
      <Tag className={className} style={style}>
        {value || placeholder}
      </Tag>
    );
  }

  return (
    <Tag
      ref={ref as never}
      className={`outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-[color:var(--wp-blue,#3858e9)]/50 empty:before:pointer-events-none empty:before:text-current empty:before:opacity-40 empty:before:content-[attr(data-placeholder)] ${className}`}
      style={style}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-multiline={multiline || undefined}
      data-placeholder={placeholder}
      spellCheck
      onClick={(e) => {
        if (stopClick) e.stopPropagation();
      }}
      onBlur={commit}
      onKeyDown={onKeyDown}
      onPaste={(e) => {
        e.preventDefault();
        const text = e.clipboardData.getData("text/plain");
        document.execCommand("insertText", false, text);
      }}
    />
  );
}

/** Wrapper that enables pointer events inside pointer-events-none preview */
export function InlineEditLayer({
  children,
  active,
}: {
  children: ReactNode;
  active?: boolean;
}) {
  return (
    <div
      className={
        active
          ? "pointer-events-auto relative z-[1]"
          : "pointer-events-none"
      }
    >
      {children}
    </div>
  );
}
