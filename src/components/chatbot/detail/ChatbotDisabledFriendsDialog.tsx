"use client";

import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Switch from "@/components/form/switch/Switch";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/lib/toast";
import { zaloAccountService } from "@/services/zalo-account.service";
import { useZaloAccountStore } from "@/stores/use-zalo-account-store";
import type { ZaloAccount } from "@/types/zalo-account";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FiBell,
  FiBellOff,
  FiCpu,
  FiDownload,
  FiLoader,
  FiMessageSquare,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiUpload,
  FiX,
} from "react-icons/fi";

interface ZaloFriendItem {
  id?: number;
  name?: string;
  alias_name?: string;
  avatar?: string;
  gender?: string;
  sdob?: string;
  uid: string;
  is_friend?: boolean;
  is_chatbot_disabled?: boolean;
  is_reminder_paused?: boolean;
}

interface ChatbotDisabledFriendInfo {
  uid: string;
  name?: string;
  display_name?: string;
  avatar?: string;
}

interface ChatbotDisabledFriendsDialogProps {
  account: ZaloAccount;
  onClose: () => void;
  onSaved?: (accountId: number, disabledUids: string[]) => void;
}

type ImportMode = "append" | "replace";

const SEARCH_DEBOUNCE_MS = 400;
const PAGE_SIZE = 50;

function getZaloFriendLabel(friend: Pick<ZaloFriendItem, "uid" | "name" | "alias_name">) {
  return friend.alias_name?.trim() || friend.name?.trim() || friend.uid;
}

/** Giữ 1 row / uid — API đôi khi trả trùng → React key warning. */
function dedupeFriendsByUid(friendList: ZaloFriendItem[]): ZaloFriendItem[] {
  const seen = new Set<string>();
  const out: ZaloFriendItem[] = [];
  for (const friend of friendList) {
    const uid = (friend.uid || "").trim();
    if (!uid) {
      out.push(friend);
      continue;
    }
    if (seen.has(uid)) continue;
    seen.add(uid);
    out.push(friend);
  }
  return out;
}

function mergeFriendList(
  friendList: ZaloFriendItem[],
  extraFriends: ChatbotDisabledFriendInfo[],
) {
  const base = dedupeFriendsByUid(friendList);
  const extras = extraFriends
    .filter((item) => item.uid && !base.some((friend) => friend.uid === item.uid))
    .map((item) => ({
      id: 0,
      uid: item.uid,
      name: item.name,
      alias_name: item.display_name || item.name,
      avatar: item.avatar,
    }));

  return [...base, ...extras];
}

function parseUidsFromTxt(text: string): string[] {
  return Array.from(
    new Set(
      text
        .split(/[\r\n,\s]+/)
        .map((item) => item.trim())
        .filter((item) => item.length > 0),
    ),
  );
}

