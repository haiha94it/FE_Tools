"use client";

import {
  clampContextMenuPosition,
  resolveSubmenuPlacement,
} from "@/lib/zalo-messenger-context-menu-utils";
import { resolveZaloLabelColor } from "@/lib/zalo-label-utils";
import { getConversationTitle } from "@/lib/zalo-messenger-utils";
import type {
  MessengerCategoryLabel,
  MessengerConversation,
} from "@/types/zalo-messenger";
import { memo, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface ConversationContextMenuProps {
  open: boolean;
  x: number;
  y: number;
  conversation: MessengerConversation | null;
  categories: MessengerCategoryLabel[];
  categoriesLoading?: boolean;
  assignedLabelIds: number[];
  onClose: () => void;
  onTogglePin: (conversation: MessengerConversation) => void;
  onOpenNote: (conversation: MessengerConversation) => void;
  onToggleLabel: (
    conversation: MessengerConversation,
    category: MessengerCategoryLabel,
    assigned: boolean,
  ) => void;
  onOpenManageLabels?: () => void;
}

function PinIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="shrink-0 text-amber-500"
    >
      <path d="M12 17v5" />
      <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1z" />
    </svg>
  );
}

function NoteIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="shrink-0 text-amber-500"
    >
      <path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z" />
      <path d="M15 3v4a2 2 0 0 0 2 2h4" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="shrink-0 text-brand-500"
    >
      <path d="M12 2 2 7l10 5 10-5-10-5Z" />
      <path d="m2 17 10 5 10-5" />
      <path d="m2 12 10 5 10-5" />
    </svg>
  );
}

const menuItemClass =
  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/[0.03]";

const LABEL_SUBMENU_WIDTH = 210;
const LABEL_SUBMENU_MAX_HEIGHT = 240;
const LABEL_PANEL_CLOSE_DELAY_MS = 120;


function estimateLabelPanelHeight(
  categoryCount: number,
  hasManageLink: boolean,
): number {
  const rows = Math.max(categoryCount, 1);
  const header = 36;
  const manage = hasManageLink ? 32 : 0;
  return Math.min(LABEL_SUBMENU_MAX_HEIGHT, header + rows * 36 + manage + 16);
}

