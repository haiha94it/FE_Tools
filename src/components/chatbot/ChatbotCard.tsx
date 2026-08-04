"use client";

import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { Tooltip } from "@/components/ui/tooltip/Tooltip";
import {
  getChatbotAccountKeys,
  getChatbotTrainingCount,
} from "@/lib/chatbot-utils";
import type { ChatbotInstance } from "@/types/chatbot";
import Link from "next/link";

interface ChatbotCardProps {
  chatbot: ChatbotInstance;
  onCopy: (chatbot: ChatbotInstance) => void;
  onDelete: (chatbot: ChatbotInstance) => void;
  onToggle: (chatbot: ChatbotInstance, next: boolean) => void;
}

function formatDate(value?: string) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("vi-VN");
  } catch {
    return "—";
  }
}

export default function ChatbotCard({
  chatbot,
  onCopy,
  onDelete,
  onToggle,
}: ChatbotCardProps) {
  const accountCount = getChatbotAccountKeys(chatbot).length;
  const qaCount = getChatbotTrainingCount(chatbot);

  return (
    <article className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs transition hover:border-brand-200 hover:shadow-theme-md dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-brand-800">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-gray-900 dark:text-white">
            {chatbot.name}
          </h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Tạo ngày {formatDate(chatbot.created_at)}
          </p>
        </div>
        <Badge
          size="sm"
          color={chatbot.is_active ? "success" : "light"}
          variant="light"
        >
          {chatbot.is_active ? "Đang bật" : "Tắt"}
        </Badge>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-gray-50 px-3 py-2 dark:bg-white/[0.04]">
          <dt className="text-xs text-gray-500 dark:text-gray-400">
            Tài khoản Zalo
          </dt>
          <dd className="mt-0.5 font-semibold text-gray-800 dark:text-gray-100">
            {accountCount}
          </dd>
        </div>
        <div className="rounded-xl bg-gray-50 px-3 py-2 dark:bg-white/[0.04]">
          <dt className="text-xs text-gray-500 dark:text-gray-400">Q&A</dt>
          <dd className="mt-0.5 font-semibold text-gray-800 dark:text-gray-100">
            {qaCount}
          </dd>
        </div>
      </dl>

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
        <Link
          href={`/chatbots/${chatbot.id}`}
          className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600"
        >
          Chỉnh sửa
        </Link>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onCopy(chatbot)}
          className="!px-3 !py-2"
        >
          Sao chép
        </Button>
        <Tooltip
          content={chatbot.is_active ? "Tắt kịch bản" : "Bật kịch bản"}
          side="top"
          avoidCollisions={false}
        >
          <button
            type="button"
            aria-label={chatbot.is_active ? "Tắt kịch bản" : "Bật kịch bản"}
            onClick={() => onToggle(chatbot, !chatbot.is_active)}
            className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-gray-600 ring-1 ring-inset ring-gray-300 transition hover:bg-gray-50 dark:text-gray-300 dark:ring-gray-700 dark:hover:bg-white/[0.03]"
          >
            {chatbot.is_active ? "Tắt" : "Bật"}
          </button>
        </Tooltip>
        <Tooltip content="Xóa kịch bản" side="top" avoidCollisions={false}>
          <button
            type="button"
            aria-label="Xóa kịch bản"
            onClick={() => onDelete(chatbot)}
            className="ml-auto cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-error-600 transition hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-500/10"
          >
            Xóa
          </button>
        </Tooltip>
      </div>
    </article>
  );
}
