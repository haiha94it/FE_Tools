"use client";

import Checkbox from "@/components/form/input/Checkbox";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { resolveAdminSettingsImage } from "@/lib/admin-settings-utils";
import Image from "next/image";
import { useEffect, useState } from "react";

interface SettingsPreviewDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  content?: string;
  imagePath?: string;
  link?: string;
  /**
   * Mock UI tick + Đồng ý (admin preview first-login).
   * Không gọi API — chỉ xem layout giống user.
   */
  showAcceptMock?: boolean;
}

export default function SettingsPreviewDialog({
  open,
  onClose,
  title,
  content,
  imagePath,
  link,
  showAcceptMock = false,
}: SettingsPreviewDialogProps) {
  const imageUrl = resolveAdminSettingsImage(imagePath);
  const [mockChecked, setMockChecked] = useState(false);

  useEffect(() => {
    if (!open) setMockChecked(false);
  }, [open]);

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      className={`p-5 sm:p-6 ${showAcceptMock ? "max-w-3xl" : "max-w-lg"}`}
    >
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
        {title}
      </h3>
      <div className="custom-scrollbar mt-4 max-h-[70vh] space-y-4 overflow-y-auto">
        {imageUrl ? (
          <div className="relative mx-auto h-64 w-full max-w-sm overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
            {link ? (
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 z-10"
                aria-label="Mở link thông báo"
              />
            ) : null}
            <Image
              src={imageUrl}
              alt=""
              fill
              unoptimized
              className="object-contain p-2"
            />
          </div>
        ) : null}
        {content ? (
          <div
            className="dialog-quill prose prose-sm max-w-none text-gray-700 dark:prose-invert dark:text-gray-300"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : null}
        {link ? (
          <p className="break-all text-sm text-brand-600 dark:text-brand-400">
            {link}
          </p>
        ) : null}
        {!imageUrl && !content && !link ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Chưa có nội dung xem trước. Chọn ảnh / nhập nội dung trên form, hoặc
            click một mục trong danh sách rồi bấm Xem trước.
          </p>
        ) : null}
      </div>

      {showAcceptMock ? (
        <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
          <label className="inline-flex cursor-pointer items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
            <span className="mt-0.5 shrink-0">
              <Checkbox checked={mockChecked} onChange={setMockChecked} />
            </span>
            <span>
              Tôi đã đọc, hiểu rõ và đồng ý với toàn bộ nội dung thoả thuận
            </span>
          </label>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" disabled={!mockChecked} onClick={onClose}>
              Đồng ý
            </Button>
            <Button size="sm" variant="outline" onClick={onClose}>
              Đóng
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-6 flex justify-end">
          <Button size="sm" variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </div>
      )}
    </Modal>
  );
}
