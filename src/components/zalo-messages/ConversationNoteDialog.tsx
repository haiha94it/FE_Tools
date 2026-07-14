"use client";

import { Modal } from "@/components/ui/modal";
import { getConversationTitle } from "@/lib/zalo-messenger-utils";
import { toast } from "@/lib/toast";
import type { MessengerConversation } from "@/types/zalo-messenger";
import { memo, useEffect, useState } from "react";

interface ConversationNoteDialogProps {
  open: boolean;
  conversation: MessengerConversation | null;
  saving?: boolean;
  onClose: () => void;
  onSave: (note: string) => Promise<void>;
}

function ConversationNoteDialog({
  open,
  conversation,
  saving = false,
  onClose,
  onSave,
}: ConversationNoteDialogProps) {
  const [noteDraft, setNoteDraft] = useState("");

  useEffect(() => {
    if (!open || !conversation) return;
    setNoteDraft(conversation.note ?? "");
  }, [conversation, open]);

  if (!open || !conversation) return null;

  const title = getConversationTitle(conversation);

  const handleSave = async () => {
    try {
      await onSave(noteDraft.trim());
      toast.success("Đã lưu ghi chú.");
      onClose();
    } catch {
      toast.error("Không lưu được ghi chú.");
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} className="max-w-md" showCloseButton>
      <div className="p-5 sm:p-6">
        <div className="mb-4 flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z" />
              <path d="M15 3v4a2 2 0 0 0 2 2h4" />
            </svg>
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Ghi chú hội thoại
            </h3>
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">
              {title}
            </p>
          </div>
        </div>

        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
          Nội dung ghi chú nội bộ
        </label>
        <textarea
          value={noteDraft}
          onChange={(e) => setNoteDraft(e.target.value)}
          placeholder="Ghi chú nội bộ cho hội thoại này..."
          rows={4}
          maxLength={2000}
          className="mt-2 w-full resize-none rounded-xl border border-amber-200 bg-amber-50/40 px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-amber-400 focus:bg-white dark:border-amber-500/30 dark:bg-amber-500/5 dark:text-white/90"
        />

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave()}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
          >
            {saving ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Đang lưu...
              </>
            ) : (
              "Lưu ghi chú"
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default memo(ConversationNoteDialog);