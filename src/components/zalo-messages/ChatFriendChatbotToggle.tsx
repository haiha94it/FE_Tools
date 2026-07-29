"use client";

import Switch from "@/components/form/switch/Switch";
import { Tooltip } from "@/components/ui/tooltip/Tooltip";
import { getApiErrorMessage } from "@/lib/errors";
import { isZaloChatbotEnabled } from "@/lib/zalo-account-utils";
import { resolveChatFriendUid } from "@/lib/zalo-messenger-friend-utils";
import { toast } from "@/lib/toast";
import { zaloAccountService } from "@/services/zalo-account.service";
import { useZaloAccountStore } from "@/stores/use-zalo-account-store";
import { useZaloMessengerStore } from "@/stores/use-zalo-messenger-store";
import type { MessengerConversation } from "@/types/zalo-messenger";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { FiClock, FiCpu } from "react-icons/fi";

interface ChatFriendChatbotToggleProps {
  accountId: number;
  conversation: MessengerConversation;
}

/**
 * Header chat 1-1: bật/tắt auto-reply chatbot cho đúng bạn đang mở.
 * ON = chatbot trả lời · OFF = UID trong chatbot_disabled_friend_uids.
 */
function ChatFriendChatbotToggle({
  accountId,
  conversation,
}: ChatFriendChatbotToggleProps) {
  const account = useZaloMessengerStore((s) =>
    s.accounts.find((item) => item.id === accountId),
  );
  const setMessengerDisabledUids = useZaloMessengerStore(
    (s) => s.setAccountChatbotDisabledUids,
  );

  const [pending, setPending] = useState(false);
  const [reminderPending, setReminderPending] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [chatbotEnabledByUid, setChatbotEnabledByUid] = useState<
    Record<string, boolean>
  >({});

  const friendUid = resolveChatFriendUid(conversation.friend);
  const accountChatbotOn = isZaloChatbotEnabled({
    is_chatbot: account?.is_chatbot,
  });

  const disabledUidSet = useMemo(() => {
    const list = account?.chatbot_disabled_friend_uids ?? [];
    return new Set(list.map(String));
  }, [account?.chatbot_disabled_friend_uids]);

  // Friend API là SSOT; list account chỉ làm fallback trước khi request hoàn tất.
  const botEnabledForFriend =
    Boolean(friendUid) &&
    (chatbotEnabledByUid[friendUid] ?? !disabledUidSet.has(friendUid));

  const handleToggle = useCallback(
    async (enabled: boolean) => {
      if (!friendUid || pending || !accountChatbotOn) return;
      setPending(true);
      try {
        const action = enabled ? "remove" : "add";
        const data = await zaloAccountService.patchChatbotDisabledFriends(
          accountId,
          action,
          [friendUid],
        );
        const nextUids = data.chatbot_disabled_friend_uids ?? [];
        setChatbotEnabledByUid((current) => ({
          ...current,
          [friendUid]: !new Set(nextUids).has(friendUid),
        }));
        setMessengerDisabledUids(accountId, nextUids);
        // Sync /zalo-accounts store nếu đã load
        useZaloAccountStore.setState((state) => ({
          accounts: state.accounts.map((acc) =>
            acc.id === accountId
              ? { ...acc, chatbot_disabled_friend_uids: nextUids }
              : acc,
          ),
        }));
        toast.success(
          enabled
            ? "Đã bật chatbot cho khách hàng này."
            : "Đã tắt chatbot cho khách hàng này. Bạn có thể tiếp tục tư vấn thủ công.",
        );
      } catch (error) {
        toast.error(getApiErrorMessage(error));
      } finally {
        setPending(false);
      }
    },
    [accountChatbotOn, accountId, friendUid, pending, setMessengerDisabledUids],
  );

  useEffect(() => {
    if (!friendUid || !accountChatbotOn) return;
    let cancelled = false;
    void zaloAccountService
      .getChatbotDisabledFriends(accountId, {
        uid: friendUid,
      })
      .then((page) => {
        if (cancelled) return;
        const friend = page.results[0];
        setChatbotEnabledByUid((current) => ({
          ...current,
          [friendUid]: friend ? !friend.is_chatbot_disabled : true,
        }));
        setReminderEnabled(friend ? !friend.is_reminder_paused : true);
      })
      .catch((error) => {
        if (!cancelled) toast.error(getApiErrorMessage(error));
      })
    return () => {
      cancelled = true;
    };
  }, [accountChatbotOn, accountId, friendUid]);

  const handleReminderToggle = useCallback(
    async (enabled: boolean) => {
      if (!friendUid || reminderPending || !accountChatbotOn) return;
      setReminderPending(true);
      try {
        const data = await zaloAccountService.patchChatbotDisabledFriends(
          accountId,
          enabled ? "resume_reminder" : "pause_reminder",
          [friendUid],
        );
        setReminderEnabled(
          !new Set(data.reminder_paused_friend_uids ?? []).has(friendUid),
        );
        toast.success(
          enabled
            ? "Đã bật chức năng nhắc nhở cho khách hàng này."
            : "Đã dừng chức năng nhắc nhở cho khách hàng này.",
        );
      } catch (error) {
        toast.error(getApiErrorMessage(error));
      } finally {
        setReminderPending(false);
      }
    },
    [accountChatbotOn, accountId, friendUid, reminderPending],
  );

  if (!friendUid || !accountChatbotOn) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.5">
      <Tooltip
        content={
          botEnabledForFriend
            ? "Chatbot đang bật cho khách hàng này — bấm để tắt"
            : "Chatbot đang tắt cho khách hàng này — bấm để bật"
        }
        side="bottom"
      >
        <div className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50/80 px-2 dark:border-brand-500/30 dark:bg-brand-500/10">
          <FiCpu size={14} className="text-brand-600 dark:text-brand-400" aria-hidden />
          <span className="hidden text-[11px] font-medium text-gray-700 sm:inline dark:text-white">
            Bot
          </span>
          <Switch
            checked={botEnabledForFriend}
            disabled={pending}
            ariaLabel="Bật hoặc tắt chatbot cho bạn đang mở"
            onChange={(checked) => void handleToggle(checked)}
          />
        </div>
      </Tooltip>
      <Tooltip
        content={
          reminderEnabled
            ? "Chức năng nhắc nhở đang bật — bấm để dừng"
            : "Chức năng nhắc nhở đang dừng — bấm để bật lại"
        }
        side="bottom"
      >
        <div className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50/80 px-2 dark:border-violet-500/30 dark:bg-violet-500/10">
          <FiClock size={14} className="text-violet-600 dark:text-violet-400" aria-hidden />
          <span className="hidden text-[11px] font-medium text-gray-700 sm:inline dark:text-white">
            Nhắc nhở
          </span>
          <Switch
            checked={reminderEnabled}
            disabled={reminderPending}
            ariaLabel="Bật hoặc tắt chức năng nhắc nhở cho khách hàng đang mở"
            onChange={(checked) => void handleReminderToggle(checked)}
          />
        </div>
      </Tooltip>
    </div>
  );
}

export default memo(ChatFriendChatbotToggle);
