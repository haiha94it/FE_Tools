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
import { FriendNameCell } from "@/components/zalo-contacts/shared/ContactAvatar";
import { useScanTaskPoll } from "@/hooks/use-scan-task-poll";
import {
  getRecommendFriendFid,
  getScanTaskStatus,
  isScanTaskDone,
  normalizeZaloFriendRecommendList,
} from "@/lib/zalo-contacts-utils";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { zaloFriendService } from "@/services/zalo-friend.service";
import type {
  ScanTaskResponse,
  ZaloFriendRecommendItem,
} from "@/types/zalo-contacts";
import { useCallback, useEffect, useRef, useState } from "react";

interface FriendRecommendPanelProps {
  active: boolean;
  accountId: number | null;
}

type RecommendActionKind = "accept" | "remove";

type RecommendActionTask = {
  id: string | number;
  kind: RecommendActionKind;
  fid: string;
};

const headerClass =
  "px-4 py-2.5 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400";
const cellClass =
  "px-4 py-2.5 text-gray-600 text-start text-theme-sm dark:text-gray-400";

function formatRecommendType(type?: string | null): string {
  if (type === "friend_request") return "Lời mời đến";
  if (type === "suggest") return "Gợi ý kết bạn";
  return type?.trim() || "Gợi ý";
}

function acceptLabel(type?: string | null): string {
  return type === "friend_request" ? "Chấp nhận" : "Kết bạn";
}

