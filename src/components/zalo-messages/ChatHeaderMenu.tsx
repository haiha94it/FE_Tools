"use client";

import { Tooltip } from "@/components/ui/tooltip/Tooltip";
import {
  getAssignedLabelIds,
  resolveZaloLabelColor,
} from "@/lib/zalo-label-utils";
import { toast } from "@/lib/toast";
import type {
  MessengerCategoryLabel,
  MessengerConversation,
} from "@/types/zalo-messenger";
import { memo, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface ChatHeaderMenuProps {
  conversation: MessengerConversation;
  labelCategories?: MessengerCategoryLabel[];
  onPin: (pinning: boolean) => void;
  onSaveNote: (note: string) => Promise<void>;
  onToggleLabel?: (
    category: MessengerCategoryLabel,
    assigned: boolean,
  ) => Promise<void>;
}

function ChatHeaderMenu({
  conversation,
  labelCategories = [],
  onPin,
  onSaveNote,
  onToggleLabel,
}: ChatHeaderMenuProps) {
  const [open, setOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [labelPanelOpen, setLabelPanelOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState(conversation.note ?? "");
  const [savingNote, setSavingNote] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(
    null,
  );
  const [labelPos, setLabelPos] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const labelTriggerRef = useRef<HTMLDivElement>(null);
  const labelPanelRef = useRef<HTMLDivElement>(null);
  const labelCloseTimerRef = useRef<number | null>(null);

  const clearLabelCloseTimer = () => {
    if (labelCloseTimerRef.current == null) return;
    window.clearTimeout(labelCloseTimerRef.current);
    labelCloseTimerRef.current = null;
  };

  const openLabelPanel = () => {
    clearLabelCloseTimer();
    setLabelPanelOpen(true);
  };

  const scheduleCloseLabelPanel = () => {
    clearLabelCloseTimer();
    labelCloseTimerRef.current = window.setTimeout(() => {
      setLabelPanelOpen(false);
      labelCloseTimerRef.current = null;
    }, 150);
  };

  const updateMenuPosition = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    setMenuPos({
      top: rect.bottom + 8,
      right: window.innerWidth - rect.right,
    });
  };

  const updateLabelPosition = () => {
    const trigger = labelTriggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const panelWidth = 200;
    const gap = 6;
    let left = rect.left - panelWidth - gap;
    if (left < 8) {
      left = rect.right + gap;
    }
    let top = rect.top;
    const maxTop = window.innerHeight - 240 - 8;
    if (top > maxTop) top = Math.max(8, maxTop);
    setLabelPos({ top, left });
  };

  useEffect(() => {
    setNoteDraft(conversation.note ?? "");
  }, [conversation.id, conversation.note]);

  useEffect(() => () => clearLabelCloseTimer(), []);

  useEffect(() => {
    if (!open) {
      clearLabelCloseTimer();
      setLabelPanelOpen(false);
      setMenuPos(null);
      setLabelPos(null);
      return undefined;
    }

    updateMenuPosition();

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      if (labelPanelRef.current?.contains(target)) return;
      setOpen(false);
      setNoteOpen(false);
      setLabelPanelOpen(false);
    };

    const handleReposition = () => {
      updateMenuPosition();
      if (labelPanelOpen) updateLabelPosition();
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [open, labelPanelOpen]);

  useLayoutEffect(() => {
    if (!open || !labelPanelOpen) {
      setLabelPos(null);
      return;
    }
    updateLabelPosition();
  }, [open, labelPanelOpen, labelCategories.length]);

  const handleSaveNote = async () => {
    setSavingNote(true);
    try {
      await onSaveNote(noteDraft.trim());
      toast.success("Đã lưu ghi chú hội thoại.");
      setNoteOpen(false);
      setOpen(false);
    } catch {
      toast.error("Không lưu được ghi chú.");
    } finally {
      setSavingNote(false);
    }
  };

  const menu =
    open && menuPos && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={menuRef}
            className="fixed z-[1300] w-56 overflow-visible rounded-2xl border border-gray-200 bg-white py-1 shadow-xl dark:border-gray-700 dark:bg-gray-900"
            style={{ top: menuPos.top, right: menuPos.right }}
          >
            <button
              type="button"
              onClick={() => {
                onPin(!conversation.pinning);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-gray-700 transition hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/[0.03]"
            >
              {conversation.pinning ? "Bỏ ghim" : "Ghim hội thoại"}
            </button>
            <button
              type="button"
              onClick={() => setNoteOpen((prev) => !prev)}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-gray-700 transition hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/[0.03]"
            >
              Ghi chú
            </button>

            {onToggleLabel ? (
              <div
                ref={labelTriggerRef}
                className="relative"
                onMouseEnter={openLabelPanel}
                onMouseLeave={scheduleCloseLabelPanel}
              >
                <button
                  type="button"
                  onClick={openLabelPanel}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm text-gray-700 transition hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/[0.03]"
                >
                  <span>Gán nhãn</span>
                  <span className="text-[10px] text-gray-400">▶</span>
                </button>
              </div>
            ) : null}

            {noteOpen ? (
              <div className="border-t border-gray-100 p-3 dark:border-gray-800">
                <textarea
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  placeholder="Ghi chú nội bộ cho hội thoại..."
                  className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-300 dark:border-gray-700 dark:bg-gray-800"
                />
                <button
                  type="button"
                  disabled={savingNote}
                  onClick={() => void handleSaveNote()}
                  className="mt-2 w-full rounded-xl bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                >
                  {savingNote ? "Đang lưu..." : "Lưu ghi chú"}
                </button>
              </div>
            ) : null}
          </div>,
          document.body,
        )
      : null;

  const labelPanel =
    open &&
    labelPanelOpen &&
    labelPos &&
    typeof document !== "undefined"
      ? createPortal(
          <div
            ref={labelPanelRef}
            className="custom-scrollbar fixed z-[1310] max-h-[min(50vh,280px)] min-w-[200px] overflow-y-auto overscroll-contain rounded-xl border border-gray-200 bg-white py-1 shadow-xl dark:border-gray-700 dark:bg-gray-900"
            style={{ top: labelPos.top, left: labelPos.left }}
            onMouseEnter={openLabelPanel}
            onMouseLeave={scheduleCloseLabelPanel}
          >
            {labelCategories.length === 0 ? (
              <p className="px-3 py-2 text-xs text-gray-500">Chưa có nhãn.</p>
            ) : (
              labelCategories.map((category) => {
                const assigned = getAssignedLabelIds(conversation).includes(
                  category.id,
                );
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => {
                      void onToggleLabel?.(category, assigned).catch(() => {
                        toast.error("Không cập nhật được nhãn.");
                      });
                      setOpen(false);
                      setLabelPanelOpen(false);
                    }}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                  >
                    <span className="inline-flex min-w-0 items-center gap-2">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{
                          backgroundColor: resolveZaloLabelColor(
                            category.color,
                          ),
                        }}
                      />
                      <span className="truncate">
                        {category.name || `Nhãn #${category.id}`}
                      </span>
                    </span>
                    {assigned ? (
                      <span className="text-brand-600">✓</span>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>,
          document.body,
        )
      : null;

  return (
    <div ref={rootRef} className="relative z-20 shrink-0">
      <Tooltip content="Tùy chọn hội thoại" side="bottom">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-600 transition hover:border-brand-300 hover:text-brand-600 dark:border-gray-700 dark:text-gray-300"
          aria-label="Tùy chọn hội thoại"
          aria-expanded={open}
        >
          ⋮
        </button>
      </Tooltip>
      {menu}
      {labelPanel}
    </div>
  );
}

export default memo(ChatHeaderMenu);
