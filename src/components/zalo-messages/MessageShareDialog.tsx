"use client";

import ContactAvatar from "@/components/zalo-contacts/shared/ContactAvatar";
import {
  getZaloFriendDisplayName,
  getZaloGroupAvatar,
  getZaloGroupDisplayName,
} from "@/lib/zalo-contacts-utils";
import {
  getConversationAvatar,
  getConversationTitle,
} from "@/lib/zalo-messenger-utils";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { zaloFriendService } from "@/services/zalo-friend.service";
import { zaloGroupService } from "@/services/zalo-group.service";
import { zaloMessengerService } from "@/services/zalo-messenger.service";
import type {
  DisplayMessage,
  MessengerConversation,
} from "@/types/zalo-messenger";
import type { ZaloFriendItem, ZaloGroupItem } from "@/types/zalo-contacts";
import { useEffect, useMemo, useState } from "react";

type ShareTarget =
  | { key: string; kind: "recent"; item: MessengerConversation }
  | { key: string; kind: "friend"; item: ZaloFriendItem }
  | { key: string; kind: "group"; item: ZaloGroupItem };

type ShareFilter = "recent" | "friend" | "group";

interface MessageShareDialogProps {
  open: boolean;
  message: DisplayMessage | null;
  accountId: number | null;
  conversations: MessengerConversation[];
  activeConversationId?: number | null;
  onClose: () => void;
  onShare: (
    targets: MessengerConversation[],
    accompanyText: string,
  ) => void | Promise<void>;
}

export default function MessageShareDialog({
  open,
  message,
  accountId,
  conversations,
  activeConversationId = null,
  onClose,
  onShare,
}: MessageShareDialogProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ShareFilter>("recent");
  const [contacts, setContacts] = useState<ShareTarget[]>([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [accompanyText, setAccompanyText] = useState("");
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (!open || !accountId) return;
    let cancelled = false;
    void Promise.all([
      zaloFriendService.list({ accountId, pageSize: 500 }),
      zaloGroupService.list({ accountId, pageSize: 500 }),
    ])
      .then(async ([friendPage, groupPage]) => {
        const [friends, groups] = await Promise.all([
          zaloFriendService.fetchDetails(friendPage.results ?? []),
          zaloGroupService.fetchDetails(groupPage.results ?? []),
        ]);
        if (cancelled) return;
        setContacts([
          ...friends.map((item) => ({
            key: `friend:${item.id}`,
            kind: "friend" as const,
            item,
          })),
          ...groups.map((item) => ({
            key: `group:${item.id}`,
            kind: "group" as const,
            item,
          })),
        ]);
      })
      .catch((error) => {
        if (!cancelled) toast.error(getApiErrorMessage(error));
      })
      .finally(() => {
        if (!cancelled) setContactsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accountId, open]);

  const allTargets = useMemo<ShareTarget[]>(() => {
    const recent: ShareTarget[] = conversations
      .filter((item) => item.id !== activeConversationId)
      .map((item) => ({
        key: `recent:${item.id}`,
        kind: "recent" as const,
        item,
      }));
    return [...recent, ...contacts];
  }, [activeConversationId, contacts, conversations]);

  const options = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return allTargets
      .filter((item) => item.kind === filter)
      .filter((item) => {
        if (!keyword) return true;
        const name =
          item.kind === "recent"
            ? getConversationTitle(item.item)
            : item.kind === "friend"
              ? getZaloFriendDisplayName(item.item)
              : getZaloGroupDisplayName(item.item);
        return name.toLowerCase().includes(keyword);
      });
  }, [allTargets, filter, search]);

  if (!open || !message) return null;

  const toggle = (key: string) => {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key],
    );
  };

  /** Mở hội thoại cho từng liên hệ đã chọn rồi chuyển tiếp tin nhắn. */
  const handleShare = async () => {
    if (!accountId) return;
    const selectedContacts = allTargets.filter((item) =>
      selectedKeys.includes(item.key),
    );
    if (!selectedContacts.length) return;
    setSharing(true);
    try {
      const resolvedTargets = await Promise.all(
        selectedContacts.map((target) => {
          if (target.kind === "recent") return target.item;
          return zaloMessengerService.openConversation({
            id_account: accountId,
            ...(target.kind === "friend"
              ? { id_friend: target.item.id }
              : { id_group: target.item.id }),
          });
        }),
      );
      const targets = Array.from(
        new Map(resolvedTargets.map((target) => [target.id, target])).values(),
      );
      await onShare(targets, accompanyText.trim());
      setSelectedKeys([]);
      setAccompanyText("");
      setSearch("");
      setFilter("recent");
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1300] flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="flex max-h-[min(80vh,560px)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Chia sẻ tin nhắn
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm bạn bè hoặc nhóm..."
            className="h-9 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm outline-none focus:border-brand-300 dark:border-gray-700 dark:bg-gray-800"
          />
          <div className="flex gap-2">
            {(["recent", "friend", "group"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  filter === value
                    ? "bg-brand-500 text-white"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                }`}
              >
                {value === "recent" ? "Gợi ý" : value === "friend" ? "Bạn bè" : "Nhóm"}
              </button>
            ))}
          </div>
          <input
            value={accompanyText}
            onChange={(e) => setAccompanyText(e.target.value)}
            placeholder="Kèm tin nhắn (tuỳ chọn)"
            className="h-9 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm outline-none focus:border-brand-300 dark:border-gray-700 dark:bg-gray-800"
          />
        </div>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-2">
          {contactsLoading && filter !== "recent" ? (
            <div className="flex justify-center py-10">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            </div>
          ) : options.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              Không có dữ liệu phù hợp
            </p>
          ) : (
            <ul className="space-y-1">
              {options.map((item) => {
                          const checked = selectedKeys.includes(item.key);
                          const name =
                            item.kind === "recent"
                              ? getConversationTitle(item.item)
                              : item.kind === "friend"
                                ? getZaloFriendDisplayName(item.item)
                                : getZaloGroupDisplayName(item.item);
                          const avatar =
                            item.kind === "recent"
                              ? getConversationAvatar(item.item)
                              : getZaloGroupAvatar(item.item);
                          const detail =
                            item.kind === "recent"
                              ? "Hội thoại gần đây"
                              : item.kind === "friend"
                                ? item.item.uid || "Bạn bè Zalo"
                                : typeof item.item.total_member === "number"
                                  ? `${item.item.total_member} thành viên`
                                  : "Nhóm Zalo";
                          return (
                            <li key={item.key}>
                              <button
                                type="button"
                                onClick={() => toggle(item.key)}
                                className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition ${
                                  checked
                                    ? "bg-brand-50 dark:bg-brand-500/10"
                                    : "hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                                }`}
                              >
                                <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${checked ? "border-brand-500 bg-brand-500 text-white" : "border-gray-300 dark:border-gray-600"}`}>
                                  {checked ? "✓" : ""}
                                </span>
                                <ContactAvatar name={name} avatar={avatar} size="sm" />
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-sm text-gray-800 dark:text-white/90">{name}</span>
                                  <span className="block truncate text-xs text-gray-400">{detail}</span>
                                </span>
                              </button>
                            </li>
                          );
              })}
            </ul>
          )}
        </div>

        <div className="border-t border-gray-100 px-4 py-3 dark:border-gray-800">
          <button
            type="button"
            disabled={sharing || selectedKeys.length === 0}
            onClick={() => void handleShare()}
            className="w-full rounded-xl bg-brand-500 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {sharing ? "Đang chia sẻ..." : `Chia sẻ (${selectedKeys.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}
