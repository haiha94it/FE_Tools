"use client";

import AvatarText from "@/components/ui/avatar/AvatarText";
import Badge from "@/components/ui/badge/Badge";
import { Modal } from "@/components/ui/modal";
import {
  getMessageKindLabel,
  getMessagePreviewSummary,
} from "@/lib/zalo-messenger-message-utils";
import {
  formatMessageDetailTime,
  getMessageText,
} from "@/lib/zalo-messenger-utils";
import { formatSentByLabel } from "@/lib/team-collaboration-utils";
import type { DisplayMessage } from "@/types/zalo-messenger";
import { memo, useMemo } from "react";
import {
  HiOutlineArrowDownTray,
  HiOutlineArrowUpTray,
  HiOutlineCalendarDays,
  HiOutlineChatBubbleLeftRight,
  HiOutlineClock,
  HiOutlineUserCircle,
} from "react-icons/hi2";

interface MessageDetailDialogProps {
  open: boolean;
  message: DisplayMessage | null;
  own?: boolean;
  onClose: () => void;
}

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}

function InfoRow({ icon, label, children }: InfoRowProps) {
  return (
    <div className="flex gap-3 rounded-xl border border-gray-100 bg-gray-50/80 px-3.5 py-3 dark:border-gray-800 dark:bg-white/[0.03]">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-gray-500 shadow-sm dark:bg-gray-800 dark:text-gray-400">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
          {label}
        </p>
        <div className="mt-1 text-sm text-gray-800 dark:text-white/90">{children}</div>
      </div>
    </div>
  );
}

function MessageDetailDialog({
  open,
  message,
  own = false,
  onClose,
}: MessageDetailDialogProps) {
  const detail = useMemo(() => {
    if (!message) return null;

    const text = getMessageText(message);
    const kind = getMessageKindLabel(message);
    const preview = getMessagePreviewSummary(message);
    const sentBy = message.sent_by;
    const chatbotReply = own && message.sender_type === "chatbot";
    return {
      text,
      kind,
      preview,
      sentBy,
      chatbotReply,
      time: formatMessageDetailTime(message.ts),
      operatorName: chatbotReply
        ? "Chatbot trả lời"
        : sentBy
          ? formatSentByLabel(sentBy)
          : "",
      operatorUsername: chatbotReply ? "" : (sentBy?.username?.trim() ?? ""),
    };
  }, [message, own]);

  if (!open || !message || !detail) return null;

  return (
    <Modal isOpen={open} onClose={onClose} className="max-w-md" showCloseButton>
      <div className="p-5 sm:p-6">
        <div className="mb-5 flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
            <HiOutlineChatBubbleLeftRight className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Thông tin tin nhắn
            </h3>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              Tóm tắt nội dung và người thao tác trên hệ thống
            </p>
          </div>
        </div>

        <div
          className={`mb-4 rounded-2xl px-4 py-3.5 ${
            own
              ? "bg-gradient-to-br from-brand-500 to-brand-600 text-white"
              : "border border-gray-100 bg-white text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
          }`}
        >
          <p
            className={`text-[11px] font-medium ${
              own ? "text-white/75" : "text-gray-400 dark:text-gray-500"
            }`}
          >
            {detail.kind}
          </p>
          <p
            className={`mt-1.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
              detail.text ? "" : "italic opacity-80"
            }`}
          >
            {detail.preview}
          </p>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <Badge
            size="sm"
            color={own ? "primary" : "info"}
            startIcon={
              own ? (
                <HiOutlineArrowUpTray className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <HiOutlineArrowDownTray className="h-3.5 w-3.5" aria-hidden />
              )
            }
          >
            {own ? "Tin đã gửi" : "Khách gửi"}
          </Badge>
          <Badge size="sm" color="light">
            {detail.kind}
          </Badge>
        </div>

        <div className="space-y-2.5">
          <InfoRow
            icon={<HiOutlineClock className="h-4 w-4" aria-hidden />}
            label="Thời gian gửi"
          >
            {detail.time}
          </InfoRow>

          <InfoRow
            icon={<HiOutlineCalendarDays className="h-4 w-4" aria-hidden />}
            label="Loại nội dung"
          >
            {detail.kind}
          </InfoRow>

          {detail.chatbotReply || detail.sentBy ? (
            <InfoRow
              icon={<HiOutlineUserCircle className="h-4 w-4" aria-hidden />}
              label="Người thao tác"
            >
              <div className="flex items-center gap-3">
                <AvatarText name={detail.operatorName} size="sm" />
                <div className="min-w-0">
                  <p className="truncate font-medium">{detail.operatorName}</p>
                  {detail.operatorUsername ? (
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                      @{detail.operatorUsername}
                    </p>
                  ) : null}
                </div>
              </div>
            </InfoRow>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}

export default memo(MessageDetailDialog);
