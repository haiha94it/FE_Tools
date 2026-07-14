"use client";

import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { resolveAdminSettingsImage } from "@/lib/admin-settings-utils";
import Image from "next/image";

interface SettingsPreviewDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  content?: string;
  imagePath?: string;
  link?: string;
}

export default function SettingsPreviewDialog({
  open,
  onClose,
  title,
  content,
  imagePath,
  link,
}: SettingsPreviewDialogProps) {
  const imageUrl = resolveAdminSettingsImage(imagePath);

  return (
    <Modal isOpen={open} onClose={onClose} className="max-w-lg p-5 sm:p-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
        {title}
      </h3>
      <div className="custom-scrollbar mt-4 max-h-[70vh] space-y-4 overflow-y-auto">
        {imageUrl ? (
          <div className="relative mx-auto h-48 w-full max-w-xs overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
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
            className="prose prose-sm max-w-none text-gray-700 dark:prose-invert dark:text-gray-300"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : null}
        {link ? (
          <p className="break-all text-sm text-brand-600 dark:text-brand-400">
            {link}
          </p>
        ) : null}
      </div>
      <div className="mt-6 flex justify-end">
        <Button size="sm" variant="outline" onClick={onClose}>
          Đóng
        </Button>
      </div>
    </Modal>
  );
}