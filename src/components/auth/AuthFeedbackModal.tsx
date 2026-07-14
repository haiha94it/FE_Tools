"use client";

import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import Image from "next/image";

interface AuthFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  imageUrl?: string | null;
}

export default function AuthFeedbackModal({
  isOpen,
  onClose,
  title = "Thông báo",
  message,
  imageUrl,
}: AuthFeedbackModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-[560px] p-6 lg:p-8"
    >
      <h4 className="mb-4 text-title-sm font-semibold text-gray-800 dark:text-white/90">
        {title}
      </h4>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {imageUrl && (
          <div className="relative mx-auto h-32 w-32 shrink-0 sm:mx-0">
            <Image
              src={imageUrl}
              alt="Thông báo"
              fill
              className="rounded-xl object-contain"
              unoptimized
            />
          </div>
        )}
        <div
          className="text-sm leading-6 text-gray-600 dark:text-gray-400"
          dangerouslySetInnerHTML={{ __html: message }}
        />
      </div>

      <div className="mt-6 flex justify-end">
        <Button size="sm" onClick={onClose}>
          Đóng
        </Button>
      </div>
    </Modal>
  );
}