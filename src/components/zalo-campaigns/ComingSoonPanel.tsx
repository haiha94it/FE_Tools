"use client";

import ComponentCard from "@/components/common/ComponentCard";
import { HiOutlineBolt } from "react-icons/hi2";

interface ComingSoonPanelProps {
  title: string;
  description?: string;
}

export default function ComingSoonPanel({
  title,
  description = "Tính năng này sẽ được cập nhật trong phiên bản tiếp theo.",
}: ComingSoonPanelProps) {
  return (
    <ComponentCard title={title} desc={description} hideDescOnMobile>
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-500/10">
          <HiOutlineBolt size={24} className="shrink-0 text-brand-500" aria-hidden />
        </span>
        <div>
          <p className="text-base font-medium text-gray-800 dark:text-white/90">
            Đang phát triển
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Logic API đã sẵn sàng — giao diện sẽ được bổ sung sớm.
          </p>
        </div>
      </div>
    </ComponentCard>
  );
}