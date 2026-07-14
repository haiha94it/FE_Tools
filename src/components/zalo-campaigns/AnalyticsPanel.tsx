"use client";

import ComponentCard from "@/components/common/ComponentCard";
import Select from "@/components/form/Select";
import { useZaloVideoStore } from "@/stores/use-zalo-video-store";
import type { RenewGeneralType, ZaloChannelInfo } from "@/types/zalo-video";
import { useState } from "react";
import type { IconType } from "react-icons";
import {
  HiOutlineArrowUpTray,
  HiOutlineChatBubbleLeftRight,
  HiOutlineEye,
  HiOutlineHeart,
} from "react-icons/hi2";

interface AnalyticsPanelProps {
  accountId: number;
  channelInfo: ZaloChannelInfo;
}

const WEEK_OPTIONS = [
  { value: "seven_day", label: "7 ngày" },
  { value: "fourteen_day", label: "14 ngày" },
  { value: "thirty_day", label: "30 ngày" },
] as const;

function formatStat(value?: number) {
  if (value == null) return "—";
  return value.toLocaleString("vi-VN");
}

function formatDateLabel(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

function StatRow({
  icon: Icon,
  label,
  value,
}: {
  icon: IconType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-[calc(50%-0.5rem)] flex-1 items-center gap-3 rounded-xl border border-gray-100 bg-white px-3 py-3 sm:min-w-0 dark:border-gray-800 dark:bg-white/[0.02]">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
        <Icon
          aria-hidden
          size={20}
          className="shrink-0 text-gray-500 dark:text-gray-400"
        />
      </span>
      <div className="min-w-0">
        <p className="truncate text-theme-xs text-gray-500 dark:text-gray-400">
          {label}
        </p>
        <p className="text-sm font-semibold tabular-nums text-gray-800 dark:text-white/90">
          {value}
        </p>
      </div>
    </div>
  );
}

export default function AnalyticsPanel({
  accountId,
  channelInfo: _channelInfo,
}: AnalyticsPanelProps) {
  const renewGeneral = useZaloVideoStore((s) => s.renewGeneral);
  const channelInfo = useZaloVideoStore((s) => s.channelInfo) ?? _channelInfo;

  const [week, setWeek] = useState<RenewGeneralType>("seven_day");
  const [renewingGeneral, setRenewingGeneral] = useState(false);

  const daily = channelInfo.channel_daily;
  const general = channelInfo.channel_general;

  const handleRenewGeneral = async () => {
    setRenewingGeneral(true);
    try {
      await renewGeneral(accountId, week);
    } finally {
      setRenewingGeneral(false);
    }
  };

  return (
    <div className="space-y-4">
      <ComponentCard
        title="Thống kê hôm nay"
        desc="Số liệu từ 00:00 đến thời điểm hiện tại"
        hideDescOnMobile
      >
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <StatRow icon={HiOutlineEye} label="Lượt xem" value={formatStat(daily?.views)} />
          <StatRow icon={HiOutlineHeart} label="Lượt thích" value={formatStat(daily?.likes)} />
          <StatRow icon={HiOutlineArrowUpTray} label="Chia sẻ" value={formatStat(daily?.shares)} />
          <StatRow icon={HiOutlineChatBubbleLeftRight} label="Bình luận" value={formatStat(daily?.comments)} />
        </div>
      </ComponentCard>

      <ComponentCard
        title="Thống kê theo khoảng thời gian"
        desc={
          general?.start && general?.end
            ? `${formatDateLabel(general.start)} → ${formatDateLabel(general.end)}`
            : "Chọn khoảng thời gian và làm mới để xem số liệu"
        }
        hideDescOnMobile
      >
        <div className="mb-4 flex flex-col gap-3 border-b border-gray-100 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
          <div className="w-full sm:max-w-[200px]">
            <Select
              options={WEEK_OPTIONS.map((o) => ({
                value: o.value,
                label: o.label,
              }))}
              value={week}
              onChange={(v) => setWeek(v as RenewGeneralType)}
            />
          </div>
          <button
            type="button"
            disabled={renewingGeneral}
            onClick={() => void handleRenewGeneral()}
            className="h-10 w-full rounded-lg bg-brand-500 px-4 text-sm font-medium text-white transition hover:bg-brand-600 disabled:opacity-60 sm:w-auto"
          >
            {renewingGeneral ? "Đang tải…" : "Làm mới thống kê"}
          </button>
        </div>

        <div className="flex flex-wrap gap-2 sm:gap-3">
          <StatRow icon={HiOutlineEye} label="Lượt xem" value={formatStat(general?.views)} />
          <StatRow icon={HiOutlineHeart} label="Lượt thích" value={formatStat(general?.likes)} />
          <StatRow icon={HiOutlineArrowUpTray} label="Chia sẻ" value={formatStat(general?.shares)} />
          <StatRow icon={HiOutlineChatBubbleLeftRight} label="Bình luận" value={formatStat(general?.comments)} />
        </div>
      </ComponentCard>
    </div>
  );
}