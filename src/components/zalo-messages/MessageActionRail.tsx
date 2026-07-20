"use client";

import { Tooltip } from "@/components/ui/tooltip/Tooltip";
import { ZALO_REACTION_OPTIONS } from "@/lib/zalo-messenger-reactions";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { HiOutlineEllipsisVertical, HiOutlineInformationCircle } from "react-icons/hi2";
import { createPortal } from "react-dom";

const MOBILE_CHAT_MEDIA = "(max-width: 992px), (hover: none), (pointer: coarse)";

function useMessengerMobileUI() {
  const [isMobileUI, setIsMobileUI] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(MOBILE_CHAT_MEDIA).matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_CHAT_MEDIA);
    const sync = () => setIsMobileUI(mediaQuery.matches);
    sync();
    mediaQuery.addEventListener("change", sync);
    return () => mediaQuery.removeEventListener("change", sync);
  }, []);

  return isMobileUI;
}

function RailButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Tooltip content={label} side="top">
      <button
        type="button"
        aria-label={label}
        onClick={onClick}
        className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-gray-600 transition hover:bg-brand-50 hover:text-brand-600 dark:text-gray-300 dark:hover:bg-brand-500/10 dark:hover:text-brand-400"
      >
        {children}
      </button>
    </Tooltip>
  );
}

function ReactionPickerPanel({
  onPick,
  onClose,
}: {
  onPick: (reactionId: number) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="flex items-center gap-0.5 rounded-full border border-gray-200 bg-white px-2 py-1 shadow-xl dark:border-gray-700 dark:bg-gray-900"
      role="menu"
    >
      {ZALO_REACTION_OPTIONS.map((option) => (
        <Tooltip key={option.id} content={option.label} side="top">
          <button
            type="button"
            aria-label={option.label}
            onClick={() => onPick(option.id)}
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-lg transition hover:scale-110 hover:bg-gray-100 dark:hover:bg-white/[0.06]"
          >
            {option.emoji}
          </button>
        </Tooltip>
      ))}
    </div>
  );
}

function PortalReactionPicker({
  anchorRef,
  onPick,
  onClose,
  onMouseEnter,
  onMouseLeave,
}: {
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  onPick: (reactionId: number) => void;
  onClose: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  const [position, setPosition] = useState<{ left: number; top: number } | null>(
    null,
  );

  useEffect(() => {
    const syncPosition = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      setPosition({
        left: rect.left + rect.width / 2,
        top: rect.top - 8,
      });
    };

    syncPosition();
    window.addEventListener("resize", syncPosition);
    window.addEventListener("scroll", syncPosition, true);
    return () => {
      window.removeEventListener("resize", syncPosition);
      window.removeEventListener("scroll", syncPosition, true);
    };
  }, [anchorRef]);

  if (!position || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed z-[1200] -translate-x-1/2 -translate-y-full"
      style={{ left: position.left, top: position.top }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <ReactionPickerPanel onPick={onPick} onClose={onClose} />
    </div>,
    document.body,
  );
}

interface MobileActionSheetProps {
  open: boolean;
  own: boolean;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  children: React.ReactNode;
}

function PortalMobileActionSheet({
  open,
  own,
  anchorRef,
  onClose,
  children,
}: MobileActionSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    maxWidth: number;
  } | null>(null);

  useEffect(() => {
    if (!open) {
      setCoords(null);
      return undefined;
    }

    const syncPosition = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      const margin = 8;
      const menuWidth = 196;
      const maxWidth = Math.min(menuWidth, window.innerWidth - margin * 2);

      let left = own ? rect.right - maxWidth : rect.left;
      left = Math.max(margin, Math.min(left, window.innerWidth - maxWidth - margin));

      setCoords({
        top: rect.bottom + 6,
        left,
        maxWidth,
      });
    };

    syncPosition();
    window.addEventListener("resize", syncPosition);
    window.addEventListener("scroll", syncPosition, true);
    return () => {
      window.removeEventListener("resize", syncPosition);
      window.removeEventListener("scroll", syncPosition, true);
    };
  }, [open, own, anchorRef]);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (sheetRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      onClose();
    };

    const timerId = window.setTimeout(() => {
      document.addEventListener("pointerdown", handlePointerDown);
    }, 0);

    return () => {
      clearTimeout(timerId);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open, onClose, anchorRef]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || !coords || typeof document === "undefined") return null;

  return createPortal(
    <>
      <button
        type="button"
        aria-label="Đóng tùy chọn tin nhắn"
        className="fixed inset-0 z-[1190] cursor-default bg-black/25 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <div
        ref={sheetRef}
        role="menu"
        aria-label="Tùy chọn tin nhắn"
        className="fixed z-[1200] flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white py-1 shadow-2xl dark:border-gray-700 dark:bg-gray-900"
        style={{
          top: coords.top,
          left: coords.left,
          width: coords.maxWidth,
        }}
      >
        {children}
      </div>
    </>,
    document.body,
  );
}

