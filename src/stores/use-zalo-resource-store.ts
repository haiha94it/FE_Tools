import { assertGuidesAndResourcesAdmin } from "@/lib/guide-resource-admin";
import { dedupeInflight } from "@/lib/inflight";
import { zaloResourceService } from "@/services/zalo-resource.service";
import type {
  ZaloProductAppFormPayload,
  ZaloProductAppItem,
  ZaloResourceFormPayload,
  ZaloResourceItem,
} from "@/types/zalo-resource";
import { create } from "zustand";

interface ZaloResourceState {
  resources: ZaloResourceItem[];
  productApps: ZaloProductAppItem[];
  loading: boolean;
  saving: boolean;
  uploadingImage: boolean;
  error: string | null;

  fetchAll: (options?: { silent?: boolean }) => Promise<void>;
  createOrEditResource: (payload: ZaloResourceFormPayload) => Promise<void>;
  deleteResource: (id: number) => Promise<void>;
  createOrEditProductApp: (payload: ZaloProductAppFormPayload) => Promise<void>;
  deleteProductApp: (id: number) => Promise<void>;
  uploadImage: (file: File) => Promise<string>;
}

export const useZaloResourceStore = create<ZaloResourceState>((set, get) => ({
  resources: [],
  productApps: [],
  loading: false,
  saving: false,
  uploadingImage: false,
  error: null,

  fetchAll: async (options) => {
    const silent = options?.silent ?? false;
    // Gộp Strict Mode / multi-mount; silent sau mutation vẫn force refresh.
    return dedupeInflight(
      `zalo-resource:fetchAll:${silent ? "silent" : "full"}`,
      async () => {
        if (!silent) set({ loading: true, error: null });
        try {
          const [resources, productApps] = await Promise.all([
            zaloResourceService.listResources(),
            zaloResourceService.listProductApps(),
          ]);
          set({ resources, productApps, loading: false });
        } catch {
          set((state) => ({
            resources: silent ? state.resources : [],
            productApps: silent ? state.productApps : [],
            loading: false,
            error: "Không tải được danh sách tài nguyên.",
          }));
        }
      },
    );
  },

  createOrEditResource: async (payload) => {
    assertGuidesAndResourcesAdmin();
    set({ saving: true });
    try {
      await zaloResourceService.createOrEditResource(payload);
      await get().fetchAll({ silent: true });
      set({ saving: false });
    } catch (error) {
      set({ saving: false });
      throw error;
    }
  },

  deleteResource: async (id) => {
    assertGuidesAndResourcesAdmin();
    set({ saving: true });
    try {
      await zaloResourceService.deleteResource(id);
      set((state) => ({
        resources: state.resources.filter((item) => item.id !== id),
        saving: false,
      }));
    } catch (error) {
      set({ saving: false });
      throw error;
    }
  },

  createOrEditProductApp: async (payload) => {
    assertGuidesAndResourcesAdmin();
    set({ saving: true });
    try {
      await zaloResourceService.createOrEditProductApp(payload);
      await get().fetchAll({ silent: true });
      set({ saving: false });
    } catch (error) {
      set({ saving: false });
      throw error;
    }
  },

  deleteProductApp: async (id) => {
    assertGuidesAndResourcesAdmin();
    set({ saving: true });
    try {
      await zaloResourceService.deleteProductApp(id);
      set((state) => ({
        productApps: state.productApps.filter((item) => item.id !== id),
        saving: false,
      }));
    } catch (error) {
      set({ saving: false });
      throw error;
    }
  },

  uploadImage: async (file) => {
    assertGuidesAndResourcesAdmin();
    set({ uploadingImage: true });
    try {
      const image = await zaloResourceService.uploadImage(file);
      set({ uploadingImage: false });
      return image;
    } catch (error) {
      set({ uploadingImage: false });
      throw error;
    }
  },
}));