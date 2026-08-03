"use client";

import SupportChatPanel from "@/components/support-chatbot/SupportChatPanel";
import { useSupportChatStore } from "@/stores/use-support-chat-store";
import { useEffect } from "react";
import { FiX } from "react-icons/fi";

/**
 * Global FAB + popup «Trợ lý riêng của bạn» — mockup CSKH assistant (HDSD).
 * Mount once in AdminShell (logged-in admin layout).
 */
export default function SupportAssistantWidget() {
  const isOpen = useSupportChatStore((s) => s.isOpen);
  const setOpen = useSupportChatStore((s) => s.setOpen);
  const toggleOpen = useSupportChatStore((s) => s.toggleOpen);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, setOpen]);

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[90] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {isOpen ? (
        <div
          className="pointer-events-auto flex w-[min(100vw-1.5rem,380px)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900"
          role="dialog"
          aria-label="Trợ lý riêng của bạn"
        >
          <div className="flex items-center justify-between gap-2 border-b border-gray-200 bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-3 text-white dark:border-gray-700">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold uppercase tracking-tight">
                Trợ lý riêng của bạn
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white transition hover:bg-white/25"
              aria-label="Đóng trợ lý"
            >
              <FiX size={16} />
            </button>
          </div>
          <SupportChatPanel compact className="h-[min(60vh,420px)]" />
        </div>
      ) : null}

      {/* FAB — mockup: vòng tròn «AI» góc phải */}
      <button
        type="button"
        onClick={() => toggleOpen()}
        className={`pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 ${
          isOpen
            ? "bg-gray-700 shadow-gray-700/30 hover:bg-gray-800"
            : "bg-brand-500 shadow-brand-500/35 hover:bg-brand-600 hover:shadow-xl"
        }`}
        title="Trợ lý riêng của bạn"
        aria-label={isOpen ? "Đóng trợ lý" : "Mở trợ lý"}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <FiX size={22} />
        ) : (
          <span className="text-sm font-extrabold tracking-wide">AI</span>
        )}
      </button>
    </div>
  );
}
