"use client";

import Button from "@/components/ui/button/Button";
import Checkbox from "@/components/form/input/Checkbox";
import Select from "@/components/form/Select";
import Pagination from "@/components/tables/Pagination";
import { Modal } from "@/components/ui/modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatCampaignStartTime,
  formatJoinGroupResultStatus,
} from "@/lib/zalo-join-group-campaign-utils";
import { confirm } from "@/lib/confirm";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { useZaloJoinGroupCampaignStore } from "@/stores/use-zalo-join-group-campaign-store";
import type { JoinGroupCampaignStatistics } from "@/types/zalo-join-group-campaign";
import type { ZaloAccount } from "@/types/zalo-account";

interface JoinGroupCampaignResultsModalProps {
  open: boolean;
  accounts: ZaloAccount[];
  campaignName?: string;
  onClose: () => void;
}

const headerClass =
  "px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400";

const PER_PAGE_OPTIONS = [
  { value: "100", label: "100 / trang" },
  { value: "300", label: "300 / trang" },
  { value: "500", label: "500 / trang" },
  { value: "1000", label: "1000 / trang" },
];

function buildResultStats(
  statistics: JoinGroupCampaignStatistics,
  resultsTotal: number,
) {
  const success =
    statistics.join_group_success ?? statistics.success ?? 0;
  const failed =
    statistics.join_group_failure ?? statistics.failed ?? 0;

  return [
    {
      label: "Tổng",
      value: statistics.total ?? resultsTotal,
      valueClass: "text-gray-800 dark:text-white/90",
    },
    {
      label: "Thành công",
      value: success,
      valueClass: "text-success-600 dark:text-success-400",
    },
    {
      label: "Thất bại",
      value: failed,
      valueClass: "text-error-600 dark:text-error-400",
    },
    {
      label: "Tài khoản",
      value:
        statistics.account_count != null && statistics.total_account != null
          ? `${statistics.account_count}/${statistics.total_account}`
          : "—",
      valueClass: "text-brand-600 dark:text-brand-400",
    },
  ];
}

