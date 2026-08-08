"use client";

import Switch from "@/components/form/switch/Switch";
import Button from "@/components/ui/button/Button";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { useChatbotStore } from "@/stores/use-chatbot-store";
import { useZaloAccountStore } from "@/stores/use-zalo-account-store";
import type { CategoryNotificationAction, ChatbotInstance } from "@/types/chatbot";
import type { ZaloAccountGroup, ZaloGroupMember } from "@/types/zalo-account";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiAlertTriangle,
  FiChevronDown,
  FiChevronUp,
  FiInfo,
  FiPlus,
  FiRefreshCw,
  FiTrash2,
  FiUsers,
  FiX,
} from "react-icons/fi";

const MISS_DATA_NOTIFICATION_TEMPLATE =
  "⚠️ CẢNH BÁO CHATBOT THIẾU DỮ LIỆU\n" +
  "• Khách hàng: {{name}}\n" +
  "• Nguồn: {{source_description}}\n" +
  "• Câu hỏi: {{user_message}}\n" +
  "👉 Quản trị viên vui lòng truy cập hệ thống để cập nhật câu trả lời ngay.";

const MESSAGE_VARIABLES = [
  { token: "{{user_message}}", label: "Câu hỏi khách" },
  { token: "{{name}}", label: "Tên khách" },
  { token: "{{title}}", label: "Anh/Chị" },
  { token: "{{source_description}}", label: "Nguồn hội thoại" },
  { token: "{{fanpage_name}}", label: "Fanpage" },
  { token: "{{zalo_account}}", label: "Nick Zalo" },
  { token: "{{group_name}}", label: "Tên nhóm" },
  { token: "{{group_link}}", label: "Link nhóm" },
];

const createMissDataNotificationAction = (): CategoryNotificationAction => ({
  account_id: null,
  target_type: "group",
  target_uid: "",
  target_label: "",
  message: MISS_DATA_NOTIFICATION_TEMPLATE,
});

interface MissDataNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatbot: ChatbotInstance | null;
}

type MentionMode = "all" | "members" | "none";

