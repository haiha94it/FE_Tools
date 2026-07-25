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
  FiCpu,
  FiDownload,
  FiLoader,
  FiMessageSquare,
  FiRefreshCw,
  FiSearch,
  FiUpload,
  FiX,
} from "react-icons/fi";

interface ZaloFriendItem {
  id: number;
  name?: string;
  alias_name?: string;
  avatar?: string;
  gender?: string;
  sdob?: string;
  uid: string;
  is_friend?: boolean;
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

const SEARCH_DEBOUNCE_MS = 400;
const PAGE_SIZE = 50;

function getZaloFriendLabel(friend: Pick<ZaloFriendItem, "uid" | "name" | "alias_name">) {
  return friend.alias_name?.trim() || friend.name?.trim() || friend.uid;
}

function mergeFriendList(
  friendList: ZaloFriendItem[],
  extraFriends: ChatbotDisabledFriendInfo[],
) {
  const extras = extraFriends
    .filter((item) => item.uid && !friendList.some((friend) => friend.uid === item.uid))
    .map((item) => ({
      id: 0,
      uid: item.uid,
      name: item.name,
      alias_name: item.display_name || item.name,
      avatar: item.avatar,
    }));

  return [...friendList, ...extras];
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
  const savingAccountIds = useZaloAccountStore(
    (s) => s.savingChatbotDisabledFriendsAccountIds,
  );

  const [friends, setFriends] = useState<ZaloFriendItem[]>([]);
  const [friendResultCount, setFriendResultCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [disabledUids, setDisabledUids] = useState<string[]>([]);
  const [disabledFriendExtras, setDisabledFriendExtras] = useState<
    ChatbotDisabledFriendInfo[]
  >([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [configLoaded, setConfigLoaded] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Xuất (Backup) danh sách UID bị tắt chatbot ra file TXT
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

  // Nhập (Import) danh sách UID từ file TXT
  const handleImportFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const rawUids = text.split(/[\r\n,\s]+/);
      const parsedUids = rawUids
        .map((item) => item.trim())
        .filter((item) => item.length > 0);

      const uniqueImported = Array.from(new Set(parsedUids));

      if (uniqueImported.length === 0) {
        toast.warning("File TXT không chứa UID hợp lệ.");
        return;
      }

      setDisabledUids((current) => {
        const currentSet = new Set(current);
        let addedCount = 0;

        uniqueImported.forEach((uid) => {
          if (!currentSet.has(uid)) {
            currentSet.add(uid);
            addedCount++;
          }
        });

        if (addedCount > 0) {
          toast.success(
            `Đã nhập ${uniqueImported.length} UID từ file. Bổ sung ${addedCount} UID mới vào danh sách tắt bot.`,
          );
        } else {
          toast.info(
            `Tất cả ${uniqueImported.length} UID trong file đã có sẵn trong danh sách.`,
          );
        }

        return Array.from(currentSet);
      });
    } catch {
      toast.error("Không thể đọc file TXT. Vui lòng kiểm tra lại định dạng file.");
    } finally {
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const handleTriggerImport = () => {
    fileInputRef.current?.click();
  };

  // Bật lại chatbot cho tất cả bạn bè (Reset danh sách tắt bot về rỗng)
  const handleResetAll = useCallback(async () => {
    const nextUids = await patchChatbotDisabledFriends(account.id, "enable_all");
    if (!nextUids) return;
    setDisabledUids(nextUids);
    toast.success("Đã bật lại chatbot cho tất cả bạn bè.");
  }, [account.id, patchChatbotDisabledFriends]);

  const handleDisableAll = useCallback(async () => {
    const nextUids = await patchChatbotDisabledFriends(account.id, "disable_all");
    if (!nextUids) return;
    setDisabledUids(nextUids);
    toast.success(`Đã tắt chatbot cho ${nextUids.length} bạn bè.`);
  }, [account.id, patchChatbotDisabledFriends]);

  const isSearching = search.trim() !== debouncedSearch.trim();
  const isLoading =
    loadingFriends ||
    loadingConfig ||
    loadingAccountIds.includes(account.id);
  const isSaving = savingAccountIds.includes(account.id);
  const disabledUidSet = useMemo(() => new Set(disabledUids), [disabledUids]);
  const hasSearchKeyword = Boolean(debouncedSearch.trim());

  const isAutoReplyEnabled = useCallback(
    (uid: string) => !disabledUidSet.has(uid),
    [disabledUidSet],
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
  }, [account.id]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const loadDisabledConfig = useCallback(async () => {
    setLoadingConfig(true);
    try {
      const res = await fetchChatbotDisabledFriends(account.id);
      const disabledFromApi = res?.chatbot_disabled_friend_uids ?? [];
      const extras = res?.friends ?? [];

      setDisabledUids(disabledFromApi);
      setDisabledFriendExtras(extras);
      return extras;
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

        // Response format mapping
        const results = Array.isArray(response)
          ? response
          : response?.results ?? [];
        const count = Array.isArray(response) ? response.length : response?.count ?? 0;

        const shouldMergeExtras = page === 1 && !searchKey.trim();
        setFriends(shouldMergeExtras ? mergeFriendList(results, extras) : results);
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

  const setAutoReplyForUid = (uid: string, enabled: boolean) => {
    setDisabledUids((current) => {
      if (enabled) return current.filter((item) => item !== uid);
      if (current.includes(uid)) return current;
      return [...current, uid];
    });
  };

  const handleSave = async () => {
    const success = await saveChatbotDisabledFriends(account.id, disabledUids);
    if (success) {
      toast.success("Đã lưu cấu hình trả lời tự động theo bạn bè.");
      onSaved?.(account.id, disabledUids);
      onClose();
    }
  };

  const accountLabel =
    account.name || account.phone_number || `Tài khoản #${account.id}`;

  return (
    <Modal isOpen onClose={onClose} className="max-w-2xl">
      <div className="p-6 sm:p-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="border-b border-gray-100 pb-4 dark:border-gray-800 shrink-0">
          <div className="flex items-start justify-between gap-4">
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
          </div>
        </div>

        {/* Cấu dẫn sử dụng nhanh */}
        <div className="my-4 shrink-0 bg-gray-50 p-3 rounded-xl border border-gray-100 dark:bg-white/[0.02] dark:border-gray-800">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 mb-2">
            Hướng dẫn
          </p>
          <div className="grid gap-2 sm:grid-cols-2 text-xs">
            <div className="rounded-lg bg-emerald-50/50 p-2.5 border border-emerald-100 dark:bg-emerald-500/5 dark:border-emerald-500/10">
              <p className="font-semibold text-emerald-800 dark:text-emerald-400">
                Công tắc BẬT
              </p>
              <p className="text-gray-500 mt-0.5">
                Chatbot sẽ tự động phản hồi tin nhắn của bạn bè này.
              </p>
            </div>
            <div className="rounded-lg bg-warning-50/50 p-2.5 border border-warning-100 dark:bg-warning-500/5 dark:border-warning-500/10">
              <p className="font-semibold text-warning-800 dark:text-warning-400">
                Công tắc TẮT
              </p>
              <p className="text-gray-500 mt-0.5">
                Chatbot sẽ bỏ qua và không nhắn tin tự động cho bạn bè này.
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
                {friendResultCount > 0 ? `Trang ${currentPage}/${totalPages}` : "Trang 1"}
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
              >
                <FiDownload size={12} /> Xuất TXT
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="!px-2 !py-1 !text-xs shrink-0"
                onClick={handleTriggerImport}
              >
                <FiUpload size={12} /> Nhập TXT
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="!px-2 !py-1 !text-xs shrink-0 !text-warning-600 hover:!bg-warning-50"
                onClick={() => void handleDisableAll()}
                disabled={isSaving}
              >
                <FiX size={12} /> Tắt hết
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="!px-2 !py-1 !text-xs shrink-0 !text-emerald-600 hover:!bg-emerald-50"
                onClick={() => void handleResetAll()}
                disabled={isSaving}
              >
                <FiRefreshCw size={12} /> Bật lại hết
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="!px-2 !py-1 !text-xs shrink-0 !text-brand-600 hover:!bg-brand-50"
                onClick={() => void reloadAll()}
                disabled={isLoading}
              >
                Làm mới
              </Button>
            </div>
          </div>
        </div>

        {/* Friends list (scrollable) */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0">
          {loadError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600 dark:border-red-500/20 dark:bg-red-500/5">
              {loadError}
            </div>
          )}

          {isLoading && !friends.length && (
            <p className="py-12 text-center text-sm font-medium text-gray-500">
              Đang tải danh sách bạn bè...
            </p>
          )}

          {!isLoading && !loadError && friends.length === 0 && (
            <p className="py-12 text-center text-sm font-medium text-gray-500">
              {hasSearchKeyword ? "Không tìm thấy bạn bè phù hợp." : "Chưa có bạn bè trong tài khoản này."}
            </p>
          )}

          <ul className="space-y-2">
            {friends.map((friend) => {
              const autoReplyEnabled = isAutoReplyEnabled(friend.uid);
              const label = getZaloFriendLabel(friend);

              return (
                <li key={friend.uid}>
                  <div
                    className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 transition duration-150 ${
                      autoReplyEnabled
                        ? "border-emerald-200 bg-emerald-50/10 dark:border-emerald-500/10 dark:bg-emerald-500/[0.01]"
                        : "border-warning-200 bg-warning-50/10 dark:border-warning-500/10 dark:bg-warning-500/[0.01]"
                    }`}
                  >
                    {/* Avatar bạn bè */}
                    <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-gray-200 dark:border-gray-800">
                      {friend.avatar ? (
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

                    <div className="flex shrink-0 items-center gap-3.5 pl-2">
                      <div className="text-right shrink-0">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            autoReplyEnabled
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                              : "bg-warning-50 text-warning-850 dark:bg-warning-500/10 dark:text-warning-400"
                          }`}
                        >
                          <FiMessageSquare size={10} />
                          {autoReplyEnabled ? "Bot trả lời" : "Bot bỏ qua"}
                        </span>
                      </div>
                      <Switch
                        checked={autoReplyEnabled}
                        onChange={(nextVal) => setAutoReplyForUid(friend.uid, nextVal)}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 pt-4 dark:border-gray-800 flex items-center justify-between gap-3 shrink-0">
          {/* Pagination buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="!px-2.5 !py-1 !text-xs"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={isLoading || currentPage <= 1}
            >
              Trang trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="!px-2.5 !py-1 !text-xs"
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={isLoading || currentPage >= totalPages}
            >
              Trang sau
            </Button>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={onClose} disabled={isSaving}>
              Hủy
            </Button>
            <Button size="sm" onClick={() => void handleSave()} disabled={isSaving || isLoading}>
              {isSaving ? "Đang lưu…" : "Lưu thay đổi"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
