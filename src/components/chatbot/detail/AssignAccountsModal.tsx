"use client";

import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Switch from "@/components/form/switch/Switch";
import Input from "@/components/form/input/InputField";
import { Modal } from "@/components/ui/modal";
import { getChatbotAccountKeys } from "@/lib/chatbot-utils";
import { useChatbotStore } from "@/stores/use-chatbot-store";
import { useZaloAccountStore } from "@/stores/use-zalo-account-store";
import type { ChatbotInstance } from "@/types/chatbot";
import type { ZaloAccount } from "@/types/zalo-account";
import { useEffect, useMemo, useState } from "react";
import { FiMessageSquare } from "react-icons/fi";
import ChatbotDisabledFriendsDialog from "./ChatbotDisabledFriendsDialog";

interface AssignAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatbot: ChatbotInstance | null;
}

function accountLabel(account: {
  id: number;
  name?: string | null;
  phone_number?: string | null;
}) {
  return (
    account.name?.trim() ||
    account.phone_number?.trim() ||
    `Tài khoản #${account.id}`
  );
}

export default function AssignAccountsModal({
  isOpen,
  onClose,
  chatbot,
}: AssignAccountsModalProps) {
  const isSaving = useChatbotStore((s) => s.isSaving);
  const assignAccounts = useChatbotStore((s) => s.assignAccounts);
  const chatbots = useChatbotStore((s) => s.chatbots);

  const accounts = useZaloAccountStore((s) => s.accounts);
  const fetchAccounts = useZaloAccountStore((s) => s.fetchAccounts);
  const accountsLoading = useZaloAccountStore((s) => s.isLoading);
  const toggleAccountMessageListener = useZaloAccountStore(
    (s) => s.toggleAccountMessageListener,
  );
  const loadingToggleMessageId = useZaloAccountStore(
    (s) => s.loadingToggleMessageId,
  );

  const [disabledFriendsAccount, setDisabledFriendsAccount] = useState<ZaloAccount | null>(
    null,
  );

  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (chatbot) {
      setSelectedKeys(getChatbotAccountKeys(chatbot));
    }
  }, [chatbot, isOpen]);

  useEffect(() => {
    if (isOpen && accounts.length === 0) {
      void fetchAccounts();
    }
  }, [isOpen, accounts.length, fetchAccounts]);

  /** Map accountId -> chatbot name đã gán (khác kịch bản hiện tại) */
  const assignedElsewhere = useMemo(() => {
    if (!chatbot) return new Map<string, string>();
    const map = new Map<string, string>();
    for (const item of chatbots) {
      if (item.id === chatbot.id) continue;
      for (const key of getChatbotAccountKeys(item)) {
        map.set(String(key), item.name);
      }
    }
    return map;
  }, [chatbots, chatbot]);

  const handleSaveAssignments = async () => {
    if (!chatbot) return;
    const success = await assignAccounts(chatbot.id, selectedKeys);
    if (success) {
      onClose();
    }
  };

  const toggleAccount = (id: number) => {
    const key = String(id);
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  // Lọc tài khoản theo query tìm kiếm
  const filteredAccounts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return accounts;
    return accounts.filter((account) => {
      const name = (account.name || "").toLowerCase();
      const phone = (account.phone_number || "").toLowerCase();
      return name.includes(query) || phone.includes(query);
    });
  }, [accounts, searchQuery]);

  if (!chatbot) return null;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} className="max-w-xl">
      <div className="p-6 sm:p-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="border-b border-gray-100 pb-4 dark:border-gray-800 shrink-0">
          <h2 className="pr-10 text-lg font-semibold text-gray-900 dark:text-white">
            Gán tài khoản Zalo
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Kịch bản: <span className="font-semibold text-brand-600 dark:text-brand-400">{chatbot.name}</span>
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Mỗi tài khoản Zalo chỉ được gán vào tối đa 1 kịch bản chatbot.
          </p>
        </div>

        {/* Content list (scrollable) */}
        <div className="my-5 flex-1 overflow-y-auto space-y-4 pr-1 min-h-0">
          {/* Search bar */}
          <div className="relative">
            <Input
              placeholder="Tìm kiếm tài khoản theo tên hoặc SĐT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full !pr-10"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Danh sách tài khoản Zalo
            </span>
            <Badge size="sm" color="primary" variant="light">
              Đã chọn {selectedKeys.length}
            </Badge>
          </div>

          {accountsLoading && accounts.length === 0 ? (
            <p className="text-sm text-gray-500 py-6 text-center">Đang tải tài khoản…</p>
          ) : accounts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center dark:border-gray-800">
              <p className="text-sm text-gray-500">
                Chưa có tài khoản Zalo nào trong hệ thống.
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Vui lòng cấu hình thêm tài khoản Zalo ở mục Quản lý tài khoản.
              </p>
            </div>
          ) : filteredAccounts.length === 0 ? (
            <p className="text-sm text-gray-500 py-6 text-center">Không tìm thấy tài khoản phù hợp.</p>
          ) : (
            <ul className="space-y-3">
              {filteredAccounts.map((account) => {
                const key = String(account.id);
                const checked = selectedKeys.includes(key);
                const elsewhere = assignedElsewhere.get(key);
                const isCheckpoint = Boolean(account.checkpoint);
                const blocked = (Boolean(elsewhere) && !checked) || isCheckpoint;

                return (
                  <li key={account.id}>
                    <label
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition duration-150 ${
                        checked
                          ? "border-brand-500 bg-brand-50/60 dark:border-brand-500/30 dark:bg-brand-500/10 shadow-xs"
                          : blocked
                            ? "cursor-not-allowed border-gray-200 bg-gray-50 opacity-60 dark:border-gray-850 dark:bg-white/[0.01]"
                            : "border-gray-300 hover:border-gray-400 dark:border-gray-700 dark:hover:border-gray-600"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="mt-2.5 rounded border-gray-300 text-brand-500 focus:ring-brand-500 disabled:cursor-not-allowed"
                        checked={checked}
                        disabled={blocked}
                        onChange={() => toggleAccount(account.id)}
                      />
                      
                      {/* Avatar tài khoản Zalo */}
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-gray-250 dark:border-gray-800 mt-0.5">
                        {account.avatar ? (
                          <img
                            src={account.avatar}
                            alt={accountLabel(account)}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gray-100 text-xs font-bold text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                            {accountLabel(account).charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                              {accountLabel(account)}
                            </p>
                            {account.phone_number ? (
                              <p className="text-xs text-gray-500 mt-0.5">
                                {account.phone_number}
                              </p>
                            ) : null}
                          </div>
                          {isCheckpoint ? (
                            <span className="shrink-0 rounded-md bg-error-50 px-2 py-0.5 text-[10px] font-semibold text-error-700 dark:bg-error-500/10 dark:text-error-400">
                              Checkpoint / Mất kết nối
                            </span>
                          ) : elsewhere ? (
                            <span className="shrink-0 rounded-md bg-warning-50 px-2 py-0.5 text-[10px] font-semibold text-warning-700 dark:bg-warning-500/10 dark:text-warning-400">
                              Kịch bản: {elsewhere}
                            </span>
                          ) : null}
                        </div>

                        {/* Switch Bật/Tắt Chatbot trực tiếp */}
                        {checked && (
                          <div className="mt-3 space-y-2 border-t border-gray-150 pt-3 dark:border-gray-800">
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white/70 px-3 py-2 dark:border-gray-800 dark:bg-gray-900/50"
                            >
                              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                Kích hoạt phản hồi tự động (Chatbot)
                              </span>
                              <Switch
                                checked={!account.disable_message}
                                disabled={loadingToggleMessageId === account.id}
                                onChange={(checkedVal) => {
                                  void toggleAccountMessageListener(account.id, checkedVal);
                                }}
                              />
                            </div>

                            {/* Cấu hình Tắt bot bạn bè */}
                            {!account.disable_message && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white/70 px-3 py-2 dark:border-gray-800 dark:bg-gray-900/50"
                              >
                                <div className="min-w-0">
                                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                    Cấu hình tắt chatbot theo bạn bè
                                  </p>
                                  {account.chatbot_disabled_friend_uids?.length ? (
                                    <p className="text-[10px] font-semibold text-warning-600 mt-0.5">
                                      Đang tắt chatbot cho {account.chatbot_disabled_friend_uids.length} bạn bè
                                    </p>
                                  ) : (
                                    <p className="text-[10px] text-gray-400 mt-0.5">
                                      Tất cả bạn bè đều nhận tin nhắn chatbot tự động
                                    </p>
                                  )}
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="!px-2.5 !py-1 !text-xs shrink-0 flex items-center gap-1 font-bold"
                                  onClick={() => setDisabledFriendsAccount(account)}
                                >
                                  <FiMessageSquare size={12} /> Cấu hình
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 pt-4 dark:border-gray-800 flex justify-end gap-3 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSaving}
          >
            Hủy
          </Button>
          <Button
            size="sm"
            onClick={() => void handleSaveAssignments()}
            disabled={isSaving}
          >
            {isSaving ? "Đang lưu…" : "Lưu thay đổi"}
          </Button>
        </div>
      </div>
    </Modal>

      {disabledFriendsAccount && (
        <ChatbotDisabledFriendsDialog
          account={disabledFriendsAccount}
          onClose={() => setDisabledFriendsAccount(null)}
        />
      )}
    </>
  );
}
