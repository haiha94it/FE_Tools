"use client";

import ContactAvatar from "@/components/zalo-contacts/shared/ContactAvatar";
import {
  getConversationAvatar,
  getConversationTitle,
} from "@/lib/zalo-messenger-utils";
import type {
  DisplayMessage,
  MessengerConversation,
} from "@/types/zalo-messenger";
import { useMemo, useState } from "react";

interface MessageShareDialogProps {
  open: boolean;
  message: DisplayMessage | null;
  conversations: MessengerConversation[];
  activeConversationId?: number | null;
  loading?: boolean;
  onClose: () => void;
  onShare: (
    targets: MessengerConversation[],
    accompanyText: string,
  ) => void | Promise<void>;
}

export default function MessageShareDialog({
  open,
  message,
  conversations,
  activeConversationId = null,
  loading = false,
  onClose,
  onShare,
}: MessageShareDialogProps) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [accompanyText, setAccompanyText] = useState("");
  const [sharing, setSharing] = useState(false);

  const options = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return conversations
      .filter((item) => item.id !== activeConversationId)
      .filter((item) => {
        if (!keyword) return true;
        return getConversationTitle(item).toLowerCase().includes(keyword);
      });
  }, [activeConversationId, conversations, search]);

  if (!open || !message) return null;

  const toggle = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleShare = async () => {
    const targets = conversations.filter((item) =>
      selectedIds.includes(item.id),
    );
    if (!targets.length) return;
    setSharing(true);
    try {
      await onShare(targets, accompanyText.trim());
      setSelectedIds([]);
      setAccompanyText("");
      setSearch("");
      onClose();
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
            placeholder="Tìm hội thoại..."
            className="h-9 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm outline-none focus:border-brand-300 dark:border-gray-700 dark:bg-gray-800"
          />
          <input
            value={accompanyText}
            onChange={(e) => setAccompanyText(e.target.value)}
            placeholder="Kèm tin nhắn (tuỳ chọn)"
            className="h-9 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm outline-none focus:border-brand-300 dark:border-gray-700 dark:bg-gray-800"
          />
        </div>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            </div>
          ) : options.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              Không có hội thoại để chia sẻ
            </p>
          ) : (
            <ul className="space-y-1">
              {options.map((item) => {
                const checked = selectedIds.includes(item.id);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => toggle(item.id)}
                      className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition ${
                        checked
                          ? "bg-brand-50 dark:bg-brand-500/10"
                          : "hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                      }`}
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                          checked
                            ? "border-brand-500 bg-brand-500 text-white"
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                      >
                        {checked ? "✓" : ""}
                      </span>
                      <ContactAvatar
                        name={getConversationTitle(item)}
                        avatar={getConversationAvatar(item)}
                        size="sm"
                      />
                      <span className="min-w-0 truncate text-sm text-gray-800 dark:text-white/90">
                        {getConversationTitle(item)}
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
            disabled={sharing || selectedIds.length === 0}
            onClick={() => void handleShare()}
            className="w-full rounded-xl bg-brand-500 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {sharing ? "Đang chia sẻ..." : `Chia sẻ (${selectedIds.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}