"use client";

import AddFriendMessageDialog from "./AddFriendMessageDialog";
import InviteGroupMembersDialog from "./InviteGroupMembersDialog";
import { ContactNameCell } from "@/components/zalo-contacts/shared/ContactAvatar";
import Button from "@/components/ui/button/Button";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { Tooltip } from "@/components/ui/tooltip/Tooltip";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useScanTaskPoll } from "@/hooks/use-scan-task-poll";
import {
  getGroupMemberDisplay,
  getScanTaskStatus,
  isScanTaskDone,
} from "@/lib/zalo-contacts-utils";
import { toast } from "@/lib/toast";
import { zaloFriendService } from "@/services/zalo-friend.service";
import { zaloGroupService } from "@/services/zalo-group.service";
import type { ScanTaskResponse, ZaloGroupMember } from "@/types/zalo-contacts";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  HiOutlineEllipsisHorizontal,
  HiOutlineMagnifyingGlass,
  HiOutlineUserPlus,
  HiOutlineXMark,
  HiOutlineArrowPath,
} from "react-icons/hi2";

/** ≤1023px + touch-first: sheet full; desktop: popover */
const COMPACT_MEDIA = "(max-width: 1023px)";

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

function findSelfMember(
  members: ZaloGroupMember[],
  accountUid?: string | null,
): ZaloGroupMember | null {
  const uid = accountUid?.trim() ? String(accountUid) : null;
  if (!uid) return null;
  return (
    members.find((m) => m.friend?.uid && String(m.friend.uid) === uid) ?? null
  );
}

function isSelfCreator(
  members: ZaloGroupMember[],
  accountUid?: string | null,
): boolean {
  return Boolean(findSelfMember(members, accountUid)?.is_creator);
}

function isSelfAdminOrCreator(
  members: ZaloGroupMember[],
  accountUid?: string | null,
): boolean {
  const self = findSelfMember(members, accountUid);
  return Boolean(self?.is_creator || self?.is_admin);
}

function memberSearchText(member: ZaloGroupMember): string {
  const { name } = getGroupMemberDisplay(member);
  const uid = member.friend?.uid ?? "";
  return `${name} ${uid}`.toLowerCase();
}

function isMemberSelf(
  member: ZaloGroupMember,
  accountUid?: string | null,
): boolean {
  const uid = accountUid?.trim() ? String(accountUid) : null;
  if (!uid || !member.friend?.uid) return false;
  return String(member.friend.uid) === uid;
}

/** Đã là bạn (relation_status=1 / is_friend) → ẩn nút Kết bạn. */
function isAlreadyFriend(member: ZaloGroupMember): boolean {
  const fr = member.friend;
  if (!fr) return false;
  const flag = fr.is_friend as unknown;
  if (flag === true || flag === 1 || flag === "1") return true;
  const status = Number(fr.relation_status);
  return Number.isFinite(status) && status === 1;
}

