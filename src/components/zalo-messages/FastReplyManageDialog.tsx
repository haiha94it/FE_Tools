"use client";

import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import { Modal } from "@/components/ui/modal";
import { confirm } from "@/lib/confirm";
import { getApiErrorMessage } from "@/lib/errors";
import {
  normalizeFastReplyImagePath,
  validateFastReplyForm,
} from "@/lib/zalo-messenger-fast-reply";
import { resolveAttachmentPreviewUrl } from "@/lib/zalo-messenger-send-utils";
import { toast } from "@/lib/toast";
import { useZaloMessengerStore } from "@/stores/use-zalo-messenger-store";
import {
  FAST_REPLY_CONTENT_MAX,
  type MessengerFastReply,
} from "@/types/zalo-messenger";
import Image from "next/image";
import { memo, useEffect, useRef, useState } from "react";

interface FastReplyManageDialogProps {
  accountId: number;
  open: boolean;
  onClose: () => void;
}

function resolveFastReplyImageUrl(imageLink?: string | null): string {
  if (!imageLink) return "";
  return resolveAttachmentPreviewUrl(imageLink);
}

const textareaClassName =
  "w-full resize-none rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-800 shadow-theme-xs outline-none placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800";

function FastReplyManageDialog({
  accountId,
  open,
  onClose,
}: FastReplyManageDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fastReplies = useZaloMessengerStore((s) => s.fastReplies);
  const createFastReply = useZaloMessengerStore((s) => s.createFastReply);
  const editFastReply = useZaloMessengerStore((s) => s.editFastReply);
  const deleteFastReply = useZaloMessengerStore((s) => s.deleteFastReply);
  const uploadAttachments = useZaloMessengerStore((s) => s.uploadAttachments);

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MessengerFastReply | null>(
    null,
  );
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageLink, setImageLink] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const resetForm = () => {
    setTitle("");
    setContent("");
    setImageLink(null);
    setEditingItem(null);
    setShowForm(false);
  };

  useEffect(() => {
    if (!open) resetForm();
  }, [open]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const startCreate = () => {
    setEditingItem(null);
    setTitle("");
    setContent("");
    setImageLink(null);
    setShowForm(true);
  };

  const startEdit = (item: MessengerFastReply) => {
    setEditingItem(item);
    setTitle(item.title ?? "");
    setContent(item.content ?? "");
    setImageLink(item.image ?? null);
    setShowForm(true);
  };

  const handleUpload = async (files: File[]) => {
    if (!files.length) return;
    setUploading(true);
    try {
      const previousDrafts = useZaloMessengerStore.getState().attachmentDrafts;
      useZaloMessengerStore.setState({ attachmentDrafts: [] });
      await uploadAttachments(files);
      const uploaded = useZaloMessengerStore.getState().attachmentDrafts[0];
      useZaloMessengerStore.setState({ attachmentDrafts: previousDrafts });
      if (uploaded?.link) {
        setImageLink(normalizeFastReplyImagePath(uploaded.link) ?? uploaded.link);
      }
    } catch {
      toast.error("Không tải được ảnh.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    const normalizedImage = normalizeFastReplyImagePath(imageLink) ?? "";

    const validationError = validateFastReplyForm({
      title: trimmedTitle,
      content: trimmedContent,
      image: normalizedImage,
    });
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSaving(true);
    try {
      if (editingItem) {
        await editFastReply(
          accountId,
          editingItem.id,
          trimmedTitle,
          trimmedContent,
          normalizedImage,
        );
        toast.success("Đã cập nhật tin nhắn nhanh.");
      } else {
        await createFastReply(
          accountId,
          trimmedTitle,
          trimmedContent,
          normalizedImage,
        );
        toast.success("Đã thêm tin nhắn nhanh.");
      }
      resetForm();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: MessengerFastReply) => {
    const label = item.title?.trim() || `mẫu #${item.id}`;
    if (
      !(await confirm({
        title: "Xóa tin nhắn nhanh",
        message: `Xóa tin nhắn nhanh "/${label}"?`,
        confirmText: "Xóa",
        variant: "danger",
      }))
    ) {
      return;
    }

    setDeletingId(item.id);
    try {
      const message = await deleteFastReply(accountId, item.id);
      toast.success(message ?? "Đã xóa tin nhắn nhanh.");
      if (editingItem?.id === item.id) resetForm();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setDeletingId(null);
    }
  };

  const canSave = (() => {
    const validationError = validateFastReplyForm({
      title,
      content,
      image: imageLink,
    });
    return validationError === null;
  })();

  return (
    <Modal
      isOpen={open}
      onClose={handleClose}
      className="max-w-lg"
      showCloseButton
    >
      <div className="flex max-h-[min(85vh,640px)] flex-col p-5 sm:p-6">
        <div className="mb-4 shrink-0 pr-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Quản lý tin nhắn nhanh
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gõ <span className="font-medium text-brand-600 dark:text-brand-400">/</span>
            {" "}trong ô chat rồi chọn mẫu để gửi nhanh
          </p>
        </div>

        <div className="min-h-0 max-h-[min(50vh,360px)] overflow-y-auto custom-scrollbar">
          {fastReplies.length === 0 && !showForm ? (
            <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              Chưa có tin nhắn nhanh. Bấm &quot;Thêm mẫu&quot; để tạo mẫu đầu
              tiên.
            </p>
          ) : (
            <ul className="space-y-2">
              {fastReplies.map((item) => (
                <li
                  key={item.id}
                  className="rounded-xl border border-gray-200 bg-gray-50/80 px-3 py-3 dark:border-gray-700 dark:bg-gray-800/50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <span className="inline-flex rounded-md bg-violet-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
                        /{item.title || "mau"}
                      </span>
                      {item.content ? (
                        <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                          {item.content}
                        </p>
                      ) : item.image ? (
                        <p className="mt-2 text-sm italic text-gray-500 dark:text-gray-400">
                          Mẫu chỉ có ảnh
                        </p>
                      ) : null}
                      {item.image ? (
                        <div className="mt-2 inline-block overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                          <Image
                            src={resolveFastReplyImageUrl(item.image)}
                            alt={`Ảnh mẫu ${item.title ?? ""}`}
                            width={120}
                            height={56}
                            unoptimized
                            className="h-14 max-w-[200px] object-contain"
                          />
                        </div>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 transition hover:bg-white hover:text-brand-600 dark:hover:bg-gray-900"
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(item)}
                        disabled={deletingId === item.id}
                        className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 transition hover:bg-white hover:text-error-500 disabled:opacity-50 dark:hover:bg-gray-900"
                      >
                        {deletingId === item.id ? "..." : "Xóa"}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {showForm ? (
            <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50/40 p-4 dark:border-brand-500/20 dark:bg-brand-500/5">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-400">
                {editingItem ? "Sửa tin nhắn nhanh" : "Thêm tin nhắn nhanh"}
              </p>

              <div className="mt-3">
                <label
                  htmlFor="fast-reply-title"
                  className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400"
                >
                  Từ khóa phím tắt
                </label>
                <Input
                  id="fast-reply-title"
                  type="text"
                  value={title}
                  disabled={saving}
                  placeholder="VD: chaohoidau"
                  onChange={(e) => setTitle(e.target.value)}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Trong chat gõ{" "}
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    /{title.trim() || "tukhoa"}
                  </span>{" "}
                  để chọn mẫu này
                </p>
              </div>

              <div className="mt-3">
                <label
                  htmlFor="fast-reply-content"
                  className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400"
                >
                  Nội dung tin nhắn
                </label>
                <textarea
                  id="fast-reply-content"
                  value={content}
                  disabled={saving}
                  maxLength={FAST_REPLY_CONTENT_MAX}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  placeholder="Nhập nội dung mẫu (hoặc chỉ dùng ảnh)..."
                  className={textareaClassName}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {content.length}/{FAST_REPLY_CONTENT_MAX} ký tự — cần ít nhất
                  nội dung hoặc ảnh
                </p>
              </div>

              <div className="mt-3">
                <span className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
                  Ảnh đính kèm (tùy chọn)
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const files = Array.from(event.target.files ?? []);
                      event.target.value = "";
                      void handleUpload(files);
                    }}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || saving}
                  >
                    {uploading ? "Đang tải..." : "Chọn ảnh"}
                  </Button>
                  {imageLink ? (
                    <button
                      type="button"
                      onClick={() => setImageLink(null)}
                      disabled={saving}
                      className="text-xs font-medium text-error-500 hover:underline disabled:opacity-50"
                    >
                      Xóa ảnh
                    </button>
                  ) : null}
                </div>
                {imageLink ? (
                  <div className="mt-2 inline-block overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                    <Image
                      src={resolveFastReplyImageUrl(imageLink)}
                      alt="Xem trước ảnh đính kèm"
                      width={160}
                      height={80}
                      unoptimized
                      className="h-20 max-w-[240px] object-contain"
                    />
                  </div>
                ) : null}
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Hủy
                </Button>
                <Button
                  size="sm"
                  onClick={() => void handleSave()}
                  disabled={saving || !canSave}
                >
                  {saving
                    ? "Đang lưu..."
                    : editingItem
                      ? "Lưu"
                      : "Tạo mẫu"}
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        {!showForm ? (
          <div className="mt-4 shrink-0 border-t border-gray-100 pt-4 dark:border-gray-800">
            <Button size="sm" className="w-full" onClick={startCreate}>
              Thêm mẫu
            </Button>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

export default memo(FastReplyManageDialog);