export default function ChatbotDisabledFriendsDialog({
  account,
  onClose,
  onSaved,
}: ChatbotDisabledFriendsDialogProps) {
  const fetchChatbotDisabledFriends = useZaloAccountStore(
    (s) => s.fetchChatbotDisabledFriends,
  );
  const saveChatbotDisabledFriends = useZaloAccountStore(
    (s) => s.saveChatbotDisabledFriends,
  );
  const patchChatbotDisabledFriends = useZaloAccountStore(
    (s) => s.patchChatbotDisabledFriends,
  );
  const loadingAccountIds = useZaloAccountStore(
    (s) => s.loadingChatbotDisabledFriendsAccountIds,
  );
  const [friends, setFriends] = useState<ZaloFriendItem[]>([]);
  const [friendResultCount, setFriendResultCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [disabledUids, setDisabledUids] = useState<string[]>([]);
  const [reminderPausedUids, setReminderPausedUids] = useState<string[]>([]);
  const [disabledFriendExtras, setDisabledFriendExtras] = useState<
    ChatbotDisabledFriendInfo[]
  >([]);
  const [pendingUids, setPendingUids] = useState<string[]>([]);
  const [bulkPending, setBulkPending] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [configLoaded, setConfigLoaded] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const importModeRef = useRef<ImportMode>("append");

  const isSearching = search.trim() !== debouncedSearch.trim();
  const isLoading =
    loadingFriends ||
    loadingConfig ||
    loadingAccountIds.includes(account.id);
  const disabledUidSet = useMemo(() => new Set(disabledUids), [disabledUids]);
  const reminderPausedUidSet = useMemo(
    () => new Set(reminderPausedUids),
    [reminderPausedUids],
  );
  const pendingUidSet = useMemo(() => new Set(pendingUids), [pendingUids]);
  const hasSearchKeyword = Boolean(debouncedSearch.trim());
  const anyPending = bulkPending || pendingUids.length > 0;

  const isAutoReplyEnabled = useCallback(
    (uid: string) => !disabledUidSet.has(uid),
    [disabledUidSet],
  );

  const applyDisabledUids = useCallback(
    (nextUids: string[]) => {
      setDisabledUids(nextUids);
      onSaved?.(account.id, nextUids);
    },
    [account.id, onSaved],
  );

  const failToast = useCallback((fallback: string) => {
    // getState sau await — hook storeError có thể stale
    const latest = useZaloAccountStore.getState().error;
    toast.error(latest || fallback);
  }, []);

  const setPendingUid = useCallback((uid: string, pending: boolean) => {
    setPendingUids((current) => {
      if (pending) {
        return current.includes(uid) ? current : [...current, uid];
      }
      return current.filter((item) => item !== uid);
    });
  }, []);

  const handleExportTxt = useCallback(() => {
    if (disabledUids.length === 0) {
      toast.info("Danh sách UID tắt bot hiện đang rỗng.");
      return;
    }

    const content = disabledUids.join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const today = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `chatbot_disabled_uids_acc${account.id}_${today}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Đã xuất ${disabledUids.length} UID ra file TXT.`);
  }, [account.id, disabledUids]);

  const handleImportFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const mode = importModeRef.current;

    try {
      const text = await file.text();
      const uniqueImported = parseUidsFromTxt(text);

      if (uniqueImported.length === 0) {
        toast.warning("File TXT không có UID hợp lệ.");
        return;
      }

      setBulkPending(true);
      if (mode === "append") {
        const nextUids = await patchChatbotDisabledFriends(
          account.id,
          "add",
          uniqueImported,
        );
        if (!nextUids) {
          failToast("Không bổ sung được UID từ file.");
          return;
        }
        applyDisabledUids(nextUids);
        toast.success(
          `Đã bổ sung UID từ file. Đang tắt bot cho ${nextUids.length} UID.`,
        );
      } else {
        const success = await saveChatbotDisabledFriends(
          account.id,
          uniqueImported,
        );
        if (!success) {
          failToast("Không thay thế được danh sách từ file.");
          return;
        }
        applyDisabledUids(uniqueImported);
        toast.success(
          `Đã thay thế danh sách. Đang tắt bot cho ${uniqueImported.length} UID.`,
        );
      }
    } catch {
      toast.error("Không thể đọc file TXT. Vui lòng kiểm tra lại định dạng file.");
    } finally {
      setBulkPending(false);
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const triggerImport = (mode: ImportMode) => {
    importModeRef.current = mode;
    fileInputRef.current?.click();
  };

  const handleResetAll = useCallback(async () => {
    setBulkPending(true);
    try {
      const nextUids = await patchChatbotDisabledFriends(account.id, "enable_all");
      if (!nextUids) {
        failToast("Không bật lại chatbot cho toàn bộ bạn bè.");
        return;
      }
      applyDisabledUids(nextUids);
      toast.success("Đã bật lại chatbot cho tất cả bạn bè.");
    } finally {
      setBulkPending(false);
    }
  }, [account.id, applyDisabledUids, failToast, patchChatbotDisabledFriends]);

  const handleDisableAll = useCallback(async () => {
    setBulkPending(true);
    try {
      const nextUids = await patchChatbotDisabledFriends(account.id, "disable_all");
      if (!nextUids) {
        failToast("Không tắt chatbot cho toàn bộ bạn bè.");
        return;
      }
      applyDisabledUids(nextUids);
      toast.success(`Đã tắt chatbot cho ${nextUids.length} bạn bè.`);
    } finally {
      setBulkPending(false);
    }
  }, [account.id, applyDisabledUids, failToast, patchChatbotDisabledFriends]);

  const handlePauseAllReminders = useCallback(async () => {
    setBulkPending(true);
    try {
      const data = await zaloAccountService.patchChatbotDisabledFriends(
        account.id,
        "pause_reminder_all",
      );
      setReminderPausedUids(data.reminder_paused_friend_uids ?? []);
      applyDisabledUids(data.chatbot_disabled_friend_uids ?? []);
      toast.success("Đã dừng chức năng nhắc nhở cho tất cả khách hàng.");
    } catch {
      failToast("Không thể dừng chức năng nhắc nhở cho tất cả khách hàng.");
    } finally {
      setBulkPending(false);
    }
  }, [account.id, applyDisabledUids, failToast]);

  const handleResumeAllReminders = useCallback(async () => {
    setBulkPending(true);
    try {
      const data = await zaloAccountService.patchChatbotDisabledFriends(
        account.id,
        "resume_reminder_all",
      );
      setReminderPausedUids(data.reminder_paused_friend_uids ?? []);
      applyDisabledUids(data.chatbot_disabled_friend_uids ?? []);
      toast.success("Đã bật chức năng nhắc nhở cho tất cả khách hàng.");
    } catch {
      failToast("Không thể bật chức năng nhắc nhở cho tất cả khách hàng.");
    } finally {
      setBulkPending(false);
    }
  }, [account.id, applyDisabledUids, failToast]);

  const setAutoReplyForUid = useCallback(
    async (uid: string, enabled: boolean) => {
      if (pendingUidSet.has(uid) || bulkPending) return;

      const action = enabled ? "remove" : "add";
      setPendingUid(uid, true);
      try {
        const nextUids = await patchChatbotDisabledFriends(account.id, action, [
          uid,
        ]);
        if (!nextUids) {
          failToast(
            enabled
              ? "Không thể bật chatbot cho khách hàng này."
              : "Không thể tắt chatbot cho khách hàng này.",
          );
          return;
        }
        applyDisabledUids(nextUids);
      } finally {
        setPendingUid(uid, false);
      }
    },
    [
      account.id,
      applyDisabledUids,
      bulkPending,
      failToast,
      patchChatbotDisabledFriends,
      pendingUidSet,
      setPendingUid,
    ],
  );

  const setReminderForUid = useCallback(
    async (uid: string, enabled: boolean) => {
      if (pendingUidSet.has(uid) || bulkPending) return;

      setPendingUid(uid, true);
      try {
        const data = await zaloAccountService.patchChatbotDisabledFriends(
          account.id,
          enabled ? "resume_reminder" : "pause_reminder",
          [uid],
        );
        setReminderPausedUids(data.reminder_paused_friend_uids ?? []);
        applyDisabledUids(data.chatbot_disabled_friend_uids ?? []);
      } catch {
        failToast(
          enabled
            ? "Không thể bật chức năng nhắc nhở cho khách hàng này."
            : "Không thể dừng chức năng nhắc nhở cho khách hàng này.",
        );
      } finally {
        setPendingUid(uid, false);
      }
    },
    [
      account.id,
      applyDisabledUids,
      bulkPending,
      failToast,
      pendingUidSet,
      setPendingUid,
    ],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search);
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setSearch("");
    setDebouncedSearch("");
    setCurrentPage(1);
    setConfigLoaded(false);
    setPendingUids([]);
    setBulkPending(false);
  }, [account.id]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const loadDisabledConfig = useCallback(async () => {
    setLoadingConfig(true);
    setLoadError(null);
    try {
      const res = await fetchChatbotDisabledFriends(account.id);
      if (!res) {
        setLoadError("Không tải được cấu hình chatbot theo bạn bè.");
        setDisabledUids([]);
        setDisabledFriendExtras([]);
        return [];
      }

      const disabledFromApi = res.chatbot_disabled_friend_uids ?? [];
      const reminderPausedFromApi = res.reminder_paused_friend_uids ?? [];

      setDisabledUids(disabledFromApi);
      setReminderPausedUids(reminderPausedFromApi);
      setDisabledFriendExtras([]);
      return [];
    } catch {
      setLoadError("Không tải được cấu hình chatbot theo bạn bè.");
      setDisabledUids([]);
      setDisabledFriendExtras([]);
      return [];
    } finally {
      setLoadingConfig(false);
    }
  }, [account.id, fetchChatbotDisabledFriends]);

  const loadFriends = useCallback(
    async (
      searchKey: string,
      page: number,
      extras: ChatbotDisabledFriendInfo[],
    ) => {
      setLoadingFriends(true);
      setLoadError(null);

      try {
        const response = await zaloAccountService.fetchFriends({
          id_account: account.id,
          page,
          number_per_page: PAGE_SIZE,
          all_friend: true,
          name: searchKey.trim() || undefined,
        });

        const results = Array.isArray(response)
          ? response
          : response?.results ?? [];
        const count = Array.isArray(response)
          ? response.length
          : response?.count ?? 0;

        const shouldMergeExtras = page === 1 && !searchKey.trim();
        setFriends(
          shouldMergeExtras
            ? mergeFriendList(results, extras)
            : dedupeFriendsByUid(results),
        );
        setFriendResultCount(count);
      } catch {
        setLoadError("Không tải được danh sách bạn bè.");
        setFriends([]);
        setFriendResultCount(0);
      } finally {
        setLoadingFriends(false);
      }
    },
    [account.id],
  );

  const reloadAll = useCallback(async () => {
    const extras = await loadDisabledConfig();
    await loadFriends(debouncedSearch, currentPage, extras);
    setConfigLoaded(true);
  }, [currentPage, debouncedSearch, loadDisabledConfig, loadFriends]);

  useEffect(() => {
    void (async () => {
      await loadDisabledConfig();
      setConfigLoaded(true);
    })();
  }, [account.id, loadDisabledConfig]);

  useEffect(() => {
    if (!configLoaded) return;
    void loadFriends(debouncedSearch, currentPage, disabledFriendExtras);
  }, [configLoaded, debouncedSearch, currentPage, disabledFriendExtras, loadFriends]);

  const totalPages = Math.max(1, Math.ceil(friendResultCount / PAGE_SIZE));
  const startIndex = friendResultCount ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
  const endIndex = friendResultCount
    ? Math.min(currentPage * PAGE_SIZE, friendResultCount)
    : 0;

  const accountLabel =
    account.name || account.phone_number || `Tài khoản #${account.id}`;

  return (
    <Modal isOpen onClose={onClose} className="max-w-2xl">
      <div className="p-6 sm:p-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="border-b border-gray-100 pb-4 dark:border-gray-800 shrink-0">
          <div className="flex items-start justify-between gap-4 pr-10 sm:pr-12">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                <FiCpu size={18} />
              </span>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Tắt chatbot theo bạn bè
                </h3>
                <p className="text-sm text-gray-500">{accountLabel}</p>
              </div>
            </div>
            <Badge size="sm" color="warning" variant="light">
              Đang tắt: {disabledUids.length}
            </Badge>
          </div>
        </div>

        {/* Hướng dẫn */}
        <div className="my-4 shrink-0 bg-gray-50 p-3 rounded-xl border border-gray-100 dark:bg-white/[0.02] dark:border-gray-800">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 mb-2">
            Hướng dẫn — áp dụng ngay khi đổi công tắc
          </p>
          <div className="grid gap-2 sm:grid-cols-2 text-xs">
            <div className="rounded-lg bg-emerald-50/50 p-2.5 border border-emerald-100 dark:bg-emerald-500/5 dark:border-emerald-500/10">
              <p className="font-semibold text-emerald-800 dark:text-emerald-400">
                Công tắc BẬT
              </p>
              <p className="text-gray-500 mt-0.5">
                Chatbot tự trả lời tin nhắn của khách hàng này (lưu ngay).
              </p>
            </div>
            <div className="rounded-lg bg-warning-50/50 p-2.5 border border-warning-100 dark:bg-warning-500/5 dark:border-warning-500/10">
              <p className="font-semibold text-warning-800 dark:text-warning-400">
                Công tắc TẮT
              </p>
              <p className="text-gray-500 mt-0.5">
                Chatbot không tự trả lời khách hàng này (lưu ngay).
              </p>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="mb-4 shrink-0 space-y-3">
          <div className="relative">
            <FiSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 size-4" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm bạn bè..."
              className="w-full !pl-10 !h-[38px]"
            />
            {(isSearching || loadingFriends) && (
              <FiLoader className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-brand-500 size-4" />
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Badge size="sm" color="primary" variant="light">
                {friendResultCount > 0
                  ? `Trang ${currentPage}/${totalPages}`
                  : "Trang 1"}
              </Badge>
              {friendResultCount > 0 && (
                <Badge size="sm" color="light" variant="light">
                  Hiển thị {startIndex}-{endIndex} của {friendResultCount}
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => void handleImportFileChange(e)}
                accept=".txt,text/plain"
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                className="!px-2 !py-1 !text-xs shrink-0"
                onClick={handleExportTxt}
                disabled={bulkPending}
              >
                <FiDownload size={12} /> Xuất TXT
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="!px-2 !py-1 !text-xs shrink-0"
                onClick={() => triggerImport("append")}
                disabled={bulkPending}
              >
                <FiPlus size={12} /> Bổ sung UID từ file
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="!px-2 !py-1 !text-xs shrink-0"
                onClick={() => triggerImport("replace")}
                disabled={bulkPending}
              >
                <FiUpload size={12} /> Thay thế bằng file
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="!px-2 !py-1 !text-xs shrink-0 !text-warning-600 hover:!bg-warning-50"
                onClick={() => void handleDisableAll()}
                disabled={bulkPending}
              >
                <FiX size={12} /> Tắt hết
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="!px-2 !py-1 !text-xs shrink-0 !text-emerald-600 hover:!bg-emerald-50"
                onClick={() => void handleResetAll()}
                disabled={bulkPending}
              >
                <FiRefreshCw size={12} /> Bật lại hết
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="!px-2 !py-1 !text-xs shrink-0 !text-violet-600 hover:!bg-violet-50"
                onClick={() => void handlePauseAllReminders()}
                disabled={bulkPending}
              >
                <FiBellOff size={12} /> Dừng nhắc nhở tất cả
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="!px-2 !py-1 !text-xs shrink-0 !text-violet-600 hover:!bg-violet-50"
                onClick={() => void handleResumeAllReminders()}
                disabled={bulkPending}
              >
                <FiBell size={12} /> Bật nhắc nhở tất cả
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="!px-2 !py-1 !text-xs shrink-0 !text-brand-600 hover:!bg-brand-50"
                onClick={() => void reloadAll()}
                disabled={isLoading || anyPending}
              >
                Làm mới
              </Button>
            </div>
          </div>
        </div>

        {/* Friends list */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0">
          {loadError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600 dark:border-red-500/20 dark:bg-red-500/5">
              <p>{loadError}</p>
              <button
                type="button"
                className="mt-2 font-semibold text-brand-600 underline-offset-2 hover:underline"
                onClick={() => void reloadAll()}
              >
                Thử lại / Làm mới
              </button>
            </div>
          )}

          {isLoading && !friends.length && (
            <p className="py-12 text-center text-sm font-medium text-gray-500">
              Đang tải danh sách bạn bè...
            </p>
          )}

          {!isLoading && !loadError && friends.length === 0 && (
            <p className="py-12 text-center text-sm font-medium text-gray-500">
              {hasSearchKeyword
                ? "Không tìm thấy bạn bè phù hợp."
                : "Chưa có bạn bè trong tài khoản này."}
            </p>
          )}

          <ul className="space-y-2">
            {friends.map((friend, index) => {
              const autoReplyEnabled = isAutoReplyEnabled(friend.uid);
              const reminderEnabled = !reminderPausedUidSet.has(friend.uid);
              const label = getZaloFriendLabel(friend);
              const uidPending = pendingUidSet.has(friend.uid);
              const switchDisabled = uidPending || bulkPending;
              // uid có thể trùng / rỗng (merge extras id=0) → key phải unique
              const rowKey =
                friend.id != null && friend.id > 0
                  ? `friend-${friend.id}`
                  : `friend-${friend.uid || "unknown"}-${index}`;

              return (
                <li key={rowKey}>
                  <div
                    className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 transition duration-150 ${
                      autoReplyEnabled
                        ? "border-emerald-200 bg-emerald-50/10 dark:border-emerald-500/10 dark:bg-emerald-500/[0.01]"
                        : "border-warning-200 bg-warning-50/10 dark:border-warning-500/10 dark:bg-warning-500/[0.01]"
                    }`}
                  >
                    <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-gray-200 dark:border-gray-800">
                      {friend.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={friend.avatar}
                          alt={label}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gray-100 text-xs font-bold text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                          {label.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                        {label}
                      </p>
                      <p className="truncate text-[10px] text-gray-400 mt-0.5">
                        UID: {friend.uid}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-3 pl-2">
                      <div className="text-right shrink-0">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            uidPending
                              ? "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                              : autoReplyEnabled
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                                : "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400"
                          }`}
                        >
                          {uidPending ? (
                            <FiLoader size={10} className="animate-spin" />
                          ) : (
                            <FiMessageSquare size={10} />
                          )}
                          {uidPending
                            ? "Đang lưu…"
                            : autoReplyEnabled
                              ? "Bot trả lời"
                              : "Bot bỏ qua"}
                        </span>
                      </div>
                      <Switch
                        checked={autoReplyEnabled}
                        disabled={switchDisabled}
                        ariaLabel={`Chatbot tự trả lời cho ${label}`}
                        onChange={(nextVal) => {
                          void setAutoReplyForUid(friend.uid, nextVal);
                        }}
                      />
                      <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />
                      <div className="text-right">
                        <p className="text-[10px] font-semibold text-gray-600 dark:text-white">
                          Nhắc nhở
                        </p>
                        <p className="text-[9px] text-gray-400">
                          {reminderEnabled ? "Đang bật" : "Tạm dừng"}
                        </p>
                      </div>
                      <Switch
                        checked={reminderEnabled}
                        disabled={switchDisabled}
                        ariaLabel={`Chức năng nhắc nhở cho ${label}`}
                        onChange={(nextVal) => {
                          void setReminderForUid(friend.uid, nextVal);
                        }}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Footer — không nút Lưu; mutation đã realtime */}
        <div className="border-t border-gray-100 pt-4 dark:border-gray-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="!px-2.5 !py-1 !text-xs"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={isLoading || currentPage <= 1 || anyPending}
            >
              Trang trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="!px-2.5 !py-1 !text-xs"
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={isLoading || currentPage >= totalPages || anyPending}
            >
              Trang sau
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={anyPending}
          >
            Đóng
          </Button>
        </div>
      </div>
    </Modal>
  );
}
