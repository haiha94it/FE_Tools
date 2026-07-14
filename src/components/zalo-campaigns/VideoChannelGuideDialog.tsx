"use client";

import { API_CHANNEL_VIDEO } from "@/config/api";
import { unwrapApiBody } from "@/lib/api-response";
import api from "@/lib/axios";
import { useEffect, useState } from "react";

interface VideoChannelGuideDialogProps {
  open: boolean;
  onClose: () => void;
}

interface InstructionsContent {
  content?: string;
}

export default function VideoChannelGuideDialog({
  open,
  onClose,
}: VideoChannelGuideDialogProps) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    setLoading(true);
    api
      .get<InstructionsContent>(API_CHANNEL_VIDEO.INSTRUCTIONS_GET)
      .then((res) => {
        const body = unwrapApiBody<InstructionsContent>(res.data);
        setContent(body.content ?? null);
      })
      .catch(() => setContent(null))
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Đóng"
        className="absolute inset-0 bg-gray-900/50 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-gray-200 bg-white shadow-theme-lg sm:max-h-[85vh] sm:rounded-2xl dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
            Hướng dẫn tạo kênh
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5"
          >
            ✕
          </button>
        </div>
        <div className="custom-scrollbar flex-1 overflow-y-auto p-5">
          {loading ? (
            <p className="text-sm text-gray-500">Đang tải hướng dẫn…</p>
          ) : content ? (
            <div
              className="prose prose-sm max-w-none text-gray-700 dark:prose-invert dark:text-gray-300"
              dangerouslySetInnerHTML={{
                __html: content.replace(/&nbsp;/g, " "),
              }}
            />
          ) : (
            <p className="text-sm text-gray-500">
              Không tải được nội dung hướng dẫn. Vui lòng tạo kênh Zalo Video
              trên ứng dụng Zalo trước khi sử dụng tính năng này.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}