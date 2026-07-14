"use client";

import Button from "@/components/ui/button/Button";
import { Tooltip } from "@/components/ui/tooltip/Tooltip";
import { HiOutlineBellAlert } from "react-icons/hi2";

interface JoinGroupCampaignToolbarProps {
  selectedCount: number;
  actionLoading: boolean;
  onCreate: () => void;
  onRunNew: () => void;
  onRunContinue: () => void;
  onStop: () => void;
  onShowNote: () => void;
}

export default function JoinGroupCampaignToolbar({
  selectedCount,
  actionLoading,
  onCreate,
  onRunNew,
  onRunContinue,
  onStop,
  onShowNote,
}: JoinGroupCampaignToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Tooltip content="Ghi chú quan trọng" side="top">
        <button
          type="button"
          onClick={onShowNote}
          aria-label="Ghi chú quan trọng"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-error-200 text-error-500 transition hover:bg-error-50 dark:border-error-500/30 dark:hover:bg-error-500/10"
        >
          <HiOutlineBellAlert size={20} aria-hidden />
        </button>
      </Tooltip>
      <Button size="sm" onClick={onCreate}>
        Thêm kịch bản
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={actionLoading || selectedCount === 0}
        onClick={onRunNew}
      >
        Chạy
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={actionLoading || selectedCount === 0}
        onClick={onRunContinue}
      >
        Chạy tiếp
      </Button>
      <Button
        size="sm"
        className="bg-error-500 hover:bg-error-600"
        disabled={actionLoading || selectedCount === 0}
        onClick={onStop}
      >
        Dừng
      </Button>
      {selectedCount > 0 ? (
        <span className="text-theme-xs text-gray-500 dark:text-gray-400">
          Đã chọn {selectedCount} kịch bản
        </span>
      ) : null}
    </div>
  );
}