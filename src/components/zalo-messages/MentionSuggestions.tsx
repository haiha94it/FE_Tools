"use client";

import ContactAvatar from "@/components/zalo-contacts/shared/ContactAvatar";
import {
  filterMentionSuggestions,
  getGroupMemberAvatar,
  getGroupMemberName,
} from "@/lib/zalo-messenger-mention-utils";
import type { ZaloGroupMember } from "@/types/zalo-contacts";
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

interface MentionSuggestionsProps {
  anchorRef: React.RefObject<HTMLElement | null>;
  text: string;
  members: ZaloGroupMember[];
  taggedMemberIds: number[];
  onSelectMember: (member: ZaloGroupMember) => void;
  onSelectAll: () => void;
  activeIndex?: number;
}

export default function MentionSuggestions({
  anchorRef,
  text,
  members,
  taggedMemberIds,
  onSelectMember,
  onSelectAll,
  activeIndex = 0,
}: MentionSuggestionsProps) {
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties | null>(null);

  const mentionQuery = useMemo(() => {
    const match = text.match(/(?:^|\s)@(\S*)$/);
    return match ? match[1] : null;
  }, [text]);

  const suggestions = useMemo(() => {
    if (mentionQuery === null) return [];
    return filterMentionSuggestions(members, mentionQuery, taggedMemberIds).slice(
      0,
      8,
    );
  }, [members, mentionQuery, taggedMemberIds]);

  const isOpen =
    mentionQuery !== null &&
    (suggestions.length > 0 || mentionQuery === "");

  const updatePanelPosition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    const panelWidth = Math.max(rect.width * 0.55, 240);

    setPanelStyle({
      position: "fixed",
      left: rect.left,
      bottom: Math.max(window.innerHeight - rect.top + 8, 8),
      width: panelWidth,
      zIndex: 60,
    });
  }, [anchorRef]);

  useLayoutEffect(() => {
    if (!isOpen) {
      setPanelStyle(null);
      return undefined;
    }

    updatePanelPosition();
    window.addEventListener("resize", updatePanelPosition);
    window.addEventListener("scroll", updatePanelPosition, true);

    return () => {
      window.removeEventListener("resize", updatePanelPosition);
      window.removeEventListener("scroll", updatePanelPosition, true);
    };
  }, [isOpen, suggestions.length, updatePanelPosition]);

  useEffect(() => {
    if (!isOpen) setPanelStyle(null);
  }, [isOpen]);

  if (!isOpen || !panelStyle || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      style={panelStyle}
      className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900"
    >
      <button
        type="button"
        onClick={onSelectAll}
        className={`flex w-full items-center gap-3 border-b border-gray-100 px-4 py-3 text-left transition hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.03] ${
          activeIndex === 0
            ? "border-l-2 border-brand-500 bg-brand-50/50 dark:bg-brand-500/10"
            : ""
        }`}
      >
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
          @
        </span>
        <span className="text-sm font-semibold text-gray-800 dark:text-white/90">
          Báo cho cả nhóm @All
        </span>
      </button>
      {suggestions.map((member, idx) => {
        const itemIndex = idx + 1;
        return (
          <button
            key={member.id}
            type="button"
            onClick={() => onSelectMember(member)}
            className={`flex w-full items-center gap-3 border-b border-gray-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.03] ${
              itemIndex === activeIndex
                ? "border-l-2 border-brand-500 bg-brand-50/50 dark:bg-brand-500/10"
                : ""
            }`}
          >
            <ContactAvatar
              name={getGroupMemberName(member)}
              avatar={getGroupMemberAvatar(member)}
              size="sm"
            />
            <span className="truncate text-sm font-medium text-gray-800 dark:text-white/90">
              {getGroupMemberName(member)}
            </span>
          </button>
        );
      })}
    </div>,
    document.body,
  );
}