export default function FriendRecommendPanel({
  active,
  accountId,
}: FriendRecommendPanelProps) {
  const [items, setItems] = useState<ZaloFriendRecommendItem[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanTaskId, setScanTaskId] = useState<string | number | null>(null);

  const [actionTask, setActionTask] = useState<RecommendActionTask | null>(
    null,
  );
  const actionTaskRef = useRef<RecommendActionTask | null>(null);
  actionTaskRef.current = actionTask;

  useEffect(() => {
    if (!active) {
      setItems([]);
      setScanTaskId(null);
      setIsScanning(false);
      setActionTask(null);
    }
  }, [active]);

  const handleScanResult = useCallback((result: ScanTaskResponse) => {
    const status = getScanTaskStatus(result);
    if (!isScanTaskDone(status)) return;
    setIsScanning(false);
    setScanTaskId(null);
    if (status === "SUCCESS") {
      const raw = result.data ?? result.result;
      const list = normalizeZaloFriendRecommendList(
        Array.isArray(raw) ? raw : [],
      );
      setItems(list);
      toast.success(
        list.length > 0
          ? `Đã tải ${list.length} gợi ý / lời mời.`
          : "Không có gợi ý kết bạn.",
      );
    } else {
      toast.error(result.message || result.error || "Quét gợi ý thất bại.");
    }
  }, []);

  useScanTaskPoll({
    taskId: scanTaskId,
    poll: zaloFriendService.pollRecommendResult,
    onResult: handleScanResult,
  });

  const pollAction = useCallback(async (taskId: string | number) => {
    const kind = actionTaskRef.current?.kind;
    if (kind === "accept") {
      return zaloFriendService.pollAcceptFriendRequest(taskId);
    }
    return zaloFriendService.pollRejectFriendRequest(taskId);
  }, []);

  const handleActionResult = useCallback((result: ScanTaskResponse) => {
    const status = getScanTaskStatus(result);
    if (!isScanTaskDone(status)) return;

    const current = actionTaskRef.current;
    setActionTask(null);

    if (!current) return;

    if (status === "SUCCESS") {
      setItems((prev) =>
        prev.filter((item) => getRecommendFriendFid(item) !== current.fid),
      );
      toast.success(
        current.kind === "accept"
          ? "Đã chấp nhận / gửi kết bạn thành công."
          : "Đã bỏ qua gợi ý.",
      );
      return;
    }

    toast.error(
      result.message ||
        result.error ||
        (current.kind === "accept"
          ? "Kết bạn thất bại."
          : "Bỏ qua gợi ý thất bại."),
    );
  }, []);

  useScanTaskPoll({
    taskId: actionTask?.id ?? null,
    poll: pollAction,
    onResult: handleActionResult,
  });

  const handleScan = async () => {
    if (!accountId) {
      toast.error("Vui lòng chọn tài khoản Zalo.");
      return;
    }
    if (actionTask) {
      toast.error("Đang xử lý một thao tác — vui lòng đợi.");
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
      setScanTaskId(id);
      toast.info("Đang tải gợi ý kết bạn...");
    } catch (error) {
      setIsScanning(false);
      toast.error(getApiErrorMessage(error));
    }
  };

  const startAction = async (
    kind: RecommendActionKind,
    item: ZaloFriendRecommendItem,
  ) => {
    if (!accountId) {
      toast.error("Vui lòng chọn tài khoản Zalo.");
      return;
    }
    if (isScanning || actionTask) {
      toast.error("Đang có tác vụ khác — vui lòng đợi.");
      return;
    }
    const fid = getRecommendFriendFid(item);
    if (!fid) {
      toast.error("Thiếu UID người dùng — không thể thao tác.");
      return;
    }

    try {
      const id =
        kind === "accept"
          ? await zaloFriendService.startAcceptFriendRequest(accountId, fid)
          : await zaloFriendService.startRejectFriendRequest(accountId, fid);
      if (!id) {
        toast.error("Không nhận được mã tác vụ.");
        return;
      }
      setActionTask({ id, kind, fid });
      toast.info(
        kind === "accept" ? "Đang gửi kết bạn..." : "Đang bỏ qua gợi ý...",
      );
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  if (!active) return null;

  const busy = isScanning || Boolean(actionTask);
  const actioningFid = actionTask?.fid ?? null;

  return (
    <div className={adminDataPanelClass}>
      <Button
        size="sm"
        className="mb-4 shrink-0"
        onClick={() => void handleScan()}
        disabled={busy}
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
              <TableCell isHeader className={headerClass}>
                Loại
              </TableCell>
              <TableCell isHeader className={`${headerClass} min-w-[11rem]`}>
                Thao tác
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {items.length === 0 ? (
              <TableRow>
                <TableCell className={cellClass}>
                  {isScanning
                    ? "Đang quét..."
                    : "Chưa có dữ liệu. Bấm «Quét gợi ý kết bạn»."}
                </TableCell>
                <TableCell className={cellClass}>{" "}</TableCell>
                <TableCell className={cellClass}>{" "}</TableCell>
                <TableCell className={cellClass}>{" "}</TableCell>
                <TableCell className={cellClass}>{" "}</TableCell>
              </TableRow>
            ) : (
              items.map((item, index) => {
                const fid = getRecommendFriendFid(item);
                const rowBusy = Boolean(fid && actioningFid === fid);
                const disableActions = busy && !rowBusy;

                return (
                  <TableRow
                    key={`${fid ?? item.id ?? index}`}
                    className={rowBusy ? "opacity-70" : undefined}
                  >
                    <TableCell className={cellClass}>{index + 1}</TableCell>
                    <TableCell className={cellClass}>
                      <FriendNameCell
                        name={item.zaloName ?? item.name}
                        avatar={item.avatar}
                      />
                    </TableCell>
                    <TableCell className={cellClass}>
                      {fid ?? "—"}
                    </TableCell>
                    <TableCell className={cellClass}>
                      {formatRecommendType(item.type)}
                    </TableCell>
                    <TableCell className={cellClass}>
                      <div className="flex flex-wrap gap-1.5">
                        <Button
                          size="sm"
                          className="!px-2.5 !py-1 text-xs"
                          disabled={!fid || disableActions || rowBusy}
                          onClick={() => void startAction("accept", item)}
                        >
                          {rowBusy && actionTask?.kind === "accept"
                            ? "Đang xử lý..."
                            : acceptLabel(item.type)}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="!px-2.5 !py-1 text-xs"
                          disabled={!fid || disableActions || rowBusy}
                          onClick={() => void startAction("remove", item)}
                        >
                          {rowBusy && actionTask?.kind === "remove"
                            ? "Đang xử lý..."
                            : "Bỏ qua"}
                        </Button>
                      </div>
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
