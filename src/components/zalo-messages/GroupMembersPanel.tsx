"use client";

import { ContactNameCell } from "@/components/zalo-contacts/shared/ContactAvatar";
import Button from "@/components/ui/button/Button";
import { Tooltip } from "@/components/ui/tooltip/Tooltip";
import { getGroupMemberDisplay } from "@/lib/zalo-contacts-utils";
import type { ZaloGroupMember } from "@/types/zalo-contacts";
import { memo, useEffect, useRef, useState } from "react";

interface GroupMembersPanelProps {
  members: ZaloGroupMember[];
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
}

function GroupMembersPanel({
  members,
  isLoading,
  isRefreshing,
  onRefresh,
}: GroupMembersPanelProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={panelRef} className="relative shrink-0">
      <Tooltip content="Thành viên nhóm" side="bottom">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex h-9 items-center gap-1.5 rounded-xl border border-gray-200 px-2.5 text-xs font-medium text-gray-600 transition hover:border-brand-300 hover:text-brand-600 dark:border-gray-700 dark:text-gray-300 dark:hover:border-brand-500/40 dark:hover:text-brand-400"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span className="hidden xl:inline">Thành viên</span>
        </button>
      </Tooltip>

      {open ? (
        <div className="absolute top-[calc(100%+8px)] right-0 z-30 flex w-[min(100vw-2rem,320px)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-3 py-2.5 dark:border-gray-800">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                Thành viên nhóm
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isLoading
                  ? "Đang tải..."
                  : `${members.length} thành viên`}
              </p>
            </div>
            <Tooltip content="Làm mới từ Zalo" side="left">
              <Button
                size="sm"
                variant="outline"
                disabled={isRefreshing}
                onClick={() => void onRefresh()}
              >
                {isRefreshing ? (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                    Đang quét...
                  </span>
                ) : (
                  "Làm mới"
                )}
              </Button>
            </Tooltip>
          </div>

          <div className="custom-scrollbar max-h-72 overflow-y-auto overscroll-contain p-2">
            {isLoading && members.length === 0 ? (
              <div className="flex items-center justify-center py-10">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
              </div>
            ) : members.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                Chưa có dữ liệu thành viên. Bấm &quot;Làm mới&quot; để quét từ
                Zalo.
              </p>
            ) : (
              <ul className="space-y-1">
                {members.map((member) => {
                  const { key, name, avatar } = getGroupMemberDisplay(member);
                  const badges: string[] = [];
                  if (member.is_creator) badges.push("Trưởng nhóm");
                  else if (member.is_admin) badges.push("Phó nhóm");

                  return (
                    <li
                      key={key}
                      className="flex items-center justify-between gap-2 rounded-xl px-2 py-2 hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                    >
                      <ContactNameCell name={name} avatar={avatar} />
                      {badges.length > 0 ? (
                        <span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-medium text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                          {badges[0]}
                        </span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default memo(GroupMembersPanel);