function ConversationContextMenu({
  open,
  x,
  y,
  conversation,
  categories,
  categoriesLoading = false,
  assignedLabelIds,
  onClose,
  onTogglePin,
  onOpenNote,
  onToggleLabel,
  onOpenManageLabels,
}: ConversationContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const labelTriggerRef = useRef<HTMLDivElement>(null);
  const labelCloseTimerRef = useRef<number | null>(null);
  const [position, setPosition] = useState({ x, y });
  const [labelPanelOpen, setLabelPanelOpen] = useState(false);
  const [labelPanelStyle, setLabelPanelStyle] = useState<{
    side: "left" | "right";
    align: "top" | "bottom";
  }>({ side: "right", align: "top" });
  const [mounted, setMounted] = useState(false);

  const clearLabelCloseTimer = () => {
    if (labelCloseTimerRef.current == null) return;
    window.clearTimeout(labelCloseTimerRef.current);
    labelCloseTimerRef.current = null;
  };

  const openLabelPanel = () => {
    clearLabelCloseTimer();
    const anchor = labelTriggerRef.current;
    if (anchor) {
      const rect = anchor.getBoundingClientRect();
      setLabelPanelStyle(
        resolveSubmenuPlacement(
          rect,
          LABEL_SUBMENU_WIDTH,
          estimateLabelPanelHeight(
            categories.length,
            Boolean(onOpenManageLabels),
          ),
        ),
      );
    }
    setLabelPanelOpen(true);
  };

  const scheduleCloseLabelPanel = () => {
    clearLabelCloseTimer();
    labelCloseTimerRef.current = window.setTimeout(() => {
      setLabelPanelOpen(false);
      labelCloseTimerRef.current = null;
    }, LABEL_PANEL_CLOSE_DELAY_MS);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open || !menuRef.current) {
      setPosition({ x, y });
      return;
    }

    const rect = menuRef.current.getBoundingClientRect();
    setPosition(clampContextMenuPosition(x, y, rect.width, rect.height));
  }, [open, x, y]);

  useEffect(() => {
    if (!open) {
      clearLabelCloseTimer();
      setLabelPanelOpen(false);
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return;
      onClose();
    };

    const handleScroll = () => onClose();

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [onClose, open]);

  useEffect(() => () => clearLabelCloseTimer(), []);

  if (!open || !conversation || !mounted || typeof document === "undefined") {
    return null;
  }

  const assignedSet = new Set(assignedLabelIds);
  const conversationTitle = getConversationTitle(conversation);

  const labelPanelPositionClass =
    labelPanelStyle.side === "right"
      ? "left-[calc(100%-10px)]"
      : "right-[calc(100%-10px)]";
  const labelPanelAlignClass =
    labelPanelStyle.align === "top" ? "top-0" : "bottom-0";

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-[120] min-w-[210px] overflow-visible rounded-xl border border-gray-200 bg-white py-1 shadow-xl dark:border-gray-700 dark:bg-gray-900"
      style={{ left: position.x, top: position.y }}
      role="menu"
      onContextMenu={(event) => event.preventDefault()}
    >
      <div className="border-b border-gray-100 px-3 py-2 dark:border-gray-800">
        <p className="truncate text-xs font-semibold text-gray-900 dark:text-white">
          {conversationTitle}
        </p>
        <p className="text-[10px] text-gray-400">Chuột phải · Tùy chọn</p>
      </div>

      <button
        type="button"
        role="menuitem"
        onClick={() => {
          onTogglePin(conversation);
          onClose();
        }}
        className={menuItemClass}
      >
        <PinIcon />
        {conversation.pinning ? "Bỏ ghim hội thoại" : "Ghim hội thoại"}
      </button>

      <button
        type="button"
        role="menuitem"
        onClick={() => {
          onOpenNote(conversation);
          onClose();
        }}
        className={menuItemClass}
      >
        <NoteIcon />
        {conversation.note ? "Sửa ghi chú" : "Thêm ghi chú"}
      </button>

      <div
        ref={labelTriggerRef}
        className="relative"
        onMouseEnter={openLabelPanel}
        onMouseLeave={scheduleCloseLabelPanel}
      >
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            if (labelPanelOpen) {
              clearLabelCloseTimer();
              setLabelPanelOpen(false);
              return;
            }
            openLabelPanel();
          }}
          className={`${menuItemClass} justify-between`}
        >
          <span className="inline-flex items-center gap-2">
            <TagIcon />
            Gán nhãn
          </span>
          <span className="text-[10px] text-gray-400">▶</span>
        </button>

        {labelPanelOpen ? (
          <div
            className={`custom-scrollbar absolute ${labelPanelPositionClass} ${labelPanelAlignClass} z-[121] max-h-[240px] min-w-[210px] overflow-y-auto overscroll-contain rounded-xl border border-gray-200 bg-white py-1 pl-2 shadow-xl dark:border-gray-700 dark:bg-gray-900`}
            onMouseEnter={openLabelPanel}
            onMouseLeave={scheduleCloseLabelPanel}
          >
            <div className="border-b border-gray-100 px-3 py-1.5 dark:border-gray-800">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                Nhãn phân loại
              </p>
            </div>

            {categoriesLoading ? (
              <div className="flex items-center justify-center gap-2 px-3 py-4 text-xs text-gray-500">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                Đang tải...
              </div>
            ) : categories.length === 0 ? (
              <p className="px-3 py-3 text-xs text-gray-500 dark:text-gray-400">
                Chưa có nhãn phân loại.
              </p>
            ) : (
              categories.map((category) => {
                const assigned = assignedSet.has(category.id);
                return (
                  <button
                    key={category.id}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      onToggleLabel(conversation, category, assigned);
                      onClose();
                    }}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                  >
                    <span className="inline-flex min-w-0 items-center gap-2">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{
                          backgroundColor: resolveZaloLabelColor(category.color),
                        }}
                      />
                      <span className="truncate font-medium text-gray-700 dark:text-gray-200">
                        {category.name || `Nhãn #${category.id}`}
                      </span>
                    </span>
                    {assigned ? (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="shrink-0 text-brand-600"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    ) : (
                      <span className="shrink-0 text-[10px] text-gray-400">
                        Gán
                      </span>
                    )}
                  </button>
                );
              })
            )}

            {onOpenManageLabels ? (
              <button
                type="button"
                onClick={() => {
                  onOpenManageLabels();
                  onClose();
                }}
                className="mt-1 w-full border-t border-gray-100 px-3 py-2 text-left text-xs font-medium text-brand-600 transition hover:bg-gray-50 dark:border-gray-800 dark:text-brand-400 dark:hover:bg-white/[0.03]"
              >
                Quản lý nhãn phân loại
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

export default memo(ConversationContextMenu);