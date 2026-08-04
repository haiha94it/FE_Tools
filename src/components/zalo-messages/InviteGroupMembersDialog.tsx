"use client";

import ContactAvatar from "@/components/zalo-contacts/shared/ContactAvatar";
import Button from "@/components/ui/button/Button";
import Checkbox from "@/components/form/input/Checkbox";
import { Modal } from "@/components/ui/modal";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  getZaloFriendDisplayName,
  getZaloGroupAvatar,
} from "@/lib/zalo-contacts-utils";
import { toast } from "@/lib/toast";
import { zaloFriendService } from "@/services/zalo-friend.service";
import { zaloGroupService } from "@/services/zalo-group.service";
import type { ZaloFriendItem, ZaloGroupMember } from "@/types/zalo-contacts";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { HiOutlineMagnifyingGlass, HiOutlineXMark } from "react-icons/hi2";

interface InviteGroupMembersDialogProps {
  open: boolean;
  accountId: number;
  groupId: number;
  /** Roster hiện tại — lọc bạn đã trong nhóm */
  members: ZaloGroupMember[];
  onClose: () => void;
  onInvited?: () => void;
}

function memberUidSet(members: ZaloGroupMember[]): Set<string> {
  const set = new Set<string>();
  for (const m of members) {
    const uid = m.friend?.uid;
    if (uid) set.add(String(uid));
  }
  return set;
}

