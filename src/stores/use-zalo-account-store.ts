import { getApiErrorMessage } from "@/lib/errors";
import {
  filterZaloAccounts,
  formatMessageListenerError,
  getZaloCheckTaskStatus,
  isZaloCheckTaskPending,
} from "@/lib/zalo-account-utils";
import { toast } from "@/lib/toast";
import { fetchAccessibleAccounts } from "@/lib/fetch-accessible-accounts";
import { zaloAccountService } from "@/services/zalo-account.service";
import { zaloProxyService } from "@/services/zalo-proxy.service";
import type { ZaloProxyItem } from "@/types/zalo-proxy";
import { runAsyncAction } from "@/stores/helpers/async-actions";
import type { EditZaloAccountPayload, ZaloAccount } from "@/types/zalo-account";
import {
  buildZaloCookieCreateBody,
  type ZaloCookieAccountPayload,
} from "@/lib/zalo-account-cookie-utils";
import { useMemo } from "react";
import { create } from "zustand";

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

  deleteConfirm: { ids: number[] } | null;

  fetchAccounts: () => Promise<void>;
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

  deleteConfirm: null,

  fetchAccounts: async () => {
    await runAsyncAction(
      async () => {
        const accounts = await fetchAccessibleAccounts();
        set({ accounts });
      },
      set,
    );
  },

  editAccountAction: async (payload) => {
    set({ editingAccountId: payload.id, error: null });
    try {
      await zaloAccountService.edit(payload);
      await get().fetchAccounts();
      set({ editingAccountId: null });
      toast.success("Đã cập nhật tài khoản.");
      return true;
    } catch {
      set({ editingAccountId: null });
      return false;
    }
  },

  deleteAccounts: async (ids) => {
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
      await get().fetchAccounts();

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
      await get().fetchAccounts();
    }
  },

  createByCookie: async (payload) => {
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

  pollCookieResult: async () => {
    const { cookieTaskId } = get();
    if (!cookieTaskId) return "failure";

    try {
      const status = await zaloAccountService.pollCookieCreateResult(
        cookieTaskId,
      );
      if (status === "pending") return "pending";

      set({ cookieTaskId: null, cookieLoading: false });
      await get().fetchAccounts();
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

  openCreateQr: () =>
    set({
      isQrOpen: true,
      qrImage: null,
      qrCountdown: 0,
      qrProxy: "",
      qrAccountId: null,
      cookieTaskId: null,
      cookieLoading: false,
    }),

  openReloginQr: (account) =>
    set({
      isQrOpen: true,
      qrImage: null,
      qrCountdown: 0,
      qrProxy: account.proxy?.proxy ?? "",
      qrAccountId: account.id,
      cookieTaskId: null,
      cookieLoading: false,
    }),

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

  openDeleteConfirm: (ids) => set({ deleteConfirm: { ids } }),
  closeDeleteConfirm: () => set({ deleteConfirm: null }),
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