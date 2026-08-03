import { getApiErrorMessage } from "@/lib/errors";
import { supportChatbotService } from "@/services/support-chatbot.service";
import type {
  SupportFaq,
  SupportMissConvertPayload,
  SupportMissQuery,
} from "@/types/support-chatbot";
import { create } from "zustand";

interface SupportMissState {
  items: SupportMissQuery[];
  count: number;
  page: number;
  pageSize: number;
  search: string;
  loading: boolean;
  saving: boolean;
  error: string | null;

  setSearch: (s: string) => void;
  setPage: (p: number) => void;
  fetchMiss: (options?: { silent?: boolean }) => Promise<void>;
  deleteMiss: (id: number) => Promise<void>;
  clearAll: () => Promise<number>;
  convertToFaq: (id: number, payload: SupportMissConvertPayload) => Promise<SupportFaq>;
}

export const useSupportMissStore = create<SupportMissState>((set, get) => ({
  items: [],
  count: 0,
  page: 1,
  pageSize: 20,
  search: "",
  loading: false,
  saving: false,
  error: null,

  setSearch: (search) => set({ search, page: 1 }),
  setPage: (page) => set({ page }),

  fetchMiss: async (options) => {
    const silent = options?.silent ?? false;
    if (!silent) set({ loading: true, error: null });
    try {
      const { page, pageSize, search } = get();
      const data = await supportChatbotService.listMissQueries({
        page,
        number_per_page: pageSize,
        search: search.trim() || undefined,
      });
      set({ items: data.results, count: data.count, loading: false });
    } catch (err) {
      set({
        loading: false,
        error: getApiErrorMessage(err),
        items: silent ? get().items : [],
      });
    }
  },

  deleteMiss: async (id) => {
    set({ saving: true });
    try {
      await supportChatbotService.deleteMissQuery(id);
      set((s) => ({
        items: s.items.filter((i) => i.id !== id),
        count: Math.max(0, s.count - 1),
        saving: false,
      }));
    } catch (err) {
      set({ saving: false });
      throw err;
    }
  },

  clearAll: async () => {
    set({ saving: true });
    try {
      const n = await supportChatbotService.clearMissQueries();
      set({ items: [], count: 0, saving: false });
      return n;
    } catch (err) {
      set({ saving: false });
      throw err;
    }
  },

  convertToFaq: async (id, payload) => {
    set({ saving: true });
    try {
      const faq = await supportChatbotService.convertMissQuery(id, payload);
      set((s) => ({
        items: s.items.filter((i) => i.id !== id),
        count: Math.max(0, s.count - 1),
        saving: false,
      }));
      return faq;
    } catch (err) {
      set({ saving: false });
      throw err;
    }
  },
}));
