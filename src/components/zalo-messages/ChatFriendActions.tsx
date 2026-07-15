"use client";

import AddFriendMessageDialog from "./AddFriendMessageDialog";
import { useScanTaskPoll } from "@/hooks/use-scan-task-poll";
import {
  getScanTaskStatus,
  isScanTaskDone,
} from "@/lib/zalo-contacts-utils";
import {
  canShowChatFriendActions,
  resolveChatFriendAction,
  resolveChatFriendUid,
} from "@/lib/zalo-messenger-friend-utils";
import { getConversationTitle } from "@/lib/zalo-messenger-utils";
import { toast } from "@/lib/toast";
import { zaloFriendService } from "@/services/zalo-friend.service";
import type { MessengerConversation } from "@/types/zalo-messenger";
import type { ScanTaskResponse } from "@/types/zalo-contacts";
import { memo, useCallback, useEffect, useRef, useState } from "react";

interface ChatFriendActionsProps {
  accountId: number;
  conversation: MessengerConversation;
  onStatusChanged?: () => void | Promise<void>;
}

const actionBtnBase =
  "inline-flex h-8 shrink-0 items-center justify-center rounded-lg px-2.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50";

function ChatFriendActions({
  accountId,
  conversation,
  onStatusChanged,
}: ChatFriendActionsProps) {
  const friend = conversation.friend;
  const actionState = resolveChatFriendAction(friend);
  const friendUid = resolveChatFriendUid(friend);

  const [busy, setBusy] = useState(false);
  const [addFriendOpen, setAddFriendOpen] = useState(false);
  const [pendingTask, setPendingTask] = useState<{
    poll: (taskId: string | number) => Promise<ScanTaskResponse>;
    successMessage: string;
    errorMessage: string;
  } | null>(null);
  const [taskId, setTaskId] = useState<string | number | null>(null);
  const pendingTaskRef = useRef(pendingTask);

  useEffect(() => {
    pendingTaskRef.current = pendingTask;
  }, [pendingTask]);

  const refreshStatus = useCallback(async () => {
    await onStatusChanged?.();
    window.setTimeout(() => {
      void onStatusChanged?.();
    }, 2500);
  }, [onStatusChanged]);

  const handleTaskResult = useCallback(
    (result: ScanTaskResponse) => {
      const status = getScanTaskStatus(result);
      if (!isScanTaskDone(status)) return;

      const task = pendingTaskRef.current;
      setBusy(false);
      setTaskId(null);
      setPendingTask(null);

      if (status === "SUCCESS") {
        toast.success(task?.successMessage ?? "Thành công.");
        void refreshStatus();
        return;
      }

      toast.error(
        result.message ||
          result.error ||
          task?.errorMessage ||
          "Thao tác thất bại.",
      );
    },
    [refreshStatus],
  );

  useScanTaskPoll({
    taskId,
    poll: (id) => {
      const task = pendingTaskRef.current;
      if (!task) return Promise.resolve({});
      return task.poll(id);
    },
    onResult: handleTaskResult,
  });

  const startTask = async (
    startFn: () => Promise<string | number | null>,
    pollFn: (taskId: string | number) => Promise<ScanTaskResponse>,
    messages: { pending: string; success: string; error: string },
  ) => {
    if (busy || !friendUid) return;
    setBusy(true);
    try {
      const id = await startFn();
      if (!id) {
        setBusy(false);
        toast.error("Không nhận được mã tác vụ.");
        return;
      }
      setPendingTask({
        poll: pollFn,
        successMessage: messages.success,
        errorMessage: messages.error,
      });
      setTaskId(id);
      toast.info(messages.pending);
    } catch {
      setBusy(false);
      toast.error(messages.error);
    }
  };

  if (!canShowChatFriendActions(friend) || !actionState || !friendUid) {
    return null;
  }

  const friendName = getConversationTitle(conversation);

  const handleAccept = () => {
    void startTask(
      () => zaloFriendService.startAcceptFriendRequest(accountId, friendUid),
      (id) => zaloFriendService.pollAcceptFriendRequest(id),
      {
        pending: "Đang chấp nhận kết bạn...",
        success: "Đã chấp nhận kết bạn.",
        error: "Không chấp nhận được lời mời.",
      },
    );
  };

  const handleReject = () => {
    void startTask(
      () => zaloFriendService.startRejectFriendRequest(accountId, friendUid),
      (id) => zaloFriendService.pollRejectFriendRequest(id),
      {
        pending: "Đang từ chối lời mời...",
        success: "Đã từ chối lời mời kết bạn.",
        error: "Không từ chối được lời mời.",
      },
    );
  };

  const handleAddFriend = (message: string) => {
    setAddFriendOpen(false);
    void startTask(
      () => zaloFriendService.startAddFriend(accountId, [friendUid], message),
      (id) => zaloFriendService.pollAddFriend(id),
      {
        pending: "Đang gửi lời mời kết bạn...",
        success: "Đã gửi lời mời kết bạn.",
        error: "Không gửi được lời mời kết bạn.",
      },
    );
  };

  const handleRecall = () => {
    void startTask(
      () => zaloFriendService.startRecallSentRequest(accountId, [friendUid]),
      (id) => zaloFriendService.pollRecallSentRequest(id),
      {
        pending: "Đang thu hồi lời mời...",
        success: "Đã thu hồi lời mời kết bạn.",
        error: "Không thu hồi được lời mời.",
      },
    );
  };

  const handleUnfriend = () => {
    if (!window.confirm(`Huỷ kết bạn với ${friendName}?`)) return;
    void startTask(
      () => zaloFriendService.startUnfriend(accountId, [friendUid]),
      (id) => zaloFriendService.pollUnfriend(id),
      {
        pending: "Đang huỷ kết bạn...",
        success: "Đã huỷ kết bạn.",
        error: "Không huỷ được kết bạn.",
      },
    );
  };

  if (busy) {
    return (
      <span className="inline-flex h-8 shrink-0 items-center gap-1.5 text-xs font-medium text-brand-600 dark:text-brand-400">
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        Đang xử lý...
      </span>
    );
  }

  if (actionState.kind === "incoming_request") {
    return (
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={handleReject}
          className={`${actionBtnBase} border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-white/[0.04]`}
        >
          Từ chối
        </button>
        <button
          type="button"
          onClick={handleAccept}
          className={`${actionBtnBase} bg-brand-500 text-white hover:bg-brand-600`}
        >
          Đồng ý
        </button>
      </div>
    );
  }

  if (actionState.kind === "add_friend") {
    return (
      <>
        <button
          type="button"
          onClick={() => setAddFriendOpen(true)}
          className={`${actionBtnBase} bg-brand-500 text-white hover:bg-brand-600`}
        >
          Kết bạn
        </button>
        <AddFriendMessageDialog
          open={addFriendOpen}
          friendName={friendName}
          onClose={() => setAddFriendOpen(false)}
          onSubmit={handleAddFriend}
        />
      </>
    );
  }

  if (actionState.kind === "recall_request") {
    return (
      <button
        type="button"
        onClick={handleRecall}
        className={`${actionBtnBase} border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-white/[0.04]`}
      >
        Thu hồi lời mời
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleUnfriend}
      className={`${actionBtnBase} border border-error-200 bg-error-50 text-error-600 hover:bg-error-100 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400`}
    >
      Huỷ kết bạn
    </button>
  );
}

export default memo(ChatFriendActions);