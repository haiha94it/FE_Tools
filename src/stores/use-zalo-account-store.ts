import { getApiErrorMessage } from "@/lib/errors";
import { dedupeInflight } from "@/lib/inflight";
import {
  filterZaloAccounts,
  formatMessageListenerError,
  getZaloCheckTaskStatus,
  isZaloChatbotEnabled,
  isZaloCheckTaskPending,
  resolveProxyString,
} from "@/lib/zalo-account-utils";
import { toast } from "@/lib/toast";
import { fetchAccessibleAccounts } from "@/lib/fetch-accessible-accounts";
import { canManageNickCrud } from "@/lib/team-collaboration-utils";
import { useAuthStore } from "@/stores/use-auth-store";
import { zaloAccountService } from "@/services/zalo-account.service";
import type { FriendAutomationPage } from "@/services/zalo-account.service";
import { zaloProxyService } from "@/services/zalo-proxy.service";
import type { ZaloProxyItem } from "@/types/zalo-proxy";
import { runAsyncAction } from "@/stores/helpers/async-actions";
import type { EditZaloAccountPayload, ZaloAccount, ZaloAccountGroup, ZaloGroupMember } from "@/types/zalo-account";
import {
  buildZaloCookieCreateBody,
  type ZaloCookieAccountPayload,
} from "@/lib/zalo-account-cookie-utils";
import { useMemo } from "react";
import { create } from "zustand";

function canCurrentUserManageNick(): boolean {
  return canManageNickCrud(useAuthStore.getState().user);
}

interface ZaloAccountState {
  accounts: ZaloAccount[];
  selectedIds: number[];
  search: string;
  showSensitiveInfo: boolean;
  isLoading: boolean;
  error: string | null;

  checkingIds: number[];
  checkTaskId: string | number | null;

  editingAccountId: number | null;
  deletingAccountId: number | null;

  isEditOpen: boolean;
  editAccount: ZaloAccount | null;
  editNote: string;
  editPassword: string;
  editProxyId: number | null;
  proxies: ZaloProxyItem[];
  isLoadingProxies: boolean;

  isQrOpen: boolean;
  qrImage: string | null;
  qrCountdown: number;
  qrProxy: string;
  qrAccountId: number | null;

  cookieTaskId: string | number | null;
  cookieLoading: boolean;

  loadingToggleAllMessage: boolean;
  loadingToggleMessageId: number | null;
  loadingToggleChatbotId: number | null;
  loadingToggleChatbotReactionId: number | null;

  deleteConfirm: { ids: number[] } | null;

  fetchAccounts: (options?: { force?: boolean }) => Promise<void>;
  editAccountAction: (payload: EditZaloAccountPayload) => Promise<boolean>;
  deleteAccounts: (ids: number[]) => Promise<boolean>;
  checkAccounts: (ids: number[]) => Promise<boolean>;
  pollCheckResult: () => Promise<void>;
  createByCookie: (payload: ZaloCookieAccountPayload) => Promise<boolean>;
  pollCookieResult: () => Promise<"pending" | "success" | "failure">;
  toggleAllMessageListener: (checked: boolean) => Promise<void>;
  toggleAccountMessageListener: (
    accountId: number,
    checked: boolean,
  ) => Promise<void>;
  toggleAccountChatbot: (
    accountId: number,
    checked: boolean,
  ) => Promise<void>;
  toggleAccountChatbotReaction: (
    accountId: number,
    checked: boolean,
  ) => Promise<void>;

  setSearch: (value: string) => void;
  setShowSensitiveInfo: (value: boolean) => void;
  toggleSelect: (id: number) => void;
  toggleSelectAll: (ids: number[]) => void;
  clearSelection: () => void;

  fetchProxies: () => Promise<void>;
  openEdit: (account: ZaloAccount) => void;
  closeEdit: () => void;
  setEditNote: (value: string) => void;
  setEditPassword: (value: string) => void;
  setEditProxyId: (value: number | null) => void;

