"use client";

import { CHAT_SCROLL_BOTTOM_THRESHOLD } from "@/lib/zalo-messenger-scroll";
import { ArrowDownIcon } from "@/icons";
import { useCallback, useEffect, useState } from "react";

interface ChatScrollToBottomProps {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  newCount?: number;
  onScrollToBottom?: () => void;
}

export default function ChatScrollToBottom({
  scrollRef,
  newCount = 0,
  onScrollToBottom,
}: ChatScrollToBottomProps) {
  const [visible, setVisible] = useState(false);

  const updateVisibility = useCallback(() => {
    const node = scrollRef.current;
    if (!node) return;
    const distanceFromBottom =
      node.scrollHeight - node.scrollTop - node.clientHeight;
    setVisible(
      distanceFromBottom > CHAT_SCROLL_BOTTOM_THRESHOLD || newCount > 0,
    );
  }, [newCount, scrollRef]);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return undefined;
    node.addEventListener("scroll", updateVisibility, { passive: true });
    updateVisibility();
    return () => node.removeEventListener("scroll", updateVisibility);
  }, [scrollRef, updateVisibility]);

  useEffect(() => {
    updateVisibility();
  }, [newCount, updateVisibility]);

  if (!visible) return null;

  const hasNewMessages = newCount > 0;

  return (
    <button
      type="button"
      onClick={onScrollToBottom}
      className={`absolute bottom-4 right-4 z-20 inline-flex items-center justify-center rounded-full border border-brand-500/25 bg-brand-500 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all duration-200 hover:bg-brand-600 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 ${
        hasNewMessages ? "h-11 gap-2 px-4" : "h-11 w-11"
      }`}
      aria-label={
        hasNewMessages
          ? "Cuộn xuống tin nhắn mới"
          : "Cuộn xuống tin mới nhất"
      }
    >
      <ArrowDownIcon className="h-4 w-4 shrink-0" />
      {hasNewMessages ? (
        <>
          <span>Tin nhắn mới</span>
          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-brand-600 px-1.5 text-[11px] font-bold">
            {newCount > 99 ? "99+" : newCount}
          </span>
        </>
      ) : null}
    </button>
  );
}