function InviteGroupMembersDialog({
  open,
  accountId,
  groupId,
  members,
  onClose,
  onInvited,
}: InviteGroupMembersDialogProps) {
  const isCompact = useMediaQuery("(max-width: 1023px)");
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [friends, setFriends] = useState<ZaloFriendItem[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const inGroup = useMemo(() => memberUidSet(members), [members]);

  const loadFriends = useCallback(
    async (name?: string) => {
      setLoading(true);
      try {
        const page = await zaloFriendService.list({
          accountId,
          page: 1,
          pageSize: 200,
          name: name?.trim() || undefined,
        });
        let list = page.results ?? [];
        if (list.length) {
          try {
            const details = await zaloFriendService.fetchDetails(list);
            if (details.length) list = details;
          } catch {
            /* giữ list simple */
          }
        }
        setFriends(list);
      } catch {
        toast.error("Không tải được danh sách bạn bè.");
        setFriends([]);
      } finally {
        setLoading(false);
      }
    },
    [accountId],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setSelected(new Set());
      setFriends([]);
      return;
    }
    void loadFriends();
  }, [open, loadFriends]);

  const candidates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return friends.filter((f) => {
      const uid = f.uid?.trim();
      if (!uid || inGroup.has(uid)) return false;
      if (!q) return true;
      const name = getZaloFriendDisplayName(f).toLowerCase();
      return name.includes(q) || uid.toLowerCase().includes(q);
    });
  }, [friends, inGroup, search]);

  const allSelected =
    candidates.length > 0 &&
    candidates.every((f) => f.uid && selected.has(String(f.uid)));

  const toggleUid = (uid: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
      return;
    }
    setSelected(
      new Set(
        candidates.map((f) => f.uid).filter((u): u is string => Boolean(u)),
      ),
    );
  };

  const handleSubmit = async () => {
    const uids = Array.from(selected);
    if (!uids.length) {
      toast.error("Chọn ít nhất một bạn bè.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await zaloGroupService.inviteGroupMembers(
        accountId,
        groupId,
        uids,
      );
      if (!res.ok) {
        toast.error(res.message || "Mời vào nhóm thất bại.");
        return;
      }
      toast.success(res.message || `Đã mời ${uids.length} người.`);
      onInvited?.();
      onClose();
    } catch {
      toast.error("Mời vào nhóm thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const body = (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 px-4 pt-4 sm:px-5 sm:pt-5">
        {isCompact ? (
          <div className="mb-2 flex justify-center" aria-hidden>
            <span className="h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-600" />
          </div>
        ) : null}
        <div className="flex items-start justify-between gap-2 pr-8 sm:pr-10">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 sm:text-base dark:text-white">
              Thêm thành viên
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Chọn bạn bè chưa trong nhóm để mời tham gia.
            </p>
          </div>
        </div>

        <div className="relative mt-3">
          <HiOutlineMagnifyingGlass
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400"
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void loadFriends(search);
              }
            }}
            placeholder="Tìm bạn bè..."
            enterKeyHint="search"
            className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-10 pr-3 text-base text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-500/15 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:placeholder:text-gray-500 sm:h-9 sm:text-sm"
          />
        </div>

        <div className="mt-2 flex items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
          <button
            type="button"
            onClick={toggleAll}
            disabled={!candidates.length || loading}
            className="min-h-9 px-1 font-medium text-brand-600 active:opacity-70 disabled:opacity-40 dark:text-brand-400"
          >
            {allSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
          </button>
          <span className="tabular-nums">
            {selected.size} đã chọn
            {candidates.length ? ` · ${candidates.length} có thể mời` : ""}
          </span>
        </div>
      </div>

      <div className="custom-scrollbar mx-4 mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-xl border border-gray-100 dark:border-gray-800 sm:mx-5">
        {loading ? (
          <div className="flex items-center justify-center py-14">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          </div>
        ) : candidates.length === 0 ? (
          <p className="px-3 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
            {friends.length === 0
              ? "Chưa có bạn bè trên nick này."
              : "Không còn bạn bè nào ngoài nhóm (hoặc không khớp tìm kiếm)."}
          </p>
        ) : (
          <ul className="divide-y divide-gray-50 dark:divide-gray-800/80">
            {candidates.map((friend) => {
              const uid = String(friend.uid);
              const name = getZaloFriendDisplayName(friend);
              const avatar = getZaloGroupAvatar(friend);
              const checked = selected.has(uid);
              return (
                <li key={friend.id ?? uid}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleUid(uid)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleUid(uid);
                      }
                    }}
                    className="flex min-h-[56px] cursor-pointer items-center gap-3 px-3 py-3 active:bg-gray-50 dark:active:bg-white/[0.03] sm:min-h-0 sm:py-2.5 sm:hover:bg-gray-50 dark:sm:hover:bg-white/[0.03]"
                  >
                    <Checkbox
                      checked={checked}
                      onChange={() => toggleUid(uid)}
                    />
                    <ContactAvatar name={name} avatar={avatar} size="sm" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-800 dark:text-white/90">
                      {name}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-gray-100 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-gray-800 sm:flex-row sm:justify-end sm:px-5 sm:py-4">
        <Button
          size="sm"
          variant="outline"
          onClick={onClose}
          disabled={submitting}
          className="!h-11 w-full sm:!h-9 sm:w-auto"
        >
          Huỷ
        </Button>
        <Button
          size="sm"
          onClick={() => void handleSubmit()}
          disabled={submitting || selected.size === 0}
          className="!h-11 w-full sm:!h-9 sm:w-auto"
        >
          {submitting
            ? "Đang mời..."
            : selected.size
              ? `Mời ${selected.size} người`
              : "Mời vào nhóm"}
        </Button>
      </div>
    </div>
  );

  if (!open) return null;

  // Mobile/tablet: bottom sheet full-width
  if (isCompact && mounted) {
    return createPortal(
      <div
        className="fixed inset-0 z-[100003] flex flex-col justify-end"
        role="dialog"
        aria-modal="true"
        aria-label="Thêm thành viên"
      >
        <button
          type="button"
          className="absolute inset-0 bg-gray-900/50 backdrop-blur-[1px]"
          aria-label="Đóng"
          onClick={onClose}
        />
        <div className="relative z-10 flex max-h-[min(92dvh,720px)] w-full flex-col overflow-hidden rounded-t-3xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900 sm:mx-auto sm:max-w-lg">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500 active:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
            aria-label="Đóng"
          >
            <HiOutlineXMark className="h-5 w-5" />
          </button>
          {body}
        </div>
      </div>,
      document.body,
    );
  }

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      className="max-w-md"
      showCloseButton
      layer="top"
    >
      <div className="flex max-h-[min(80vh,560px)] flex-col">{body}</div>
    </Modal>
  );
}

export default memo(InviteGroupMembersDialog);
