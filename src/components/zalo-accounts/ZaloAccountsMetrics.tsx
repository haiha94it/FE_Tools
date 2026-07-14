"use client";

import {
  CheckCircleIcon,
  CloseLineIcon,
  GroupIcon,
  UserCircleIcon,
} from "@/icons";

interface ZaloAccountsMetricsProps {
  total: number;
  active: number;
  inactive: number;
  selected: number;
}

export default function ZaloAccountsMetrics({
  total,
  active,
  inactive,
  selected,
}: ZaloAccountsMetricsProps) {
  const items = [
    { label: "Tổng tài khoản", value: total, icon: GroupIcon },
    { label: "Đang hoạt động", value: active, icon: CheckCircleIcon },
    { label: "Ngưng hoạt động", value: inactive, icon: CloseLineIcon },
    { label: "Đã chọn", value: selected, icon: UserCircleIcon },
  ];

  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-2 sm:flex sm:flex-wrap sm:items-center sm:gap-x-5">
      {items.map((item, index) => {
        const Icon = item.icon;
        return (
          <div key={item.label} className="flex min-w-0 items-center gap-1.5 sm:gap-2">
            {index > 0 && (
              <span
                aria-hidden
                className="hidden h-3.5 w-px shrink-0 bg-gray-200 sm:block dark:bg-gray-700"
              />
            )}
            <Icon className="size-3.5 shrink-0 text-gray-400 sm:size-4 dark:text-gray-500" />
            <span className="truncate text-[11px] text-gray-500 sm:text-theme-xs dark:text-gray-400">
              {item.label}
            </span>
            <span className="text-xs font-semibold tabular-nums text-gray-800 sm:text-sm dark:text-white/90">
              {item.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}