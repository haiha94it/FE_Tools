"use client";

import ContactAvatar from "@/components/zalo-contacts/shared/ContactAvatar";
import { useStableHandler } from "@/hooks/use-stable-handler";
import {
  getAssignedLabelIds,
  resolveConversationLabels,
  resolveZaloLabelColor,
} from "@/lib/zalo-label-utils";
import {
  formatConversationTime,
  getConversationAvatar,
  getConversationTitle,
} from "@/lib/zalo-messenger-utils";
import type {
  MessengerCategoryLabel,
  MessengerConversation,
  MessengerConversationFilter,
} from "@/types/zalo-messenger";
import { memo, useEffect, useRef, useState } from "react";
import ConversationContextMenu from "./ConversationContextMenu";
import InboxToolbar from "./InboxToolbar";

const FILTERS: { id: MessengerConversationFilter; label: string }[] = [
  { id: "all", label: "Tất cả" },
  { id: "unread", label: "Chưa đọc" },
  { id: "friend", label: "Bạn bè" },
  { id: "group", label: "Nhóm" },
];

interface ConversationPanelProps {
  accountId: number | null;
  conversations: MessengerConversation[];
  selectedId: number | null;
  search: string;
  filter: MessengerConversationFilter;
  labelCategories: MessengerCategoryLabel[];
  labelCategoriesLoading: boolean;
  selectedCategoryId: number | null;
  loading?: boolean;
  loadingMore?: boolean;
  hasMore?: boolean;
  onSearchSubmit: (value: string) => void;
  onFilterChange: (value: MessengerConversationFilter) => void;
  onApplyInboxFilter: (
    filter: MessengerConversationFilter,
    categoryId: number | null,
  ) => void;
  onMarkAllRead: () => void;
  onOpenSendPhone: () => void;
  onOpenCreateGroup: () => void;
  onOpenManageLabels?: () => void;
  onSelect: (conversation: MessengerConversation) => void;
  onLoadMore: () => void;
  onPin?: (conversation: MessengerConversation) => void;
  onOpenNote?: (conversation: MessengerConversation) => void;
  onToggleLabel?: (
    conversation: MessengerConversation,
    category: MessengerCategoryLabel,
    assigned: boolean,
  ) => void;
}

