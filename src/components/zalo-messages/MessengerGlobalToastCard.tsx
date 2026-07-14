"use client";

import ContactAvatar from "@/components/zalo-contacts/shared/ContactAvatar";
import { ChatIcon } from "@/icons";

export interface MessengerGlobalToastCardProps {
  senderName: string;
  sourceLabel: string;
  preview: string;
  avatarUrl?: string | null;
  onOpen: () => void;
}

export default function MessengerGlobalToastCard({
  senderName,
  sourceLabel,
  preview,
  avatarUrl,
  onOpen,
}: MessengerGlobalToastCardProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-[min(288px,calc(100vw-24px))] items-center gap-2 rounded-xl border border-gray-200/90 bg-white px-3 py-2 text-left shadow-theme-sm transition-colors duration-150 hover:border-[#0068ff]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-[#0068ff]/40"
    >
      <span
        className="h-[8px] w-[8px] shrink-0 rounded-full bg-error-500"
        aria-hidden
      />

      <ContactAvatar name={senderName} avatar={avatarUrl} size="sm" />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-xs font-bold text-gray-900 dark:text-white/90">
            {senderName}
          </p>
          <span className="shrink-0 rounded bg-[#0068ff]/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#0068ff]">
            Zalo
          </span>
        </div>
        <p className="truncate text-[11px] font-medium text-gray-500 dark:text-gray-400">
          {sourceLabel}
          <span className="text-gray-300 dark:text-gray-600"> · </span>
          <span className="text-gray-600 dark:text-gray-300">{preview}</span>
        </p>
      </div>

      <ChatIcon
        className="h-3.5 w-3.5 shrink-0 text-[#0068ff] opacity-40 transition-opacity duration-150 group-hover:opacity-70"
        aria-hidden
      />
    </button>
  );
}