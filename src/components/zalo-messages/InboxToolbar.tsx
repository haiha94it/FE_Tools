"use client";

import { Tooltip } from "@/components/ui/tooltip/Tooltip";
import { useStableHandler } from "@/hooks/use-stable-handler";
import type { MessengerConversationFilter } from "@/types/zalo-messenger";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import LabelFilterDropdown from "./LabelFilterDropdown";

interface InboxToolbarProps {
  accountId: number | null;
  conversationFilter: MessengerConversationFilter;
  selectedCategoryId: number | null;
  labelCategories: import("@/types/zalo-messenger").MessengerCategoryLabel[];
  labelCategoriesLoading: boolean;
  onApplyFilter: (
    filter: MessengerConversationFilter,
    categoryId: number | null,
  ) => void;
  onMarkAllRead: () => void;
  onOpenSendPhone: () => void;
  onOpenCreateGroup: () => void;
  onOpenManageLabels: () => void;
}

const SLOT_WIDTH = 38;

const iconButtonClass =
  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition hover:border-brand-200 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-400";

const quickActionClass =
  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:border-[#0068ff]/30 hover:bg-[#0068ff]/5 hover:text-[#0068ff] disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700";

const scrollNavClass =
  "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700";

function InboxToolbar({
  accountId,
  conversationFilter,
  selectedCategoryId,
  labelCategories,
  labelCategoriesLoading,
  onApplyFilter,
  onMarkAllRead,
  onOpenSendPhone,
  onOpenCreateGroup,
  onOpenManageLabels,
}: InboxToolbarProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [pageStart, setPageStart] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(4);

  const handleSelectCategory = useStableHandler((categoryId: number | null) => {
    onApplyFilter("all", categoryId);
  });

  const toolbarItems = useMemo(() => {
    const items: Array<{ key: string; node: React.ReactNode }> = [
      {
        key: "filter-all",
        node: (
          <Tooltip content="Tất cả hội thoại" side="top">
            <button
              type="button"
              onClick={() => onApplyFilter("all", null)}
              className={`${iconButtonClass} ${
                conversationFilter === "all" && !selectedCategoryId
                  ? "border-brand-300 bg-brand-50 text-brand-700 dark:border-brand-500/40 dark:bg-brand-500/10 dark:text-brand-400"
                  : ""
              }`}
              aria-label="Tất cả hội thoại"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
              </svg>
            </button>
          </Tooltip>
        ),
      },
      {
        key: "filter-unread",
        node: (
          <Tooltip content="Chỉ tin chưa đọc" side="top">
            <button
              type="button"
              onClick={() => onApplyFilter("unread", null)}
              className={`${iconButtonClass} ${
                conversationFilter === "unread"
                  ? "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10"
                  : ""
              }`}
              aria-label="Chỉ tin chưa đọc"
            >
              <span className="relative inline-flex">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <path d="m22 6-10 7L2 6" />
                </svg>
                <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-rose-500 ring-1 ring-white dark:ring-gray-900" />
              </span>
            </button>
          </Tooltip>
        ),
      },
      {
        key: "mark-all-read",
        node: (
          <Tooltip content="Đánh dấu đã đọc tất cả" side="top">
            <button
              type="button"
              onClick={onMarkAllRead}
              disabled={!accountId}
              className={`${iconButtonClass} hover:border-emerald-200 hover:text-emerald-600`}
              aria-label="Đánh dấu đã đọc tất cả"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 7 17l-5-5" />
                <path d="m22 10-7.5 7.5L13 16" />
              </svg>
            </button>
          </Tooltip>
        ),
      },
      {
        key: "label-filter",
        node: (
          <LabelFilterDropdown
            disabled={!accountId}
            categories={labelCategories}
            categoriesLoading={labelCategoriesLoading}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={handleSelectCategory}
            onOpenManageLabels={onOpenManageLabels}
          />
        ),
      },
      {
        key: "send-phone",
        node: (
          <Tooltip content="Gửi tin nhắn qua SĐT" side="top">
            <button
              type="button"
              onClick={onOpenSendPhone}
              disabled={!accountId}
              className={quickActionClass}
              aria-label="Gửi tin nhắn qua SĐT"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 21a8 8 0 0 1 13.292-6" />
                <circle cx="10" cy="8" r="5" />
                <path d="M19 16v6" />
                <path d="M22 19h-6" />
              </svg>
            </button>
          </Tooltip>
        ),
      },
      {
        key: "create-group",
        node: (
          <Tooltip content="Tạo nhóm chat" side="top">
            <button
              type="button"
              onClick={onOpenCreateGroup}
              disabled={!accountId}
              className={quickActionClass}
              aria-label="Tạo nhóm chat"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 21a8 8 0 0 0-16 0" />
                <circle cx="10" cy="8" r="5" />
                <path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3" />
              </svg>
            </button>
          </Tooltip>
        ),
      },
    ];
    return items;
  }, [
    accountId,
    conversationFilter,
    handleSelectCategory,
    labelCategories,
    labelCategoriesLoading,
    onApplyFilter,
    onMarkAllRead,
    onOpenCreateGroup,
    onOpenManageLabels,
    onOpenSendPhone,
    selectedCategoryId,
  ]);

  const updateItemsPerPage = useCallback(() => {
    const width = viewportRef.current?.clientWidth ?? 0;
    setItemsPerPage(Math.max(1, Math.floor((width + 6) / SLOT_WIDTH)));
  }, []);

  useEffect(() => {
    updateItemsPerPage();
    const node = viewportRef.current;
    if (!node) return undefined;
    const observer = new ResizeObserver(() => updateItemsPerPage());
    observer.observe(node);
    return () => observer.disconnect();
  }, [updateItemsPerPage]);

  useEffect(() => {
    setPageStart(0);
  }, [toolbarItems.length]);

  useEffect(() => {
    setPageStart((current) =>
      Math.max(0, Math.min(current, Math.max(0, toolbarItems.length - itemsPerPage))),
    );
  }, [itemsPerPage, toolbarItems.length]);

  const canGoLeft = pageStart > 0;
  const canGoRight = pageStart + itemsPerPage < toolbarItems.length;
  const visibleItems = toolbarItems.slice(pageStart, pageStart + itemsPerPage);

  return (
    <div className="flex min-w-0 items-center gap-1">
      {canGoLeft ? (
        <Tooltip content="Xem trước" side="top">
          <button type="button" onClick={() => setPageStart((c) => Math.max(0, c - itemsPerPage))} className={scrollNavClass} aria-label="Xem trước">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
          </button>
        </Tooltip>
      ) : null}

      <div ref={viewportRef} className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
        {visibleItems.map((item) => (
          <div key={item.key} className="shrink-0">
            {item.node}
          </div>
        ))}
      </div>

      {canGoRight ? (
        <Tooltip content="Xem tiếp" side="top">
          <button
            type="button"
            onClick={() =>
              setPageStart((c) =>
                Math.min(toolbarItems.length - itemsPerPage, c + itemsPerPage),
              )
            }
            className={scrollNavClass}
            aria-label="Xem tiếp"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
          </button>
        </Tooltip>
      ) : null}
    </div>
  );
}

export default memo(InboxToolbar);