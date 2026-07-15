"use client";

import { useScanTaskPoll } from "@/hooks/use-scan-task-poll";
import { getScanTaskStatus, isScanTaskDone } from "@/lib/zalo-contacts-utils";
import { toast } from "@/lib/toast";
import { zaloGroupService } from "@/services/zalo-group.service";
import type { ZaloGroupMember } from "@/types/zalo-contacts";
import { useCallback, useEffect, useRef, useState } from "react";

export function useGroupMembers(
  accountId: number | null,
  groupId: number | null,
  enabled: boolean,
) {
  const [members, setMembers] = useState<ZaloGroupMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [taskId, setTaskId] = useState<string | number | null>(null);
  const activeGroupIdRef = useRef<number | null>(null);

  const loadMembers = useCallback(async (targetGroupId: number) => {
    setIsLoading(true);
    try {
      const data = await zaloGroupService.showMembers(targetGroupId);
      if (activeGroupIdRef.current !== targetGroupId) return;
      setMembers(data);
    } catch {
      if (activeGroupIdRef.current !== targetGroupId) return;
      setMembers([]);
      toast.error("Không tải được danh sách thành viên nhóm.");
    } finally {
      if (activeGroupIdRef.current === targetGroupId) {
        setIsLoading(false);
      }
    }
  }, []);

  const refreshMembers = useCallback(async () => {
    if (!accountId || !groupId) return;
    setIsRefreshing(true);
    try {
      const id = await zaloGroupService.startGetMembers(accountId, groupId);
      if (!id) {
        setIsRefreshing(false);
        toast.error("Không nhận được mã tác vụ làm mới thành viên.");
        return;
      }
      setTaskId(id);
    } catch {
      setIsRefreshing(false);
      toast.error("Không gửi được yêu cầu làm mới thành viên nhóm.");
    }
  }, [accountId, groupId]);

  useScanTaskPoll({
    taskId: isRefreshing ? taskId : null,
    poll: zaloGroupService.pollGetMembersResult,
    onResult: (result) => {
      const status = getScanTaskStatus(result);
      if (status === "SUCCESS") {
        const next = Array.isArray(result.data) ? result.data : [];
        setMembers(next);
        setIsRefreshing(false);
        setTaskId(null);
        toast.success(
          `Đã làm mới ${next.length} thành viên${
            result.total_member ? ` / ${result.total_member}` : ""
          }.`,
        );
        return;
      }
      if (isScanTaskDone(status)) {
        setIsRefreshing(false);
        setTaskId(null);
        toast.error(result.message || "Làm mới thành viên nhóm thất bại.");
      }
    },
  });

  useEffect(() => {
    if (!enabled || !groupId) {
      activeGroupIdRef.current = null;
      setMembers([]);
      setTaskId(null);
      setIsRefreshing(false);
      setIsLoading(false);
      return;
    }

    activeGroupIdRef.current = groupId;
    setMembers([]);
    setTaskId(null);
    setIsRefreshing(false);
    void loadMembers(groupId);
  }, [enabled, groupId, loadMembers]);

  return {
    members,
    isLoading,
    isRefreshing,
    refreshMembers,
    reloadMembers: () => {
      if (groupId) void loadMembers(groupId);
    },
  };
}