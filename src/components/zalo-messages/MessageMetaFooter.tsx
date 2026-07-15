"use client";

import { Tooltip } from "@/components/ui/tooltip/Tooltip";
import { formatMessageTime } from "@/lib/zalo-messenger-utils";
import type { DisplayMessage } from "@/types/zalo-messenger";
import { memo } from "react";

interface MessageMetaFooterProps {
  message: DisplayMessage;
  own: boolean;
  sentByLabel?: string;
  className?: string;
}

function MessageMetaFooter({
  message,
  own,
  sentByLabel = "",
  className = "",
}: MessageMetaFooterProps) {
  const time = formatMessageTime(message.ts);
  if (!time && !sentByLabel) return null;

  const timeClass = own
    ? "text-white/65"
    : "text-gray-400 dark:text-gray-500";

  const sentByClass = own
    ? "font-semibold text-amber-200"
    : "font-semibold text-brand-600 dark:text-brand-400";

  return (
    <div
      className={`mt-1 inline-flex max-w-full items-center justify-end gap-1 text-[10px] leading-none ${className}`}
    >
      {sentByLabel ? (
        <>
          <Tooltip content={sentByLabel} side="top">
            <span className={`max-w-[9rem] truncate ${sentByClass}`}>
              {sentByLabel}
            </span>
          </Tooltip>
          <span
            className={`shrink-0 ${own ? "text-white/45" : "text-gray-300 dark:text-gray-600"}`}
            aria-hidden
          >
            ·
          </span>
        </>
      ) : null}
      {time ? (
        <span className={`shrink-0 tabular-nums ${timeClass}`}>{time}</span>
      ) : null}
    </div>
  );
}

export default memo(MessageMetaFooter);