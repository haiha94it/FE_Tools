"use client";

import Button from "@/components/ui/button/Button";
import { useSupportChatStore } from "@/stores/use-support-chat-store";
import { useEffect, useRef, useState } from "react";
import { FiCpu, FiRefreshCw, FiSend, FiUser } from "react-icons/fi";
import SupportImageLightbox from "./SupportImageLightbox";

interface SupportChatPanelProps {
  /** Compact height for floating widget */
  compact?: boolean;
  className?: string;
}

export default function SupportChatPanel({
  compact = false,
  className = "",
}: SupportChatPanelProps) {
  const messages = useSupportChatStore((s) => s.messages);
  const sending = useSupportChatStore((s) => s.sending);
  const send = useSupportChatStore((s) => s.send);
  const reset = useSupportChatStore((s) => s.reset);

  const [input, setInput] = useState("");
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 100)}px`;
  }, [input]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    await send(text);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <div
      className={`flex flex-col overflow-hidden bg-gray-50/40 dark:bg-gray-900/20 ${className}`}
    >
      <div
        className={`custom-scrollbar flex-1 space-y-3 overflow-y-auto px-3 py-3 ${
          compact ? "min-h-[280px] max-h-[360px]" : "min-h-[360px]"
        }`}
      >
        {messages.map((msg) => {
          const isBot = msg.sender === "bot";
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2 ${
                isBot ? "justify-start" : "justify-end"
              }`}
            >
              {isBot ? (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                  <FiCpu size={14} />
                </div>
              ) : null}
              <div className="max-w-[80%] min-w-0">
                {msg.text ? (
                  <div
                    className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                      isBot
                        ? "rounded-tl-none border border-gray-200 bg-white text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                        : "rounded-tr-none bg-brand-500 text-white"
                    }`}
                    style={{ whiteSpace: "pre-line" }}
                  >
                    {msg.text}
                  </div>
                ) : null}
                {isBot && msg.imageUrls && msg.imageUrls.length > 0 ? (
                  <div className="mt-1.5 flex flex-col gap-1.5">
                    {msg.imageUrls.map((url) => (
                      <button
                        key={url}
                        type="button"
                        title="Phóng to"
                        onClick={() => setPreviewSrc(url)}
                        className="block overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt="Ảnh trả lời"
                          className="mx-auto max-h-48 w-auto max-w-full object-contain"
                        />
                      </button>
                    ))}
                  </div>
                ) : null}
                <p
                  className={`mt-1 text-[10px] text-gray-400 ${
                    isBot ? "text-left" : "text-right"
                  }`}
                >
                  {msg.timestamp}
                </p>
              </div>
              {!isBot ? (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                  <FiUser size={14} />
                </div>
              ) : null}
            </div>
          );
        })}
        {sending ? (
          <div className="flex items-start gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
              <FiCpu size={14} />
            </div>
            <div className="flex items-center gap-1 rounded-2xl rounded-tl-none border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
              <span
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400"
                style={{ animationDelay: "300ms" }}
              />
            </div>
          </div>
        ) : null}
        <div ref={endRef} />
      </div>

      <div className="shrink-0 border-t border-gray-200 bg-white p-2.5 dark:border-gray-800 dark:bg-gray-900/90">
        <div className="mb-1.5 flex justify-end">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/5 dark:hover:text-gray-300"
            title="Làm mới hội thoại"
          >
            <FiRefreshCw size={12} />
            Làm mới
          </button>
        </div>
        <div className="flex items-end gap-2 rounded-xl border border-gray-200 bg-gray-50 px-2.5 py-2 dark:border-gray-800 dark:bg-gray-900">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={sending}
            placeholder="Nhập câu hỏi của bạn..."
            className="max-h-24 flex-1 resize-none border-0 bg-transparent p-0 text-sm text-gray-900 focus:outline-hidden focus:ring-0 dark:text-white"
          />
          <Button
            size="sm"
            onClick={() => void handleSend()}
            disabled={!input.trim() || sending}
            className="!flex h-8 w-8 shrink-0 items-center justify-center !p-0"
            aria-label="Gửi"
          >
            <FiSend size={14} />
          </Button>
        </div>
        <p className="mt-1 text-center text-[10px] text-gray-400">
          Enter gửi · Shift+Enter xuống dòng
        </p>
      </div>

      <SupportImageLightbox
        src={previewSrc}
        onClose={() => setPreviewSrc(null)}
      />
    </div>
  );
}
