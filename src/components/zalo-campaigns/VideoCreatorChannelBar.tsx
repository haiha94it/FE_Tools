"use client";

import { useZaloVideoStore } from "@/stores/use-zalo-video-store";
import type { ZaloChannelInfo } from "@/types/zalo-video";
import { useState } from "react";

interface VideoCreatorChannelBarProps {
  accountId: number;
  channelInfo: ZaloChannelInfo;
}

function formatStat(value?: number) {
  if (value == null) return "—";
  return value.toLocaleString("vi-VN");
}

/** Header kênh compact — avatar + tên + stats 1 hàng. */
export default function VideoCreatorChannelBar({
  accountId,
  channelInfo,
}: VideoCreatorChannelBarProps) {
  const renewChannel = useZaloVideoStore((s) => s.renewChannel);
  const [renewing, setRenewing] = useState(false);

  const label = channelInfo.name?.trim() || "Kênh Zalo Video";
  const initial = label.charAt(0).toUpperCase();

  const handleRenew = async () => {
    setRenewing(true);
    try {
      await renewChannel(accountId);
    } finally {
      setRenewing(false);
    }
  };

  return (
    <div className="shrink-0 border-b border-gray-100 bg-gradient-to-r from-gray-50/90 to-white px-3 py-2 dark:border-gray-800 dark:from-white/[0.02] dark:to-transparent sm:px-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          {channelInfo.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={channelInfo.avatar}
              alt=""
              className="h-8 w-8 shrink-0 rounded-lg object-cover ring-1 ring-white dark:ring-gray-800 sm:h-9 sm:w-9"
            />
          ) : (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-sm font-bold text-brand-600 dark:bg-brand-500/15 dark:text-brand-300 sm:h-9 sm:w-9">
              {initial}
            </span>
          )}
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold leading-tight text-gray-800 dark:text-white/90">
              {label}
            </h2>
            <p className="mt-0.5 truncate text-[11px] text-gray-500 dark:text-gray-400">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {formatStat(channelInfo.videos)}
              </span>{" "}
              video ·{" "}
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {formatStat(channelInfo.followers)}
              </span>{" "}
              follow ·{" "}
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {formatStat(channelInfo.likes)}
              </span>{" "}
              thích
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={renewing}
          onClick={() => void handleRenew()}
          className="h-8 shrink-0 rounded-lg border border-gray-200 bg-white px-2.5 text-[11px] font-medium text-gray-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600 disabled:opacity-60 sm:h-9 sm:px-3 sm:text-xs dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-brand-500/30 dark:hover:bg-brand-500/10 dark:hover:text-brand-300"
        >
          {renewing ? "Đang làm mới…" : "Làm mới kênh"}
        </button>
      </div>
    </div>
  );
}
