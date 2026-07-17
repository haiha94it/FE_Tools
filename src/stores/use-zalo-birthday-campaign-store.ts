import { fetchAccessibleAccounts } from "@/lib/fetch-accessible-accounts";
import { zaloBirthdayCampaignService } from "@/services/zalo-birthday-campaign.service";
import type {
  BirthdayCampaign,
  BirthdayCampaignFormPayload,
  BirthdayCampaignResult,
  BirthdayMediaItem,
} from "@/types/zalo-birthday-campaign";
import type { ZaloAccount } from "@/types/zalo-account";
import { create } from "zustand";

interface BirthdayCampaignState {
  campaign: BirthdayCampaign | null;
  accounts: ZaloAccount[];
  videos: BirthdayMediaItem[];
  albums: BirthdayMediaItem[];

  loading: boolean;
  accountsLoading: boolean;
  saving: boolean;
  actionLoading: boolean;
  mediaLoading: boolean;
  error: string | null;

  results: BirthdayCampaignResult[];
  resultsSelectedIds: number[];
  resultsPage: number;
  resultsPerPage: number;
  resultsTotal: number;
  resultsLoading: boolean;

  fetchCampaign: (options?: { silent?: boolean }) => Promise<void>;
  fetchAccounts: () => Promise<void>;
  fetchMediaLibraries: () => Promise<void>;
  createOrEditCampaign: (payload: BirthdayCampaignFormPayload) => Promise<void>;
  startCampaign: () => Promise<void>;
  stopCampaign: () => Promise<void>;
  runNow: () => Promise<void>;

  setResultsPage: (page: number) => void;
  setResultsPerPage: (perPage: number) => void;
  toggleResultSelected: (id: number) => void;
  toggleSelectAllResults: () => void;
  deleteSelectedResults: () => Promise<void>;
  refreshResults: (options?: { silent?: boolean }) => Promise<void>;
}

export const useZaloBirthdayCampaignStore = create<BirthdayCampaignState>(
  (set, get) => ({
    campaign: null,
    accounts: [],
    videos: [],
    albums: [],

    loading: false,
    accountsLoading: false,
    saving: false,
    actionLoading: false,
    mediaLoading: false,
    error: null,

    results: [],
    resultsSelectedIds: [],
    resultsPage: 1,
    resultsPerPage: 100,
    resultsTotal: 0,
    resultsLoading: false,

    fetchCampaign: async (options) => {
      const silent = options?.silent ?? false;
      if (!silent) set({ loading: true, error: null });
      try {
        const campaign = await zaloBirthdayCampaignService.getCampaign();
        set({ campaign, loading: false });
      } catch {
        set((state) => ({
          campaign: silent ? state.campaign : null,
          loading: false,
          error: "Không tải được kịch bản sinh nhật.",
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

    fetchMediaLibraries: async () => {
      set({ mediaLoading: true });
      try {
        const [videos, albums] = await Promise.all([
          zaloBirthdayCampaignService.listVideos(),
          zaloBirthdayCampaignService.listAlbums(),
        ]);
        set({ videos, albums, mediaLoading: false });
      } catch {
        set({ videos: [], albums: [], mediaLoading: false });
      }
    },

    createOrEditCampaign: async (payload) => {
      set({ saving: true });
      try {
        await zaloBirthdayCampaignService.createOrEditCampaign(payload);
        await get().fetchCampaign({ silent: true });
        set({ saving: false });
      } catch (error) {
        set({ saving: false });
        throw error;
      }
    },

    startCampaign: async () => {
      const { campaign } = get();
      if (!campaign?.id) {
        throw new Error("Chưa có kịch bản. Vui lòng tạo kịch bản trước.");
      }
      set({ actionLoading: true });
      try {
        await zaloBirthdayCampaignService.startCampaign(campaign.id);
        set({ actionLoading: false });
        await get().fetchCampaign({ silent: true });
      } catch (error) {
        set({ actionLoading: false });
        throw error;
      }
    },

    stopCampaign: async () => {
      const { campaign } = get();
      if (!campaign?.id) {
        throw new Error("Chưa có kịch bản đang chạy.");
      }
      set({ actionLoading: true });
      try {
        await zaloBirthdayCampaignService.stopCampaign(campaign.id);
        set({ actionLoading: false });
        await get().fetchCampaign({ silent: true });
      } catch (error) {
        set({ actionLoading: false });
        throw error;
      }
    },

    runNow: async () => {
      set({ actionLoading: true });
      try {
        await zaloBirthdayCampaignService.runNow();
        set({ actionLoading: false });
        await Promise.all([
          get().fetchCampaign({ silent: true }),
          get().refreshResults({ silent: true }),
        ]);
      } catch (error) {
        set({ actionLoading: false });
        throw error;
      }
    },

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
      const { resultsSelectedIds } = get();
      if (!resultsSelectedIds.length) return;
      const idsToDelete = new Set(resultsSelectedIds);
      try {
        await zaloBirthdayCampaignService.deleteResults(resultsSelectedIds);
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
      const { resultsPage, resultsPerPage } = get();
      const silent = options?.silent ?? false;
      if (!silent) set({ resultsLoading: true });
      try {
        const pageData = await zaloBirthdayCampaignService.fetchResults({
          page: resultsPage,
          perPage: resultsPerPage,
        });
        set({
          results: pageData.results ?? [],
          resultsTotal: pageData.count ?? pageData.results?.length ?? 0,
          resultsLoading: false,
        });
      } catch {
        set((state) => ({
          results: silent ? state.results : [],
          resultsTotal: silent ? state.resultsTotal : 0,
          resultsLoading: false,
        }));
      }
    },
  }),
);