import { API_UPLOAD, API_ZALO_SHOP } from "@/config/api";
import api from "@/lib/axios";
import publicApi from "@/lib/public-api";
import type {
  AddToCartPayload,
  CreateCategoryPayload,
  CreateOrderPayload,
  CreateProductPayload,
  ShopCart,
  ShopCategory,
  ShopCover,
  ShopCoupon,
  ShopLocation,
  ShopOrder,
  ShopOrdersResponse,
  ShopProduct,
  ShopProductsResponse,
  UpdateCoverPayload,
} from "@/types/zalo-shop";

function normalizeList<T>(body: unknown): T[] {
  if (Array.isArray(body)) return body;
  if (body && typeof body === "object" && "results" in body) {
    const data = body as { results?: T[] };
    return Array.isArray(data.results) ? data.results : [];
  }
  return [];
}

function normalizePaginated<T>(body: unknown): { results: T[]; count: number } {
  if (body && typeof body === "object" && "results" in body) {
    const data = body as { results?: T[]; count?: number };
    return {
      results: Array.isArray(data.results) ? data.results : [],
      count: typeof data.count === "number" ? data.count : 0,
    };
  }
  if (Array.isArray(body)) {
    return { results: body, count: body.length };
  }
  return { results: [], count: 0 };
}

export const zaloShopService = {
  async getDomain(): Promise<string | null> {
    const response = await api.get(API_ZALO_SHOP.DOMAIN);
    const data = response.data;
    if (typeof data === "string") return data;
    if (data && typeof data === "object" && "domain" in data) {
      return String((data as { domain: string }).domain);
    }
    return data ? String(data) : null;
  },

  async listCategories(employeeId: number | string): Promise<ShopCategory[]> {
    const response = await publicApi.get(
      `${API_ZALO_SHOP.CATEGORY}?id_employee=${employeeId}`,
    );
    return normalizeList<ShopCategory>(response.data);
  },

  async createOrUpdateCategory(payload: CreateCategoryPayload): Promise<void> {
    await api.post(API_ZALO_SHOP.CATEGORY_CREATE, payload);
  },

  async deleteCategory(
    userId: number | string,
    categoryId: number,
  ): Promise<void> {
    await api.post(API_ZALO_SHOP.CATEGORY_DELETE, {
      id_user: userId,
      id_category: categoryId,
    });
  },

  async activateCategory(categoryId: number): Promise<void> {
    await api.post(API_ZALO_SHOP.CATEGORY_ACTIVATE, { id_category: categoryId });
  },

  async deactivateCategory(categoryId: number): Promise<void> {
    await api.post(API_ZALO_SHOP.CATEGORY_DEACTIVATE, {
      id_category: categoryId,
    });
  },

  async getCover(employeeId: number | string): Promise<ShopCover> {
    const response = await publicApi.get(
      `${API_ZALO_SHOP.COVER}?id_employee=${employeeId}`,
    );
    return (response.data ?? {}) as ShopCover;
  },

  async updateCover(payload: UpdateCoverPayload): Promise<void> {
    await api.post(API_ZALO_SHOP.COVER_CREATE, payload);
  },

  async findProductById(
    employeeId: number | string,
    productId: number | string,
  ): Promise<ShopProduct | null> {
    const response = await this.listProducts({
      employeeId,
      pageSize: 500,
    });
    const id = Number(productId);
    return response.results.find((p) => p.id === id) ?? null;
  },

  async listProducts(params: {
    employeeId: number | string;
    categoryId?: number | string;
    page?: number;
    pageSize?: number;
  }): Promise<ShopProductsResponse> {
    const search = new URLSearchParams();
    search.set("id_employee", String(params.employeeId));
    if (params.categoryId != null) {
      search.set("id_category", String(params.categoryId));
    }
    if (params.pageSize) search.set("number_per_page", String(params.pageSize));
    if (params.page) search.set("page", String(params.page));

    const response = await publicApi.get(
      `${API_ZALO_SHOP.PRODUCT}?${search.toString()}`,
    );
    const normalized = normalizePaginated<ShopProduct>(response.data);
    return { ...normalized, next: null, previous: null };
  },

  async createOrUpdateProduct(payload: CreateProductPayload): Promise<void> {
    await api.post(API_ZALO_SHOP.PRODUCT_CREATE, payload);
  },

  async deleteProduct(
    accountId: number | string,
    productId: number,
  ): Promise<void> {
    await api.post(API_ZALO_SHOP.PRODUCT_DELETE, {
      id_account: accountId,
      id_product: productId,
    });
  },

  async activateProduct(productId: number): Promise<void> {
    await api.post(API_ZALO_SHOP.PRODUCT_ACTIVATE, { id_product: productId });
  },

  async deactivateProduct(productId: number): Promise<void> {
    await api.post(API_ZALO_SHOP.PRODUCT_DEACTIVATE, { id_product: productId });
  },

  async copyProduct(productId: number, title: string): Promise<void> {
    await api.post(API_ZALO_SHOP.PRODUCT_COPY, {
      id_product: productId,
      title,
    });
  },

  async uploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post(API_UPLOAD.FILE, formData);
    const data = response.data as { file?: string };
    return data.file ?? "";
  },

  async getCart(
    employeeId: number | string,
    sessionKey: string,
  ): Promise<ShopCart> {
    const response = await publicApi.post(API_ZALO_SHOP.CART, {
      id_employee: employeeId,
      session_key: sessionKey,
    });
    return (response.data ?? {}) as ShopCart;
  },

  async addToCart(payload: AddToCartPayload): Promise<string | null> {
    const response = await publicApi.post(API_ZALO_SHOP.CART_ADD, payload);
    const data = response.data as { data?: { session_key?: string } };
    return data?.data?.session_key ?? null;
  },

  async updateCartQuantity(payload: {
    id_employee: number | string;
    session_key: string;
    id_cart_item: number;
    quantity: number;
  }): Promise<void> {
    await publicApi.post(API_ZALO_SHOP.CART_UPDATE, payload);
  },

  async createOrder(payload: CreateOrderPayload): Promise<void> {
    await publicApi.post(API_ZALO_SHOP.ORDER_CREATE, payload);
  },

  async listOrders(params?: {
    page?: number;
    pageSize?: number;
  }): Promise<ShopOrdersResponse> {
    const search = new URLSearchParams();
    if (params?.pageSize) search.set("number_per_page", String(params.pageSize));
    if (params?.page) search.set("page", String(params.page));
    const qs = search.toString();
    const response = await api.get(
      qs ? `${API_ZALO_SHOP.ORDER}?${qs}` : API_ZALO_SHOP.ORDER,
    );
    const normalized = normalizePaginated<ShopOrder>(response.data);
    return { ...normalized };
  },

  async listCities(): Promise<ShopLocation[]> {
    const response = await publicApi.get(API_ZALO_SHOP.CITY);
    return normalizeList<ShopLocation>(response.data);
  },

  async listWards(cityId: number): Promise<ShopLocation[]> {
    const response = await publicApi.post(API_ZALO_SHOP.WARD, { id_city: cityId });
    return normalizeList<ShopLocation>(response.data);
  },

  async listCoupons(): Promise<ShopCoupon[]> {
    const response = await api.get(API_ZALO_SHOP.COUPON);
    return normalizeList<ShopCoupon>(response.data);
  },
};