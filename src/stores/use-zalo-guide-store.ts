import { resolveGuideSystemFilter } from "@/lib/zalo-guide-utils";
import { zaloGuideService } from "@/services/zalo-guide.service";
import type { ZaloGuideFormPayload, ZaloGuideItem } from "@/types/zalo-guide";
import { create } from "zustand";

interface ZaloGuideState {
  guides: ZaloGuideItem[];
  loading: boolean;
  saving: boolean;
  uploadingImage: boolean;
  error: string | null;

  fetchGuides: (options?: { silent?: boolean }) => Promise<void>;
  createOrEditGuide: (payload: ZaloGuideFormPayload) => Promise<void>;
  deleteGuide: (id: number) => Promise<void>;
  uploadImage: (file: File) => Promise<string>;
}

export const useZaloGuideStore = create<ZaloGuideState>((set, get) => ({
  guides: [],
  loading: false,
  saving: false,
  uploadingImage: false,
  error: null,

  fetchGuides: async (options) => {
    const silent = options?.silent ?? false;
    if (!silent) set({ loading: true, error: null });
    try {
      const system = resolveGuideSystemFilter();
      const guides = await zaloGuideService.listGuides(system);
      set({ guides, loading: false });
    } catch {
      set((state) => ({
        guides: silent ? state.guides : [],
        loading: false,
        error: "Không tải được danh sách hướng dẫn.",
      }));
    }
  },

  createOrEditGuide: async (payload) => {
    set({ saving: true });
    try {
      await zaloGuideService.createOrEditGuide(payload);
      await get().fetchGuides({ silent: true });
      set({ saving: false });
    } catch (error) {
      set({ saving: false });
      throw error;
    }
  },

  deleteGuide: async (id) => {
    set({ saving: true });
    try {
      await zaloGuideService.deleteGuide(id);
      set((state) => ({
        guides: state.guides.filter((item) => item.id !== id),
        saving: false,
      }));
    } catch (error) {
      set({ saving: false });
      throw error;
    }
  },

  uploadImage: async (file) => {
    set({ uploadingImage: true });
    try {
      const image = await zaloGuideService.uploadImage(file);
      set({ uploadingImage: false });
      return image;
    } catch (error) {
      set({ uploadingImage: false });
      throw error;
    }
  },
}));