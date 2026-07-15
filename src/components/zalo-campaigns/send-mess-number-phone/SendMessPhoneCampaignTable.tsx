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
  formatCampaignStartTime,
  formatSendMessPhoneCampaignRunStatus,
} from "@/lib/zalo-send-mess-phone-campaign-utils";
import { resolveCampaignStatusDisplay } from "@/lib/team-collaboration-utils";
import CampaignTeamActionBar from "@/components/zalo-campaigns/shared/CampaignTeamActionBar";
import CampaignTeamCreatedByCell from "@/components/zalo-campaigns/shared/CampaignTeamCreatedByCell";
import CampaignTeamSelectableCheckbox from "@/components/zalo-campaigns/shared/CampaignTeamSelectableCheckbox";
import type { SendMessPhoneCampaign } from "@/types/zalo-send-mess-phone-campaign";

interface SendMessPhoneCampaignTableProps {
  campaigns: SendMessPhoneCampaign[];
  selectedIds: number[];
  loading: boolean;
  actionLoading: boolean;
  onToggleAll: () => void;
  onToggleOne: (id: number) => void;
  onEdit: (campaign: SendMessPhoneCampaign) => void;
  onCopy: (campaign: SendMessPhoneCampaign) => void;
  onResults: (campaign: SendMessPhoneCampaign) => void;
  onDelete: (campaign: SendMessPhoneCampaign) => void;
}

const headerClass =
  "px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400";

export default function SendMessPhoneCampaignTable({
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
}: SendMessPhoneCampaignTableProps) {
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
        Chưa có kịch bản nhắn tin SĐT. Bấm &quot;Thêm kịch bản&quot; để tạo mới.
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
                Tên kịch bản / Người tạo
              </TableCell>
              <TableCell isHeader className={headerClass}>
                Số điện thoại được gán
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
              const status = resolveCampaignStatusDisplay(campaign, formatSendMessPhoneCampaignRunStatus);
              const phoneCount = campaign.phone_numbers_count ?? 0;
              return (
                <TableRow
                  key={campaign.id}
                  className="hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                >
                  <TableCell className="px-4 py-3">
                    <CampaignTeamSelectableCheckbox
                      campaign={campaign}
                      checked={selectedSet.has(campaign.id)}
                      onChange={() => onToggleOne(campaign.id)}
                    />
                  </TableCell>
                  <TableCell className="px-4 py-3 text-theme-sm text-gray-600 dark:text-gray-300">
                    {index + 1}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-white/90">
                    {campaign.name}
                    <CampaignTeamCreatedByCell campaign={campaign} />
                  </TableCell>
                  <TableCell className="px-4 py-3 text-theme-sm text-gray-600 dark:text-gray-300">
                    {phoneCount === 0
                      ? "Chưa có số điện thoại được gán"
                      : `Có ${phoneCount} số điện thoại được gán`}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-theme-sm text-gray-600 dark:text-gray-300">
                    {formatCampaignStartTime(campaign.start_time)}
                  </TableCell>
                  <TableCell className={`px-4 py-3 text-theme-sm font-medium ${status.className}`}>
                    {status.label}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div onClick={(event) => event.stopPropagation()}>
                      <CampaignTeamActionBar
                        campaign={campaign}
                        actionLoading={actionLoading}
                        onEdit={() => onEdit(campaign)}
                        onCopy={() => onCopy(campaign)}
                        onResults={() => onResults(campaign)}
                        onDelete={() => onDelete(campaign)}
                      />
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