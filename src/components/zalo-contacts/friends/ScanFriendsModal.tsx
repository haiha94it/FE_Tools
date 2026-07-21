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
import {
  formatZaloFriendGender,
  isScanTaskDone,
} from "@/lib/zalo-contacts-utils";
import { toast } from "@/lib/toast";
import { isEmployeeUser } from "@/lib/team-collaboration-utils";
import { zaloFriendService } from "@/services/zalo-friend.service";
import { useAuthStore } from "@/stores/use-auth-store";
import { FriendNameCell } from "@/components/zalo-contacts/shared/ContactAvatar";
import type { ScanTaskResponse, ZaloFriendItem } from "@/types/zalo-contacts";
import { useCallback, useEffect, useState } from "react";

interface ScanFriendsPanelProps {
  active: boolean;
  accountId: number | null;
}

const headerClass =
  "px-4 py-2.5 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400";
const cellClass =
  "px-4 py-2.5 text-gray-600 text-start text-theme-sm dark:text-gray-400";

export default function ScanFriendsPanel({
  active,
  accountId,
}: ScanFriendsPanelProps) {
  const user = useAuthStore((s) => s.user);
  const isEmployee = isEmployeeUser(user);
  const [friends, setFriends] = useState<ZaloFriendItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [taskId, setTaskId] = useState<string | number | null>(null);

  const pageSize = 50;

  const loadFriends = useCallback(async () => {
    if (!accountId) return;
    setIsLoading(true);
    try {
      const data = await zaloFriendService.list({
        accountId,
        page,
        pageSize,
        name: search.trim() || undefined,
        detail: true,
      });
      setFriends(data.results ?? []);
      setTotal(data.count ?? data.results?.length ?? 0);
    } catch {
      setFriends([]);
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
    void loadFriends();
  }, [active, loadFriends]);

  const handleScanResult = useCallback(
    (result: ScanTaskResponse) => {
      if (!isScanTaskDone(result.status)) return;
      setIsScanning(false);
      setTaskId(null);
      if (result.status === "SUCCESS") {
        toast.success("Quét danh sách bạn bè thành công.");
        void loadFriends();
      } else {
        toast.error(result.message || result.error || "Quét bạn bè thất bại.");
      }
    },
    [loadFriends],
  );

  useScanTaskPoll({
    taskId,
    poll: zaloFriendService.pollScanResult,
    onResult: handleScanResult,
  });

  const handleScan = async () => {
    if (!accountId) {
      toast.error("Vui lòng chọn tài khoản Zalo.");
      return;
    }
    setIsScanning(true);
    try {
      const id = await zaloFriendService.startScan(accountId);
      if (!id) {
        toast.error("Không nhận được mã tác vụ quét.");
        setIsScanning(false);
        return;
      }
      setTaskId(id);
      toast.info("Đang quét danh sách bạn bè...");
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
          <Label>Tìm kiếm tên</Label>
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tên bạn bè..."
          />
        </div>
        <Button size="sm" variant="outline" onClick={() => void loadFriends()}>
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
                Tên bạn bè
              </TableCell>
              <TableCell isHeader className={headerClass}>
                Giới tính
              </TableCell>
              <TableCell isHeader className={headerClass}>
                Ngày sinh
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
            ) : friends.length === 0 ? (
              <TableRow>
                <TableCell className={cellClass}>
                  {isEmployee
                    ? 'Chưa có bạn bè trên nick này. Bấm "Quét danh sách" để đồng bộ (NV dùng chung list với quản lý khi nick được gán).'
                    : 'Chưa có dữ liệu. Bấm "Quét danh sách" để đồng bộ.'}
                </TableCell>
                <TableCell className={cellClass}>{" "}</TableCell>
                <TableCell className={cellClass}>{" "}</TableCell>
                <TableCell className={cellClass}>{" "}</TableCell>
              </TableRow>
            ) : (
              friends.map((friend, index) => {
                const genderLabel = formatZaloFriendGender(friend.gender);
                return (
                  <TableRow key={friend.id}>
                    <TableCell className={cellClass}>
                      {(page - 1) * pageSize + index + 1}
                    </TableCell>
                    <TableCell className={cellClass}>
                      <FriendNameCell
                        name={friend.name ?? friend.alias_name}
                        avatar={friend.avatar ?? friend.avt}
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
                    <TableCell className={cellClass}>
                      {friend.sdob?.trim() ? friend.sdob : "—"}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </ScrollableTableContainer>

      {totalPages > 1 && (
        <div className="mt-4 flex shrink-0 items-center justify-between">
          <span className="text-theme-xs text-gray-500">
            Trang {page}/{totalPages} — {total} bạn bè
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