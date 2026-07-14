"use client";

import { useEffect } from "react";
import Image from "next/image";

export interface MessageMediaPreviewItem {
  type: "image" | "video";
  src: string;
  title?: string;
}

interface MessageMediaLightboxProps {
  item: MessageMediaPreviewItem | null;
  onClose: () => void;
}

export default function MessageMediaLightbox({
  item,
  onClose,
}: MessageMediaLightboxProps) {
  useEffect(() => {
    if (!item) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [item, onClose]);

  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/90 p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label="Xem trước media"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
        aria-label="Đóng"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>

      <div
        className="flex max-h-full max-w-full flex-col items-center gap-3"
        onClick={(event) => event.stopPropagation()}
      >
        {item.type === "image" ? (
          <Image
            src={item.src}
            alt={item.title || "Ảnh"}
            width={1200}
            height={1200}
            unoptimized
            className="max-h-[calc(100vh-6rem)] w-auto max-w-[min(100vw-2rem,1200px)] rounded-lg object-contain"
          />
        ) : (
          <video
            src={item.src}
            controls
            autoPlay
            playsInline
            className="max-h-[calc(100vh-6rem)] w-auto max-w-[min(100vw-2rem,1200px)] rounded-lg bg-black"
          >
            <track kind="captions" />
          </video>
        )}

        {item.title ? (
          <p className="max-w-[min(100vw-2rem,720px)] text-center text-sm text-white/80">
            {item.title}
          </p>
        ) : null}
      </div>
    </div>
  );
}