import { fetchAccessibleAccounts } from "@/lib/fetch-accessible-accounts";
import { dedupeInflight } from "@/lib/inflight";
import { canSkipZaloProxyRequirement } from "@/lib/map-auth-user";
import { getScanTaskStatus, isScanTaskDone } from "@/lib/zalo-contacts-utils";
import {
  getZaloAccountStatus,
  isZaloAccountRunnable,
} from "@/lib/zalo-account-utils";
import { zaloCampaignNotificationService } from "@/services/zalo-campaign-notification.service";
import { useAuthStore } from "@/stores/use-auth-store";
import type { ZaloAccount, ZaloAccountGroup } from "@/types/zalo-account";
import { create } from "zustand";

const GROUPS_PAGE_SIZE = 50;

interface CampaignNotificationState {
  accounts: ZaloAccount[];
  groups: ZaloAccountGroup[];
  selectedAccountId: number | null;
  selectedGroupId: number | null;
  active: boolean;
  loading: boolean;
  saving: boolean;
  accountsLoading: boolean;
  groupsLoading: boolean;
  groupsLoadingMore: boolean;
  groupsPage: number;
  groupsHasMore: boolean;
  groupsSearch: string;
  groupsCount: number;

  fetchAll: () => Promise<void>;
  setSelectedAccountId: (id: number | null) => Promise<void>;
  setSelectedGroupId: (id: number | null) => void;
  setActive: (value: boolean) => void;
  setGroupsSearch: (q: string) => void;
  loadMoreGroups: () => Promise<void>;
  save: () => Promise<void>;
}

function filterEligibleAccounts(
  accounts: ZaloAccount[],
  canSkipProxy: boolean,
): ZaloAccount[] {
  return accounts.filter((account) =>
    isZaloAccountRunnable(account, canSkipProxy),
  );
}

async function pollSetupTask(
  taskId: string | number,
  maxAttempts = 40,
  intervalMs = 3000,
): Promise<{ ok: boolean; message?: string }> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const result = await zaloCampaignNotificationService.pollSetupResult(taskId);
    const status = getScanTaskStatus(result);
    if (!isScanTaskDone(status)) {
      await new Promise((resolve) => window.setTimeout(resolve, intervalMs));
      continue;
    }
    const message =
      zaloCampaignNotificationService.extractSetupOutcome(result) ??
      result.message;
    return { ok: status === "SUCCESS", message: message ?? undefined };
  }
  return { ok: false, message: "Hết thời gian chờ thiết lập." };
}

/** Gộp group theo id — giữ order, tránh trùng khi append page. */
function mergeGroups(
  prev: ZaloAccountGroup[],
  next: ZaloAccountGroup[],
): ZaloAccountGroup[] {
  const map = new Map<number, ZaloAccountGroup>();
  for (const g of prev) map.set(g.id, g);
  for (const g of next) map.set(g.id, g);
  return Array.from(map.values());
}

let groupsSearchTimer: ReturnType<typeof setTimeout> | null = null;

