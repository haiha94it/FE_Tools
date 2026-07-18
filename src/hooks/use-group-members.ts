"use client";

import { useScanTaskPoll } from "@/hooks/use-scan-task-poll";
import { dedupeInflight } from "@/lib/inflight";
import { getScanTaskStatus, isScanTaskDone } from "@/lib/zalo-contacts-utils";
import { toast } from "@/lib/toast";
import { zaloGroupService } from "@/services/zalo-group.service";
import type { ZaloGroupMember } from "@/types/zalo-contacts";
import { useCallback, useEffect, useRef, useState } from "react";

/** Cache theo groupId — đổi hội thoại rồi quay lại không fetch lại ngay */
const membersCache = new Map<number, ZaloGroupMember[]>();
const membersAbort = new Map<number, AbortController>();

function abortMembersExcept(keepGroupId: number | null) {
  for (const [id, ctrl] of membersAbort) {
    if (keepGroupId == null || id !== keepGroupId) {
      ctrl.abort();
      membersAbort.delete(id);
    }
  }
}

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
    const cached = membersCache.get(targetGroupId);
    if (cached) {
      if (activeGroupIdRef.current === targetGroupId) {
        setMembers(cached);
        setIsLoading(false);
      }
      return;
    }

    abortMembersExcept(targetGroupId);
    const controller = new AbortController();
    membersAbort.set(targetGroupId, controller);

    if (activeGroupIdRef.current === targetGroupId) {
      setIsLoading(true);
    }

    try {
      const data = await dedupeInflight(
        `group:showMembers:${targetGroupId}`,
        () =>
          zaloGroupService.showMembers(targetGroupId, {
            signal: controller.signal,
          }),
      );
      if (controller.signal.aborted) return;
      membersCache.set(targetGroupId, data);
      if (activeGroupIdRef.current !== targetGroupId) return;
      setMembers(data);
    } catch {
      if (controller.signal.aborted) return;
      if (activeGroupIdRef.current !== targetGroupId) return;
      setMembers([]);
      toast.error("Không tải được danh sách thành viên nhóm.");
    } finally {
      if (membersAbort.get(targetGroupId) === controller) {
        membersAbort.delete(targetGroupId);
      }
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
        const gid = activeGroupIdRef.current;
        if (gid != null) {
          membersCache.set(gid, next);
        }
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
    setTaskId(null);
    setIsRefreshing(false);

    const cached = membersCache.get(groupId);
    if (cached) {
      setMembers(cached);
      setIsLoading(false);
      return;
    }

    setMembers([]);
    void loadMembers(groupId);
  }, [enabled, groupId, loadMembers]);

  return {
    members,
    isLoading,
    isRefreshing,
    refreshMembers,
    reloadMembers: () => {
      if (!groupId) return;
      membersCache.delete(groupId);
      void loadMembers(groupId);
    },
  };
}
