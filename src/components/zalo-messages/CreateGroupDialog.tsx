"use client";

import ContactAvatar from "@/components/zalo-contacts/shared/ContactAvatar";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import { Modal } from "@/components/ui/modal";
import {
  CREATE_GROUP_SEARCH_DEBOUNCE_MS,
  filterFriendsForCreateGroup,
  getFriendDisplayName,
  hasMoreFriendPages,
  isFriendListNearBottom,
  shouldLoadMoreFriendsOnScroll,
  validateCreateGroupInput,
} from "@/lib/zalo-messenger-create-group-utils";
import { toast } from "@/lib/toast";
import { useZaloMessengerStore } from "@/stores/use-zalo-messenger-store";
import type { ZaloFriendItem } from "@/types/zalo-contacts";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

interface CreateGroupDialogProps {
  open: boolean;
  accountId: number;
  onClose: () => void;
  /** conversationId có thể thiếu nếu BE chỉ trả groupId Zalo (số quá lớn) */
  onCreated: (conversationId?: number) => void;
}

function CreateGroupDialog({
  open,
  accountId,
  onClose,
  onCreated,
}: CreateGroupDialogProps) {
  const fetchFriendsForCreateGroup = useZaloMessengerStore(
    (s) => s.fetchFriendsForCreateGroup,
  );
  const createZaloGroup = useZaloMessengerStore((s) => s.createZaloGroup);

  const [groupName, setGroupName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [friends, setFriends] = useState<ZaloFriendItem[]>([]);
  const [hasMoreFriends, setHasMoreFriends] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<ZaloFriendItem[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [creating, setCreating] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const currentPageRef = useRef(1);
  const appliedSearchRef = useRef("");
  const loadingMoreRef = useRef(false);
  const userHasScrolledRef = useRef(false);
  const allowLoadAtBottomRef = useRef(true);

  const resetState = useCallback(() => {
    setGroupName("");
    setSearchQuery("");
    appliedSearchRef.current = "";
    setFriends([]);
    setHasMoreFriends(false);
    setSelectedMembers([]);
    setLoadingFriends(false);
    setLoadingMore(false);
    setCreating(false);
    currentPageRef.current = 1;
    loadingMoreRef.current = false;
    userHasScrolledRef.current = false;
    allowLoadAtBottomRef.current = true;
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [onClose, resetState]);

  const loadFriends = useCallback(
    async (search: string, page = 1, append = false) => {
      if (append) {
        if (loadingMoreRef.current) return;
        loadingMoreRef.current = true;
        setLoadingMore(true);
        allowLoadAtBottomRef.current = false;
      } else {
        setLoadingFriends(true);
        currentPageRef.current = 1;
        userHasScrolledRef.current = false;
        allowLoadAtBottomRef.current = true;
      }

      try {
        const result = await fetchFriendsForCreateGroup(accountId, { search, page });
        const selectable = filterFriendsForCreateGroup(result.results ?? []);
        setFriends((current) =>
          append ? [...current, ...selectable] : selectable,
        );
        currentPageRef.current = page;
        setHasMoreFriends(hasMoreFriendPages(result.next));
      } catch {
        if (!append) {
          setFriends([]);
          setHasMoreFriends(false);
        }
        toast.error("Không tải được danh sách bạn bè.");
      } finally {
        if (append) {
          loadingMoreRef.current = false;
          setLoadingMore(false);
        } else {
          setLoadingFriends(false);
        }
      }
    },
    [accountId, fetchFriendsForCreateGroup],
  );

  useEffect(() => {
    if (!open) return undefined;
    const timer = window.setTimeout(() => {
      const trimmed = searchQuery.trim();
      appliedSearchRef.current = trimmed;
      void loadFriends(trimmed, 1, false);
    }, CREATE_GROUP_SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [loadFriends, open, searchQuery]);

  useEffect(() => {
    if (!open) return undefined;
    const node = listRef.current;
    if (!node) return undefined;

    const handleScroll = () => {
      const { scrollTop, clientHeight, scrollHeight } = node;
      if (scrollTop > 0) userHasScrolledRef.current = true;
      if (!isFriendListNearBottom(scrollTop, clientHeight, scrollHeight)) {
        allowLoadAtBottomRef.current = true;
        return;
      }
      if (
        !shouldLoadMoreFriendsOnScroll(scrollTop, clientHeight, scrollHeight, {
          hasMore: hasMoreFriends,
          isLoadingMore: loadingMoreRef.current,
          userHasScrolled: userHasScrolledRef.current,
          allowLoadAtBottom: allowLoadAtBottomRef.current,
        })
      ) {
        return;
      }
      allowLoadAtBottomRef.current = false;
      void loadFriends(appliedSearchRef.current, currentPageRef.current + 1, true);
    };

    node.addEventListener("scroll", handleScroll, { passive: true });
    return () => node.removeEventListener("scroll", handleScroll);
  }, [hasMoreFriends, loadFriends, open]);

  const selectedUidSet = useMemo(
    () => new Set(selectedMembers.map((m) => m.uid)),
    [selectedMembers],
  );

  const toggleMember = (friend: ZaloFriendItem) => {
    setSelectedMembers((current) => {
      if (current.some((m) => m.uid === friend.uid)) {
        return current.filter((m) => m.uid !== friend.uid);
      }
      return [...current, friend];
    });
  };

  const handleCreate = async () => {
    const memberUids = selectedMembers
      .map((m) => m.uid)
      .filter((uid): uid is string => Boolean(uid));
    const validationError = validateCreateGroupInput(groupName, memberUids);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setCreating(true);
    try {
      const result = await createZaloGroup({
        name: groupName,
        accountId,
        memberUids,
      });
      if (!result.ok) {
        toast.error(result.message || "Tạo nhóm thất bại.");
        return;
      }
      toast.success(result.message || "Tạo nhóm thành công.");
      onCreated(result.conversationId);
      handleClose();
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={handleClose} className="max-w-md" showCloseButton>
      <div className="flex max-h-[82vh] flex-col p-5 sm:p-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Tạo nhóm chat
        </h3>
        <p className="text-xs text-gray-500">Chọn ít nhất 2 bạn bè</p>

        <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-hidden">
          <Input
            type="text"
            value={groupName}
            placeholder="Tên nhóm"
            onChange={(e) => setGroupName(e.target.value)}
          />

          {selectedMembers.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {selectedMembers.map((member) => (
                <button
                  key={member.uid}
                  type="button"
                  onClick={() => toggleMember(member)}
                  className="inline-flex items-center gap-1 rounded-lg border border-brand-200 bg-brand-50 px-2 py-1 text-xs dark:border-brand-500/30 dark:bg-brand-500/10"
                >
                  {getFriendDisplayName(member)}
                  <span className="text-gray-400">×</span>
                </button>
              ))}
            </div>
          ) : null}

          <Input
            type="text"
            value={searchQuery}
            placeholder="Tìm bạn bè..."
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <div
            ref={listRef}
            className="custom-scrollbar max-h-[280px] min-h-[160px] overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700"
          >
            {loadingFriends ? (
              <p className="px-3 py-6 text-center text-sm text-gray-500">Đang tải...</p>
            ) : friends.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-gray-500">Không có bạn bè</p>
            ) : (
              <ul>
                {friends.map((friend) => {
                  const selected = selectedUidSet.has(friend.uid);
                  const name = getFriendDisplayName(friend);
                  return (
                    <li key={friend.id}>
                      <button
                        type="button"
                        onClick={() => toggleMember(friend)}
                        className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-gray-50 dark:hover:bg-white/[0.03] ${
                          selected ? "bg-brand-50/70 dark:bg-brand-500/10" : ""
                        }`}
                      >
                        <ContactAvatar
                          name={name}
                          avatar={friend.avatar || friend.avt}
                          size="sm"
                        />
                        <span className="min-w-0 flex-1 truncate">{name}</span>
                        {selected ? (
                          <span className="text-brand-600">✓</span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {loadingMore ? (
              <p className="py-2 text-center text-xs text-gray-400">Đang tải thêm...</p>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
          <Button size="sm" variant="outline" onClick={handleClose}>
            Hủy
          </Button>
          <Button size="sm" disabled={creating} onClick={() => void handleCreate()}>
            {creating ? "Đang tạo..." : "Tạo nhóm"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default memo(CreateGroupDialog);