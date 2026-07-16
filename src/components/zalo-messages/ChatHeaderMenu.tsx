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
import { memo, useEffect, useRef, useState } from "react";

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
  const panelRef = useRef<HTMLDivElement>(null);
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
    }, 120);
  };

  useEffect(() => {
    setNoteDraft(conversation.note ?? "");
  }, [conversation.id, conversation.note]);

  useEffect(() => () => clearLabelCloseTimer(), []);

  useEffect(() => {
    if (!open) {
      clearLabelCloseTimer();
      setLabelPanelOpen(false);
      return undefined;
    }
    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setNoteOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

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

  return (
    <div ref={panelRef} className="relative shrink-0">
      <Tooltip content="Tùy chọn hội thoại" side="bottom">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-600 transition hover:border-brand-300 hover:text-brand-600 dark:border-gray-700 dark:text-gray-300"
          aria-label="Tùy chọn hội thoại"
        >
          ⋮
        </button>
      </Tooltip>

      {open ? (
        <div className="absolute top-[calc(100%+8px)] right-0 z-30 w-56 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
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
              className="relative"
              onMouseEnter={openLabelPanel}
              onMouseLeave={scheduleCloseLabelPanel}
            >
              <button
                type="button"
                className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm text-gray-700 transition hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/[0.03]"
              >
                <span>Gán nhãn</span>
                <span className="text-[10px] text-gray-400">▶</span>
              </button>
              {labelPanelOpen ? (
                <div
                  className="custom-scrollbar absolute top-0 right-[calc(100%-10px)] z-40 max-h-[220px] min-w-[180px] overflow-y-auto overscroll-contain rounded-xl border border-gray-200 bg-white py-1 pr-2 shadow-xl dark:border-gray-700 dark:bg-gray-900"
                  onMouseEnter={openLabelPanel}
                  onMouseLeave={scheduleCloseLabelPanel}
                >
                  {labelCategories.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-gray-500">
                      Chưa có nhãn.
                    </p>
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
                            void onToggleLabel(category, assigned).catch(() => {
                              toast.error("Không cập nhật được nhãn.");
                            });
                            setOpen(false);
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
                </div>
              ) : null}
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
        </div>
      ) : null}
    </div>
  );
}

export default memo(ChatHeaderMenu);