  openCreateQr: () => void;
  openReloginQr: (account: ZaloAccount) => void;
  closeQr: () => void;
  setQrImage: (value: string | null) => void;
  setQrCountdown: (value: number) => void;
  setQrProxy: (value: string) => void;

  openDeleteConfirm: (ids: number[]) => void;
  closeDeleteConfirm: () => void;

  loadingChatbotDisabledFriendsAccountIds: number[];
  savingChatbotDisabledFriendsAccountIds: number[];
  fetchChatbotDisabledFriends: (
    accountId: number | string,
  ) => Promise<FriendAutomationPage | null>;
  saveChatbotDisabledFriends: (accountId: number | string, disabledUids: string[]) => Promise<boolean>;
  patchChatbotDisabledFriends: (
    accountId: number | string,
    action:
      | "add"
      | "remove"
      | "disable_all"
      | "enable_all"
      | "pause_reminder"
      | "resume_reminder"
      | "pause_reminder_all"
      | "resume_reminder_all",
    uids?: string[],
  ) => Promise<string[] | null>;

  groupsByAccountId: Record<number, { results: ZaloAccountGroup[]; count: number; page: number }>;
  loadingGroupAccountIds: number[];
  groupErrorsByAccountId: Record<number, string>;
  groupMembersByGroupId: Record<number, ZaloGroupMember[]>;
  loadingGroupMemberIds: number[];
  scanningGroupMemberIds: number[];
  groupMemberErrorsByGroupId: Record<number, string>;
  groupScanTaskIdsByAccountId: Record<number, string | number>;
  groupMemberScanTaskIdsByGroupId: Record<number, string | number>;

  fetchGroupsByAccount: (accountId: number, page?: number, search?: string) => Promise<void>;
  scanGroupsByAccount: (accountId: number) => Promise<boolean>;
  pollGroupScanResult: (accountId: number) => Promise<void>;
  fetchGroupMembers: (groupId: number) => Promise<void>;
  scanGroupMembers: (accountId: number, groupId: number) => Promise<boolean>;
  pollGroupMemberScanResult: (groupId: number) => Promise<void>;
}


