"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  isFullscreen?: boolean;
  layer?: "default" | "top";
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  className = "",
  showCloseButton = true,
  isFullscreen = false,
  layer = "default",
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen || !mounted || typeof document === "undefined") {
    return null;
  }

  const hasCustomMaxWidth = /\bmax-w-/.test(className);
  const defaultMaxWidth = hasCustomMaxWidth ? "" : "max-w-lg";

  const panelClasses = isFullscreen
    ? "relative z-10 h-full w-full"
    : `relative z-10 box-border flex h-auto max-h-[calc(100dvh-1rem)] w-full min-w-0 ${defaultMaxWidth} flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xl sm:max-h-[calc(100dvh-2rem)] sm:rounded-3xl dark:border-gray-800 dark:bg-gray-900 ${className}`;

  const layerClass = layer === "top" ? "z-[100001]" : "z-[99999]";

  return createPortal(
    <div
      className={`fixed inset-0 ${layerClass} flex items-center justify-center overflow-hidden overscroll-contain p-2 sm:p-4 md:p-6`}
      role="dialog"
      aria-modal="true"
    >
      {!isFullscreen ? (
        <div
          className="fixed inset-0 bg-gray-900/55 backdrop-blur-[2px]"
          onClick={onClose}
          aria-hidden
        />
      ) : null}
      <div
        ref={modalRef}
        className={panelClasses}
        onClick={(e) => e.stopPropagation()}
      >
        {showCloseButton ? (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-2 top-2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white sm:right-5 sm:top-5 sm:h-10 sm:w-10"
            aria-label="Đóng"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.04289 16.5413C5.65237 16.9318 5.65237 17.565 6.04289 17.9555C6.43342 18.346 7.06658 18.346 7.45711 17.9555L11.9987 13.4139L16.5408 17.956C16.9313 18.3466 17.5645 18.3466 17.955 17.956C18.3455 17.5655 18.3455 16.9323 17.955 16.5418L13.4129 11.9997L17.955 7.4576C18.3455 7.06707 18.3455 6.43391 17.955 6.04338C17.5645 5.65286 16.9313 5.65286 16.5408 6.04338L11.9987 10.5855L7.45711 6.0439C7.06658 5.65338 6.43342 5.65338 6.04289 6.0439C5.65237 6.43442 5.65237 7.06759 6.04289 7.45811L10.5845 11.9997L6.04289 16.5413Z"
                fill="currentColor"
              />
            </svg>
          </button>
        ) : null}
        {children}
      </div>
    </div>,
    document.body,
  );
};