import { getApiErrorMessage } from "@/lib/errors";
import { supportChatbotService } from "@/services/support-chatbot.service";
import type {
  SupportFaq,
  SupportFaqCreatePayload,
  SupportFaqUpdatePayload,
  SupportMedia,
} from "@/types/support-chatbot";
import { create } from "zustand";

interface SupportFaqState {
  faqs: SupportFaq[];
  count: number;
  page: number;
  pageSize: number;
  search: string;
  loading: boolean;
  saving: boolean;
  error: string | null;
  media: SupportMedia[];
  mediaLoading: boolean;

  setSearch: (search: string) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  fetchFaqs: (options?: { silent?: boolean }) => Promise<void>;
  createFaq: (payload: SupportFaqCreatePayload) => Promise<SupportFaq>;
  updateFaq: (id: number, payload: SupportFaqUpdatePayload) => Promise<SupportFaq>;
  deleteFaq: (id: number) => Promise<void>;
  clearFaqs: () => Promise<number>;
  exportText: () => Promise<string>;
  exportCsv: () => Promise<string>;
  importFaqs: (
    items: SupportFaqCreatePayload[],
  ) => Promise<{
    created_count: number;
    errors: Array<{ index?: number; error?: string; errors?: unknown }>;
  }>;
  syncEmbeddings: () => Promise<number>;
  fetchMedia: () => Promise<void>;
  uploadMedia: (file: File) => Promise<SupportMedia>;
}

export const useSupportFaqStore = create<SupportFaqState>((set, get) => ({
  faqs: [],
  count: 0,
  page: 1,
  pageSize: 20,
  search: "",
  loading: false,
  saving: false,
  error: null,
  media: [],
  mediaLoading: false,

  setSearch: (search) => set({ search, page: 1 }),
  setPage: (page) => set({ page }),
  setPageSize: (pageSize) => set({ pageSize, page: 1 }),

  fetchFaqs: async (options) => {
    const silent = options?.silent ?? false;
    if (!silent) set({ loading: true, error: null });
    try {
      const { page, pageSize, search } = get();
      const data = await supportChatbotService.listFaqs({
        page,
        number_per_page: pageSize,
        search: search.trim() || undefined,
      });
      set({
        faqs: data.results,
        count: data.count,
        loading: false,
      });
    } catch (err) {
      set({
        loading: false,
        error: getApiErrorMessage(err),
        faqs: silent ? get().faqs : [],
      });
      throw err;
    }
  },

  createFaq: async (payload) => {
    set({ saving: true });
    try {
      const faq = await supportChatbotService.createFaq(payload);
      await get().fetchFaqs({ silent: true });
      set({ saving: false });
      return faq;
    } catch (err) {
      set({ saving: false });
      throw err;
    }
  },

  updateFaq: async (id, payload) => {
    set({ saving: true });
    try {
      const faq = await supportChatbotService.updateFaq(id, payload);
      await get().fetchFaqs({ silent: true });
      set({ saving: false });
      return faq;
    } catch (err) {
      set({ saving: false });
      throw err;
    }
  },

  deleteFaq: async (id) => {
    set({ saving: true });
    try {
      await supportChatbotService.deleteFaq(id);
      await get().fetchFaqs({ silent: true });
      set({ saving: false });
    } catch (err) {
      set({ saving: false });
      throw err;
    }
  },

  clearFaqs: async () => {
    set({ saving: true });
    try {
      const n = await supportChatbotService.clearFaqs();
      set({ faqs: [], count: 0, saving: false });
      return n;
    } catch (err) {
      set({ saving: false });
      throw err;
    }
  },

  exportText: async () => supportChatbotService.exportFaqsText(),

  exportCsv: async () => supportChatbotService.exportFaqsCsv(),

  importFaqs: async (items) => {
    set({ saving: true });
    try {
      const result = await supportChatbotService.importFaqs(items);
      await get().fetchFaqs({ silent: true });
      set({ saving: false });
      return result;
    } catch (err) {
      set({ saving: false });
      throw err;
    }
  },

  syncEmbeddings: async () => {
    set({ saving: true });
    try {
      const n = await supportChatbotService.syncEmbeddings();
      await get().fetchFaqs({ silent: true });
      set({ saving: false });
      return n;
    } catch (err) {
      set({ saving: false });
      throw err;
    }
  },

  fetchMedia: async () => {
    set({ mediaLoading: true });
    try {
      const data = await supportChatbotService.listMedia({
        page: 1,
        number_per_page: 100,
      });
      set({ media: data.results, mediaLoading: false });
    } catch {
      set({ mediaLoading: false });
    }
  },

  uploadMedia: async (file) => {
    const media = await supportChatbotService.uploadMedia(file);
    set((s) => ({ media: [media, ...s.media] }));
    return media;
  },
}));
