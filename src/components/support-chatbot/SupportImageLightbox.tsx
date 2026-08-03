"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { FiX } from "react-icons/fi";

interface SupportImageLightboxProps {
  src: string | null;
  alt?: string;
  onClose: () => void;
}

/**
 * Full-screen image zoom (portal). Giữ đúng tỷ lệ ảnh (object-contain).
 * Esc / click nền / nút X để đóng — stop Esc không đóng modal cha.
 */
export default function SupportImageLightbox({
  src,
  alt = "Ảnh phóng to",
  onClose,
}: SupportImageLightboxProps) {
  useEffect(() => {
    if (!src) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      event.preventDefault();
      onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown, true);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [src, onClose]);

  if (!src || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-999999 flex items-center justify-center bg-black/90 p-4 sm:p-8"
      style={{ zIndex: 999999 }}
      role="dialog"
      aria-modal="true"
      aria-label="Xem ảnh phóng to"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
        aria-label="Đóng"
      >
        <FiX size={20} />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="max-h-[calc(100vh-4rem)] max-w-[min(100vw-2rem,1200px)] rounded-lg object-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>,
    document.body,
  );
}