interface MessageActionRailProps {
  own: boolean;
  canReply?: boolean;
  canShare?: boolean;
  canSaveVideo?: boolean;
  canSaveAlbum?: boolean;
  onReply?: () => void;
  onShare?: () => void;
  onReaction?: (reactionId: number) => void;
  onShowDetail?: () => void;
  onSaveVideo?: () => void;
  onSaveAlbum?: () => void;
}

const mobileMenuItemClass =
  "flex min-h-[44px] w-full cursor-pointer items-center gap-2.5 px-3.5 text-left text-sm text-gray-700 transition active:bg-gray-100 dark:text-gray-200 dark:active:bg-white/[0.06]";

export function MessageActionRail({
  own,
  canReply = true,
  canShare = false,
  canSaveVideo = false,
  canSaveAlbum = false,
  onReply,
  onShare,
  onReaction,
  onShowDetail,
  onSaveVideo,
  onSaveAlbum,
}: MessageActionRailProps) {
  const isMobileUI = useMessengerMobileUI();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const reactionBtnRef = useRef<HTMLButtonElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasActions = Boolean(
    onReply ||
      onShare ||
      onReaction ||
      onShowDetail ||
      (canSaveVideo && onSaveVideo) ||
      (canSaveAlbum && onSaveAlbum),
  );
  if (!hasActions) return null;

  const clearHoverTimer = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  };

  const handleReactionEnter = () => {
    clearHoverTimer();
    setPickerOpen(true);
  };

  const handleReactionLeave = () => {
    clearHoverTimer();
    hoverTimerRef.current = setTimeout(() => setPickerOpen(false), 200);
  };

  const closeSheet = () => setSheetOpen(false);

  const toggleSheet = (event: React.MouseEvent | React.PointerEvent) => {
    event.stopPropagation();
    setSheetOpen((prev) => !prev);
  };

  if (isMobileUI) {
    return (
      <>
        <button
          ref={menuBtnRef}
          type="button"
          aria-label="Tùy chọn tin nhắn"
          aria-expanded={sheetOpen}
          aria-haspopup="menu"
          onClick={toggleSheet}
          className={`absolute top-1/2 z-10 inline-flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white/95 text-gray-500 shadow-sm transition active:scale-95 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 ${
            own ? "-left-9" : "-right-9"
          }`}
        >
          <HiOutlineEllipsisVertical className="h-5 w-5" aria-hidden />
        </button>

        <PortalMobileActionSheet
          open={sheetOpen}
          own={own}
          anchorRef={menuBtnRef}
          onClose={closeSheet}
        >
          {canReply && onReply ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onReply();
                closeSheet();
              }}
              className={mobileMenuItemClass}
            >
              Trả lời
            </button>
          ) : null}
          {canShare && onShare ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onShare();
                closeSheet();
              }}
              className={mobileMenuItemClass}
            >
              Chia sẻ
            </button>
          ) : null}
          {canSaveVideo && onSaveVideo ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onSaveVideo();
                closeSheet();
              }}
              className={mobileMenuItemClass}
            >
              Lưu video
            </button>
          ) : null}
          {canSaveAlbum && onSaveAlbum ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onSaveAlbum();
                closeSheet();
              }}
              className={mobileMenuItemClass}
            >
              Lưu album
            </button>
          ) : null}
          {onShowDetail ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onShowDetail();
                closeSheet();
              }}
              className={`${mobileMenuItemClass} border-t border-gray-100 dark:border-gray-800`}
            >
              <HiOutlineInformationCircle className="h-4 w-4 shrink-0" aria-hidden />
              Chi tiết tin nhắn
            </button>
          ) : null}
          {onReaction ? (
            <div className="border-t border-gray-100 px-3 py-2.5 dark:border-gray-800">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                Cảm xúc
              </p>
              <div className="flex flex-wrap gap-1.5">
                {ZALO_REACTION_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    role="menuitem"
                    aria-label={option.label}
                    onClick={() => {
                      onReaction(option.id);
                      closeSheet();
                    }}
                    className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-gray-100 text-lg transition active:scale-95 active:bg-gray-100 dark:border-gray-800 dark:active:bg-white/[0.06]"
                  >
                    {option.emoji}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </PortalMobileActionSheet>
      </>
    );
  }

  return (
    <>
      <div
        className={`pointer-events-none absolute top-1/2 z-20 flex -translate-y-1/2 items-center gap-0.5 rounded-full border border-gray-200/90 bg-white/95 px-1 py-0.5 opacity-0 shadow-md backdrop-blur transition duration-150 group-hover/row:pointer-events-auto group-hover/row:opacity-100 group-focus-within/row:pointer-events-auto group-focus-within/row:opacity-100 dark:border-gray-700 dark:bg-gray-900/95 ${
          own ? "right-full mr-1.5" : "left-full ml-1.5"
        } ${pickerOpen ? "pointer-events-auto opacity-100" : ""}`}
        aria-label="Thao tác tin nhắn"
      >
        {onReaction ? (
          <div
            className="relative"
            onMouseEnter={handleReactionEnter}
            onMouseLeave={handleReactionLeave}
          >
            <Tooltip content="Cảm xúc" side="top">
              <button
                ref={reactionBtnRef}
                type="button"
                aria-label="Cảm xúc"
                onClick={() => onReaction(0)}
                className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-sm transition hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/10 dark:hover:text-brand-400"
              >
                👍
              </button>
            </Tooltip>
          </div>
        ) : null}

        {canShare && onShare ? (
          <RailButton label="Chia sẻ" onClick={onShare}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
              <path d="M16 6l-4-4-4 4" />
              <path d="M12 2v14" />
            </svg>
          </RailButton>
        ) : null}

        {canReply && onReply ? (
          <RailButton label="Trả lời" onClick={onReply}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
            </svg>
          </RailButton>
        ) : null}

        {canSaveVideo && onSaveVideo ? (
          <RailButton label="Lưu video" onClick={onSaveVideo}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <path d="M12 3v12" />
              <path d="m7 10 5 5 5-5" />
              <path d="M5 21h14" />
            </svg>
          </RailButton>
        ) : null}

        {canSaveAlbum && onSaveAlbum ? (
          <RailButton label="Lưu album" onClick={onSaveAlbum}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <path d="M17 14v7M14 17h7" />
            </svg>
          </RailButton>
        ) : null}

        {onShowDetail ? (
          <RailButton label="Chi tiết tin nhắn" onClick={onShowDetail}>
            <HiOutlineInformationCircle className="h-4 w-4" aria-hidden />
          </RailButton>
        ) : null}
      </div>

      {pickerOpen && onReaction ? (
        <PortalReactionPicker
          anchorRef={reactionBtnRef}
          onMouseEnter={handleReactionEnter}
          onMouseLeave={handleReactionLeave}
          onPick={(id) => {
            onReaction(id);
            setPickerOpen(false);
          }}
          onClose={() => setPickerOpen(false)}
        />
      ) : null}
    </>
  );
}