function canShowAddFriend(
  member: ZaloGroupMember,
  accountUid?: string | null,
): boolean {
  if (isMemberSelf(member, accountUid)) return false;
  if (!member.friend?.uid) return false;
  return !isAlreadyFriend(member);
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
  const isCompact = useMediaQuery(COMPACT_MEDIA);
  const [open, setOpen] = useState(false);
  const [busyUid, setBusyUid] = useState<string | null>(null);
  const [menuKey, setMenuKey] = useState<string | number | null>(null);
  const [menuMember, setMenuMember] = useState<ZaloGroupMember | null>(null);
  const [search, setSearch] = useState("");
  const [addFriendTarget, setAddFriendTarget] = useState<{
    uid: string;
    name: string;
  } | null>(null);
  const [addFriendTaskId, setAddFriendTaskId] = useState<string | number | null>(
    null,
  );
  const [inviteOpen, setInviteOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const canManageAdmins = useMemo(
    () =>
      Boolean(accountId && groupId && isSelfCreator(members, accountUid)),
    [accountId, accountUid, groupId, members],
  );

  const canKickMembers = useMemo(
    () =>
      Boolean(
        accountId && groupId && isSelfAdminOrCreator(members, accountUid),
      ),
    [accountId, accountUid, groupId, members],
  );

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => memberSearchText(m).includes(q));
  }, [members, search]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setMenuKey(null);
      setMenuMember(null);
    }
  }, [open]);

  // Body scroll lock khi sheet/popover mở (mobile/tablet)
  useEffect(() => {
    if (!open || !isCompact) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, isCompact]);

  // Escape đóng
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (menuMember) {
          setMenuMember(null);
          setMenuKey(null);
          return;
        }
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, menuMember]);

  // Desktop: click outside popover
  useEffect(() => {
    if (!open || isCompact) return undefined;
    const handleClickOutside = (event: MouseEvent) => {
      const t = event.target as Node;
      if (panelRef.current?.contains(t)) return;
      if (triggerRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, isCompact]);

  const afterMutation = useCallback(() => {
    onAdminChanged?.();
    onRefresh();
  }, [onAdminChanged, onRefresh]);

  const closeMenus = useCallback(() => {
    setMenuKey(null);
    setMenuMember(null);
  }, []);

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
      closeMenus();
      setBusyUid(uid);
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
        afterMutation();
      } catch {
        toast.error("Thao tác phó nhóm thất bại.");
      } finally {
        setBusyUid(null);
      }
    },
    [accountId, afterMutation, canManageAdmins, closeMenus, groupId],
  );

  const handleKick = useCallback(
    async (member: ZaloGroupMember) => {
      if (!canKickMembers || !accountId || !groupId) {
        toast.error("Không đủ quyền xóa thành viên khỏi nhóm.");
        return;
      }
      const uid = member.friend?.uid;
      if (!uid) {
        toast.error("Thành viên thiếu UID — làm mới danh sách rồi thử lại.");
        return;
      }
      const { name } = getGroupMemberDisplay(member);
      if (!window.confirm(`Xóa ${name} khỏi nhóm?`)) return;

      closeMenus();
      setBusyUid(uid);
      try {
        const res = await zaloGroupService.removeGroupMembers(
          accountId,
          groupId,
          [uid],
        );
        if (!res.ok) {
          toast.error(res.message || "Xóa thành viên thất bại.");
          return;
        }
        toast.success(res.message || "Đã xóa thành viên khỏi nhóm.");
        afterMutation();
      } catch {
        toast.error("Xóa thành viên thất bại.");
      } finally {
        setBusyUid(null);
      }
    },
    [accountId, afterMutation, canKickMembers, closeMenus, groupId],
  );

  const handleAddFriendResult = useCallback(
    (result: ScanTaskResponse) => {
      const status = getScanTaskStatus(result);
      if (!isScanTaskDone(status)) return;
      setAddFriendTaskId(null);
      setBusyUid(null);
      if (status === "SUCCESS") {
        toast.success("Đã gửi lời mời kết bạn.");
        afterMutation();
        return;
      }
      toast.error(
        result.message || result.error || "Không gửi được lời mời kết bạn.",
      );
    },
    [afterMutation],
  );

  useScanTaskPoll({
    taskId: addFriendTaskId,
    poll: (id) => zaloFriendService.pollAddFriend(id),
    onResult: handleAddFriendResult,
  });

  const submitAddFriend = useCallback(
    async (message: string) => {
      if (!accountId || !addFriendTarget) return;
      const { uid, name } = addFriendTarget;
      setAddFriendTarget(null);
      setBusyUid(uid);
      try {
        const id = await zaloFriendService.startAddFriend(
          accountId,
          [uid],
          message,
        );
        if (!id) {
          setBusyUid(null);
          toast.error("Không nhận được mã tác vụ.");
          return;
        }
        setAddFriendTaskId(id);
        toast.info(`Đang gửi lời mời tới ${name}...`);
      } catch {
        setBusyUid(null);
        toast.error("Không gửi được lời mời kết bạn.");
      }
    },
    [accountId, addFriendTarget],
  );

  const openMemberMenu = (member: ZaloGroupMember, key: string | number) => {
    if (isCompact) {
      setMenuMember(member);
      setMenuKey(key);
      return;
    }
    setMenuKey((prev) => (prev === key ? null : key));
    setMenuMember(null);
  };

  const memberCount = members.length;
  const countLabel = isLoading && memberCount === 0 ? "…" : String(memberCount);

  const subtitle = isLoading
    ? "Đang tải..."
    : search.trim()
      ? `${filteredMembers.length}/${members.length} khớp`
      : `${members.length} thành viên`;

  const memberList = (
    <>
      {isLoading && members.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        </div>
      ) : members.length === 0 ? (
        <p className="px-3 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
          Chưa có dữ liệu thành viên. Bấm &quot;Làm mới&quot; để quét từ Zalo.
        </p>
      ) : filteredMembers.length === 0 ? (
        <p className="px-3 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
          Không tìm thấy thành viên khớp &quot;{search.trim()}&quot;.
        </p>
      ) : (
        <ul className="space-y-0.5">
          {filteredMembers.map((member) => {
            const { key, name, avatar } = getGroupMemberDisplay(member);
            const uid = member.friend?.uid ?? "";
            const busy = busyUid === uid;
            const roleBadge = member.is_creator
              ? "Trưởng nhóm"
              : member.is_admin
                ? "Phó nhóm"
                : null;
            const showAddFriend =
              Boolean(accountId) && canShowAddFriend(member, accountUid);
            const showMenu =
              !member.is_creator &&
              (canManageAdmins || canKickMembers) &&
              Boolean(uid);

            return (
              <li
                key={key}
                className="flex min-h-[52px] items-center gap-2 rounded-xl px-2 py-2.5 active:bg-gray-50 sm:min-h-0 sm:py-2 dark:active:bg-white/[0.04] sm:hover:bg-gray-50 dark:sm:hover:bg-white/[0.03]"
              >
                <div className="min-w-0 flex-1">
                  <ContactNameCell name={name} avatar={avatar} />
                  {roleBadge ? (
                    <p className="mt-0.5 pl-11 text-[11px] font-medium text-gray-400 dark:text-gray-500">
                      {roleBadge}
                    </p>
                  ) : null}
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  {busy ? (
                    <span className="inline-flex h-10 w-10 items-center justify-center sm:h-7 sm:w-7">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent sm:h-3.5 sm:w-3.5" />
                    </span>
                  ) : null}

                  {showAddFriend && !busy ? (
                    <button
                      type="button"
                      disabled={!uid}
                      onClick={() => setAddFriendTarget({ uid, name })}
                      className="inline-flex h-10 min-w-[4.5rem] items-center justify-center rounded-xl bg-[#0068FF] px-3 text-xs font-semibold text-white transition active:scale-[0.98] hover:bg-[#0055d4] disabled:opacity-50 sm:h-8 sm:min-w-0 sm:rounded-lg sm:px-2.5 sm:text-[11px]"
                    >
                      Kết bạn
                    </button>
                  ) : null}

                  {showMenu ? (
                    <div className="relative">
                      <button
                        type="button"
                        disabled={busy || !uid}
                        aria-label={`Tuỳ chọn ${name}`}
                        aria-expanded={menuKey === key}
                        className="dropdown-toggle inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-500 transition active:bg-gray-100 disabled:opacity-40 sm:h-8 sm:w-8 dark:text-gray-400 dark:active:bg-white/[0.08] sm:hover:bg-gray-100 sm:hover:text-gray-700 dark:sm:hover:bg-white/[0.06]"
                        onClick={() => openMemberMenu(member, key)}
                      >
                        <HiOutlineEllipsisHorizontal
                          className="h-6 w-6 sm:h-5 sm:w-5"
                          aria-hidden
                        />
                      </button>
                      {!isCompact ? (
                        <Dropdown
                          isOpen={menuKey === key}
                          onClose={() => setMenuKey(null)}
                          className="right-0 mt-1 w-48 py-1"
                        >
                          {canManageAdmins ? (
                            <DropdownItem
                              onClick={() =>
                                void handleAdmin(
                                  member,
                                  member.is_admin ? "remove" : "add",
                                )
                              }
                              className="!px-3 !py-2.5 text-sm text-gray-700 dark:text-gray-200"
                            >
                              {member.is_admin
                                ? "Gỡ phó nhóm"
                                : "Thêm phó nhóm"}
                            </DropdownItem>
                          ) : null}
                          {canKickMembers ? (
                            <DropdownItem
                              onClick={() => void handleKick(member)}
                              className="!px-3 !py-2.5 text-sm !text-error-600 hover:!bg-error-50 dark:hover:!bg-error-500/10"
                            >
                              Xóa khỏi nhóm
                            </DropdownItem>
                          ) : null}
                        </Dropdown>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );

  const headerActions = (
    <div className="flex shrink-0 items-center gap-1.5">
      {accountId && groupId ? (
        <Button
          size="sm"
          variant="outline"
          className="!h-10 !min-w-10 !px-2.5 sm:!h-9"
          onClick={() => setInviteOpen(true)}
          aria-label="Thêm thành viên vào nhóm"
        >
          <HiOutlineUserPlus className="h-4 w-4" aria-hidden />
          <span className="ml-1 hidden min-[380px]:inline sm:inline">Thêm</span>
        </Button>
      ) : null}
      <Button
        size="sm"
        variant="outline"
        disabled={isRefreshing}
        className="!h-10 !px-2.5 sm:!h-9"
        onClick={() => void onRefresh()}
        aria-label="Làm mới danh sách thành viên"
      >
        {isRefreshing ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            <span className="hidden sm:inline">Đang quét...</span>
          </span>
        ) : (
          <>
            <HiOutlineArrowPath className="h-4 w-4 sm:hidden" aria-hidden />
            <span className="hidden sm:inline">Làm mới</span>
          </>
        )}
      </Button>
    </div>
  );

  const panelBody = (
    <>
      <div className="flex shrink-0 flex-col gap-2 border-b border-gray-100 px-3 py-3 dark:border-gray-800 sm:px-3 sm:py-2.5">
        {/* drag handle — mobile sheet */}
        {isCompact ? (
          <div className="flex justify-center pb-0.5" aria-hidden>
            <span className="h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-600" />
          </div>
        ) : null}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-base font-semibold text-gray-800 sm:text-sm dark:text-white/90">
                Thành viên nhóm
              </p>
              {isCompact ? (
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-500 active:bg-gray-100 dark:text-gray-400 dark:active:bg-white/[0.06] sm:hidden"
                  aria-label="Đóng"
                >
                  <HiOutlineXMark className="h-5 w-5" />
                </button>
              ) : null}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
          </div>
          <div className={isCompact ? "hidden min-[360px]:flex" : "flex"}>
            {headerActions}
          </div>
        </div>
        {/* màn hẹp: nút Thêm / Làm mới full hàng */}
        {isCompact ? (
          <div className="flex min-[360px]:hidden">{headerActions}</div>
        ) : null}

        <div className="relative">
          <HiOutlineMagnifyingGlass
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400 sm:left-2.5"
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên hoặc UID..."
            enterKeyHint="search"
            className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-10 pr-3 text-base text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-500/15 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:placeholder:text-gray-500 sm:h-9 sm:rounded-lg sm:pl-8 sm:text-sm"
          />
        </div>
      </div>

      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {memberList}
      </div>
    </>
  );

  const compactSheet =
    open && isCompact && mounted
      ? createPortal(
          <div
            className="fixed inset-0 z-[100002] flex flex-col justify-end"
            role="dialog"
            aria-modal="true"
            aria-label="Thành viên nhóm"
          >
            <button
              type="button"
              className="absolute inset-0 bg-gray-900/50 backdrop-blur-[1px]"
              aria-label="Đóng danh sách thành viên"
              onClick={() => setOpen(false)}
            />
            <div
              ref={panelRef}
              className="relative z-10 flex max-h-[min(92dvh,720px)] w-full flex-col overflow-hidden rounded-t-3xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900 sm:mx-auto sm:max-w-lg sm:rounded-t-2xl"
            >
              {panelBody}
            </div>

            {/* Action sheet tuỳ chọn thành viên */}
            {menuMember ? (
              <div className="absolute inset-0 z-20 flex flex-col justify-end">
                <button
                  type="button"
                  className="absolute inset-0 bg-black/30"
                  aria-label="Đóng menu"
                  onClick={closeMenus}
                />
                <div className="relative z-10 mx-auto w-full max-w-lg px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                  <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
                    <p className="truncate border-b border-gray-100 px-4 py-3 text-center text-sm font-medium text-gray-500 dark:border-gray-800 dark:text-gray-400">
                      {getGroupMemberDisplay(menuMember).name}
                    </p>
                    {canManageAdmins ? (
                      <button
                        type="button"
                        className="flex min-h-12 w-full items-center justify-center px-4 py-3 text-base font-medium text-gray-800 active:bg-gray-50 dark:text-white/90 dark:active:bg-white/[0.04]"
                        onClick={() =>
                          void handleAdmin(
                            menuMember,
                            menuMember.is_admin ? "remove" : "add",
                          )
                        }
                      >
                        {menuMember.is_admin
                          ? "Gỡ phó nhóm"
                          : "Thêm phó nhóm"}
                      </button>
                    ) : null}
                    {canKickMembers ? (
                      <button
                        type="button"
                        className="flex min-h-12 w-full items-center justify-center border-t border-gray-100 px-4 py-3 text-base font-medium text-error-600 active:bg-error-50 dark:border-gray-800 dark:active:bg-error-500/10"
                        onClick={() => void handleKick(menuMember)}
                      >
                        Xóa khỏi nhóm
                      </button>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    className="mt-2 flex min-h-12 w-full items-center justify-center rounded-2xl border border-gray-200 bg-white text-base font-semibold text-gray-800 shadow-sm active:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                    onClick={closeMenus}
                  >
                    Huỷ
                  </button>
                </div>
              </div>
            ) : null}
          </div>,
          document.body,
        )
      : null;

  const desktopPopover =
    open && !isCompact ? (
      <div
        ref={panelRef}
        className="absolute top-[calc(100%+8px)] right-0 z-30 flex h-[min(82vh,580px)] w-[min(100vw-1.25rem,420px)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900"
      >
        {panelBody}
      </div>
    ) : null;

  return (
    <div className="relative shrink-0">
      <Tooltip
        content={
          memberCount > 0
            ? `Thành viên nhóm (${memberCount})`
            : "Thành viên nhóm"
        }
        side="bottom"
      >
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex h-10 min-w-10 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-gray-200 px-2.5 text-xs font-medium text-gray-600 transition hover:border-brand-300 hover:text-brand-600 active:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:border-brand-500/40 dark:hover:text-brand-400 sm:h-9"
          aria-label={`Thành viên nhóm, ${countLabel} người`}
          aria-expanded={open}
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

      {compactSheet}
      {desktopPopover}

      <AddFriendMessageDialog
        open={Boolean(addFriendTarget)}
        friendName={addFriendTarget?.name}
        onClose={() => setAddFriendTarget(null)}
        onSubmit={(msg) => void submitAddFriend(msg)}
      />

      {accountId && groupId ? (
        <InviteGroupMembersDialog
          open={inviteOpen}
          accountId={accountId}
          groupId={groupId}
          members={members}
          onClose={() => setInviteOpen(false)}
          onInvited={() => {
            afterMutation();
          }}
        />
      ) : null}
    </div>
  );
}

export default memo(GroupMembersPanel);
