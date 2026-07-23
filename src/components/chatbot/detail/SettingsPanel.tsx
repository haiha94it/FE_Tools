"use client";

import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Switch from "@/components/form/switch/Switch";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { getChatbotAccountKeys } from "@/lib/chatbot-utils";
import { useChatbotStore } from "@/stores/use-chatbot-store";
import { useZaloAccountStore } from "@/stores/use-zalo-account-store";
import type { ChatbotInstance } from "@/types/chatbot";
import { useEffect, useMemo, useState } from "react";

interface SettingsPanelProps {
  chatbot: ChatbotInstance;
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

export default function SettingsPanel({ chatbot }: SettingsPanelProps) {
  const isSaving = useChatbotStore((s) => s.isSaving);
  const updateChatbot = useChatbotStore((s) => s.updateChatbot);
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

  const [name, setName] = useState(chatbot.name);
  const [isActive, setIsActive] = useState(chatbot.is_active);
  const [selectedKeys, setSelectedKeys] = useState<string[]>(
    getChatbotAccountKeys(chatbot),
  );

  useEffect(() => {
    setName(chatbot.name);
    setIsActive(chatbot.is_active);
    setSelectedKeys(getChatbotAccountKeys(chatbot));
  }, [chatbot]);

  useEffect(() => {
    if (accounts.length === 0) void fetchAccounts();
  }, [accounts.length, fetchAccounts]);

  /** Map accountId -> chatbot name đã gán (khác kịch bản hiện tại) */
  const assignedElsewhere = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of chatbots) {
      if (item.id === chatbot.id) continue;
      for (const key of getChatbotAccountKeys(item)) {
        map.set(String(key), item.name);
      }
    }
    return map;
  }, [chatbots, chatbot.id]);

  const handleSaveInfo = async () => {
    await updateChatbot(chatbot.id, {
      name: name.trim(),
      is_active: isActive,
    });
  };

  const handleSaveAssignments = async () => {
    await assignAccounts(chatbot.id, selectedKeys);
  };

  const toggleAccount = (id: number) => {
    const key = String(id);
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.02]">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          Thông tin chung
        </h3>
        <div className="mt-4 space-y-4">
          <div>
            <Label htmlFor="settings-name">Tên kịch bản</Label>
            <Input
              id="settings-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <Switch
            label={isActive ? "Kịch bản đang bật" : "Kịch bản đang tắt"}
            checked={isActive}
            onChange={setIsActive}
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={() => void handleSaveInfo()}
              disabled={isSaving || !name.trim()}
            >
              {isSaving ? "Đang lưu…" : "Lưu thông tin"}
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.02]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Gán tài khoản Zalo
            </h3>
            <p className="mt-0.5 text-xs text-gray-500">
              Mỗi tài khoản chỉ được gán vào 1 kịch bản. Gửi danh sách đầy đủ để
              thay thế.
            </p>
          </div>
          <Badge size="sm" color="primary" variant="light">
            {selectedKeys.length} đã chọn
          </Badge>
        </div>

        {accountsLoading && accounts.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">Đang tải tài khoản…</p>
        ) : accounts.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">
            Chưa có tài khoản Zalo. Thêm tài khoản ở mục Quản lý tài khoản.
          </p>
        ) : (
          <ul className="mt-4 max-h-80 space-y-2 overflow-y-auto">
            {accounts.map((account) => {
              const key = String(account.id);
              const checked = selectedKeys.includes(key);
              const elsewhere = assignedElsewhere.get(key);
              const blocked = Boolean(elsewhere) && !checked;

              return (
                <li key={account.id}>
                  <label
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 transition ${
                      checked
                        ? "border-brand-500 bg-brand-50/60 dark:border-brand-500/30 dark:bg-brand-500/10"
                        : blocked
                          ? "cursor-not-allowed border-gray-200 bg-gray-50 opacity-60 dark:border-gray-800 dark:bg-white/[0.02]"
                          : "border-gray-300 hover:border-gray-400 dark:border-gray-700 dark:hover:border-gray-600"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="mt-1 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                      checked={checked}
                      disabled={blocked}
                      onChange={() => toggleAccount(account.id)}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                        {accountLabel(account)}
                      </p>
                      {account.phone_number ? (
                        <p className="text-xs text-gray-500">
                          {account.phone_number}
                        </p>
                      ) : null}
                      {elsewhere ? (
                        <p className="mt-0.5 text-xs text-warning-600 dark:text-warning-400">
                          Đang gán ở kịch bản: {elsewhere}
                        </p>
                      ) : null}
                      {checked && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="mt-2 flex items-center gap-2 rounded-lg bg-gray-50 dark:bg-white/[0.03] px-2.5 py-1 w-fit border border-gray-100 dark:border-gray-800"
                        >
                          <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
                            Hoạt động Chatbot:
                          </span>
                          <Switch
                            checked={!account.disable_message}
                            disabled={loadingToggleMessageId === account.id}
                            onChange={(checkedVal) => {
                              void toggleAccountMessageListener(account.id, checkedVal);
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </label>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-4 flex justify-end">
          <Button
            size="sm"
            onClick={() => void handleSaveAssignments()}
            disabled={isSaving}
          >
            {isSaving ? "Đang lưu…" : "Lưu gán tài khoản"}
          </Button>
        </div>
      </section>

      <section className="rounded-2xl border border-dashed border-gray-200 p-5 dark:border-gray-800">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          Sao chép kịch bản
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Sao chép Q&A, danh mục và ảnh sang kịch bản mới. Tài khoản Zalo không
          được copy — cần gán lại.
        </p>
        <Button
          size="sm"
          variant="outline"
          className="mt-3"
          onClick={() => useChatbotStore.getState().openCopy(chatbot)}
        >
          Sao chép kịch bản này
        </Button>
      </section>
    </div>
  );
}
