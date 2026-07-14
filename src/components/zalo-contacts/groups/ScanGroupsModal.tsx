"use client";

import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import ScrollableTableContainer, {
  adminDataPanelClass,
  stickyTableHeaderClass,
} from "@/components/ui/table/ScrollableTableContainer";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useScanTaskPoll } from "@/hooks/use-scan-task-poll";
import { isScanTaskDone } from "@/lib/zalo-contacts-utils";
import { toast } from "@/lib/toast";
import { ContactNameCell } from "@/components/zalo-contacts/shared/ContactAvatar";
import { getZaloGroupAvatar } from "@/lib/zalo-contacts-utils";
import { zaloGroupService } from "@/services/zalo-group.service";
import type { ScanTaskResponse, ZaloGroupItem } from "@/types/zalo-contacts";
import { useCallback, useEffect, useState } from "react";

interface ScanGroupsPanelProps {
  active: boolean;
  accountId: number | null;
}

const headerClass =
  "px-4 py-2.5 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400";
const cellClass =
  "px-4 py-2.5 text-gray-600 text-start text-theme-sm dark:text-gray-400";

export default function ScanGroupsPanel({
  active,
  accountId,
}: ScanGroupsPanelProps) {
  const [groups, setGroups] = useState<ZaloGroupItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [taskId, setTaskId] = useState<string | number | null>(null);

  const pageSize = 50;

  const loadGroups = useCallback(async () => {
    if (!accountId) return;
    setIsLoading(true);
    try {
      const data = await zaloGroupService.list({
        accountId,
        page,
        pageSize,
        name: search.trim() || undefined,
      });
      setGroups(data.results ?? []);
      setTotal(data.count ?? data.results?.length ?? 0);
    } catch {
      setGroups([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [accountId, page, pageSize, search]);

  useEffect(() => {
    if (!active) {
      setTaskId(null);
      setIsScanning(false);
      setPage(1);
      setSearch("");
      return;
    }
    void loadGroups();
  }, [active, loadGroups]);

  const handleScanResult = useCallback(
    (result: ScanTaskResponse) => {
      if (!isScanTaskDone(result.status)) return;
      setIsScanning(false);
      setTaskId(null);
      if (result.status === "SUCCESS") {
        toast.success("Quét danh sách nhóm thành công.");
        void loadGroups();
      } else {
        toast.error(result.message || result.error || "Quét nhóm thất bại.");
      }
    },
    [loadGroups],
  );

  useScanTaskPoll({
    taskId,
    poll: zaloGroupService.pollScanResult,
    onResult: handleScanResult,
  });

  const handleScan = async () => {
    if (!accountId) {
      toast.error("Vui lòng chọn tài khoản Zalo.");
      return;
    }
    setIsScanning(true);
    try {
      const id = await zaloGroupService.startScan([accountId]);
      if (!id) {
        toast.error("Không nhận được mã tác vụ quét.");
        setIsScanning(false);
        return;
      }
      setTaskId(id);
      toast.info("Đang quét danh sách nhóm...");
    } catch {
      setIsScanning(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (!active) return null;

  return (
    <div className={adminDataPanelClass}>
      <div className="mb-4 flex shrink-0 flex-wrap items-end gap-3">
        <div className="w-full min-w-0 flex-1 sm:min-w-[12.5rem]">
          <Label>Tìm kiếm tên nhóm</Label>
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tên nhóm..."
          />
        </div>
        <Button size="sm" variant="outline" onClick={() => void loadGroups()}>
          Tải lại
        </Button>
        <Button size="sm" onClick={() => void handleScan()} disabled={isScanning}>
          {isScanning ? "Đang quét..." : "Quét danh sách"}
        </Button>
      </div>

      <ScrollableTableContainer fill>
        <Table>
          <TableHeader className={stickyTableHeaderClass}>
            <TableRow>
              <TableCell isHeader className={headerClass}>
                STT
              </TableCell>
              <TableCell isHeader className={headerClass}>
                Tên nhóm
              </TableCell>
              <TableCell isHeader className={headerClass}>
                Thành viên
              </TableCell>
              <TableCell isHeader className={headerClass}>
                Link nhóm
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {isLoading ? (
              <TableRow>
                <TableCell className={cellClass}>Đang tải...</TableCell>
                <TableCell className={cellClass}>{" "}</TableCell>
                <TableCell className={cellClass}>{" "}</TableCell>
                <TableCell className={cellClass}>{" "}</TableCell>
              </TableRow>
            ) : groups.length === 0 ? (
              <TableRow>
                <TableCell className={cellClass}>
                  Chưa có dữ liệu. Bấm &quot;Quét danh sách&quot; để đồng bộ.
                </TableCell>
                <TableCell className={cellClass}>{" "}</TableCell>
                <TableCell className={cellClass}>{" "}</TableCell>
                <TableCell className={cellClass}>{" "}</TableCell>
              </TableRow>
            ) : (
              groups.map((group, index) => (
                <TableRow key={group.id}>
                  <TableCell className={cellClass}>
                    {(page - 1) * pageSize + index + 1}
                  </TableCell>
                  <TableCell className={cellClass}>
                    <ContactNameCell
                      name={group.name}
                      avatar={getZaloGroupAvatar(group)}
                    />
                  </TableCell>
                  <TableCell className={cellClass}>
                    {group.total_member ?? "—"}
                  </TableCell>
                  <TableCell className={cellClass}>
                    <span className="block max-w-[280px] truncate">
                      {group.link_group || "—"}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ScrollableTableContainer>

      {totalPages > 1 && (
        <div className="mt-4 flex shrink-0 items-center justify-between">
          <span className="text-theme-xs text-gray-500">
            Trang {page}/{totalPages} — {total} nhóm
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Trước
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Sau
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}