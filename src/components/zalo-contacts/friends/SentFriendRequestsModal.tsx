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
import { confirm } from "@/lib/confirm";
import { getApiErrorMessage } from "@/lib/errors";
import {
  formatZaloFriendGender,
  getScanTaskStatus,
  isScanTaskDone,
} from "@/lib/zalo-contacts-utils";
import { toast } from "@/lib/toast";
import { zaloFriendService } from "@/services/zalo-friend.service";
import type {
  ScanTaskResponse,
  ZaloSentFriendRequestItem,
} from "@/types/zalo-contacts";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface SentFriendRequestsPanelProps {
  active: boolean;
  accountId: number | null;
}

type PanelTask =
  | { kind: "sync"; id: string | number }
  | { kind: "recall"; id: string | number; uids: string[] };

const headerClass =
  "px-4 py-2.5 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400";
const cellClass =
  "px-4 py-2.5 text-gray-600 text-start text-theme-sm dark:text-gray-400";

function getSentRequestUid(item: ZaloSentFriendRequestItem): string | null {
  const uid = item.uid?.trim();
  return uid || null;
}

export default function SentFriendRequestsPanel({
  active,
  accountId,
}: SentFriendRequestsPanelProps) {
  const [items, setItems] = useState<ZaloSentFriendRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUids, setSelectedUids] = useState<string[]>([]);
  const [panelTask, setPanelTask] = useState<PanelTask | null>(null);
  const panelTaskRef = useRef<PanelTask | null>(null);
  panelTaskRef.current = panelTask;

  const isBusy = Boolean(panelTask);
  const isSyncing = panelTask?.kind === "sync";
  const isRecalling = panelTask?.kind === "recall";

  const loadItems = useCallback(async () => {
    if (!accountId) return;
    setIsLoading(true);
    try {
      const list = await zaloFriendService.listSentRequests(accountId);
      setItems(list);
      // Bỏ chọn uid không còn trong list
      setSelectedUids((prev) => {
        const alive = new Set(
          list.map((row) => getSentRequestUid(row)).filter(Boolean) as string[],
        );
        return prev.filter((uid) => alive.has(uid));
      });
    } catch (error) {
      setItems([]);
      toast.error(getApiErrorMessage(error) || "Không tải được danh sách lời mời.");
    } finally {
      setIsLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    if (!active) {
      setPanelTask(null);
      setSelectedUids([]);
      return;
    }
    void loadItems();
  }, [active, loadItems]);

  const pollPanelTask = useCallback(async (taskId: string | number) => {
    const kind = panelTaskRef.current?.kind;
    if (kind === "recall") {
      return zaloFriendService.pollRecallSentRequest(taskId);
    }
    return zaloFriendService.pollSentRequestResult(taskId);
  }, []);

  const handleTaskResult = useCallback(
    (result: ScanTaskResponse) => {
      const status = getScanTaskStatus(result);
      if (!isScanTaskDone(status)) return;

      const current = panelTaskRef.current;
      setPanelTask(null);
      if (!current) return;

      if (status !== "SUCCESS") {
        toast.error(
          result.message ||
            result.error ||
            (current.kind === "sync"
              ? "Đồng bộ thất bại."
              : "Thu hồi lời mời thất bại."),
        );
        return;
      }

      if (current.kind === "sync") {
        toast.success("Đồng bộ lời mời đã gửi thành công.");
        void loadItems();
        return;
      }

      // recall: result có thể là mảng per-uid
      const raw = result.data ?? result.result;
      const successUids = new Set<string>(current.uids);
      if (Array.isArray(raw)) {
        successUids.clear();
        for (const row of raw) {
          if (!row || typeof row !== "object") continue;
          const rec = row as {
            uid?: unknown;
            success?: unknown;
            message?: unknown;
          };
          const uid =
            typeof rec.uid === "string"
              ? rec.uid
              : typeof rec.uid === "number"
                ? String(rec.uid)
                : null;
          if (!uid) continue;
          if (rec.success === false) {
            if (typeof rec.message === "string" && rec.message.trim()) {
              toast.error(`${uid}: ${rec.message}`);
            }
            continue;
          }
          successUids.add(uid);
        }
      }

      if (successUids.size > 0) {
        setItems((prev) =>
          prev.filter((row) => {
            const uid = getSentRequestUid(row);
            return !uid || !successUids.has(uid);
          }),
        );
        setSelectedUids((prev) => prev.filter((uid) => !successUids.has(uid)));
        toast.success(
          successUids.size === 1
            ? "Đã thu hồi lời mời."
            : `Đã thu hồi ${successUids.size} lời mời.`,
        );
      } else {
        toast.error("Không thu hồi được lời mời nào.");
      }
    },
    [loadItems],
  );

  useScanTaskPoll({
    taskId: panelTask?.id ?? null,
    poll: pollPanelTask,
    onResult: handleTaskResult,
  });

  const handleSync = async () => {
    if (!accountId) {
      toast.error("Vui lòng chọn tài khoản Zalo.");
      return;
    }
    if (isBusy) return;
    try {
      const id = await zaloFriendService.startSentRequestScan(accountId);
      if (!id) {
        toast.error("Không nhận được mã tác vụ.");
        return;
      }
      setPanelTask({ kind: "sync", id });
      toast.info("Đang đồng bộ lời mời đã gửi từ Zalo...");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const startRecall = async (uids: string[]) => {
    if (!accountId) {
      toast.error("Vui lòng chọn tài khoản Zalo.");
      return;
    }
    const clean = [...new Set(uids.map((u) => u.trim()).filter(Boolean))];
    if (!clean.length) {
      toast.error("Chọn ít nhất 1 lời mời để thu hồi (dùng UID Zalo).");
      return;
    }
    if (isBusy) return;

    const ok = await confirm({
      title: "Thu hồi lời mời?",
      message:
        clean.length === 1
          ? "Thu hồi lời mời kết bạn đã gửi tới người này?"
          : `Thu hồi ${clean.length} lời mời kết bạn đã gửi?`,
      confirmText: "Thu hồi",
      variant: "danger",
    });
    if (!ok) return;

    try {
      const id = await zaloFriendService.startRecallSentRequest(
        accountId,
        clean,
      );
      if (!id) {
        toast.error("Không nhận được mã tác vụ.");
        return;
      }
      setPanelTask({ kind: "recall", id, uids: clean });
      toast.info("Đang thu hồi lời mời...");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const selectableUids = useMemo(
    () =>
      items
        .map((row) => getSentRequestUid(row))
        .filter((uid): uid is string => Boolean(uid)),
    [items],
  );

  const allSelected =
    selectableUids.length > 0 &&
    selectableUids.every((uid) => selectedUids.includes(uid));

  const toggleUid = (uid: string) => {
    setSelectedUids((prev) =>
      prev.includes(uid) ? prev.filter((x) => x !== uid) : [...prev, uid],
    );
  };

  const toggleAll = () => {
    setSelectedUids(allSelected ? [] : selectableUids);
  };

  if (!active) return null;

  return (
    <div className={adminDataPanelClass}>
      <div className="mb-4 flex shrink-0 flex-wrap gap-2">
        <Button
          size="sm"
          onClick={() => void handleSync()}
          disabled={isBusy || !accountId}
        >
          {isSyncing ? "Đang đồng bộ..." : "Đồng bộ từ Zalo"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => void loadItems()}
          disabled={isBusy || isLoading}
        >
          Tải lại
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="!border-error-200 !text-error-600 dark:!border-error-500/40 dark:!text-error-400"
          disabled={isBusy || selectedUids.length === 0}
          onClick={() => void startRecall(selectedUids)}
        >
          {isRecalling
            ? "Đang thu hồi..."
            : selectedUids.length > 0
              ? `Thu hồi đã chọn (${selectedUids.length})`
              : "Thu hồi đã chọn"}
        </Button>
      </div>

      <ScrollableTableContainer fill>
        <Table>
          <TableHeader className={stickyTableHeaderClass}>
            <TableRow>
              <TableCell isHeader className={`${headerClass} w-12`}>
                <input
                  type="checkbox"
                  className="size-4 rounded border-gray-300"
                  checked={allSelected}
                  disabled={selectableUids.length === 0 || isBusy}
                  onChange={toggleAll}
                  aria-label="Chọn tất cả"
                />
              </TableCell>
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
                Giới tính
              </TableCell>
              <TableCell isHeader className={`${headerClass} min-w-[7rem]`}>
                Thao tác
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {isLoading ? (
              <TableRow>
                <TableCell className={cellClass}>{" "}</TableCell>
                <TableCell className={cellClass}>Đang tải...</TableCell>
                <TableCell className={cellClass}>{" "}</TableCell>
                <TableCell className={cellClass}>{" "}</TableCell>
                <TableCell className={cellClass}>{" "}</TableCell>
                <TableCell className={cellClass}>{" "}</TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell className={cellClass}>{" "}</TableCell>
                <TableCell className={cellClass}>
                  Chưa có lời mời đã gửi.
                </TableCell>
                <TableCell className={cellClass}>{" "}</TableCell>
                <TableCell className={cellClass}>{" "}</TableCell>
                <TableCell className={cellClass}>{" "}</TableCell>
                <TableCell className={cellClass}>{" "}</TableCell>
              </TableRow>
            ) : (
              items.map((item, index) => {
                const uid = getSentRequestUid(item);
                const genderLabel = formatZaloFriendGender(item.gender);
                const selected = Boolean(uid && selectedUids.includes(uid));
                const rowRecalling =
                  isRecalling &&
                  Boolean(
                    uid &&
                      panelTask?.kind === "recall" &&
                      panelTask.uids.includes(uid),
                  );

                return (
                  <TableRow
                    key={`${uid ?? item.id ?? index}`}
                    className={rowRecalling ? "opacity-70" : undefined}
                  >
                    <TableCell className={cellClass}>
                      <input
                        type="checkbox"
                        className="size-4 rounded border-gray-300"
                        checked={selected}
                        disabled={!uid || isBusy}
                        onChange={() => uid && toggleUid(uid)}
                        aria-label={`Chọn ${item.name || uid || ""}`}
                      />
                    </TableCell>
                    <TableCell className={cellClass}>{index + 1}</TableCell>
                    <TableCell className={cellClass}>
                      <FriendNameCell
                        name={item.name}
                        avatar={item.avatar}
                        subtitle={genderLabel !== "—" ? genderLabel : null}
                      />
                    </TableCell>
                    <TableCell className={cellClass}>{uid ?? "—"}</TableCell>
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
                    <TableCell className={cellClass}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="!border-error-200 !px-2.5 !py-1 text-xs !text-error-600 dark:!border-error-500/40 dark:!text-error-400"
                        disabled={!uid || isBusy}
                        onClick={() => uid && void startRecall([uid])}
                      >
                        {rowRecalling ? "Đang thu hồi..." : "Thu hồi"}
                      </Button>
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
