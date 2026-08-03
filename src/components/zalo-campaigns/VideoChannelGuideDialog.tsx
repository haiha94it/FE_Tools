"use client";

import { API_CHANNEL_VIDEO } from "@/config/api";
import { unwrapApiBody } from "@/lib/api-response";
import api from "@/lib/axios";
import { getApiErrorMessage } from "@/lib/errors";
import { canManageGuidesAndResources } from "@/lib/map-auth-user";
import { toast } from "@/lib/toast";
import { useAuthStore } from "@/stores/use-auth-store";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";

const Editor = dynamic(
  () => import("primereact/editor").then((mod) => mod.Editor),
  {
    ssr: false,
    loading: () => (
      <p className="py-8 text-center text-sm text-gray-500">
        Đang tải trình soạn thảo…
      </p>
    ),
  },
);

interface VideoChannelGuideDialogProps {
  open: boolean;
  onClose: () => void;
}

interface InstructionsContent {
  id?: number;
  content?: string;
}

const GUIDE_STYLE_IDS = [
  "video-channel-guide-quill",
  "video-channel-guide-prime-theme",
  "video-channel-guide-prime-core",
] as const;

/** Nạp CSS Quill + PrimeReact khi mở dialog edit — gỡ khi đóng để không đụng TailAdmin. */
function useGuideEditorStyles(enabled: boolean) {
  useEffect(() => {
    if (!enabled || typeof document === "undefined") return;

    const styles: { id: (typeof GUIDE_STYLE_IDS)[number]; href: string }[] = [
      {
        id: "video-channel-guide-quill",
        href: "https://unpkg.com/quill@2.0.3/dist/quill.snow.css",
      },
      {
        id: "video-channel-guide-prime-theme",
        href: "https://unpkg.com/primereact@10/resources/themes/lara-light-blue/theme.css",
      },
      {
        id: "video-channel-guide-prime-core",
        href: "https://unpkg.com/primereact@10/resources/primereact.min.css",
      },
    ];

    styles.forEach(({ id, href }) => {
      if (document.getElementById(id)) return;
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = href;
      document.head.appendChild(link);
    });

    return () => {
      GUIDE_STYLE_IDS.forEach((id) => {
        document.getElementById(id)?.remove();
      });
    };
  }, [enabled]);
}

/**
 * Dialog hướng dẫn tạo kênh Zalo Video.
 * User: xem HTML từ GET /api/popup/instructions/get.
 * Admin (is_admin): nút Chỉnh sửa / Thêm nội dung + Lưu POST create-or-edit — giống Care.
 */
export default function VideoChannelGuideDialog({
  open,
  onClose,
}: VideoChannelGuideDialogProps) {
  const user = useAuthStore((s) => s.user);
  const isAdmin = canManageGuidesAndResources(user);

  const [content, setContent] = useState<string>("");
  const [draft, setDraft] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  useGuideEditorStyles(open && isEdit);

  const loadContent = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await api.get<InstructionsContent>(
        API_CHANNEL_VIDEO.INSTRUCTIONS_GET,
      );
      // Interceptor có thể đã unwrap envelope — unwrapApiBody an toàn cả 2 dạng
      const body = unwrapApiBody<InstructionsContent>(res.data);
      const html = body?.content ?? "";
      setContent(html);
      setDraft(html);
    } catch {
      setContent("");
      setDraft("");
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      setIsEdit(false);
      return;
    }
    void loadContent();
  }, [open, loadContent]);

  const handleStartEdit = () => {
    setDraft(content);
    setIsEdit(true);
  };

  const handleCancelEdit = () => {
    setDraft(content);
    setIsEdit(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.post<InstructionsContent>(
        API_CHANNEL_VIDEO.INSTRUCTIONS_EDIT,
        { content: draft || "" },
      );
      const body = unwrapApiBody<InstructionsContent>(res.data);
      const html = body?.content ?? draft ?? "";
      setContent(html);
      setDraft(html);
      setIsEdit(false);
      setLoadError(false);
      toast.success("Đã lưu hướng dẫn tạo kênh.");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const hasContent = Boolean(content?.trim());

  return (
    <div className="fixed inset-0 z-[99999] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Đóng"
        className="absolute inset-0 bg-gray-900/50 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-gray-200 bg-white shadow-theme-lg sm:max-h-[85vh] sm:rounded-2xl dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
            Hướng dẫn tạo kênh
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5"
            aria-label="Đóng dialog"
          >
            ✕
          </button>
        </div>

        <div className="custom-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto p-5">
          {loading ? (
            <p className="text-sm text-gray-500">Đang tải hướng dẫn…</p>
          ) : isEdit ? (
            <div className="flex min-h-0 flex-1 flex-col gap-3">
              <div className="video-channel-guide-editor overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                <Editor
                  value={draft}
                  onTextChange={(e) => setDraft(e.htmlValue || "")}
                  style={{ height: "min(60vh, 480px)" }}
                />
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-white/5"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={saving}
                  className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600 disabled:opacity-50"
                >
                  {saving ? "Đang lưu…" : "Lưu"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col gap-3">
              {isAdmin && (
                <div>
                  <button
                    type="button"
                    onClick={handleStartEdit}
                    className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-medium text-gray-900 transition hover:bg-amber-500"
                  >
                    {hasContent ? "Chỉnh sửa" : "Thêm nội dung"}
                  </button>
                </div>
              )}

              {hasContent ? (
                <div
                  className="prose prose-sm max-w-none text-gray-700 dark:prose-invert dark:text-gray-300"
                  dangerouslySetInnerHTML={{
                    __html: content.replace(/&nbsp;/g, " "),
                  }}
                />
              ) : (
                <p className="text-sm text-gray-500">
                  {isAdmin
                    ? "Chưa có nội dung hướng dẫn. Bấm «Thêm nội dung» để soạn (HTML/ảnh như bên Care)."
                    : loadError
                      ? "Không tải được nội dung hướng dẫn. Vui lòng thử lại sau."
                      : "Chưa có nội dung hướng dẫn. Vui lòng tạo kênh Zalo Video trên ứng dụng Zalo trước khi sử dụng tính năng này."}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
