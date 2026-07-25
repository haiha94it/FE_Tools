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
import { memo, useCallback, useMemo, useState } from "react";
import { FiCpu } from "react-icons/fi";

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

  const friendUid = resolveChatFriendUid(conversation.friend);
  const accountChatbotOn = isZaloChatbotEnabled({
    is_chatbot: account?.is_chatbot,
  });

  const disabledUidSet = useMemo(() => {
    const list = account?.chatbot_disabled_friend_uids ?? [];
    return new Set(list.map(String));
  }, [account?.chatbot_disabled_friend_uids]);

  // Switch ON = bot được phép trả lời bạn này
  const botEnabledForFriend =
    Boolean(friendUid) && !disabledUidSet.has(friendUid);

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
            ? "Đã bật chatbot cho bạn này."
            : "Đã tắt chatbot — chat thủ công.",
        );
      } catch (error) {
        toast.error(getApiErrorMessage(error));
      } finally {
        setPending(false);
      }
    },
    [accountChatbotOn, accountId, friendUid, pending, setMessengerDisabledUids],
  );

  if (!friendUid || !accountChatbotOn) {
    return null;
  }

  return (
    <Tooltip
      content={
        botEnabledForFriend
          ? "Chatbot đang bật cho bạn này — bấm để tắt (chat thủ công)"
          : "Chatbot đang tắt cho bạn này — bấm để bật auto-reply"
      }
      side="bottom"
    >
      <div
        className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border px-2 transition ${
          botEnabledForFriend
            ? "border-brand-200 bg-brand-50/80 dark:border-brand-500/30 dark:bg-brand-500/10"
            : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
        }`}
      >
        <FiCpu
          size={14}
          className={
            botEnabledForFriend
              ? "text-brand-600 dark:text-brand-400"
              : "text-gray-400"
          }
          aria-hidden
        />
        <span className="hidden text-[11px] font-medium text-gray-600 sm:inline dark:text-gray-300">
          Bot
        </span>
        <Switch
          key={`chat-bot-${accountId}-${friendUid}-${botEnabledForFriend}`}
          checked={botEnabledForFriend}
          disabled={pending}
          onChange={(checked) => {
            void handleToggle(checked);
          }}
        />
      </div>
    </Tooltip>
  );
}

export default memo(ChatFriendChatbotToggle);
