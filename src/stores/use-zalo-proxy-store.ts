import {
  filterZaloProxies,
  formatExpirationForApi,
  getProxyCheckTaskStatus,
  isProxyCheckTaskPending,
  parseExpirationToDateInput,
  parseProxyLines,
} from "@/lib/zalo-proxy-utils";
import { toast } from "@/lib/toast";
import { zaloProxyService } from "@/services/zalo-proxy.service";
import { runAsyncAction } from "@/stores/helpers/async-actions";
import type { ZaloProxyItem } from "@/types/zalo-proxy";
import { useMemo } from "react";
import { create } from "zustand";

interface ZaloProxyState {
  proxies: ZaloProxyItem[];
  selectedIds: number[];
  search: string;
  isLoading: boolean;
  error: string | null;

  isFormOpen: boolean;
  editingProxy: ZaloProxyItem | null;
  proxyInput: string;
  noteInput: string;
  expirationInput: string;
  isSaving: boolean;

  deletingId: number | null;
  deleteConfirm: { ids: number[] } | null;

  checkingIds: number[];
  checkTaskId: string | number | null;

  fetchProxies: () => Promise<void>;
  createProxies: () => Promise<boolean>;
  updateProxy: () => Promise<boolean>;
  deleteProxies: (ids: number[]) => Promise<boolean>;
  checkProxies: (ids: number[]) => Promise<boolean>;
  pollCheckResult: () => Promise<void>;

  setSearch: (value: string) => void;
  toggleSelect: (id: number) => void;
  toggleSelectAll: (ids: number[]) => void;
  clearSelection: () => void;

  openCreateForm: () => void;
  openEditForm: (proxy: ZaloProxyItem) => void;
  closeForm: () => void;
  setProxyInput: (value: string) => void;
  setNoteInput: (value: string) => void;
  setExpirationInput: (value: string) => void;

  openDeleteConfirm: (ids: number[]) => void;
  closeDeleteConfirm: () => void;
}

export const useZaloProxyStore = create<ZaloProxyState>((set, get) => ({
  proxies: [],
  selectedIds: [],
  search: "",
  isLoading: false,
  error: null,

  isFormOpen: false,
  editingProxy: null,
  proxyInput: "",
  noteInput: "",
  expirationInput: "",
  isSaving: false,

  deletingId: null,
  deleteConfirm: null,

  checkingIds: [],
  checkTaskId: null,

  fetchProxies: async () => {
    await runAsyncAction(
      async () => {
        const proxies = await zaloProxyService.list();
        set({ proxies });
      },
      set,
    );
  },

  createProxies: async () => {
    const { proxyInput, noteInput, expirationInput } = get();
    const proxyList = parseProxyLines(proxyInput);
    if (!proxyList.length) {
      toast.error("Vui lòng nhập ít nhất 1 proxy.");
      return false;
    }

    set({ isSaving: true, error: null });
    try {
      await zaloProxyService.create({
        proxies: proxyList,
        note: noteInput.trim() || undefined,
        date_expiration: formatExpirationForApi(expirationInput) || undefined,
      });
      await get().fetchProxies();
      set({
        isSaving: false,
        isFormOpen: false,
        proxyInput: "",
        noteInput: "",
        expirationInput: "",
      });
      toast.success("Đã thêm proxy.");
      return true;
    } catch {
      set({ isSaving: false });
      return false;
    }
  },

  updateProxy: async () => {
    const { editingProxy, proxyInput, noteInput, expirationInput } = get();
    if (!editingProxy) {
      toast.error("Không tìm thấy proxy cần sửa.");
      return false;
    }

    const normalizedProxy = proxyInput.trim();
    if (!normalizedProxy) {
      toast.error("Proxy không được để trống.");
      return false;
    }

    set({ isSaving: true, error: null });
    try {
      await zaloProxyService.edit({
        id: editingProxy.id,
        proxy: normalizedProxy,
        note: noteInput.trim() || undefined,
        date_expiration: formatExpirationForApi(expirationInput) || undefined,
      });
      await get().fetchProxies();
      set({
        isSaving: false,
        isFormOpen: false,
        editingProxy: null,
        proxyInput: "",
        noteInput: "",
        expirationInput: "",
      });
      toast.success("Đã cập nhật proxy.");
      return true;
    } catch {
      set({ isSaving: false });
      return false;
    }
  },

  deleteProxies: async (ids) => {
    set({ deletingId: ids[0] ?? null, error: null });
    try {
      await zaloProxyService.delete(ids);
      set((state) => ({
        proxies: state.proxies.filter((proxy) => !ids.includes(proxy.id)),
        selectedIds: state.selectedIds.filter((id) => !ids.includes(id)),
        deletingId: null,
        deleteConfirm: null,
      }));
      toast.success("Đã xóa proxy.");
      return true;
    } catch {
      set({ deletingId: null });
      return false;
    }
  },

  checkProxies: async (ids) => {
    if (!ids.length) {
      toast.error("Chọn ít nhất 1 proxy để kiểm tra.");
      return false;
    }

    set({ checkingIds: ids, checkTaskId: null, error: null });
    try {
      const taskId = await zaloProxyService.startCheck(ids);
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
      const result = await zaloProxyService.pollCheckResult(checkTaskId);
      const taskStatus = getProxyCheckTaskStatus(result);
      if (isProxyCheckTaskPending(taskStatus)) return;

      set({ checkingIds: [], checkTaskId: null });
      await get().fetchProxies();

      if (taskStatus === "SUCCESS") {
        toast.success("Kiểm tra proxy hoàn tất.");
      } else if (taskStatus === "FAILURE") {
        toast.warning("Kiểm tra proxy có lỗi.");
      }
    } catch {
      set({ checkingIds: [], checkTaskId: null });
      await get().fetchProxies();
    }
  },

  setSearch: (search) => set({ search }),

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

  openCreateForm: () =>
    set({
      isFormOpen: true,
      editingProxy: null,
      proxyInput: "",
      noteInput: "",
      expirationInput: "",
      error: null,
    }),

  openEditForm: (proxy) =>
    set({
      isFormOpen: true,
      editingProxy: proxy,
      proxyInput: proxy.proxy ?? "",
      noteInput: proxy.note ?? "",
      expirationInput: parseExpirationToDateInput(proxy.date_expiration),
      error: null,
    }),

  closeForm: () =>
    set({
      isFormOpen: false,
      editingProxy: null,
      proxyInput: "",
      noteInput: "",
      expirationInput: "",
    }),

  setProxyInput: (proxyInput) => set({ proxyInput }),
  setNoteInput: (noteInput) => set({ noteInput }),
  setExpirationInput: (expirationInput) => set({ expirationInput }),

  openDeleteConfirm: (ids) => set({ deleteConfirm: { ids } }),
  closeDeleteConfirm: () => set({ deleteConfirm: null }),
}));

export function useFilteredZaloProxies(): ZaloProxyItem[] {
  const proxies = useZaloProxyStore((s) => s.proxies);
  const search = useZaloProxyStore((s) => s.search);
  return useMemo(
    () => filterZaloProxies(proxies, search),
    [proxies, search],
  );
}