export default function JoinGroupCampaignResultsModal({
  open,
  accounts,
  campaignName,
  onClose,
}: JoinGroupCampaignResultsModalProps) {
  const results = useZaloJoinGroupCampaignStore((s) => s.results);
  const resultsSelectedIds = useZaloJoinGroupCampaignStore((s) => s.resultsSelectedIds);
  const resultsPage = useZaloJoinGroupCampaignStore((s) => s.resultsPage);
  const resultsPerPage = useZaloJoinGroupCampaignStore((s) => s.resultsPerPage);
  const resultsTotal = useZaloJoinGroupCampaignStore((s) => s.resultsTotal);
  const resultsLoading = useZaloJoinGroupCampaignStore((s) => s.resultsLoading);
  const statistics = useZaloJoinGroupCampaignStore((s) => s.statistics);
  const failedLinks = useZaloJoinGroupCampaignStore((s) => s.failedLinks);
  const toggleResultSelected = useZaloJoinGroupCampaignStore((s) => s.toggleResultSelected);
  const toggleSelectAllResults = useZaloJoinGroupCampaignStore((s) => s.toggleSelectAllResults);
  const setResultsPage = useZaloJoinGroupCampaignStore((s) => s.setResultsPage);
  const setResultsPerPage = useZaloJoinGroupCampaignStore((s) => s.setResultsPerPage);
  const deleteSelectedResults = useZaloJoinGroupCampaignStore((s) => s.deleteSelectedResults);
  const refreshResults = useZaloJoinGroupCampaignStore((s) => s.refreshResults);

  const accountMap = new Map(accounts.map((item) => [item.id, item]));
  const selectedSet = new Set(resultsSelectedIds);
  const allSelected =
    results.length > 0 && results.every((item) => selectedSet.has(item.id));
  const totalPages = Math.max(1, Math.ceil(resultsTotal / resultsPerPage));
  const resultStats = buildResultStats(statistics, resultsTotal);

  const handleCopyFailedLinks = async () => {
    if (!failedLinks.length) {
      toast.error("Không có link thất bại để sao chép.");
      return;
    }
    try {
      await navigator.clipboard.writeText(failedLinks.join("\n"));
      toast.success("Đã sao chép danh sách link thất bại.");
    } catch {
      toast.error("Không sao chép được.");
    }
  };

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
    <Modal isOpen={open} onClose={onClose} className="max-w-6xl" showCloseButton>
      <div className="flex max-h-[min(90vh,760px)] flex-col overflow-hidden p-4 sm:p-6">
        <div className="mb-4 shrink-0 pr-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Kết quả chiến dịch
          </h3>
          {campaignName ? (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Kịch bản: {campaignName}
            </p>
          ) : null}
        </div>

        <div className="mb-4 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="grid grid-cols-2 divide-x divide-y divide-gray-100 sm:grid-cols-4 sm:divide-y-0 dark:divide-gray-800">
            {resultStats.map((item) => (
              <div
                key={item.label}
                className="flex min-w-0 flex-col gap-0.5 px-3 py-2.5 sm:px-4 sm:py-3"
              >
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {item.label}
                </span>
                <span
                  className={`text-base font-bold tabular-nums sm:text-xl ${item.valueClass}`}
                >
                  {item.value ?? 0}
                </span>
              </div>
            ))}
          </div>
        </div>

        {statistics.account_excluded_count ? (
          <p className="mb-3 text-sm text-warning-600 dark:text-warning-400">
            Số tài khoản hạn chế: {statistics.account_excluded_count}
          </p>
        ) : null}

        {failedLinks.length > 0 ? (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
            <span className="min-w-0 flex-1 truncate">
              Link thất bại: {failedLinks.slice(0, 3).join(", ")}
              {failedLinks.length > 3 ? ` … (+${failedLinks.length - 3})` : ""}
            </span>
            <Button size="sm" variant="outline" onClick={() => void handleCopyFailedLinks()}>
              Sao chép
            </Button>
          </div>
        ) : null}

        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
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
              Chưa có kết quả cho kịch bản này.
            </p>
          ) : (
            <div className="min-w-[820px]">
              {resultsLoading ? (
                <div className="flex justify-center py-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                </div>
              ) : null}
              <Table>
                <TableHeader className="sticky top-0 z-10 border-b border-gray-100 bg-gray-50 dark:border-white/[0.05] dark:bg-gray-900">
                  <TableRow>
                    <TableCell isHeader className={`${headerClass} w-12`}>
                      <Checkbox checked={allSelected} onChange={toggleSelectAllResults} />
                    </TableCell>
                    <TableCell isHeader className={headerClass}>
                      Thời gian
                    </TableCell>
                    <TableCell isHeader className={headerClass}>
                      Tài khoản
                    </TableCell>
                    <TableCell isHeader className={headerClass}>
                      Link nhóm
                    </TableCell>
                    <TableCell isHeader className={headerClass}>
                      Trạng thái
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {results.map((row) => {
                    const account = accountMap.get(row.account);
                    return (
                      <TableRow key={row.id}>
                        <TableCell className="px-4 py-3">
                          <Checkbox
                            checked={selectedSet.has(row.id)}
                            onChange={() => toggleResultSelected(row.id)}
                          />
                        </TableCell>
                        <TableCell className="px-4 py-3 text-theme-sm text-gray-600 dark:text-gray-300">
                          {formatCampaignStartTime(row.created_at)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-theme-sm text-gray-700 dark:text-gray-300">
                          {account?.name || `#${row.account}`}
                        </TableCell>
                        <TableCell className="max-w-[280px] px-4 py-3 text-theme-sm text-gray-700 dark:text-gray-300">
                          <span className="line-clamp-2 break-all">
                            {row.link_group || "—"}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-theme-sm">
                          <span className="font-medium text-gray-800 dark:text-white/90">
                            {formatJoinGroupResultStatus(row.status)}
                          </span>
                          {row.status_message ? (
                            <span className="mt-0.5 block text-theme-xs text-gray-500">
                              {row.status_message}
                            </span>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {totalPages > 1 ? (
          <div className="mt-4 flex justify-center">
            <Pagination
              currentPage={resultsPage}
              totalPages={totalPages}
              onPageChange={setResultsPage}
            />
          </div>
        ) : null}
      </div>
    </Modal>
  );
}