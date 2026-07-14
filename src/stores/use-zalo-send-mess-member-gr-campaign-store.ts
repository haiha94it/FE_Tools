import { zaloSendMessMemberGrCampaignService } from "@/services/zalo-send-mess-member-gr-campaign.service";
import { fetchAccessibleAccounts } from "@/lib/fetch-accessible-accounts";
import type {
  SendMessMemberGrCampaign,
  SendMessMemberGrCampaignFormPayload,
  SendMessMemberGrCampaignResult,
  SendMessMemberGrCampaignStatistics,
} from "@/types/zalo-send-mess-member-gr-campaign";
import type { ZaloAccount } from "@/types/zalo-account";
import { create } from "zustand";

interface SendMessMemberGrCampaignState {
  campaigns: SendMessMemberGrCampaign[];
  accounts: ZaloAccount[];
  selectedIds: number[];
  loading: boolean;
  accountsLoading: boolean;
  saving: boolean;
  actionLoading: boolean;
  error: string | null;

  resultsOpen: boolean;
  resultsCampaignId: number | null;
  results: SendMessMemberGrCampaignResult[];
  resultsSelectedIds: number[];
  resultsPage: number;
  resultsPerPage: number;
  resultsTotal: number;
  resultsLoading: boolean;
  statistics: SendMessMemberGrCampaignStatistics;

  fetchCampaigns: (options?: { silent?: boolean }) => Promise<void>;
  fetchAccounts: () => Promise<void>;
  toggleSelected: (id: number) => void;
  toggleSelectAll: () => void;

  createOrEditCampaign: (payload: SendMessMemberGrCampaignFormPayload) => Promise<void>;
  deleteCampaign: (id: number) => Promise<void>;
  copyCampaign: (id: number, name: string) => Promise<void>;
  startCampaigns: (type: "new" | "continue") => Promise<void>;
  stopCampaigns: () => Promise<void>;

  openResults: (campaignId: number) => Promise<void>;
  closeResults: () => void;
  setResultsPage: (page: number) => void;
  setResultsPerPage: (perPage: number) => void;
  toggleResultSelected: (id: number) => void;
  toggleSelectAllResults: () => void;
  deleteSelectedResults: () => Promise<void>;
  refreshResults: (options?: { silent?: boolean }) => Promise<void>;
}

