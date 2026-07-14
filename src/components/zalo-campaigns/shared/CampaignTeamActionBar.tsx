"use client";

import { useCampaignTeamAccess } from "@/components/zalo-campaigns/shared/useCampaignTeamAccess";
import type { TeamCategoryFields } from "@/types/team-collaboration";

interface CampaignTeamActionBarProps<T extends TeamCategoryFields> {
  campaign: T;
  actionLoading?: boolean;
  onEdit: () => void;
  onCopy: () => void;
  onResults: () => void;
  onDelete: () => void;
}

export default function CampaignTeamActionBar<T extends TeamCategoryFields>({
  campaign,
  actionLoading,
  onEdit,
  onCopy,
  onResults,
  onDelete,
}: CampaignTeamActionBarProps<T>) {
  const access = useCampaignTeamAccess(campaign);

  if (!access.canEdit && !access.canViewResults && !access.canDelete) {
    return (
      <span className="text-xs text-gray-400 dark:text-gray-500">
        Chỉ xem danh sách
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {access.canEdit ? (
        <>
          <button
            type="button"
            disabled={actionLoading}
            onClick={onCopy}
            className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
          >
            Sao chép
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
          >
            Chi tiết
          </button>
        </>
      ) : access.isReadOnlyDetail ? (
        <button
          type="button"
          onClick={onEdit}
          className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
        >
          Xem
        </button>
      ) : null}
      {access.canViewResults ? (
        <button
          type="button"
          onClick={onResults}
          className="rounded-lg border border-brand-200 px-2.5 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50 dark:border-brand-500/30 dark:text-brand-400"
        >
          Kết quả
        </button>
      ) : null}
      {access.canDelete ? (
        <button
          type="button"
          disabled={actionLoading}
          onClick={onDelete}
          className="rounded-lg border border-error-200 px-2.5 py-1.5 text-xs font-medium text-error-600 hover:bg-error-50 dark:border-error-500/30"
        >
          Xóa
        </button>
      ) : null}
    </div>
  );
}