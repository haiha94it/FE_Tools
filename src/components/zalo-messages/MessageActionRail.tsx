"use client";

import { Tooltip } from "@/components/ui/tooltip/Tooltip";
import { ZALO_REACTION_OPTIONS } from "@/lib/zalo-messenger-reactions";
import { useEffect, useRef, useState, type ReactNode } from "react";
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
    const handlePointerDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
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

interface MessageActionRailProps {
  own: boolean;
  canReply?: boolean;
  canShare?: boolean;
  onReply?: () => void;
  onShare?: () => void;
  onReaction?: (reactionId: number) => void;
}

export function MessageActionRail({
  own,
  canReply = true,
  canShare = false,
  onReply,
  onShare,
  onReaction,
}: MessageActionRailProps) {
  const isMobileUI = useMessengerMobileUI();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const reactionBtnRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!sheetOpen) return undefined;
    const handlePointerDown = (event: MouseEvent) => {
      if (sheetRef.current?.contains(event.target as Node)) return;
      setSheetOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [sheetOpen]);

  const hasActions = Boolean(onReply || onShare || onReaction);
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

  if (isMobileUI) {
    return (
      <>
        <button
          type="button"
          aria-label="Tùy chọn tin nhắn"
          aria-expanded={sheetOpen}
          onClick={() => setSheetOpen((prev) => !prev)}
          className={`absolute top-1 z-10 inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white/95 text-xs text-gray-500 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 ${
            own ? "-left-9" : "-right-9"
          }`}
        >
          ⋮
        </button>

        {sheetOpen ? (
          <div
            ref={sheetRef}
            className={`absolute z-20 flex min-w-[148px] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-xl dark:border-gray-700 dark:bg-gray-900 ${
              own ? "top-8 right-0" : "top-8 left-0"
            }`}
          >
            {canReply && onReply ? (
              <button
                type="button"
                onClick={() => {
                  onReply();
                  setSheetOpen(false);
                }}
                className="px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/[0.04]"
              >
                Trả lời
              </button>
            ) : null}
            {canShare && onShare ? (
              <button
                type="button"
                onClick={() => {
                  onShare();
                  setSheetOpen(false);
                }}
                className="px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/[0.04]"
              >
                Chia sẻ
              </button>
            ) : null}
            {onReaction ? (
              <div className="flex flex-wrap gap-1 border-t border-gray-100 px-2 py-2 dark:border-gray-800">
                {ZALO_REACTION_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    aria-label={option.label}
                    onClick={() => {
                      onReaction(option.id);
                      setSheetOpen(false);
                    }}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-lg hover:bg-gray-100 dark:hover:bg-white/[0.06]"
                  >
                    {option.emoji}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
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