export const useZaloSendMessMemberGrCampaignStore = create<SendMessMemberGrCampaignState>(
  (set, get) => ({
    campaigns: [],
    accounts: [],
    selectedIds: [],
    loading: false,
    accountsLoading: false,
    saving: false,
    actionLoading: false,
    error: null,

    resultsOpen: false,
    resultsCampaignId: null,
    results: [],
    resultsSelectedIds: [],
    resultsPage: 1,
    resultsPerPage: 100,
    resultsTotal: 0,
    resultsLoading: false,
    statistics: {},

    fetchCampaigns: async (options) => {
      const silent = options?.silent ?? false;
      if (!silent) set({ loading: true, error: null });
      try {
        const campaigns = await zaloSendMessMemberGrCampaignService.listCampaigns();
        set({
          campaigns: campaigns.sort((a, b) => b.id - a.id),
          loading: false,
        });
      } catch {
        set((state) => ({
          campaigns: silent ? state.campaigns : [],
          loading: false,
          error: "Không tải được danh sách kịch bản.",
        }));
      }
    },

    fetchAccounts: async () => {
      set({ accountsLoading: true });
      try {
        const accounts = await fetchAccessibleAccounts();
        set({ accounts, accountsLoading: false });
      } catch {
        set({ accounts: [], accountsLoading: false });
      }
    },

    toggleSelected: (id) => {
      const { selectedIds } = get();
      set({
        selectedIds: selectedIds.includes(id)
          ? selectedIds.filter((item) => item !== id)
          : [...selectedIds, id],
      });
    },

    toggleSelectAll: () => {
      const { campaigns, selectedIds } = get();
      const allIds = campaigns.map((item) => item.id);
      const allSelected =
        allIds.length > 0 && allIds.every((id) => selectedIds.includes(id));
      set({ selectedIds: allSelected ? [] : allIds });
    },

    createOrEditCampaign: async (payload) => {
      set({ saving: true });
      try {
        await zaloSendMessMemberGrCampaignService.createOrEditCampaign(payload);
        await get().fetchCampaigns({ silent: true });
        set({ saving: false });
      } catch (error) {
        set({ saving: false });
        throw error;
      }
    },

    deleteCampaign: async (id) => {
      set({ actionLoading: true });
      try {
        await zaloSendMessMemberGrCampaignService.deleteCampaign(id);
        set((state) => ({
          campaigns: state.campaigns.filter((item) => item.id !== id),
          selectedIds: state.selectedIds.filter((item) => item !== id),
          actionLoading: false,
        }));
      } catch (error) {
        set({ actionLoading: false });
        throw error;
      }
    },

    copyCampaign: async (id, name) => {
      set({ actionLoading: true });
      try {
        await zaloSendMessMemberGrCampaignService.copyCampaign(id, name);
        set({ actionLoading: false, selectedIds: [] });
        await get().fetchCampaigns({ silent: true });
      } catch (error) {
        set({ actionLoading: false });
        throw error;
      }
    },

    startCampaigns: async (type) => {
      const { selectedIds } = get();
      if (!selectedIds.length) {
        throw new Error("Chọn ít nhất 1 kịch bản để chạy.");
      }
      set({ actionLoading: true });
      try {
        await zaloSendMessMemberGrCampaignService.startCampaigns(selectedIds, type);
        set({ actionLoading: false });
        await get().fetchCampaigns({ silent: true });
      } catch (error) {
        set({ actionLoading: false });
        throw error;
      }
    },

    stopCampaigns: async () => {
      const { selectedIds } = get();
      if (!selectedIds.length) {
        throw new Error("Chọn ít nhất 1 kịch bản để dừng.");
      }
      set({ actionLoading: true });
      try {
        await zaloSendMessMemberGrCampaignService.stopCampaigns(selectedIds);
        set({ actionLoading: false });
        await get().fetchCampaigns({ silent: true });
      } catch (error) {
        set({ actionLoading: false });
        throw error;
      }
    },

    openResults: async (campaignId) => {
      set({
        resultsOpen: true,
        resultsCampaignId: campaignId,
        resultsPage: 1,
        resultsSelectedIds: [],
      });
      await get().refreshResults();
    },

    closeResults: () =>
      set({
        resultsOpen: false,
        resultsCampaignId: null,
        results: [],
        resultsSelectedIds: [],
        statistics: {},
      }),

    setResultsPage: (page) => {
      set({ resultsPage: page });
      void get().refreshResults();
    },

    setResultsPerPage: (perPage) => {
      set({ resultsPerPage: perPage, resultsPage: 1 });
      void get().refreshResults();
    },

    toggleResultSelected: (id) => {
      const { resultsSelectedIds } = get();
      set({
        resultsSelectedIds: resultsSelectedIds.includes(id)
          ? resultsSelectedIds.filter((item) => item !== id)
          : [...resultsSelectedIds, id],
      });
    },

    toggleSelectAllResults: () => {
      const { results, resultsSelectedIds } = get();
      const allIds = results.map((item) => item.id);
      const allSelected =
        allIds.length > 0 &&
        allIds.every((id) => resultsSelectedIds.includes(id));
      set({ resultsSelectedIds: allSelected ? [] : allIds });
    },

    deleteSelectedResults: async () => {
      const { resultsSelectedIds, resultsCampaignId } = get();
      if (!resultsSelectedIds.length || !resultsCampaignId) return;
      const idsToDelete = new Set(resultsSelectedIds);
      try {
        await zaloSendMessMemberGrCampaignService.deleteResults(resultsSelectedIds);
        set((state) => ({
          results: state.results.filter((item) => !idsToDelete.has(item.id)),
          resultsTotal: Math.max(0, state.resultsTotal - idsToDelete.size),
          resultsSelectedIds: [],
        }));
        void get().refreshResults({ silent: true });
      } catch (error) {
        throw error;
      }
    },

    refreshResults: async (options) => {
      const { resultsCampaignId, resultsPage, resultsPerPage } = get();
      if (!resultsCampaignId) return;
      const silent = options?.silent ?? false;
      if (!silent) set({ resultsLoading: true });
      try {
        const [pageData, statistics] = await Promise.all([
          zaloSendMessMemberGrCampaignService.fetchResults({
            categoryId: resultsCampaignId,
            page: resultsPage,
            perPage: resultsPerPage,
          }),
          zaloSendMessMemberGrCampaignService.fetchStatistics(resultsCampaignId),
        ]);
        set({
          results: pageData.results ?? [],
          resultsTotal: pageData.count ?? pageData.results?.length ?? 0,
          statistics,
          resultsLoading: false,
        });
      } catch {
        set((state) => ({
          results: silent ? state.results : [],
          resultsTotal: silent ? state.resultsTotal : 0,
          statistics: silent ? state.statistics : {},
          resultsLoading: false,
        }));
      }
    },
  }),
);