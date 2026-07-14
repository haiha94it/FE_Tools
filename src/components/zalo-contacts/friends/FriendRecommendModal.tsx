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
import { isScanTaskDone } from "@/lib/zalo-contacts-utils";
import { toast } from "@/lib/toast";
import { zaloFriendService } from "@/services/zalo-friend.service";
import { FriendNameCell } from "@/components/zalo-contacts/shared/ContactAvatar";
import type {
  ScanTaskResponse,
  ZaloFriendRecommendItem,
} from "@/types/zalo-contacts";
import { useCallback, useEffect, useState } from "react";

interface FriendRecommendPanelProps {
  active: boolean;
  accountId: number | null;
}

const headerClass =
  "px-4 py-2.5 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400";
const cellClass =
  "px-4 py-2.5 text-gray-600 text-start text-theme-sm dark:text-gray-400";

export default function FriendRecommendPanel({
  active,
  accountId,
}: FriendRecommendPanelProps) {
  const [items, setItems] = useState<ZaloFriendRecommendItem[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [taskId, setTaskId] = useState<string | number | null>(null);

  useEffect(() => {
    if (!active) {
      setItems([]);
      setTaskId(null);
      setIsScanning(false);
    }
  }, [active]);

  const handleScanResult = useCallback((result: ScanTaskResponse) => {
    if (!isScanTaskDone(result.status)) return;
    setIsScanning(false);
    setTaskId(null);
    if (result.status === "SUCCESS") {
      const list = Array.isArray(result.data)
        ? (result.data as ZaloFriendRecommendItem[])
        : [];
      setItems(list);
      toast.success(`Đã quét ${list.length} gợi ý kết bạn.`);
    } else {
      toast.error(result.message || result.error || "Quét gợi ý thất bại.");
    }
  }, []);

  useScanTaskPoll({
    taskId,
    poll: zaloFriendService.pollRecommendResult,
    onResult: handleScanResult,
  });

  const handleScan = async () => {
    if (!accountId) {
      toast.error("Vui lòng chọn tài khoản Zalo.");
      return;
    }
    setIsScanning(true);
    setItems([]);
    try {
      const id = await zaloFriendService.startRecommendScan(accountId);
      if (!id) {
        setIsScanning(false);
        toast.error("Không nhận được mã tác vụ.");
        return;
      }
      setTaskId(id);
      toast.info("Đang quét gợi ý kết bạn...");
    } catch {
      setIsScanning(false);
    }
  };

  if (!active) return null;

  return (
    <div className={adminDataPanelClass}>
      <Button
        size="sm"
        className="mb-4 shrink-0"
        onClick={() => void handleScan()}
        disabled={isScanning}
      >
        {isScanning ? "Đang quét..." : "Quét gợi ý kết bạn"}
      </Button>

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
                UID
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {items.length === 0 ? (
              <TableRow>
                <TableCell className={cellClass}>
                  {isScanning ? "Đang quét..." : "Chưa có dữ liệu."}
                </TableCell>
                <TableCell className={cellClass}>{" "}</TableCell>
                <TableCell className={cellClass}>{" "}</TableCell>
              </TableRow>
            ) : (
              items.map((item, index) => (
                <TableRow key={`${item.uid ?? item.id ?? index}`}>
                  <TableCell className={cellClass}>{index + 1}</TableCell>
                  <TableCell className={cellClass}>
                    <FriendNameCell name={item.name} avatar={item.avatar} />
                  </TableCell>
                  <TableCell className={cellClass}>
                    {item.uid || "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ScrollableTableContainer>
    </div>
  );
}