export const useZaloAccountStore = create<ZaloAccountState>((set, get) => ({
  accounts: [],
  selectedIds: [],
  search: "",
  showSensitiveInfo: false,
  isLoading: false,
  error: null,

  checkingIds: [],
  checkTaskId: null,

  editingAccountId: null,
  deletingAccountId: null,

  isEditOpen: false,
  editAccount: null,
  editNote: "",
  editPassword: "",
  editProxyId: null,
  proxies: [],
  isLoadingProxies: false,

  isQrOpen: false,
  qrImage: null,
  qrCountdown: 0,
  qrProxy: "",
  qrAccountId: null,

  cookieTaskId: null,
  cookieLoading: false,

  loadingToggleAllMessage: false,
  loadingToggleMessageId: null,
  loadingToggleChatbotId: null,
  loadingToggleChatbotReactionId: null,

  deleteConfirm: null,

  loadingChatbotDisabledFriendsAccountIds: [],
  savingChatbotDisabledFriendsAccountIds: [],

  groupsByAccountId: {},
  loadingGroupAccountIds: [],
  groupErrorsByAccountId: {},
  groupMembersByGroupId: {},
  loadingGroupMemberIds: [],
  scanningGroupMemberIds: [],
  groupMemberErrorsByGroupId: {},
  groupScanTaskIdsByAccountId: {},
  groupMemberScanTaskIdsByGroupId: {},

  fetchAccounts: async (options = {}) => {
    const force = options.force === true;
    // Đã có list + không force → không gọi lại (Strict Mode / re-visit)
    if (!force && get().accounts.length > 0 && !get().isLoading) {
      return;
    }
    await dedupeInflight("zalo-account:fetchAccounts", () =>
      runAsyncAction(
        async () => {
          const accounts = await fetchAccessibleAccounts();
          set({ accounts });
        },
        set,
      ),
    );
  },

  editAccountAction: async (payload) => {
    if (!canCurrentUserManageNick()) {
      toast.error("Nhân viên không được sửa nick Zalo.");
      return false;
    }
    set({ editingAccountId: payload.id, error: null });
    try {
      await zaloAccountService.edit(payload);
      await get().fetchAccounts({ force: true });
      set({ editingAccountId: null });
      toast.success("Đã cập nhật tài khoản.");
      return true;
    } catch {
      set({ editingAccountId: null });
      return false;
    }
  },

  deleteAccounts: async (ids) => {
    if (!canCurrentUserManageNick()) {
      toast.error("Nhân viên không được xóa nick Zalo.");
      return false;
    }
    set({ deletingAccountId: ids[0] ?? null, error: null });
    try {
      await zaloAccountService.delete(ids);
      set((state) => ({
        accounts: state.accounts.filter((a) => !ids.includes(a.id)),
        selectedIds: state.selectedIds.filter((id) => !ids.includes(id)),
        deletingAccountId: null,
        deleteConfirm: null,
      }));
      toast.success("Đã xóa tài khoản.");
      return true;
    } catch {
      set({ deletingAccountId: null });
      return false;
    }
  },

  checkAccounts: async (ids) => {
    if (!canCurrentUserManageNick()) {
      toast.error("Nhân viên không được kiểm tra nick Zalo.");
      return false;
    }
    if (!ids.length) {
      toast.error("Chọn ít nhất 1 tài khoản để kiểm tra.");
      return false;
    }

    set({ checkingIds: ids, checkTaskId: null, error: null });
    try {
      const taskId = await zaloAccountService.startCheck(ids);
      set({ checkTaskId: taskId });
      return true;
    } catch {
      set({ checkingIds: [], checkTaskId: null });
      return false;
    }
  },

  pollCheckResult: async () => {
    const { checkTaskId } = get();
    if (!checkTaskId) return;

    try {
      const result = await zaloAccountService.pollCheckResult(checkTaskId);
      const taskStatus = getZaloCheckTaskStatus(result);
      if (isZaloCheckTaskPending(taskStatus)) return;

      set({ checkingIds: [], checkTaskId: null });
      await get().fetchAccounts({ force: true });

      if (taskStatus === "SUCCESS") {
        const failedCount =
          result.result?.filter((item) => !item.status).length ?? 0;
        if (failedCount > 0) {
          toast.warning(
            `Kiểm tra xong: ${failedCount} tài khoản không hoạt động.`,
          );
        } else {
          toast.success("Kiểm tra tài khoản hoàn tất.");
        }
        return;
      }

      if (taskStatus === "FAILURE") {
        toast.warning(
          result.message || result.error || "Kiểm tra tài khoản thất bại.",
        );
        return;
      }

      toast.warning(result.message || "Kiểm tra tài khoản có lỗi.");
    } catch {
      set({ checkingIds: [], checkTaskId: null });
      await get().fetchAccounts({ force: true });
    }
  },

  createByCookie: async (payload) => {
    if (!canCurrentUserManageNick()) {
      toast.error("Nhân viên không được thêm nick Zalo.");
      return false;
    }
    set({ cookieLoading: true, cookieTaskId: null, error: null });
    try {
      const taskId = await zaloAccountService.createByCookie(
        buildZaloCookieCreateBody(payload),
      );
      set({ cookieTaskId: taskId, cookieLoading: false });
      return true;
    } catch {
      set({ cookieLoading: false, cookieTaskId: null });
      return false;
    }
  },

  toggleAllMessageListener: async (checked) => {
    if (!canCurrentUserManageNick()) {
      toast.error("Chỉ manager mới bật listener tin nhắn.");
      return;
    }
    set({ loadingToggleAllMessage: true, error: null });
    try {
      await zaloAccountService.toggleMessageListener({
        all: true,
        disable_message: !checked,
      });
      set((state) => ({
        accounts: state.accounts.map((account) =>
          account.checkpoint === true
            ? account
            : { ...account, disable_message: !checked },
        ),
      }));
      toast.success(
        checked
          ? "Đã bật tin nhắn cho tất cả tài khoản"
          : "Đã tắt tin nhắn cho tất cả tài khoản",
      );
    } catch (error) {
      toast.error(formatMessageListenerError(getApiErrorMessage(error)));
    } finally {
      set({ loadingToggleAllMessage: false });
    }
  },

  toggleAccountMessageListener: async (accountId, checked) => {
    if (!canCurrentUserManageNick()) {
      toast.error("Chỉ manager mới bật listener tin nhắn.");
      return;
    }
    set({ loadingToggleMessageId: accountId, error: null });
    try {
      await zaloAccountService.toggleMessageListener({
        id_account: accountId,
        disable_message: !checked,
      });
      set((state) => ({
        accounts: state.accounts.map((account) =>
          account.id === accountId
            ? { ...account, disable_message: !checked }
            : account,
        ),
      }));
    } catch (error) {
      toast.error(formatMessageListenerError(getApiErrorMessage(error)));
    } finally {
      set({ loadingToggleMessageId: null });
    }
  },

  toggleAccountChatbot: async (accountId, checked) => {
    if (!canCurrentUserManageNick()) {
      toast.error("Chỉ manager mới bật/tắt chatbot.");
      return;
    }
    const prev = get().accounts.find((a) => a.id === accountId);
    if (!prev) return;

    // Optimistic: switch + tin nhắn (BE bật chatbot → disable_message=false)
    set({
      loadingToggleChatbotId: accountId,
      error: null,
      accounts: get().accounts.map((account) =>
        account.id === accountId
          ? {
              ...account,
              is_chatbot: checked,
              ...(checked ? { disable_message: false } : {}),
            }
          : account,
      ),
    });

    try {
      const updated = await zaloAccountService.toggleChatbot({
        id_account: accountId,
        is_chatbot: checked,
      });
      set((state) => ({
        accounts: state.accounts.map((account) => {
          if (account.id !== accountId) return account;
          const nextChatbot =
            typeof updated?.is_chatbot === "boolean"
              ? updated.is_chatbot
              : checked;
          const nextDisableMessage =
            typeof updated?.disable_message === "boolean"
              ? updated.disable_message
              : checked
                ? false
                : account.disable_message;
          return {
            ...account,
            is_chatbot: nextChatbot,
            disable_message: nextDisableMessage,
            is_chatbot_reaction_enabled:
              typeof updated?.is_chatbot_reaction_enabled === "boolean"
                ? updated.is_chatbot_reaction_enabled
                : account.is_chatbot_reaction_enabled,
          };
        }),
      }));
      toast.success(checked ? "Đã bật chatbot." : "Đã tắt chatbot.");
    } catch (error) {
      // Rollback UI nếu API fail
      set((state) => ({
        accounts: state.accounts.map((account) =>
          account.id === accountId
            ? {
                ...account,
                is_chatbot: prev.is_chatbot,
                disable_message: prev.disable_message,
                is_chatbot_reaction_enabled: prev.is_chatbot_reaction_enabled,
              }
            : account,
        ),
      }));
      toast.error(getApiErrorMessage(error));
    } finally {
      set({ loadingToggleChatbotId: null });
    }
  },

  toggleAccountChatbotReaction: async (accountId, checked) => {
    if (!canCurrentUserManageNick()) {
      toast.error("Chỉ manager mới bật/tắt thả tim chatbot.");
      return;
    }
    const prev = get().accounts.find((a) => a.id === accountId);
    if (!prev) return;

    set({
      loadingToggleChatbotReactionId: accountId,
      error: null,
      accounts: get().accounts.map((account) =>
        account.id === accountId
          ? { ...account, is_chatbot_reaction_enabled: checked }
          : account,
      ),
    });

    try {
      // BE bắt buộc is_chatbot trong payload — gửi kèm trạng thái hiện tại
      const updated = await zaloAccountService.toggleChatbot({
        id_account: accountId,
        is_chatbot: isZaloChatbotEnabled(prev),
        is_chatbot_reaction_enabled: checked,
      });
      set((state) => ({
        accounts: state.accounts.map((account) => {
          if (account.id !== accountId) return account;
          return {
            ...account,
            is_chatbot_reaction_enabled:
              typeof updated?.is_chatbot_reaction_enabled === "boolean"
                ? updated.is_chatbot_reaction_enabled
                : checked,
            is_chatbot:
              typeof updated?.is_chatbot === "boolean"
                ? updated.is_chatbot
                : account.is_chatbot,
          };
        }),
      }));
      toast.success(
        checked ? "Đã bật thả tim khi bot trả lời." : "Đã tắt thả tim chatbot.",
      );
    } catch (error) {
      set((state) => ({
        accounts: state.accounts.map((account) =>
          account.id === accountId
            ? {
                ...account,
                is_chatbot_reaction_enabled: prev.is_chatbot_reaction_enabled,
              }
            : account,
        ),
      }));
      toast.error(getApiErrorMessage(error));
    } finally {
      set({ loadingToggleChatbotReactionId: null });
    }
  },

  pollCookieResult: async () => {
    const { cookieTaskId } = get();
    if (!cookieTaskId) return "failure";

    try {
      const status = await zaloAccountService.pollCookieCreateResult(
        cookieTaskId,
      );
      if (status === "pending") return "pending";

      set({ cookieTaskId: null, cookieLoading: false });
      await get().fetchAccounts({ force: true });
      return status;
    } catch {
      set({ cookieTaskId: null, cookieLoading: false });
      return "failure";
    }
  },

  setSearch: (search) => set({ search }),
  setShowSensitiveInfo: (showSensitiveInfo) => set({ showSensitiveInfo }),

  toggleSelect: (id) =>
    set((state) => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds.filter((x) => x !== id)
        : [...state.selectedIds, id],
    })),

  toggleSelectAll: (ids) =>
    set((state) => {
      const allSelected = ids.every((id) => state.selectedIds.includes(id));
      if (allSelected) {
        return {
          selectedIds: state.selectedIds.filter((id) => !ids.includes(id)),
        };
      }
      const next = new Set([...state.selectedIds, ...ids]);
      return { selectedIds: Array.from(next) };
    }),

  clearSelection: () => set({ selectedIds: [] }),

  fetchProxies: async () => {
    set({ isLoadingProxies: true });
    try {
      const proxies = await zaloProxyService.list();
      set({ proxies, isLoadingProxies: false });
    } catch {
      set({ isLoadingProxies: false });
    }
  },

  openEdit: (account) => {
    if (!canCurrentUserManageNick()) return;
    set({
      isEditOpen: true,
      editAccount: account,
      editNote: account.note ?? "",
      editPassword: "",
      editProxyId: account.proxy?.id ?? null,
    });
    void get().fetchProxies();
  },

  closeEdit: () =>
    set({
      isEditOpen: false,
      editAccount: null,
      editNote: "",
      editPassword: "",
      editProxyId: null,
    }),

  setEditNote: (editNote) => set({ editNote }),
  setEditPassword: (editPassword) => set({ editPassword }),
  setEditProxyId: (editProxyId) => set({ editProxyId }),

  openCreateQr: () => {
    if (!canCurrentUserManageNick()) return;
    set({
      isQrOpen: true,
      qrImage: null,
      qrCountdown: 0,
      qrProxy: "",
      qrAccountId: null,
      cookieTaskId: null,
      cookieLoading: false,
    });
    void get().fetchProxies();
  },

  openReloginQr: (account) => {
    if (!canCurrentUserManageNick()) return;
    set({
      isQrOpen: true,
      qrImage: null,
      qrCountdown: 0,
      qrProxy: account.proxy ? resolveProxyString(account.proxy) : "",
      qrAccountId: account.id,
      cookieTaskId: null,
      cookieLoading: false,
    });
    void get().fetchProxies();
  },

  closeQr: () =>
    set({
      isQrOpen: false,
      qrImage: null,
      qrCountdown: 0,
      qrAccountId: null,
      cookieTaskId: null,
      cookieLoading: false,
    }),

  setQrImage: (qrImage) => set({ qrImage }),
  setQrCountdown: (qrCountdown) => set({ qrCountdown }),
  setQrProxy: (qrProxy) => set({ qrProxy }),

  openDeleteConfirm: (ids) => {
    if (!canCurrentUserManageNick()) return;
    set({ deleteConfirm: { ids } });
  },
  closeDeleteConfirm: () => set({ deleteConfirm: null }),

  fetchChatbotDisabledFriends: async (accountId) => {
    set((state) => ({
      loadingChatbotDisabledFriendsAccountIds: [
        ...state.loadingChatbotDisabledFriendsAccountIds,
        Number(accountId),
      ],
    }));
    try {
      const data = await zaloAccountService.getChatbotDisabledFriends(accountId);
      set((state) => ({
        accounts: state.accounts.map((acc) =>
          acc.id === Number(accountId)
            ? { ...acc, chatbot_disabled_friend_uids: data.chatbot_disabled_friend_uids }
            : acc
        ),
      }));
      return data;
    } catch (err) {
      set({ error: getApiErrorMessage(err) });
      return null;
    } finally {
      set((state) => ({
        loadingChatbotDisabledFriendsAccountIds:
          state.loadingChatbotDisabledFriendsAccountIds.filter(
            (id) => id !== Number(accountId),
          ),
      }));
    }
  },

  saveChatbotDisabledFriends: async (accountId, disabledUids) => {
    set((state) => ({
      savingChatbotDisabledFriendsAccountIds: [
        ...state.savingChatbotDisabledFriendsAccountIds,
        Number(accountId),
      ],
    }));
    try {
      await zaloAccountService.saveChatbotDisabledFriends(accountId, disabledUids);
      set((state) => ({
        accounts: state.accounts.map((acc) =>
          acc.id === Number(accountId)
            ? { ...acc, chatbot_disabled_friend_uids: disabledUids }
            : acc
        ),
      }));
      return true;
    } catch (err) {
      set({ error: getApiErrorMessage(err) });
      return false;
    } finally {
      set((state) => ({
        savingChatbotDisabledFriendsAccountIds:
          state.savingChatbotDisabledFriendsAccountIds.filter(
            (id) => id !== Number(accountId),
          ),
      }));
    }
  },

  patchChatbotDisabledFriends: async (accountId, action, uids) => {
    set((state) => ({
      savingChatbotDisabledFriendsAccountIds: [
        ...state.savingChatbotDisabledFriendsAccountIds,
        Number(accountId),
      ],
    }));
    try {
      const data = await zaloAccountService.patchChatbotDisabledFriends(accountId, action, uids);
      const disabledUids = data.chatbot_disabled_friend_uids;
      set((state) => ({
        accounts: state.accounts.map((acc) =>
          acc.id === Number(accountId)
            ? { ...acc, chatbot_disabled_friend_uids: disabledUids }
            : acc
        ),
      }));
      return disabledUids;
    } catch (err) {
      set({ error: getApiErrorMessage(err) });
      return null;
    } finally {
      set((state) => ({
        savingChatbotDisabledFriendsAccountIds:
          state.savingChatbotDisabledFriendsAccountIds.filter(
            (id) => id !== Number(accountId),
          ),
      }));
    }
  },

  fetchGroupsByAccount: async (accountId, page = 1, search = "") => {
    set((state) => ({
      loadingGroupAccountIds: state.loadingGroupAccountIds.includes(accountId)
        ? state.loadingGroupAccountIds
        : [...state.loadingGroupAccountIds, accountId],
      groupErrorsByAccountId: Object.fromEntries(
        Object.entries(state.groupErrorsByAccountId).filter(([id]) => Number(id) !== accountId),
      ),
    }));

    try {
      const data = await zaloAccountService.fetchGroupsByAccount(accountId, page, search);
      set((state) => ({
        groupsByAccountId: {
          ...state.groupsByAccountId,
          [accountId]: {
            results: data.results ?? [],
            count: data.count ?? 0,
            page,
          },
        },
        loadingGroupAccountIds: state.loadingGroupAccountIds.filter((id) => id !== accountId),
      }));
    } catch (error) {
      const message = getApiErrorMessage(error);
      set((state) => ({
        groupErrorsByAccountId: {
          ...state.groupErrorsByAccountId,
          [accountId]: message,
        },
        loadingGroupAccountIds: state.loadingGroupAccountIds.filter((id) => id !== accountId),
      }));
    }
  },

  scanGroupsByAccount: async (accountId) => {
    set((state) => ({
      groupErrorsByAccountId: Object.fromEntries(
        Object.entries(state.groupErrorsByAccountId).filter(([id]) => Number(id) !== accountId),
      ),
    }));

    try {
      const data = await zaloAccountService.scanGroupsByAccount(accountId);
      const taskId = data.id_task;
      if (!taskId) {
        set((state) => ({
          groupErrorsByAccountId: {
            ...state.groupErrorsByAccountId,
            [accountId]: "Không nhận được mã tác vụ quét nhóm.",
          },
        }));
        return false;
      }

      set((state) => ({
        groupScanTaskIdsByAccountId: {
          ...state.groupScanTaskIdsByAccountId,
          [accountId]: taskId,
        },
      }));
      return true;
    } catch (error) {
      const message = getApiErrorMessage(error);
      set((state) => ({
        groupErrorsByAccountId: {
          ...state.groupErrorsByAccountId,
          [accountId]: message,
        },
      }));
      return false;
    }
  },

  pollGroupScanResult: async (accountId) => {
    const taskId = get().groupScanTaskIdsByAccountId[accountId];
    if (!taskId) return;

    try {
      const response = await zaloAccountService.pollGroupScanResult(taskId);
      if (response.status === "PENDING") return;

      if (response.status === "SUCCESS") {
        set((state) => ({
          groupScanTaskIdsByAccountId: Object.fromEntries(
            Object.entries(state.groupScanTaskIdsByAccountId).filter(([id]) => Number(id) !== accountId),
          ),
        }));
        await get().fetchGroupsByAccount(accountId, 1);
        return;
      }

      set((state) => ({
        groupScanTaskIdsByAccountId: Object.fromEntries(
          Object.entries(state.groupScanTaskIdsByAccountId).filter(([id]) => Number(id) !== accountId),
        ),
        groupErrorsByAccountId: {
          ...state.groupErrorsByAccountId,
          [accountId]: "Quét danh sách nhóm thất bại.",
        },
      }));
    } catch (error) {
      const message = getApiErrorMessage(error);
      set((state) => ({
        groupScanTaskIdsByAccountId: Object.fromEntries(
          Object.entries(state.groupScanTaskIdsByAccountId).filter(([id]) => Number(id) !== accountId),
        ),
        groupErrorsByAccountId: {
          ...state.groupErrorsByAccountId,
          [accountId]: message,
        },
      }));
    }
  },

  fetchGroupMembers: async (groupId) => {
    set((state) => ({
      loadingGroupMemberIds: state.loadingGroupMemberIds.includes(groupId)
        ? state.loadingGroupMemberIds
        : [...state.loadingGroupMemberIds, groupId],
      groupMemberErrorsByGroupId: Object.fromEntries(
        Object.entries(state.groupMemberErrorsByGroupId || {}).filter(([id]) => Number(id) !== groupId),
      ),
    }));

    try {
      const data = await zaloAccountService.fetchGroupMembers(groupId);
      set((state) => ({
        groupMembersByGroupId: {
          ...state.groupMembersByGroupId,
          [groupId]: data.data ?? [],
        },
        loadingGroupMemberIds: state.loadingGroupMemberIds.filter((id) => id !== groupId),
      }));
    } catch (error) {
      const message = getApiErrorMessage(error);
      set((state) => ({
        groupMemberErrorsByGroupId: {
          ...(state.groupMemberErrorsByGroupId || {}),
          [groupId]: message,
        },
        loadingGroupMemberIds: state.loadingGroupMemberIds.filter((id) => id !== groupId),
      }));
    }
  },

  scanGroupMembers: async (accountId, groupId) => {
    set((state) => ({
      scanningGroupMemberIds: state.scanningGroupMemberIds.includes(groupId)
        ? state.scanningGroupMemberIds
        : [...state.scanningGroupMemberIds, groupId],
      groupMemberErrorsByGroupId: Object.fromEntries(
        Object.entries(state.groupMemberErrorsByGroupId || {}).filter(([id]) => Number(id) !== groupId),
      ),
    }));

    try {
      const data = await zaloAccountService.scanGroupMembers(accountId, groupId);
      const taskId = data.id_task;
      if (!taskId) {
        set((state) => ({
          scanningGroupMemberIds: state.scanningGroupMemberIds.filter((id) => id !== groupId),
          groupMemberErrorsByGroupId: {
            ...(state.groupMemberErrorsByGroupId || {}),
            [groupId]: "Không nhận được mã tác vụ quét thành viên.",
          },
        }));
        return false;
      }

      set((state) => ({
        groupMemberScanTaskIdsByGroupId: {
          ...state.groupMemberScanTaskIdsByGroupId,
          [groupId]: taskId,
        },
      }));
      return true;
    } catch (error) {
      const message = getApiErrorMessage(error);
      set((state) => ({
        scanningGroupMemberIds: state.scanningGroupMemberIds.filter((id) => id !== groupId),
        groupMemberErrorsByGroupId: {
          ...(state.groupMemberErrorsByGroupId || {}),
          [groupId]: message,
        },
      }));
      return false;
    }
  },

  pollGroupMemberScanResult: async (groupId) => {
    const taskId = get().groupMemberScanTaskIdsByGroupId[groupId];
    if (!taskId) return;

    try {
      const response = await zaloAccountService.pollGroupMemberScanResult(taskId);
      if (response.status === "PENDING") return;

      if (response.status === "SUCCESS") {
        set((state) => ({
          groupMembersByGroupId: {
            ...state.groupMembersByGroupId,
            [groupId]: response.data ?? [],
          },
          scanningGroupMemberIds: state.scanningGroupMemberIds.filter((id) => id !== groupId),
          groupMemberScanTaskIdsByGroupId: Object.fromEntries(
            Object.entries(state.groupMemberScanTaskIdsByGroupId).filter(([id]) => Number(id) !== groupId),
          ),
        }));
        await get().fetchGroupMembers(groupId);
        return;
      }

      set((state) => ({
        scanningGroupMemberIds: state.scanningGroupMemberIds.filter((id) => id !== groupId),
        groupMemberScanTaskIdsByGroupId: Object.fromEntries(
          Object.entries(state.groupMemberScanTaskIdsByGroupId).filter(([id]) => Number(id) !== groupId),
        ),
        groupMemberErrorsByGroupId: {
          ...(state.groupMemberErrorsByGroupId || {}),
          [groupId]: "Quét thành viên nhóm thất bại.",
        },
      }));
    } catch (error) {
      const message = getApiErrorMessage(error);
      set((state) => ({
        scanningGroupMemberIds: state.scanningGroupMemberIds.filter((id) => id !== groupId),
        groupMemberScanTaskIdsByGroupId: Object.fromEntries(
          Object.entries(state.groupMemberScanTaskIdsByGroupId).filter(([id]) => Number(id) !== groupId),
        ),
        groupMemberErrorsByGroupId: {
          ...(state.groupMemberErrorsByGroupId || {}),
          [groupId]: message,
        },
      }));
    }
  },
}));

/** Danh sách đã lọc theo từ khóa tìm kiếm */
export function useFilteredZaloAccounts(): ZaloAccount[] {
  const accounts = useZaloAccountStore((s) => s.accounts);
  const search = useZaloAccountStore((s) => s.search);
  return useMemo(
    () => filterZaloAccounts(accounts, search),
    [accounts, search],
  );
}
