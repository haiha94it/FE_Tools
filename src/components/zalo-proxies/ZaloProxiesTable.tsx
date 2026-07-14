"use client";

import Checkbox from "@/components/form/input/Checkbox";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatZaloProxyExpiration,
  getZaloProxyDisplayValue,
  getZaloProxyStatusMeta,
  isZaloProxyExpired,
} from "@/lib/zalo-proxy-utils";
import type { ZaloProxyItem } from "@/types/zalo-proxy";
import { memo, useMemo } from "react";

interface ZaloProxiesTableProps {
  proxies: ZaloProxyItem[];
  selectedIds: number[];
  checkingIds: number[];
  isLoading: boolean;
  onToggleAll: () => void;
  onToggleOne: (id: number) => void;
  onEdit: (proxy: ZaloProxyItem) => void;
  onDelete: (proxy: ZaloProxyItem) => void;
}

const headerClass =
  "px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400";
const cellClass =
  "px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400";

function ZaloProxiesTable({
  proxies,
  selectedIds,
  checkingIds,
  isLoading,
  onToggleAll,
  onToggleOne,
  onEdit,
  onDelete,
}: ZaloProxiesTableProps) {
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const checkingIdSet = useMemo(() => new Set(checkingIds), [checkingIds]);

  const allSelected =
    proxies.length > 0 && proxies.every((proxy) => selectedIdSet.has(proxy.id));

  if (isLoading) {
    return (
      <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
        Đang tải danh sách proxy...
      </p>
    );
  }

  if (proxies.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
        Chưa có proxy. Bấm &quot;Thêm Proxy&quot; để bắt đầu.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
        <TableRow>
          <TableCell isHeader className={headerClass}>
            <Checkbox checked={allSelected} onChange={() => onToggleAll()} />
          </TableCell>
          <TableCell isHeader className={headerClass}>
            STT
          </TableCell>
          <TableCell isHeader className={headerClass}>
            Proxy
          </TableCell>
          <TableCell isHeader className={headerClass}>
            Ghi chú
          </TableCell>
          <TableCell isHeader className={headerClass}>
            Trạng thái
          </TableCell>
          <TableCell isHeader className={headerClass}>
            Hạn sử dụng
          </TableCell>
          <TableCell isHeader className={`${headerClass} text-end`}>
            Tuỳ chọn
          </TableCell>
        </TableRow>
      </TableHeader>

      <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
        {proxies.map((proxy, index) => {
          const expired = isZaloProxyExpired(proxy.date_expiration);
          const isChecking = checkingIdSet.has(proxy.id);
          const status = getZaloProxyStatusMeta(proxy, isChecking);

          return (
            <TableRow key={proxy.id}>
              <TableCell className="px-5 py-4 sm:px-6">
                <Checkbox
                  checked={selectedIdSet.has(proxy.id)}
                  onChange={() => onToggleOne(proxy.id)}
                />
              </TableCell>
              <TableCell className={cellClass}>{index + 1}</TableCell>
              <TableCell
                className={`${cellClass} ${
                  expired ? "text-error-600 dark:text-error-500" : ""
                }`}
              >
                <span className="block max-w-[360px] truncate">
                  {getZaloProxyDisplayValue(proxy)}
                </span>
              </TableCell>
              <TableCell className={cellClass}>{proxy.note || "—"}</TableCell>
              <TableCell className={cellClass}>
                <Badge size="sm" color={status.color}>
                  {status.label}
                </Badge>
              </TableCell>
              <TableCell
                className={`${cellClass} ${
                  expired ? "text-error-600 dark:text-error-500" : ""
                }`}
              >
                {formatZaloProxyExpiration(proxy.date_expiration)}
              </TableCell>
              <TableCell className="px-4 py-3 text-end">
                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(proxy)}
                  >
                    Sửa
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="!text-error-600 !ring-error-200 hover:!bg-error-50"
                    onClick={() => onDelete(proxy)}
                  >
                    Xóa
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export default memo(ZaloProxiesTable);