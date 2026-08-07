import { create } from "zustand";
import { runAsyncAction } from "@/stores/helpers/async-actions";
import { zaloShopService } from "@/services/zalo-shop.service";
import type {
  CreateCategoryPayload,
  CreateProductPayload,
  ShopCategory,
  ShopCover,
  ShopProduct,
  UpdateCoverPayload,
} from "@/types/zalo-shop";

interface ShopAdminState {
  categories: ShopCategory[];
  products: ShopProduct[];
  productCount: number;
  cover: ShopCover | null;
  /** null = chưa load; "" = chưa cấu hình; string = domain hiện tại */
  domain: string | null;
  selectedCategoryId: number | null;
  isLoading: boolean;
  error: string | null;
  loadDomain: () => Promise<void>;
  saveDomain: (domain: string) => Promise<void>;
  loadCategories: (userId: number | string) => Promise<void>;
  loadCover: (userId: number | string) => Promise<void>;
  loadProducts: (
    userId: number | string,
    categoryId?: number | string,
  ) => Promise<void>;
  setSelectedCategoryId: (id: number | null) => void;
  createCategory: (payload: CreateCategoryPayload) => Promise<void>;
  deleteCategory: (
    userId: number | string,
    categoryId: number,
  ) => Promise<void>;
  toggleCategoryStatus: (
    category: ShopCategory,
    active: boolean,
  ) => Promise<void>;
  updateCover: (payload: UpdateCoverPayload) => Promise<void>;
  deleteProduct: (
    accountId: number | string,
    productId: number,
  ) => Promise<void>;
  toggleProductStatus: (product: ShopProduct, active: boolean) => Promise<void>;
  copyProduct: (productId: number, title: string) => Promise<void>;
  saveProduct: (payload: CreateProductPayload) => Promise<void>;
}

export const useZaloShopAdminStore = create<ShopAdminState>()((set, get) => ({
  categories: [],
  products: [],
  productCount: 0,
  cover: null,
  domain: null,
  selectedCategoryId: null,
  isLoading: false,
  error: null,

  loadDomain: async () => {
    await runAsyncAction(async () => {
      const domain = await zaloShopService.getDomain();
      set({ domain });
    }, set);
  },

  saveDomain: async (domain) => {
    await runAsyncAction(async () => {
      await zaloShopService.editDomain(domain);
      set({ domain: domain.trim().toLowerCase() });
    }, set);
  },

  loadCategories: async (userId) => {
    await runAsyncAction(async () => {
      const categories = await zaloShopService.listCategories(userId);
      set({ categories });
    }, set);
  },

  loadCover: async (userId) => {
    await runAsyncAction(async () => {
      const cover = await zaloShopService.getCover(userId);
      set({ cover });
    }, set);
  },

  loadProducts: async (userId, categoryId) => {
    await runAsyncAction(async () => {
      const response = await zaloShopService.listProducts({
        employeeId: userId,
        categoryId,
        pageSize: 100,
      });
      set({ products: response.results, productCount: response.count });
    }, set);
  },

  setSelectedCategoryId: (id) => set({ selectedCategoryId: id }),

  createCategory: async (payload) => {
    await runAsyncAction(async () => {
      await zaloShopService.createOrUpdateCategory(payload);
      await get().loadCategories(payload.id_user);
    }, set);
  },

  deleteCategory: async (userId, categoryId) => {
    await runAsyncAction(async () => {
      await zaloShopService.deleteCategory(userId, categoryId);
      await get().loadCategories(userId);
      set({ selectedCategoryId: null, products: [] });
    }, set);
  },

  toggleCategoryStatus: async (category, active) => {
    await runAsyncAction(async () => {
      if (active) {
        await zaloShopService.activateCategory(category.id);
      } else {
        await zaloShopService.deactivateCategory(category.id);
      }
      const userId = category.id_user ?? category.user;
      if (userId) await get().loadCategories(userId);
    }, set);
  },

  updateCover: async (payload) => {
    await runAsyncAction(async () => {
      await zaloShopService.updateCover(payload);
      await get().loadCover(payload.id_user);
    }, set);
  },

  deleteProduct: async (accountId, productId) => {
    await runAsyncAction(async () => {
      await zaloShopService.deleteProduct(accountId, productId);
      const { selectedCategoryId } = get();
      await get().loadProducts(accountId, selectedCategoryId ?? undefined);
    }, set);
  },

  toggleProductStatus: async (product, active) => {
    await runAsyncAction(async () => {
      if (active) {
        await zaloShopService.activateProduct(product.id);
      } else {
        await zaloShopService.deactivateProduct(product.id);
      }
      const categoryId = product.category;
      const accountId = get().cover?.user;
      if (accountId) await get().loadProducts(accountId, categoryId);
    }, set);
  },

  copyProduct: async (productId, title) => {
    await runAsyncAction(async () => {
      await zaloShopService.copyProduct(productId, title);
      const { cover, selectedCategoryId } = get();
      if (cover?.user) {
        await get().loadProducts(cover.user, selectedCategoryId ?? undefined);
      }
    }, set);
  },

  saveProduct: async (payload) => {
    await runAsyncAction(async () => {
      await zaloShopService.createOrUpdateProduct(payload);
    }, set);
  },
}));