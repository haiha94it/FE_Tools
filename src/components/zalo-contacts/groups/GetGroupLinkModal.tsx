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
import { ContactNameCell } from "@/components/zalo-contacts/shared/ContactAvatar";
import { getZaloGroupAvatar } from "@/lib/zalo-contacts-utils";
import { zaloGroupService } from "@/services/zalo-group.service";
import type { ScanTaskResponse, ZaloGroupLinkItem } from "@/types/zalo-contacts";
import { useCallback, useEffect, useState } from "react";

interface GetGroupLinkPanelProps {
  active: boolean;
  accountId: number | null;
}

const headerClass =
  "px-4 py-2.5 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400";
const cellClass =
  "px-4 py-2.5 text-gray-600 text-start text-theme-sm dark:text-gray-400";

export default function GetGroupLinkPanel({
  active,
  accountId,
}: GetGroupLinkPanelProps) {
  const [links, setLinks] = useState<ZaloGroupLinkItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [taskId, setTaskId] = useState<string | number | null>(null);

  useEffect(() => {
    if (!active) {
      setLinks([]);
      setTaskId(null);
      setIsLoading(false);
    }
  }, [active]);

  const handleResult = useCallback((result: ScanTaskResponse) => {
    if (!isScanTaskDone(result.status)) return;
    setIsLoading(false);
    setTaskId(null);
    if (result.status === "SUCCESS") {
      const list = zaloGroupService.extractGroupLinks(result);
      setLinks(list);
      toast.success(`Đã lấy ${list.length} link nhóm.`);
    } else {
      toast.error(result.message || result.error || "Lấy link nhóm thất bại.");
    }
  }, []);

  useScanTaskPoll({
    taskId,
    poll: zaloGroupService.pollGetLinkResult,
    onResult: handleResult,
  });

  const handleFetch = async () => {
    if (!accountId) {
      toast.error("Vui lòng chọn tài khoản Zalo.");
      return;
    }
    setIsLoading(true);
    setLinks([]);
    try {
      const id = await zaloGroupService.startGetLink(accountId);
      if (!id) {
        setIsLoading(false);
        toast.error("Không nhận được mã tác vụ.");
        return;
      }
      setTaskId(id);
      toast.info("Đang lấy link nhóm...");
    } catch {
      setIsLoading(false);
    }
  };

  if (!active) return null;

  return (
    <div className={adminDataPanelClass}>
      <Button
        size="sm"
        className="mb-4 shrink-0"
        onClick={() => void handleFetch()}
        disabled={isLoading}
      >
        {isLoading ? "Đang lấy..." : "Lấy danh sách link"}
      </Button>

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
                Link
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {links.length === 0 ? (
              <TableRow>
                <TableCell className={cellClass}>
                  {isLoading ? "Đang xử lý..." : "Chưa có dữ liệu."}
                </TableCell>
                <TableCell className={cellClass}>{" "}</TableCell>
                <TableCell className={cellClass}>{" "}</TableCell>
              </TableRow>
            ) : (
              links.map((item, index) => (
                <TableRow key={`${item.link_group}-${index}`}>
                  <TableCell className={cellClass}>{index + 1}</TableCell>
                  <TableCell className={cellClass}>
                    <ContactNameCell
                      name={item.name}
                      avatar={getZaloGroupAvatar(item)}
                    />
                  </TableCell>
                  <TableCell className={cellClass}>
                    {item.link_group ? (
                      <a
                        href={item.link_group}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-500 hover:underline"
                      >
                        {item.link_group}
                      </a>
                    ) : (
                      "—"
                    )}
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