export const useZaloCampaignNotificationStore = create<CampaignNotificationState>(
  (set, get) => ({
    accounts: [],
    groups: [],
    selectedAccountId: null,
    selectedGroupId: null,
    active: false,
    loading: false,
    saving: false,
    accountsLoading: false,
    groupsLoading: false,
    groupsLoadingMore: false,
    groupsPage: 0,
    groupsHasMore: false,
    groupsSearch: "",
    groupsCount: 0,

    fetchAll: async () => {
      // Strict Mode / multi-mount: 1 HTTP account + campaign-notification
      return dedupeInflight("campaign-notification:fetchAll", async () => {
        set({ loading: true, accountsLoading: true });

        let accounts: ZaloAccount[] = [];
        let config: Awaited<
          ReturnType<typeof zaloCampaignNotificationService.getConfig>
        > = null;

        try {
          accounts = await fetchAccessibleAccounts();
        } catch {
          accounts = [];
        }

        try {
          config = await zaloCampaignNotificationService.getConfig();
        } catch {
          config = null;
        }

        const canSkipProxy = canSkipZaloProxyRequirement(
          useAuthStore.getState().user,
        );
        const eligible = filterEligibleAccounts(accounts, canSkipProxy);
        const accountId = config?.account ?? null;
        const selected =
          accountId != null && eligible.some((a) => a.id === accountId)
            ? accountId
            : (eligible[0]?.id ?? null);

        set({
          accounts: eligible,
          selectedAccountId: selected,
          selectedGroupId: config?.group ?? null,
          active: Boolean(config?.active),
          loading: false,
          accountsLoading: false,
          groups: [],
          groupsPage: 0,
          groupsHasMore: false,
          groupsSearch: "",
          groupsCount: 0,
        });

        if (selected) {
          set({ groupsLoading: true });
          try {
            const page = await zaloCampaignNotificationService.getGroups(
              selected,
              { page: 1, pageSize: GROUPS_PAGE_SIZE },
            );
            if (get().selectedAccountId !== selected) return;
            const configuredGroupId = config?.group ?? null;
            let groups = page.results;
            // Nhóm đã cấu hình có thể không nằm page 1 — giữ selected nếu có trong list
            let selectedGroupId =
              configuredGroupId != null &&
              groups.some((g) => g.id === configuredGroupId)
                ? configuredGroupId
                : (groups[0]?.id ?? null);
            // Nếu config group chưa có trong page 1, giữ config id (user thấy selected khi load thêm)
            if (
              configuredGroupId != null &&
              !groups.some((g) => g.id === configuredGroupId)
            ) {
              selectedGroupId = configuredGroupId;
            }
            set({
              groups,
              selectedGroupId,
              groupsPage: 1,
              groupsHasMore: page.hasMore,
              groupsCount: page.count,
              groupsLoading: false,
            });
          } catch {
            if (get().selectedAccountId === selected) {
              set({
                groups: [],
                groupsPage: 0,
                groupsHasMore: false,
                groupsCount: 0,
                groupsLoading: false,
              });
            }
          }
        }
      });
    },

    setSelectedAccountId: async (id) => {
      if (groupsSearchTimer) {
        clearTimeout(groupsSearchTimer);
        groupsSearchTimer = null;
      }
      set({
        selectedAccountId: id,
        selectedGroupId: null,
        groups: [],
        groupsLoading: Boolean(id),
        groupsLoadingMore: false,
        groupsPage: 0,
        groupsHasMore: false,
        groupsSearch: "",
        groupsCount: 0,
      });
      if (!id) return;
      try {
        const page = await zaloCampaignNotificationService.getGroups(id, {
          page: 1,
          pageSize: GROUPS_PAGE_SIZE,
        });
        if (get().selectedAccountId !== id) return;
        set({
          groups: page.results,
          selectedGroupId: page.results[0]?.id ?? null,
          groupsPage: 1,
          groupsHasMore: page.hasMore,
          groupsCount: page.count,
          groupsLoading: false,
        });
      } catch {
        if (get().selectedAccountId === id) {
          set({
            groups: [],
            selectedGroupId: null,
            groupsPage: 0,
            groupsHasMore: false,
            groupsCount: 0,
            groupsLoading: false,
          });
        }
      }
    },

    setSelectedGroupId: (id) => set({ selectedGroupId: id }),

    setActive: (value) => set({ active: value }),

    setGroupsSearch: (q) => {
      const selectedAccountId = get().selectedAccountId;
      set({ groupsSearch: q });
      if (!selectedAccountId) return;

      if (groupsSearchTimer) clearTimeout(groupsSearchTimer);
      groupsSearchTimer = setTimeout(() => {
        void (async () => {
          const accountId = get().selectedAccountId;
          const search = get().groupsSearch.trim();
          if (!accountId) return;
          set({ groupsLoading: true, groupsLoadingMore: false });
          try {
            const page = await zaloCampaignNotificationService.getGroups(
              accountId,
              {
                page: 1,
                pageSize: GROUPS_PAGE_SIZE,
                name: search || undefined,
              },
            );
            if (
              get().selectedAccountId !== accountId ||
              get().groupsSearch.trim() !== search
            ) {
              return;
            }
            const prevSelected = get().selectedGroupId;
            const stillVisible =
              prevSelected != null &&
              page.results.some((g) => g.id === prevSelected);
            set({
              groups: page.results,
              groupsPage: 1,
              groupsHasMore: page.hasMore,
              groupsCount: page.count,
              groupsLoading: false,
              selectedGroupId: stillVisible
                ? prevSelected
                : (page.results[0]?.id ?? null),
            });
          } catch {
            if (get().selectedAccountId === accountId) {
              set({
                groups: [],
                groupsPage: 0,
                groupsHasMore: false,
                groupsCount: 0,
                groupsLoading: false,
              });
            }
          }
        })();
      }, 300);
    },

    loadMoreGroups: async () => {
      const {
        selectedAccountId,
        groupsHasMore,
        groupsLoading,
        groupsLoadingMore,
        groupsPage,
        groupsSearch,
        groups,
      } = get();
      if (
        !selectedAccountId ||
        !groupsHasMore ||
        groupsLoading ||
        groupsLoadingMore
      ) {
        return;
      }
      const nextPage = groupsPage + 1;
      set({ groupsLoadingMore: true });
      try {
        const page = await zaloCampaignNotificationService.getGroups(
          selectedAccountId,
          {
            page: nextPage,
            pageSize: GROUPS_PAGE_SIZE,
            name: groupsSearch.trim() || undefined,
          },
        );
        if (get().selectedAccountId !== selectedAccountId) return;
        set({
          groups: mergeGroups(groups, page.results),
          groupsPage: nextPage,
          groupsHasMore: page.hasMore,
          groupsCount: page.count,
          groupsLoadingMore: false,
        });
      } catch {
        if (get().selectedAccountId === selectedAccountId) {
          set({ groupsLoadingMore: false });
        }
      }
    },

    save: async () => {
      const { selectedAccountId, selectedGroupId, active } = get();
      if (!selectedAccountId) {
        throw new Error("Chọn nick Zalo gửi thông báo.");
      }
      if (!selectedGroupId) {
        throw new Error("Chọn nhóm Zalo nhận thông báo.");
      }

      set({ saving: true });
      try {
        const taskId = await zaloCampaignNotificationService.setup({
          id_account: selectedAccountId,
          id_group: selectedGroupId,
          active,
        });

        if (taskId) {
          const outcome = await pollSetupTask(taskId);
          if (!outcome.ok) {
            throw new Error(outcome.message || "Thiết lập thông báo thất bại.");
          }
        }

        await get().fetchAll();
      } finally {
        set({ saving: false });
      }
    },
  }),
);

/** Hiển thị trạng thái nick trong picker */
export function getCampaignNotificationAccountLabel(
  account: ZaloAccount,
): string {
  const status = getZaloAccountStatus(account, []);
  return status.label;
}