export default function MissDataNotificationModal({
  isOpen,
  onClose,
  chatbot,
}: MissDataNotificationModalProps) {
  const isSaving = useChatbotStore((s) => s.isSaving);
  const updateChatbot = useChatbotStore((s) => s.updateChatbot);

  const accounts = useZaloAccountStore((s) => s.accounts);
  const accountsLoading = useZaloAccountStore((s) => s.isLoading);
  const fetchAccounts = useZaloAccountStore((s) => s.fetchAccounts);

  const groupsByAccountId = useZaloAccountStore((s) => s.groupsByAccountId);
  const loadingGroupAccountIds = useZaloAccountStore((s) => s.loadingGroupAccountIds);
  const fetchGroupsByAccount = useZaloAccountStore((s) => s.fetchGroupsByAccount);
  const scanGroupsByAccount = useZaloAccountStore((s) => s.scanGroupsByAccount);
  const groupScanTaskIdsByAccountId = useZaloAccountStore((s) => s.groupScanTaskIdsByAccountId);
  const pollGroupScanResult = useZaloAccountStore((s) => s.pollGroupScanResult);

  const groupMembersByGroupId = useZaloAccountStore((s) => s.groupMembersByGroupId);
  const loadingGroupMemberIds = useZaloAccountStore((s) => s.loadingGroupMemberIds);
  const fetchGroupMembers = useZaloAccountStore((s) => s.fetchGroupMembers);
  const scanGroupMembers = useZaloAccountStore((s) => s.scanGroupMembers);
  const groupMemberScanTaskIdsByGroupId = useZaloAccountStore((s) => s.groupMemberScanTaskIdsByGroupId);
  const pollGroupMemberScanResult = useZaloAccountStore((s) => s.pollGroupMemberScanResult);

  const [isEnabled, setIsEnabled] = useState(false);
  const [actions, setActions] = useState<CategoryNotificationAction[]>([]);
  const [variablesOpen, setVariablesOpen] = useState(false);

  // Dropdown States for custom dropdown UI
  const [activeAccountDropdown, setActiveAccountDropdown] = useState<number | null>(null);
  const [activeGroupDropdown, setActiveGroupDropdown] = useState<number | null>(null);

  const [groupSearchTexts, setGroupSearchTexts] = useState<Record<number, string>>({});
  const [memberSearchTexts, setMemberSearchTexts] = useState<Record<number, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (accounts.length === 0) void fetchAccounts();

      const configActions = (chatbot?.miss_data_notification_actions ?? []).map((action) => {
        const rawId = action.account_id as number | string | null | undefined;
        const accountId =
          rawId == null || rawId === ""
            ? null
            : Number(rawId);
        return {
          ...action,
          account_id: accountId != null && Number.isFinite(accountId) ? accountId : null,
          target_type: (action.target_type || "group") as CategoryNotificationAction["target_type"],
          message: action.message ?? "",
        };
      });
      setActions(configActions.length > 0 ? configActions : [createMissDataNotificationAction()]);
      setIsEnabled(configActions.length > 0);
    }
  }, [isOpen, chatbot, accounts.length, fetchAccounts]);

  // Polling for groups scan
  useEffect(() => {
    const activeAccountIds = Object.keys(groupScanTaskIdsByAccountId).map(Number);
    if (activeAccountIds.length === 0) return;

    const interval = setInterval(() => {
      activeAccountIds.forEach((accId) => {
        void pollGroupScanResult(accId);
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [groupScanTaskIdsByAccountId, pollGroupScanResult]);

  // Polling for members scan
  useEffect(() => {
    const activeGroupIds = Object.keys(groupMemberScanTaskIdsByGroupId).map(Number);
    if (activeGroupIds.length === 0) return;

    const interval = setInterval(() => {
      activeGroupIds.forEach((grpId) => {
        void pollGroupMemberScanResult(grpId);
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [groupMemberScanTaskIdsByGroupId, pollGroupMemberScanResult]);

  // Auto-fetch groups — chỉ theo account_id của từng action (key number)
  useEffect(() => {
    if (!isOpen) return;
    actions.forEach((action) => {
      const accId =
        action.account_id != null && Number.isFinite(Number(action.account_id))
          ? Number(action.account_id)
          : null;
      if (accId == null) return;
      if (!groupsByAccountId[accId]) {
        void fetchGroupsByAccount(accId, 1);
      }
    });
  }, [isOpen, actions, groupsByAccountId, fetchGroupsByAccount]);

  // Auto-fetch members — chỉ group thuộc list của đúng nick gửi
  useEffect(() => {
    if (!isOpen) return;
    actions.forEach((action) => {
      const accId =
        action.account_id != null && Number.isFinite(Number(action.account_id))
          ? Number(action.account_id)
          : null;
      if (accId == null || !action.target_uid) return;
      const groups = groupsByAccountId[accId]?.results ?? [];
      const matched = groups.find((g) => g.uid === action.target_uid);
      // Chỉ skip khi đã có mảng (kể cả []). Object envelope cũ → fetch lại
      if (matched && !Array.isArray(groupMembersByGroupId[matched.id])) {
        void fetchGroupMembers(matched.id);
      }
    });
  }, [isOpen, actions, groupsByAccountId, groupMembersByGroupId, fetchGroupMembers]);

  if (!isOpen || !chatbot) return null;

  const handleToggleEnabled = () => {
    if (isEnabled) {
      setIsEnabled(false);
    } else {
      setIsEnabled(true);
      if (actions.length === 0) {
        setActions([createMissDataNotificationAction()]);
      }
    }
  };

  const updateAction = (index: number, patch: Partial<CategoryNotificationAction>) => {
    setActions((prev) =>
      prev.map((action, actionIndex) =>
        actionIndex === index ? { ...action, ...patch } : action
      )
    );
  };

  const removeAction = (index: number) => {
    setActions((prev) => {
      const next = prev.filter((_, actionIndex) => actionIndex !== index);
      if (next.length === 0) setIsEnabled(false);
      return next;
    });
  };

  const addAction = () => {
    setActions((prev) => [...prev, createMissDataNotificationAction()]);
    setIsEnabled(true);
  };

  const restoreTemplate = (index: number) => {
    updateAction(index, { message: MISS_DATA_NOTIFICATION_TEMPLATE });
  };

  const handleSave = async () => {
    const payloadActions = isEnabled
      ? actions
          .filter((act) => act.account_id != null && act.target_uid)
          .map((act) => ({
            ...act,
            account_id: Number(act.account_id),
            target_type: "group" as const,
          }))
      : [];

    const success = await updateChatbot(chatbot.id, {
      miss_data_notification_actions: payloadActions,
    });

    if (success) {
      toast.success("Cấu hình báo thiếu dữ liệu thành công.");
      onClose();
    } else {
      toast.error("Lưu cấu hình thất bại.");
    }
  };

  const getMentionMode = (action: CategoryNotificationAction): MentionMode => {
    if (action.mention?.all) return "all";
    if (action.mention?.uids) return "members";
    return "none";
  };

  const setMentionMode = (index: number, mode: MentionMode, action: CategoryNotificationAction) => {
    if (mode === "all") {
      updateAction(index, { mention: { all: true } });
    } else if (mode === "members") {
      updateAction(index, { mention: { uids: action.mention?.uids ?? [] } });
    } else {
      updateAction(index, { mention: undefined });
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-999 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-100 dark:border-gray-800 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-150 dark:border-gray-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
              <FiUsers size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Báo thiếu dữ liệu (Đào tạo bot)
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Kịch bản: <span className="font-semibold text-gray-700 dark:text-gray-300">{chatbot.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-700 dark:hover:text-white rounded-lg transition-colors shrink-0"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin">
          
          {/* Banner */}
          <div className="rounded-xl border border-amber-200 dark:border-amber-500/20 bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-amber-500/5 dark:to-orange-500/5 p-4 flex gap-3.5">
            <div className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-500">
              <FiAlertTriangle size={18} />
            </div>
            <div className="text-xs leading-5 text-amber-800 dark:text-amber-300">
              <p className="font-bold mb-0.5">Cơ chế cảnh báo khi bot bị Miss dữ liệu</p>
              <p>
                Khi khách hàng nhắn tin hỏi nhưng bot không tìm thấy câu trả lời phù hợp trong dữ liệu huấn luyện, chatbot sẽ tự động gửi tin nhắn báo động kèm câu hỏi vào nhóm Zalo quản lý để bạn nắm bắt và bổ sung Q&A lập tức.
              </p>
            </div>
          </div>

          {/* Toggle Enable */}
          <div className="flex items-center justify-between rounded-xl border border-gray-150 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-4 py-3.5">
            <div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white block">
                Bật cảnh báo Zalo
              </span>
              <span className="text-[11px] text-gray-500 dark:text-gray-400 block mt-0.5">
                {isEnabled
                  ? "Đang bật cảnh báo thiếu dữ liệu"
                  : "Đang tắt cảnh báo (bot gặp câu lạ sẽ im lặng hoặc dùng câu chào mặc định)"}
              </span>
            </div>
            <Switch checked={isEnabled} onChange={handleToggleEnabled} />
          </div>

          {/* Configuration List */}
          {isEnabled && (
            <div className="space-y-4">
              {actions.map((action, index) => {
                // Nhóm nhận chỉ lấy từ groupsByAccountId[nick gửi] — không trộn nick khác
                const accountId =
                  action.account_id != null && Number.isFinite(Number(action.account_id))
                    ? Number(action.account_id)
                    : null;
                const groupsRes =
                  accountId != null ? groupsByAccountId[accountId] : null;
                const groups: ZaloAccountGroup[] =
                  accountId != null && Array.isArray(groupsRes?.results)
                    ? groupsRes.results
                    : [];
                const loadingGroups =
                  accountId != null
                    ? loadingGroupAccountIds.includes(accountId)
                    : false;
                const scanningGroups =
                  accountId != null
                    ? Boolean(groupScanTaskIdsByAccountId[accountId])
                    : false;

                const selectedGroup =
                  accountId != null && action.target_uid
                    ? groups.find((g) => g.uid === action.target_uid) ?? null
                    : null;
                const mentionMode = getMentionMode(action);

                const rawMembers = selectedGroup
                  ? groupMembersByGroupId[selectedGroup.id]
                  : undefined;
                // Guard: store phải là array (tránh object nested envelope cũ)
                const groupMembers: ZaloGroupMember[] = Array.isArray(rawMembers)
                  ? rawMembers
                  : [];
                const loadingMembers = selectedGroup
                  ? loadingGroupMemberIds.includes(selectedGroup.id)
                  : false;
                const scanningMembers = selectedGroup
                  ? Boolean(groupMemberScanTaskIdsByGroupId[selectedGroup.id])
                  : false;

                // Group Filtering
                const grpSearch = groupSearchTexts[index] || "";
                const filteredGroups = groups.filter((g) =>
                  g.name?.toLowerCase().includes(grpSearch.toLowerCase()) ||
                  (g.uid || "").includes(grpSearch)
                );

                // Members Filtering — search rỗng giữ full list (kể cả thiếu friend)
                const memSearch = (memberSearchTexts[index] || "").trim().toLowerCase();
                const filteredMembers = !memSearch
                  ? groupMembers
                  : groupMembers.filter((m) => {
                      const name = (m.friend?.name || "").toLowerCase();
                      const uid = m.friend?.uid || "";
                      return name.includes(memSearch) || uid.includes(memSearch);
                    });

                const activeAccount = accounts.find((acc) => acc.id === accountId);

                return (
                  <div
                    key={index}
                    className="relative rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.01] p-4 space-y-4 shadow-xs"
                  >
                    {/* Header Item */}
                    <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2.5">
                      <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                        Nhóm nhận cảnh báo {actions.length > 1 ? `#${index + 1}` : ""}
                      </span>
                      {actions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeAction(index)}
                          className="text-gray-400 hover:text-error-500 p-1 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      )}
                    </div>

                    {/* Form Controls */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* Account Dropdown */}
                      <div className="relative">
                        <label className="mb-1 block text-xs font-bold text-gray-700 dark:text-gray-300">
                          Tài khoản Zalo gửi
                        </label>
                        <button
                          type="button"
                          onClick={() => setActiveAccountDropdown(activeAccountDropdown === index ? null : index)}
                          className="flex h-10 w-full items-center justify-between rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 text-sm"
                        >
                          <span className={`truncate ${activeAccount ? "text-gray-800 dark:text-gray-200" : "text-gray-400 dark:text-gray-500"}`}>
                            {activeAccount
                              ? `${activeAccount.name || "Nick Zalo"} (${activeAccount.phone_number || "Không có SĐT"})`
                              : "Chọn tài khoản Zalo"}
                          </span>
                          <FiChevronDown className="text-gray-400 shrink-0" />
                        </button>

                        {activeAccountDropdown === index && (
                          <div className="absolute top-full left-0 z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-1 shadow-lg">
                            {accounts.map((acc) => (
                              <button
                                key={acc.id}
                                type="button"
                                onClick={() => {
                                  const nextAccountId = Number(acc.id);
                                  // Đổi nick gửi → reset nhóm nhận (không giữ group nick cũ)
                                  updateAction(index, {
                                    account_id: nextAccountId,
                                    target_uid: "",
                                    target_label: "",
                                    mention: undefined,
                                  });
                                  setActiveAccountDropdown(null);
                                  setActiveGroupDropdown(null);
                                  setGroupSearchTexts((prev) => ({
                                    ...prev,
                                    [index]: "",
                                  }));
                                  setMemberSearchTexts((prev) => ({
                                    ...prev,
                                    [index]: "",
                                  }));
                                  if (Number.isFinite(nextAccountId)) {
                                    void fetchGroupsByAccount(nextAccountId, 1);
                                  }
                                }}
                                className="flex w-full flex-col px-3 py-2 text-left text-xs hover:bg-gray-50 dark:hover:bg-white/5"
                              >
                                <span className="font-semibold text-gray-800 dark:text-white">
                                  {acc.name || "Nick Zalo"}
                                </span>
                                <span className="text-[10px] text-gray-500 mt-0.5">
                                  {acc.phone_number || "Không có SĐT"}
                                </span>
                              </button>
                            ))}
                            {accounts.length === 0 && (
                              <p className="p-3 text-center text-xs text-gray-400">Không có tài khoản Zalo</p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Group Dropdown — chỉ list nhóm của nick gửi đang chọn */}
                      <div className="relative">
                        <label className="mb-1 flex items-center justify-between text-xs font-bold text-gray-700 dark:text-gray-300">
                          <span>Nhóm Zalo nhận</span>
                          {accountId != null && (
                            <button
                              type="button"
                              disabled={scanningGroups}
                              onClick={async () => {
                                const ok = await scanGroupsByAccount(accountId);
                                if (ok) toast.success("Đã bắt đầu quét nhóm Zalo...");
                              }}
                              className="text-[10px] text-brand-600 hover:text-brand-700 flex items-center gap-1 dark:text-brand-400"
                            >
                              <FiRefreshCw className={scanningGroups ? "animate-spin" : ""} />
                              {scanningGroups ? "Đang quét..." : "Quét nhóm"}
                            </button>
                          )}
                        </label>
                        <button
                          type="button"
                          disabled={accountId == null}
                          title={
                            accountId == null
                              ? "Chọn tài khoản Zalo gửi trước"
                              : undefined
                          }
                          onClick={() => {
                            if (accountId == null) return;
                            const opening = activeGroupDropdown !== index;
                            setActiveGroupDropdown(opening ? index : null);
                            // Mở dropdown → load/refresh list nhóm đúng nick
                            if (opening) {
                              void fetchGroupsByAccount(accountId, 1);
                            }
                          }}
                          className="flex h-10 w-full items-center justify-between rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 text-sm disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-white/5"
                        >
                          <span
                            className={`truncate ${
                              accountId != null &&
                              (selectedGroup || action.target_uid)
                                ? "text-gray-800 dark:text-gray-200"
                                : "text-gray-400 dark:text-gray-500"
                            }`}
                          >
                            {accountId == null
                              ? "Chọn tài khoản Zalo gửi trước"
                              : selectedGroup
                                ? selectedGroup.name || selectedGroup.uid
                                : action.target_label ||
                                  action.target_uid ||
                                  "Chọn nhóm của nick này"}
                          </span>
                          <FiChevronDown className="text-gray-400 shrink-0" />
                        </button>

                        {accountId != null && activeGroupDropdown === index && (
                          <div className="absolute top-full left-0 z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-1 shadow-lg p-2 flex flex-col gap-1.5">
                            <p className="px-1 text-[10px] text-gray-400">
                              Nhóm thuộc nick đang chọn
                              {activeAccount
                                ? ` · ${activeAccount.name || activeAccount.phone_number || accountId}`
                                : ""}
                              {groupsRes?.count != null
                                ? ` · ${groups.length}/${groupsRes.count}`
                                : groups.length
                                  ? ` · ${groups.length} nhóm`
                                  : ""}
                            </p>
                            <input
                              type="text"
                              placeholder="Tìm nhóm trong nick này..."
                              value={grpSearch}
                              onChange={(e) =>
                                setGroupSearchTexts({
                                  ...groupSearchTexts,
                                  [index]: e.target.value,
                                })
                              }
                              className="w-full px-2.5 py-1.5 text-xs border border-gray-200 dark:border-gray-800 rounded-md outline-hidden bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-200"
                            />
                            <div className="max-h-40 overflow-y-auto flex flex-col">
                              {filteredGroups.map((grp) => (
                                <button
                                  key={grp.id}
                                  type="button"
                                  onClick={() => {
                                    if (!grp.uid) {
                                      toast.error(
                                        "Nhóm thiếu UID — quét lại nhóm hoặc chọn nhóm khác.",
                                      );
                                      return;
                                    }
                                    updateAction(index, {
                                      target_uid: grp.uid,
                                      target_label: grp.name || grp.uid,
                                      mention: undefined,
                                    });
                                    setActiveGroupDropdown(null);
                                    void fetchGroupMembers(grp.id);
                                  }}
                                  className="flex w-full flex-col px-2 py-1.5 text-left text-xs rounded-md hover:bg-gray-50 dark:hover:bg-white/5"
                                >
                                  <span className="font-semibold text-gray-800 dark:text-white">
                                    {grp.name || grp.uid}
                                  </span>
                                  <span className="text-[10px] text-gray-500">
                                    {Number(grp.total_member) || 0} thành viên
                                  </span>
                                </button>
                              ))}
                              {filteredGroups.length === 0 && (
                                <p className="p-3 text-center text-xs text-gray-400">
                                  {loadingGroups
                                    ? "Đang tải nhóm của nick..."
                                    : "Nick này chưa có nhóm (hoặc không khớp tìm kiếm). Bấm «Quét nhóm»."}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                    </div>

                    {/* Mentions Config */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                        Tag nhắc tên khi báo động
                      </label>
                      <div className="flex gap-2">
                        {([
                          { id: "all" as const, label: "Tag @All" },
                          { id: "members" as const, label: "Tag thành viên" },
                          { id: "none" as const, label: "Không tag" },
                        ]).map((opt) => {
                          const active = mentionMode === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              disabled={!selectedGroup}
                              onClick={() => setMentionMode(index, opt.id, action)}
                              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                                active
                                  ? "border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                                  : "border-gray-200 hover:bg-gray-50 text-gray-600 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-white/5"
                              }`}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>

                      {mentionMode === "members" && selectedGroup && (
                        <div className="mt-2.5 rounded-lg border border-gray-150 dark:border-gray-800 bg-gray-50/50 dark:bg-white/[0.01] p-3 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">Thành viên nhận tag</span>
                            <button
                              type="button"
                              disabled={scanningMembers}
                              onClick={async () => {
                                if (accountId && selectedGroup) {
                                  const ok = await scanGroupMembers(accountId, selectedGroup.id);
                                  if (ok) toast.success("Đang quét thành viên nhóm...");
                                }
                              }}
                              className="text-[10px] text-brand-600 hover:text-brand-700 font-bold"
                            >
                              {scanningMembers ? "Đang quét..." : "Quét thành viên"}
                            </button>
                          </div>

                          {/* Member list inline — tránh absolute dropdown bị overflow-hidden modal cắt */}
                          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-2 space-y-2">
                            <div className="flex items-center justify-between gap-2 px-0.5">
                              <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                                {loadingMembers
                                  ? "Đang tải..."
                                  : `Hiển thị ${filteredMembers.length}/${groupMembers.length} thành viên`}
                                {action.mention?.uids && action.mention.uids.length > 0
                                  ? ` · Đã chọn ${action.mention.uids.length}`
                                  : ""}
                              </span>
                              {!loadingMembers && groupMembers.length === 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (selectedGroup) void fetchGroupMembers(selectedGroup.id);
                                  }}
                                  className="text-[10px] font-bold text-brand-600 hover:text-brand-700"
                                >
                                  Tải lại
                                </button>
                              )}
                            </div>
                            <input
                              type="text"
                              placeholder="Tìm thành viên..."
                              value={memberSearchTexts[index] || ""}
                              onChange={(e) =>
                                setMemberSearchTexts({
                                  ...memberSearchTexts,
                                  [index]: e.target.value,
                                })
                              }
                              className="w-full px-2.5 py-1.5 text-xs border border-gray-200 dark:border-gray-800 rounded-md outline-hidden bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200"
                            />
                            <div className="max-h-60 overflow-y-auto overscroll-contain flex flex-col divide-y divide-gray-50 dark:divide-gray-800/80">
                              {filteredMembers.map((mem) => {
                                const uids = action.mention?.uids ?? [];
                                const uid = mem.friend?.uid ? String(mem.friend.uid) : "";
                                const isChecked = uid ? uids.includes(uid) : false;
                                return (
                                  <label
                                    key={uid ? `${mem.id}-${uid}` : `mem-${mem.id}`}
                                    className="flex items-center gap-2 px-2 py-2 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer text-xs"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      disabled={!uid}
                                      onChange={() => {
                                        if (!uid) return;
                                        const nextUids = isChecked
                                          ? uids.filter((id) => id !== uid)
                                          : [...uids, uid];
                                        updateAction(index, { mention: { uids: nextUids } });
                                      }}
                                      className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                                    />
                                    <span className="min-w-0 flex-1 truncate font-semibold text-gray-800 dark:text-white">
                                      {mem.friend?.name || uid || "Thành viên ẩn"}
                                    </span>
                                    {mem.is_admin || mem.is_creator ? (
                                      <span className="shrink-0 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                        {mem.is_creator ? "Creator" : "Admin"}
                                      </span>
                                    ) : null}
                                  </label>
                                );
                              })}
                              {filteredMembers.length === 0 && (
                                <p className="p-3 text-center text-xs text-gray-400">
                                  {loadingMembers
                                    ? "Đang tải thành viên..."
                                    : groupMembers.length === 0
                                      ? "Chưa có thành viên. Bấm «Quét thành viên» nếu nhóm mới."
                                      : "Không tìm thấy thành viên"}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Selected Tags list */}
                          {action.mention?.uids && action.mention.uids.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {action.mention.uids.map((uid) => {
                                const matchedMember = groupMembers.find((m) => m.friend?.uid === uid);
                                return (
                                  <span
                                    key={uid}
                                    className="inline-flex items-center gap-1 rounded-md bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400"
                                  >
                                    {matchedMember?.friend?.name || uid}
                                    <FiX
                                      className="cursor-pointer hover:text-amber-900"
                                      onClick={() => {
                                        const nextUids = action.mention?.uids?.filter((id) => id !== uid) ?? [];
                                        updateAction(index, { mention: { uids: nextUids } });
                                      }}
                                    />
                                  </span>
                                );
                              })}
                            </div>
                          )}

                        </div>
                      )}
                    </div>

                  </div>
                );
              })}

              <button
                type="button"
                onClick={addAction}
                className="w-full h-10 border border-dashed border-gray-300 dark:border-gray-800 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-800 hover:border-gray-400 dark:hover:text-white dark:hover:border-gray-700 transition"
              >
                <FiPlus />
                Thêm nhóm nhận khác
              </button>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-150 dark:border-gray-800 flex justify-end gap-3 shrink-0">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSaving}>
            Hủy
          </Button>
          <Button size="sm" onClick={() => void handleSave()} disabled={isSaving || (isEnabled && actions.length === 0)}>
            {isSaving ? "Đang lưu..." : "Lưu cấu hình"}
          </Button>
        </div>

      </div>
    </div>
  );
}
