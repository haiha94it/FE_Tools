"use client";

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
import {
  formatZaloFriendGender,
  isScanTaskDone,
} from "@/lib/zalo-contacts-utils";
import { toast } from "@/lib/toast";
import { zaloFriendService } from "@/services/zalo-friend.service";
import { FriendNameCell } from "@/components/zalo-contacts/shared/ContactAvatar";
import type {
  ScanTaskResponse,
  ZaloSentFriendRequestItem,
} from "@/types/zalo-contacts";
import { useCallback, useEffect, useState } from "react";

interface SentFriendRequestsPanelProps {
  active: boolean;
  accountId: number | null;
}

const headerClass =
  "px-4 py-2.5 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400";
const cellClass =
  "px-4 py-2.5 text-gray-600 text-start text-theme-sm dark:text-gray-400";

export default function SentFriendRequestsPanel({
  active,
  accountId,
}: SentFriendRequestsPanelProps) {
  const [items, setItems] = useState<ZaloSentFriendRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [taskId, setTaskId] = useState<string | number | null>(null);

  const loadItems = useCallback(async () => {
    if (!accountId) return;
    setIsLoading(true);
    try {
      const list = await zaloFriendService.listSentRequests(accountId);
      setItems(list);
    } catch {
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    if (!active) {
      setTaskId(null);
      setIsScanning(false);
      return;
    }
    void loadItems();
  }, [active, loadItems]);

  const handleScanResult = useCallback(
    (result: ScanTaskResponse) => {
      if (!isScanTaskDone(result.status)) return;
      setIsScanning(false);
      setTaskId(null);
      if (result.status === "SUCCESS") {
        toast.success("Đồng bộ lời mời kết bạn thành công.");
        void loadItems();
      } else {
        toast.error(result.message || result.error || "Đồng bộ thất bại.");
      }
    },
    [loadItems],
  );

  useScanTaskPoll({
    taskId,
    poll: zaloFriendService.pollSentRequestResult,
    onResult: handleScanResult,
  });

  const handleScan = async () => {
    if (!accountId) {
      toast.error("Vui lòng chọn tài khoản Zalo.");
      return;
    }
    setIsScanning(true);
    try {
      const id = await zaloFriendService.startSentRequestScan(accountId);
      if (!id) {
        setIsScanning(false);
        toast.error("Không nhận được mã tác vụ.");
        return;
      }
      setTaskId(id);
      toast.info("Đang đồng bộ lời mời đã gửi...");
    } catch {
      setIsScanning(false);
    }
  };

  if (!active) return null;

  return (
    <div className={adminDataPanelClass}>
      <div className="mb-4 flex shrink-0 gap-2">
        <Button
          size="sm"
          onClick={() => void handleScan()}
          disabled={isScanning}
        >
          {isScanning ? "Đang đồng bộ..." : "Đồng bộ danh sách"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => void loadItems()}>
          Tải lại
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
                Tên
              </TableCell>
              <TableCell isHeader className={headerClass}>
                Giới tính
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {isLoading ? (
              <TableRow>
                <TableCell className={cellClass}>Đang tải...</TableCell>
                <TableCell className={cellClass}>{" "}</TableCell>
                <TableCell className={cellClass}>{" "}</TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell className={cellClass}>Chưa có lời mời nào.</TableCell>
                <TableCell className={cellClass}>{" "}</TableCell>
                <TableCell className={cellClass}>{" "}</TableCell>
              </TableRow>
            ) : (
              items.map((item, index) => {
                const genderLabel = formatZaloFriendGender(item.gender);
                return (
                  <TableRow key={`${item.uid ?? item.id ?? index}`}>
                    <TableCell className={cellClass}>{index + 1}</TableCell>
                    <TableCell className={cellClass}>
                      <FriendNameCell
                        name={item.name}
                        avatar={item.avatar}
                        subtitle={genderLabel !== "—" ? genderLabel : null}
                      />
                    </TableCell>
                    <TableCell className={cellClass}>
                      <span
                        className={
                          genderLabel === "—"
                            ? "text-gray-400"
                            : "font-medium text-gray-800 dark:text-white/90"
                        }
                      >
                        {genderLabel}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </ScrollableTableContainer>
    </div>
  );
}