"use client";

import ContactAvatar from "@/components/zalo-contacts/shared/ContactAvatar";
import Button from "@/components/ui/button/Button";
import Checkbox from "@/components/form/input/Checkbox";
import { Modal } from "@/components/ui/modal";
import {
  getZaloFriendDisplayName,
  getZaloGroupAvatar,
} from "@/lib/zalo-contacts-utils";
import { toast } from "@/lib/toast";
import { zaloFriendService } from "@/services/zalo-friend.service";
import { zaloGroupService } from "@/services/zalo-group.service";
import type { ZaloFriendItem, ZaloGroupMember } from "@/types/zalo-contacts";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { HiOutlineMagnifyingGlass } from "react-icons/hi2";

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
        // hydrate avatar khi list simple thiếu ảnh
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

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      className="max-w-md"
      showCloseButton
      layer="top"
    >
      <div className="flex max-h-[min(80vh,560px)] flex-col p-5 sm:p-6">
        <div className="shrink-0">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Thêm thành viên
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Chọn bạn bè chưa trong nhóm để mời tham gia.
          </p>

          <div className="relative mt-3">
            <HiOutlineMagnifyingGlass
              className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-gray-400"
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
              className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-500/15 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:placeholder:text-gray-500"
            />
          </div>

          <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <button
              type="button"
              onClick={toggleAll}
              disabled={!candidates.length || loading}
              className="font-medium text-brand-600 hover:underline disabled:opacity-40 dark:text-brand-400"
            >
              {allSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
            </button>
            <span>
              {selected.size} đã chọn
              {candidates.length ? ` · ${candidates.length} có thể mời` : ""}
            </span>
          </div>
        </div>

        <div className="custom-scrollbar mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-xl border border-gray-100 dark:border-gray-800">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            </div>
          ) : candidates.length === 0 ? (
            <p className="px-3 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
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
                      className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-white/[0.03]"
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

        <div className="mt-4 flex shrink-0 justify-end gap-2">
          <Button size="sm" variant="outline" onClick={onClose} disabled={submitting}>
            Huỷ
          </Button>
          <Button
            size="sm"
            onClick={() => void handleSubmit()}
            disabled={submitting || selected.size === 0}
          >
            {submitting
              ? "Đang mời..."
              : selected.size
                ? `Mời ${selected.size} người`
                : "Mời vào nhóm"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default memo(InviteGroupMembersDialog);