function ConversationPanel({
  accountId,
  conversations,
  selectedId,
  search,
  filter,
  labelCategories,
  labelCategoriesLoading,
  selectedCategoryId,
  loading = false,
  loadingMore = false,
  hasMore = false,
  onSearchSubmit,
  onFilterChange,
  onApplyInboxFilter,
  onMarkAllRead,
  onOpenSendPhone,
  onOpenCreateGroup,
  onOpenManageLabels,
  onSelect,
  onLoadMore,
  onPin,
  onOpenNote,
  onToggleLabel,
}: ConversationPanelProps) {
  const [localSearch, setLocalSearch] = useState(search);
  const [contextMenu, setContextMenu] = useState<{
    conversation: MessengerConversation;
    x: number;
    y: number;
  } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useStableHandler(onLoadMore);
  const searchSubmitRef = useStableHandler(onSearchSubmit);

  const activeCategoryLabel = selectedCategoryId
    ? (labelCategories.find((item) => item.id === selectedCategoryId)?.name ??
      `Nhãn #${selectedCategoryId}`)
    : null;

  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  useEffect(() => {
    if (!accountId) return undefined;
    if (localSearch === search) return undefined;

    const timer = window.setTimeout(() => {
      searchSubmitRef(localSearch);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [accountId, localSearch, search, searchSubmitRef]);

  useEffect(() => {
    const node = listRef.current;
    if (!node) return undefined;

    const handleScroll = () => {
      setContextMenu(null);
      if (!hasMore || loadingMore || loading) return;
      const nearBottom =
        node.scrollTop + node.clientHeight + 120 >= node.scrollHeight;
      if (nearBottom) loadMoreRef();
    };

    node.addEventListener("scroll", handleScroll, { passive: true });
    return () => node.removeEventListener("scroll", handleScroll);
  }, [hasMore, loadingMore, loading, loadMoreRef]);

  const handleContextMenu = (
    event: React.MouseEvent,
    conversation: MessengerConversation,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      conversation,
      x: event.clientX,
      y: event.clientY,
    });
  };

  if (!accountId) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-gray-500 dark:text-gray-400">
        Chọn tài khoản để xem hội thoại
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 space-y-2 border-b border-gray-100 p-3 dark:border-gray-800">
        <InboxToolbar
          accountId={accountId}
          conversationFilter={filter}
          selectedCategoryId={selectedCategoryId}
          labelCategories={labelCategories}
          labelCategoriesLoading={labelCategoriesLoading}
          onApplyFilter={onApplyInboxFilter}
          onMarkAllRead={onMarkAllRead}
          onOpenSendPhone={onOpenSendPhone}
          onOpenCreateGroup={onOpenCreateGroup}
          onOpenManageLabels={onOpenManageLabels}
        />

        <div className="relative">
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-400">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </span>
          <input
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Tìm hội thoại..."
            className="h-9 w-full rounded-xl border border-gray-200 bg-gray-50 pr-3 pl-9 text-sm text-gray-800 outline-none transition focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-500/15 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          />
        </div>

        {activeCategoryLabel ? (
          <p className="truncate text-[11px] font-medium text-brand-600 dark:text-brand-400">
            Đang lọc: {activeCategoryLabel}
          </p>
        ) : null}

        <div className="no-scrollbar flex gap-1 overflow-x-auto overscroll-x-contain pb-0.5">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onFilterChange(item.id)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition ${
                filter === item.id
                  ? "bg-brand-500 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={listRef}
        className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        {loading && conversations.length > 0 ? (
          <div className="flex justify-center py-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          </div>
        ) : null}

        {loading && conversations.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          </div>
        ) : conversations.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            Không có hội thoại phù hợp
          </p>
        ) : (
          <ul>
            {conversations.map((conversation) => {
              const active = selectedId === conversation.id;
              const title = getConversationTitle(conversation);
              const avatar = getConversationAvatar(conversation);
              const labels = resolveConversationLabels(
                conversation,
                labelCategories,
              );

              return (
                <li key={conversation.id} className="messenger-list-item">
                  <div
                    onContextMenu={(event) =>
                      handleContextMenu(event, conversation)
                    }
                    className={`relative flex w-full items-center gap-3 border-b border-gray-50 px-3 py-3 transition dark:border-gray-800/60 ${
                      active
                        ? "bg-brand-50/70 dark:bg-brand-500/[0.07]"
                        : "hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onSelect(conversation)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <div className="relative shrink-0">
                        <ContactAvatar name={title} avatar={avatar} size="md" />
                        {conversation.new_message ? (
                          <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#0068ff] ring-2 ring-white dark:ring-gray-900" />
                        ) : null}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`truncate text-sm font-medium ${
                              conversation.new_message
                                ? "text-gray-900 dark:text-white"
                                : "text-gray-700 dark:text-white/85"
                            }`}
                          >
                            {title}
                            {conversation.pinning ? " 📌" : ""}
                          </span>
                          <span className="shrink-0 text-[11px] text-gray-400">
                            {formatConversationTime(conversation)}
                          </span>
                        </div>
                        {labels.length > 0 ? (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {labels.map((label) => (
                              <span
                                key={`${conversation.id}-${label.id}`}
                                className="rounded-md px-1.5 py-0.5 text-[10px] font-medium text-white"
                                style={{
                                  backgroundColor: resolveZaloLabelColor(
                                    label.color,
                                  ),
                                }}
                              >
                                {label.name || `Nhãn #${label.id}`}
                              </span>
                            ))}
                          </div>
                        ) : null}
                        {conversation.note ? (
                          <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                            {conversation.note}
                          </p>
                        ) : null}
                      </div>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {loadingMore ? (
          <div className="flex justify-center py-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          </div>
        ) : null}
      </div>

      <ConversationContextMenu
        open={Boolean(contextMenu)}
        x={contextMenu?.x ?? 0}
        y={contextMenu?.y ?? 0}
        conversation={contextMenu?.conversation ?? null}
        categories={labelCategories}
        categoriesLoading={labelCategoriesLoading}
        assignedLabelIds={
          contextMenu
            ? getAssignedLabelIds(contextMenu.conversation)
            : []
        }
        onClose={() => setContextMenu(null)}
        onTogglePin={(conversation) => onPin?.(conversation)}
        onOpenNote={(conversation) => onOpenNote?.(conversation)}
        onToggleLabel={(conversation, category, assigned) =>
          onToggleLabel?.(conversation, category, assigned)
        }
        onOpenManageLabels={onOpenManageLabels}
      />
    </div>
  );
}

export default memo(ConversationPanel);