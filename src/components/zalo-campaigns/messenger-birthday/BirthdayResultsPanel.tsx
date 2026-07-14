"use client";

import Button from "@/components/ui/button/Button";
import Checkbox from "@/components/form/input/Checkbox";
import Select from "@/components/form/Select";
import Pagination from "@/components/tables/Pagination";
import ContactAvatar from "@/components/zalo-contacts/shared/ContactAvatar";
import {
  formatBirthdayResultStatus,
  formatCampaignStartTime,
  getBirthdayMediaUrl,
} from "@/lib/zalo-birthday-campaign-utils";
import { confirm } from "@/lib/confirm";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { useZaloBirthdayCampaignStore } from "@/stores/use-zalo-birthday-campaign-store";
import type { ZaloAccount } from "@/types/zalo-account";
import Image from "next/image";

interface BirthdayResultsPanelProps {
  accounts: ZaloAccount[];
}

const headerClass =
  "px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400";

const PER_PAGE_OPTIONS = [
  { value: "100", label: "100 / trang" },
  { value: "300", label: "300 / trang" },
  { value: "500", label: "500 / trang" },
  { value: "1000", label: "1000 / trang" },
];

export default function BirthdayResultsPanel({ accounts }: BirthdayResultsPanelProps) {
  const results = useZaloBirthdayCampaignStore((s) => s.results);
  const resultsSelectedIds = useZaloBirthdayCampaignStore((s) => s.resultsSelectedIds);
  const resultsPage = useZaloBirthdayCampaignStore((s) => s.resultsPage);
  const resultsPerPage = useZaloBirthdayCampaignStore((s) => s.resultsPerPage);
  const resultsTotal = useZaloBirthdayCampaignStore((s) => s.resultsTotal);
  const resultsLoading = useZaloBirthdayCampaignStore((s) => s.resultsLoading);
  const toggleResultSelected = useZaloBirthdayCampaignStore((s) => s.toggleResultSelected);
  const toggleSelectAllResults = useZaloBirthdayCampaignStore((s) => s.toggleSelectAllResults);
  const setResultsPage = useZaloBirthdayCampaignStore((s) => s.setResultsPage);
  const setResultsPerPage = useZaloBirthdayCampaignStore((s) => s.setResultsPerPage);
  const deleteSelectedResults = useZaloBirthdayCampaignStore((s) => s.deleteSelectedResults);
  const refreshResults = useZaloBirthdayCampaignStore((s) => s.refreshResults);

  const accountMap = new Map(accounts.map((item) => [item.id, item]));
  const selectedSet = new Set(resultsSelectedIds);
  const allSelected =
    results.length > 0 && results.every((item) => selectedSet.has(item.id));
  const totalPages = Math.max(1, Math.ceil(resultsTotal / resultsPerPage));

  const handleDelete = async () => {
    if (!resultsSelectedIds.length) {
      toast.error("Chọn ít nhất một dòng kết quả để xóa.");
      return;
    }
    if (
      !(await confirm({
        title: "Xóa kết quả",
        message: `Xóa ${resultsSelectedIds.length} dòng kết quả đã chọn?`,
        confirmText: "Xóa",
        variant: "danger",
      }))
    ) {
      return;
    }
    try {
      await deleteSelectedResults();
      toast.success("Đã xóa kết quả.");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => void refreshResults()}>
            Làm mới
          </Button>
          <Button
            size="sm"
            className="bg-error-500 hover:bg-error-600"
            disabled={!resultsSelectedIds.length || resultsLoading}
            onClick={() => void handleDelete()}
          >
            Xóa đã chọn
          </Button>
        </div>
        <div className="w-full sm:w-[180px]">
          <Select
            options={PER_PAGE_OPTIONS}
            defaultValue={String(resultsPerPage)}
            onChange={(value) => setResultsPerPage(Number(value))}
          />
        </div>
      </div>

      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700">
        {resultsLoading && results.length === 0 ? (
          <p className="py-16 text-center text-sm text-gray-500">Đang tải kết quả...</p>
        ) : results.length === 0 ? (
          <p className="py-16 text-center text-sm text-gray-500">
            Chưa có kết quả gửi sinh nhật.
          </p>
        ) : (
          <div className="min-w-[960px]">
            {resultsLoading ? (
              <div className="flex justify-center py-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
              </div>
            ) : null}
            <table className="w-full text-left">
              <thead className="sticky top-0 z-10 border-b border-gray-100 bg-gray-50 dark:border-white/[0.05] dark:bg-gray-900">
                <tr>
                  <th className={`${headerClass} w-12`}>
                    <Checkbox checked={allSelected} onChange={toggleSelectAllResults} />
                  </th>
                  <th className={headerClass}>Thời gian</th>
                  <th className={headerClass}>Người gửi</th>
                  <th className={headerClass}>Người nhận</th>
                  <th className={headerClass}>Nội dung</th>
                  <th className={headerClass}>Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {results.map((row) => {
                  const account = row.account ? accountMap.get(row.account) : undefined;
                  const thumb = row.thumb_url || row.image || row.images?.[0];
                  const thumbUrl = thumb ? getBirthdayMediaUrl(thumb) : null;
                  const senderLabel = account
                    ? `${account.name || `#${row.account}`}${account.phone_number ? ` - ${account.phone_number}` : ""}`
                    : row.account_number
                      ? `${row.account ?? ""} - ${row.account_number}`
                      : row.account
                        ? `#${row.account}`
                        : "—";
                  return (
                    <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={selectedSet.has(row.id)}
                          onChange={() => toggleResultSelected(row.id)}
                        />
                      </td>
                      <td className="px-4 py-3 text-theme-sm text-gray-600 dark:text-gray-300">
                        {formatCampaignStartTime(row.created_at)}
                      </td>
                      <td className="px-4 py-3 text-theme-sm text-gray-700 dark:text-gray-300">
                        {senderLabel}
                      </td>
                      <td className="px-4 py-3 text-theme-sm text-gray-700 dark:text-gray-300">
                        <div className="flex items-center gap-2">
                          <ContactAvatar
                            name={row.name || "—"}
                            avatar={row.friend_avt}
                            size="sm"
                          />
                          <span className="truncate">{row.name || "—"}</span>
                        </div>
                      </td>
                      <td className="max-w-[280px] px-4 py-3 text-theme-sm">
                        <div className="flex items-start gap-2">
                          {thumbUrl ? (
                            <span className="relative block h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                              <Image
                                src={thumbUrl}
                                alt=""
                                fill
                                unoptimized
                                className="object-cover"
                              />
                            </span>
                          ) : null}
                          <span className="line-clamp-3 break-words text-gray-700 dark:text-gray-300">
                            {row.content || "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-theme-sm font-medium text-gray-800 dark:text-white/90">
                        {formatBirthdayResultStatus(row.status)}
                        {row.status_message ? (
                          <span className="mt-0.5 block text-theme-xs font-normal text-gray-500">
                            {row.status_message}
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 ? (
        <div className="flex justify-center">
          <Pagination
            currentPage={resultsPage}
            totalPages={totalPages}
            onPageChange={setResultsPage}
          />
        </div>
      ) : null}
    </div>
  );
}