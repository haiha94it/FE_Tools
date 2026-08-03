"use client";

import { useScanTaskPoll } from "@/hooks/use-scan-task-poll";
import { dedupeInflight } from "@/lib/inflight";
import { getScanTaskStatus, isScanTaskDone } from "@/lib/zalo-contacts-utils";
import { toast } from "@/lib/toast";
import { zaloGroupService } from "@/services/zalo-group.service";
import type { ZaloGroupMember } from "@/types/zalo-contacts";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

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

/** Quản lý member group; operation epoch chặn GET/poll cũ ghi đè state mới. */
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
  const activeScopeRef = useRef<string | null>(null);
  const refreshScopeRef = useRef<string | null>(null);
  const loadEpochRef = useRef(0);
  const refreshEpochRef = useRef<number | null>(null);
  const scopeKey =
    enabled && accountId && groupId ? `${accountId}:${groupId}` : null;

  useLayoutEffect(() => {
    activeScopeRef.current = scopeKey;
    activeGroupIdRef.current = scopeKey ? groupId : null;
    loadEpochRef.current += 1;
    refreshScopeRef.current = null;
    refreshEpochRef.current = null;
  }, [groupId, scopeKey]);

  const loadMembers = useCallback(async (
    targetGroupId: number,
    targetScope: string,
    targetEpoch: number,
  ) => {
    const isCurrentOperation = () =>
      activeScopeRef.current === targetScope &&
      loadEpochRef.current === targetEpoch;
    const cached = membersCache.get(targetGroupId);
    if (cached) {
      if (isCurrentOperation()) {
        setMembers(cached);
        setIsLoading(false);
      }
      return;
    }

    abortMembersExcept(targetGroupId);
    membersAbort.get(targetGroupId)?.abort();
    const controller = new AbortController();
    membersAbort.set(targetGroupId, controller);

    if (isCurrentOperation()) {
      setIsLoading(true);
    }

    try {
      const data = await dedupeInflight(
        `group:showMembers:${targetGroupId}:${targetEpoch}`,
        () =>
          zaloGroupService.showMembers(targetGroupId, {
            signal: controller.signal,
          }),
      );
      if (controller.signal.aborted || !isCurrentOperation()) return;
      membersCache.set(targetGroupId, data);
      setMembers(data);
    } catch {
      if (controller.signal.aborted) return;
      if (!isCurrentOperation()) return;
      setMembers([]);
      toast.error("Không tải được danh sách thành viên nhóm.");
    } finally {
      if (membersAbort.get(targetGroupId) === controller) {
        membersAbort.delete(targetGroupId);
      }
      if (isCurrentOperation()) {
        setIsLoading(false);
      }
    }
  }, []);

  const refreshMembers = useCallback(async () => {
    const targetScope = scopeKey;
    if (
      !accountId ||
      !groupId ||
      !targetScope ||
      refreshEpochRef.current !== null
    ) {
      return;
    }
    const refreshEpoch = ++loadEpochRef.current;
    membersAbort.get(groupId)?.abort();
    refreshScopeRef.current = targetScope;
    refreshEpochRef.current = refreshEpoch;
    setIsLoading(false);
    setIsRefreshing(true);
    try {
      const id = await zaloGroupService.startGetMembers(accountId, groupId);
      if (
        activeScopeRef.current !== targetScope ||
        loadEpochRef.current !== refreshEpoch
      ) {
        return;
      }
      if (!id) {
        setIsRefreshing(false);
        refreshScopeRef.current = null;
        refreshEpochRef.current = null;
        toast.error("Không nhận được mã tác vụ làm mới thành viên.");
        return;
      }
      setTaskId(id);
    } catch {
      if (
        activeScopeRef.current !== targetScope ||
        loadEpochRef.current !== refreshEpoch
      ) {
        return;
      }
      setIsRefreshing(false);
      refreshScopeRef.current = null;
      refreshEpochRef.current = null;
      toast.error("Không gửi được yêu cầu làm mới thành viên nhóm.");
    }
  }, [accountId, groupId, scopeKey]);

  useScanTaskPoll({
    taskId: isRefreshing ? taskId : null,
    poll: zaloGroupService.pollGetMembersResult,
    onResult: (result) => {
      const refreshScope = refreshScopeRef.current;
      const refreshEpoch = refreshEpochRef.current;
      if (
        !refreshScope ||
        refreshEpoch == null ||
        activeScopeRef.current !== refreshScope ||
        loadEpochRef.current !== refreshEpoch
      ) {
        return;
      }
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
        refreshScopeRef.current = null;
        refreshEpochRef.current = null;
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
        refreshScopeRef.current = null;
        refreshEpochRef.current = null;
        toast.error(result.message || "Làm mới thành viên nhóm thất bại.");
      }
    },
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (activeScopeRef.current !== scopeKey) return;
      setTaskId(null);
      setIsRefreshing(false);
      refreshScopeRef.current = null;
      refreshEpochRef.current = null;
      if (!scopeKey || !groupId) {
        abortMembersExcept(null);
        setMembers([]);
        setIsLoading(false);
        return;
      }

      const cached = membersCache.get(groupId);
      if (cached) {
        setMembers(cached);
        setIsLoading(false);
        return;
      }

      setMembers([]);
      const loadEpoch = ++loadEpochRef.current;
      void loadMembers(groupId, scopeKey, loadEpoch);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [groupId, loadMembers, scopeKey]);

  return {
    members,
    isLoading,
    isRefreshing,
    refreshMembers,
    reloadMembers: () => {
      if (!groupId || !scopeKey) return;
      const loadEpoch = ++loadEpochRef.current;
      refreshScopeRef.current = null;
      refreshEpochRef.current = null;
      setTaskId(null);
      setIsRefreshing(false);
      membersCache.delete(groupId);
      void loadMembers(groupId, scopeKey, loadEpoch);
    },
  };
}
