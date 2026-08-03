"use client";

import SupportChatPanel from "@/components/support-chatbot/SupportChatPanel";
import { SUPPORT_BOT_AVATAR_SRC } from "@/components/support-chatbot/support-bot-avatar";
import { useSupportChatStore } from "@/stores/use-support-chat-store";
import Image from "next/image";
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
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full ring-2 ring-white/35 shadow-md">
                <Image
                  src={SUPPORT_BOT_AVATAR_SRC}
                  alt=""
                  fill
                  sizes="36px"
                  className="object-cover"
                  priority
                />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold uppercase tracking-tight">
                  Trợ lý riêng của bạn
                </p>
                <p className="truncate text-[11px] font-medium text-white/80">
                  Hỗ trợ HDSD · AI
                </p>
              </div>
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

      {/* FAB — avatar bot CSKH */}
      <button
        type="button"
        onClick={() => toggleOpen()}
        className={`pointer-events-auto relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full text-white shadow-lg transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 ${
          isOpen
            ? "bg-gray-700 shadow-gray-700/30 hover:bg-gray-800"
            : "bg-brand-500 shadow-brand-500/40 ring-2 ring-white/90 hover:scale-105 hover:shadow-xl"
        }`}
        title="Trợ lý riêng của bạn"
        aria-label={isOpen ? "Đóng trợ lý" : "Mở trợ lý"}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <FiX size={22} />
        ) : (
          <Image
            src={SUPPORT_BOT_AVATAR_SRC}
            alt="Trợ lý AI"
            width={56}
            height={56}
            className="h-full w-full object-cover"
            priority
          />
        )}
      </button>
    </div>
  );
}
