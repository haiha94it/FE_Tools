"use client";

import { ContactNameCell } from "@/components/zalo-contacts/shared/ContactAvatar";
import Button from "@/components/ui/button/Button";
import { Tooltip } from "@/components/ui/tooltip/Tooltip";
import { getGroupMemberDisplay } from "@/lib/zalo-contacts-utils";
import { toast } from "@/lib/toast";
import { zaloGroupService } from "@/services/zalo-group.service";
import type { ZaloGroupMember } from "@/types/zalo-contacts";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HiOutlineMagnifyingGlass } from "react-icons/hi2";

interface GroupMembersPanelProps {
  members: ZaloGroupMember[];
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  accountId?: number | null;
  groupId?: number | null;
  accountUid?: string | null;
  onAdminChanged?: () => void;
}

function isSelfCreator(
  members: ZaloGroupMember[],
  accountUid?: string | null,
): boolean {
  const uid = accountUid?.trim() ? String(accountUid) : null;
  if (!uid) return false;
  const self = members.find(
    (m) => m.friend?.uid && String(m.friend.uid) === uid,
  );
  return Boolean(self?.is_creator);
}

function memberSearchText(member: ZaloGroupMember): string {
  const { name } = getGroupMemberDisplay(member);
  const uid = member.friend?.uid ?? "";
  return `${name} ${uid}`.toLowerCase();
}

function GroupMembersPanel({
  members,
  isLoading,
  isRefreshing,
  onRefresh,
  accountId,
  groupId,
  accountUid,
  onAdminChanged,
}: GroupMembersPanelProps) {
  const [open, setOpen] = useState(false);
  const [busyAdminUid, setBusyAdminUid] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  const canManageAdmins = useMemo(
    () =>
      Boolean(accountId && groupId && isSelfCreator(members, accountUid)),
    [accountId, accountUid, groupId, members],
  );

  /** BE show-member đã trả full roster — chỉ lọc client, không cắt trang */
  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => memberSearchText(m).includes(q));
  }, [members, search]);

  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

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

  const handleAdmin = useCallback(
    async (member: ZaloGroupMember, action: "add" | "remove") => {
      if (!canManageAdmins || !accountId || !groupId) {
        toast.error("Chỉ trưởng nhóm mới được thêm/gỡ phó nhóm.");
        return;
      }
      const uid = member.friend?.uid;
      if (!uid) {
        toast.error("Thành viên thiếu UID — làm mới danh sách rồi thử lại.");
        return;
      }
      setBusyAdminUid(uid);
      try {
        const res =
          action === "add"
            ? await zaloGroupService.addGroupAdmin(accountId, groupId, uid)
            : await zaloGroupService.removeGroupAdmin(accountId, groupId, uid);
        if (!res.ok) {
          toast.error(res.message || "Thao tác phó nhóm thất bại.");
          return;
        }
        toast.success(
          action === "add" ? "Đã thêm phó nhóm." : "Đã gỡ phó nhóm.",
        );
        onAdminChanged?.();
        onRefresh();
      } catch {
        toast.error("Thao tác phó nhóm thất bại.");
      } finally {
        setBusyAdminUid(null);
      }
    },
    [accountId, canManageAdmins, groupId, onAdminChanged, onRefresh],
  );

  const memberCount = members.length;
  const countLabel = isLoading && memberCount === 0 ? "…" : String(memberCount);

  return (
    <div ref={panelRef} className="relative shrink-0">
      <Tooltip
        content={
          memberCount > 0
            ? `Thành viên nhóm (${memberCount})`
            : "Thành viên nhóm"
        }
        side="bottom"
      >
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-gray-200 px-2.5 text-xs font-medium text-gray-600 transition hover:border-brand-300 hover:text-brand-600 dark:border-gray-700 dark:text-gray-300 dark:hover:border-brand-500/40 dark:hover:text-brand-400"
          aria-label={`Thành viên nhóm, ${countLabel} người`}
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
          <span className="hidden sm:inline">Thành viên</span>
          <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-brand-50 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
            {countLabel}
          </span>
        </button>
      </Tooltip>

      {open ? (
        <div className="absolute top-[calc(100%+8px)] right-0 z-30 flex h-[min(82vh,580px)] w-[min(100vw-1.25rem,420px)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
          <div className="flex shrink-0 flex-col gap-2 border-b border-gray-100 px-3 py-2.5 dark:border-gray-800">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                  Thành viên nhóm
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isLoading
                    ? "Đang tải..."
                    : search.trim()
                      ? `${filteredMembers.length}/${members.length} khớp`
                      : `${members.length} thành viên`}
                  {canManageAdmins ? " · Gán/gỡ phó" : ""}
                </p>
              </div>
              <Tooltip
                content="Làm mới từ Zalo"
                side="left"
                avoidCollisions={false}
              >
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

            <div className="relative">
              <HiOutlineMagnifyingGlass
                className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-gray-400"
                aria-hidden
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên hoặc UID..."
                className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-500/15 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:placeholder:text-gray-500"
              />
            </div>
          </div>

          <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
            {isLoading && members.length === 0 ? (
              <div className="flex items-center justify-center py-10">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
              </div>
            ) : members.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                Chưa có dữ liệu thành viên. Bấm &quot;Làm mới&quot; để quét từ
                Zalo.
              </p>
            ) : filteredMembers.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                Không tìm thấy thành viên khớp &quot;{search.trim()}&quot;.
              </p>
            ) : (
              <ul className="space-y-1">
                {filteredMembers.map((member) => {
                  const { key, name, avatar } = getGroupMemberDisplay(member);
                  const uid = member.friend?.uid ?? "";
                  const busy = busyAdminUid === uid;
                  const roleBadge = member.is_creator
                    ? "Trưởng nhóm"
                    : member.is_admin
                      ? "Phó nhóm"
                      : null;

                  return (
                    <li
                      key={key}
                      className="flex items-center justify-between gap-2 rounded-xl px-2 py-2 hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                    >
                      <ContactNameCell name={name} avatar={avatar} />
                      <div className="flex shrink-0 items-center gap-1.5">
                        {roleBadge ? (
                          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-medium text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                            {roleBadge}
                          </span>
                        ) : null}
                        {canManageAdmins && !member.is_creator ? (
                          <Button
                            size="sm"
                            variant={member.is_admin ? "outline" : "primary"}
                            disabled={busy || !uid}
                            className="!min-h-0 !px-2 !py-1 text-[10px]"
                            onClick={() =>
                              void handleAdmin(
                                member,
                                member.is_admin ? "remove" : "add",
                              )
                            }
                          >
                            {busy
                              ? "..."
                              : member.is_admin
                                ? "Gỡ phó"
                                : "Thêm phó"}
                          </Button>
                        ) : null}
                      </div>
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
