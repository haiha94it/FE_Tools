"use client";

import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { memo, useEffect, useState } from "react";

interface AddFriendMessageDialogProps {
  open: boolean;
  friendName?: string;
  onClose: () => void;
  onSubmit: (message: string) => void;
}

const DEFAULT_MESSAGE = "Xin chào, kết bạn với tôi nhé!";

function AddFriendMessageDialog({
  open,
  friendName,
  onClose,
  onSubmit,
}: AddFriendMessageDialogProps) {
  const [message, setMessage] = useState(DEFAULT_MESSAGE);

  useEffect(() => {
    if (open) setMessage(DEFAULT_MESSAGE);
  }, [open]);

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      className="max-w-md max-md:max-w-full"
      showCloseButton
      layer="top"
    >
      <div className="flex flex-col p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-6">
        <h3 className="pr-10 text-lg font-semibold text-gray-900 sm:text-base dark:text-white">
          Gửi lời mời kết bạn
        </h3>
        {friendName ? (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Đến {friendName}
          </p>
        ) : null}

        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={4}
          maxLength={135}
          placeholder="Lời nhắn kèm lời mời..."
          className="mt-4 w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-base outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-500/15 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 sm:py-2.5 sm:text-sm"
        />
        <p className="mt-1 text-right text-[11px] text-gray-400">
          {message.length}/135
        </p>

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={onClose}
            className="!h-11 w-full sm:!h-9 sm:w-auto"
          >
            Huỷ
          </Button>
          <Button
            size="sm"
            onClick={() => onSubmit(message.trim() || DEFAULT_MESSAGE)}
            className="!h-11 w-full sm:!h-9 sm:w-auto"
          >
            Gửi lời mời
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default memo(AddFriendMessageDialog);