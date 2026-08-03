"use client";

import { Tooltip } from "@/components/ui/tooltip/Tooltip";
import { formatMessageTime } from "@/lib/zalo-messenger-utils";
import type { DisplayMessage } from "@/types/zalo-messenger";
import { memo } from "react";

interface MessageMetaFooterProps {
  message: DisplayMessage;
  own: boolean;
  /** Nền sáng (card/media) — time xám, không trắng như bubble xanh */
  onLight?: boolean;
  sentByLabel?: string;
  className?: string;
}

function MessageMetaFooter({
  message,
  own,
  onLight = false,
  sentByLabel = "",
  className = "",
}: MessageMetaFooterProps) {
  const time = formatMessageTime(message.ts);
  if (!time && !sentByLabel) return null;

  const light = onLight || !own;
  const timeClass = light
    ? "text-gray-400 dark:text-gray-500"
    : "text-white/65";

  const sentByClass = light
    ? "font-medium text-[#0068FF] dark:text-blue-400"
    : "font-medium text-amber-200";

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
            className={`shrink-0 ${light ? "text-gray-300 dark:text-gray-600" : "text-white/45"}`}
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