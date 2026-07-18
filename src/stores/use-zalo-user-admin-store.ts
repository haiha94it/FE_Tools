import { dedupeInflight } from "@/lib/inflight";
import { toIsoDate } from "@/lib/zalo-user-admin-utils";
import { zaloUserAdminService } from "@/services/zalo-user-admin.service";
import type {
  ManagedUser,
  UserActivityLog,
  UserPermissionFilter,
} from "@/types/zalo-user-admin";
import { create } from "zustand";

interface ZaloUserAdminState {
  users: ManagedUser[];
  total: number;
  page: number;
  pageSize: number;
  keyword: string;
  permissionFilter: UserPermissionFilter;
  startDate: Date | null;
  endDate: Date | null;
  dateFilterEnabled: boolean;
  loading: boolean;
  actionLoading: boolean;
  error: string | null;

  activeTab: "users" | "logs";
  activityLogs: UserActivityLog[];
  activityTotal: number;
  activityPage: number;
  activityPageSize: number;
  logsLoading: boolean;

  fetchUsers: (options?: { silent?: boolean }) => Promise<void>;
  fetchActivityLogs: (options?: { silent?: boolean }) => Promise<void>;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setKeyword: (keyword: string) => void;
  setPermissionFilter: (permission: UserPermissionFilter) => void;
  setDateFilter: (payload: {
    enabled: boolean;
    startDate: Date | null;
    endDate: Date | null;
  }) => void;
  applyFilters: (payload: {
    permission: UserPermissionFilter;
    enabled: boolean;
    startDate: Date | null;
    endDate: Date | null;
  }) => void;
  setActiveTab: (tab: "users" | "logs") => void;
  setActivityPage: (page: number) => void;
  setActivityPageSize: (pageSize: number) => void;
}

export const useZaloUserAdminStore = create<ZaloUserAdminState>((set, get) => ({
  users: [],
  total: 0,
  page: 1,
  pageSize: 50,
  keyword: "",
  permissionFilter: "all",
  startDate: null,
  endDate: null,
  dateFilterEnabled: false,
  loading: false,
  actionLoading: false,
  error: null,

  activeTab: "users",
  activityLogs: [],
  activityTotal: 0,
  activityPage: 1,
  activityPageSize: 50,
  logsLoading: false,

  fetchUsers: async (options) => {
    const silent = options?.silent ?? false;
    const state = get();
    const start =
      state.dateFilterEnabled && state.startDate
        ? toIsoDate(state.startDate)
        : "";
    const end =
      state.dateFilterEnabled && state.endDate ? toIsoDate(state.endDate) : "";
    // Strict Mode + cùng filter/page → 1 HTTP get-all-account
    return dedupeInflight(
      `user-admin:fetchUsers:${state.page}:${state.pageSize}:${state.keyword}:${state.permissionFilter}:${start}:${end}:${silent ? "silent" : "full"}`,
      async () => {
        if (!silent) set({ loading: true, error: null });
        try {
          const response = await zaloUserAdminService.listUsers({
            page: state.page,
            pageSize: state.pageSize,
            keyword: state.keyword,
            permission: state.permissionFilter,
            startDate: start || undefined,
            endDate: end || undefined,
          });
          set({
            users: response.results,
            total: response.count,
            loading: false,
            error: null,
          });
        } catch {
          set((prev) => ({
            users: silent ? prev.users : [],
            total: silent ? prev.total : 0,
            loading: false,
            error: "Không tải được danh sách người dùng.",
          }));
        }
      },
    );
  },

  fetchActivityLogs: async (options) => {
    const silent = options?.silent ?? false;
    const state = get();
    return dedupeInflight(
      `user-admin:fetchActivityLogs:${state.activityPage}:${state.activityPageSize}:${silent ? "silent" : "full"}`,
      async () => {
        if (!silent) set({ logsLoading: true });
        try {
          const response = await zaloUserAdminService.listActivityLogs({
            page: state.activityPage,
            pageSize: state.activityPageSize,
          });
          set({
            activityLogs: response.results,
            activityTotal: response.count,
            logsLoading: false,
          });
        } catch {
          set((prev) => ({
            activityLogs: silent ? prev.activityLogs : [],
            activityTotal: silent ? prev.activityTotal : 0,
            logsLoading: false,
          }));
        }
      },
    );
  },

  setPage: (page) => {
    set({ page });
    void get().fetchUsers();
  },

  setPageSize: (pageSize) => {
    set({ pageSize, page: 1 });
    void get().fetchUsers();
  },

  setKeyword: (keyword) => set({ keyword }),

  setPermissionFilter: (permissionFilter) => {
    set({ permissionFilter, page: 1 });
    void get().fetchUsers();
  },

  setDateFilter: ({ enabled, startDate, endDate }) => {
    set({
      dateFilterEnabled: enabled,
      startDate,
      endDate,
      page: 1,
    });
    void get().fetchUsers();
  },

  applyFilters: ({ permission, enabled, startDate, endDate }) => {
    set({
      permissionFilter: permission,
      dateFilterEnabled: enabled,
      startDate,
      endDate,
      page: 1,
    });
    void get().fetchUsers();
  },

  setActiveTab: (activeTab) => {
    set({ activeTab });
    if (activeTab === "logs") {
      void get().fetchActivityLogs();
    }
  },

  setActivityPage: (activityPage) => {
    set({ activityPage });
    void get().fetchActivityLogs();
  },

  setActivityPageSize: (activityPageSize) => {
    set({ activityPageSize, activityPage: 1 });
    void get().fetchActivityLogs();
  },
}));