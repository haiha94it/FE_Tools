"use client";

import Checkbox from "@/components/form/input/Checkbox";
import ScrollableTableContainer from "@/components/ui/table/ScrollableTableContainer";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatCampaignRunStatus,
  formatCampaignStartTime,
} from "@/lib/zalo-add-friend-campaign-utils";
import type { AddFriendCampaign } from "@/types/zalo-add-friend-campaign";

interface AddFriendCampaignTableProps {
  campaigns: AddFriendCampaign[];
  selectedIds: number[];
  loading: boolean;
  actionLoading: boolean;
  onToggleAll: () => void;
  onToggleOne: (id: number) => void;
  onEdit: (campaign: AddFriendCampaign) => void;
  onCopy: (campaign: AddFriendCampaign) => void;
  onResults: (campaign: AddFriendCampaign) => void;
  onDelete: (campaign: AddFriendCampaign) => void;
}

const headerClass =
  "px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400";

export default function AddFriendCampaignTable({
  campaigns,
  selectedIds,
  loading,
  actionLoading,
  onToggleAll,
  onToggleOne,
  onEdit,
  onCopy,
  onResults,
  onDelete,
}: AddFriendCampaignTableProps) {
  const selectedSet = new Set(selectedIds);
  const allSelected =
    campaigns.length > 0 && campaigns.every((item) => selectedSet.has(item.id));

  if (loading && campaigns.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-gray-500 dark:text-gray-400">
        Đang tải kịch bản...
      </p>
    );
  }

  if (campaigns.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-gray-500 dark:text-gray-400">
        Chưa có kịch bản kết bạn. Bấm &quot;Thêm kịch bản&quot; để tạo mới.
      </p>
    );
  }

  return (
    <ScrollableTableContainer fill>
      {loading && campaigns.length > 0 ? (
        <div className="flex justify-center py-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        </div>
      ) : null}
      <div className="min-w-[960px]">
        <Table>
          <TableHeader className="sticky top-0 z-10 border-b border-gray-100 bg-gray-50 dark:border-white/[0.05] dark:bg-gray-900">
            <TableRow>
              <TableCell isHeader className={`${headerClass} w-12`}>
                <Checkbox checked={allSelected} onChange={onToggleAll} />
              </TableCell>
              <TableCell isHeader className={`${headerClass} w-14`}>
                STT
              </TableCell>
              <TableCell isHeader className={headerClass}>
                Tên kịch bản
              </TableCell>
              <TableCell isHeader className={headerClass}>
                Số điện thoại
              </TableCell>
              <TableCell isHeader className={headerClass}>
                Thời gian bắt đầu
              </TableCell>
              <TableCell isHeader className={headerClass}>
                Trạng thái
              </TableCell>
              <TableCell isHeader className={`${headerClass} min-w-[280px]`}>
                Thao tác
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {campaigns.map((campaign, index) => {
              const status = formatCampaignRunStatus(campaign.status);
              return (
                <TableRow
                  key={campaign.id}
                  className="hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                >
                  <TableCell className="px-4 py-3">
                    <Checkbox
                      checked={selectedSet.has(campaign.id)}
                      onChange={() => onToggleOne(campaign.id)}
                    />
                  </TableCell>
                  <TableCell className="px-4 py-3 text-theme-sm text-gray-600 dark:text-gray-300">
                    {index + 1}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-white/90">
                    {campaign.name}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-theme-sm text-gray-600 dark:text-gray-300">
                    {campaign.phone_number_count
                      ? `${campaign.phone_number_count} số`
                      : "Chưa có số điện thoại"}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-theme-sm text-gray-600 dark:text-gray-300">
                    {formatCampaignStartTime(campaign.start_time)}
                  </TableCell>
                  <TableCell className={`px-4 py-3 text-theme-sm font-medium ${status.className}`}>
                    {status.label}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div
                      className="flex flex-wrap gap-1.5"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => onCopy(campaign)}
                        className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
                      >
                        Sao chép
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit(campaign)}
                        className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
                      >
                        Chi tiết
                      </button>
                      <button
                        type="button"
                        onClick={() => onResults(campaign)}
                        className="rounded-lg border border-brand-200 px-2.5 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50 dark:border-brand-500/30 dark:text-brand-400"
                      >
                        Kết quả
                      </button>
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => onDelete(campaign)}
                        className="rounded-lg border border-error-200 px-2.5 py-1.5 text-xs font-medium text-error-600 hover:bg-error-50 dark:border-error-500/30"
                      >
                        Xóa
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </ScrollableTableContainer>
  );
}