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
    <div className="shrink-0 border-b border-gray-100 bg-gradient-to-r from-gray-50/90 to-white px-4 py-3 dark:border-gray-800 dark:from-white/[0.02] dark:to-transparent sm:px-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          {channelInfo.avatar ? (
            <img
              src={channelInfo.avatar}
              alt=""
              className="h-11 w-11 shrink-0 rounded-xl object-cover ring-2 ring-white dark:ring-gray-800"
            />
          ) : (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-base font-bold text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
              {initial}
            </span>
          )}
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-gray-800 dark:text-white/90">
              {label}
            </h2>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-theme-xs text-gray-500 dark:text-gray-400">
              <span>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {formatStat(channelInfo.videos)}
                </span>{" "}
                video
              </span>
              <span className="hidden h-3 w-px bg-gray-200 sm:inline dark:bg-gray-700" />
              <span>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {formatStat(channelInfo.followers)}
                </span>{" "}
                theo dõi
              </span>
              <span className="hidden h-3 w-px bg-gray-200 sm:inline dark:bg-gray-700" />
              <span>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {formatStat(channelInfo.likes)}
                </span>{" "}
                thích
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          disabled={renewing}
          onClick={() => void handleRenew()}
          className="h-9 shrink-0 rounded-lg border border-gray-200 bg-white px-3.5 text-theme-xs font-medium text-gray-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600 disabled:opacity-60 sm:text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-brand-500/30 dark:hover:bg-brand-500/10 dark:hover:text-brand-300"
        >
          {renewing ? "Đang làm mới…" : "Làm mới kênh"}
        </button>
      </div>
    </div>
  );
}