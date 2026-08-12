import { API_UPLOAD, API_ZALO_SHOP } from "@/config/api";
import api from "@/lib/axios";
import publicApi from "@/lib/public-api";
import type {
  AddToCartPayload,
  CreateCategoryPayload,
  CreateCouponsPayload,
  CreateOrderPayload,
  CreateProductPayload,
  ListOrdersParams,
  ShopCart,
  ShopCategory,
  ShopCover,
  ShopCoupon,
  ShopLocation,
  ShopOrder,
  ShopOrdersResponse,
  ShopPersonalizationData,
  ShopPersonalizationRecord,
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
  /** Domain shop của manager — chuỗi rỗng nếu chưa cấu hình. */
  async getDomain(): Promise<string> {
    const response = await api.get(API_ZALO_SHOP.DOMAIN);
    // Interceptor unwrap envelope → data = string | null; vẫn parse an toàn.
    const data = response.data;
    if (typeof data === "string") return data.trim().toLowerCase();
    if (typeof data === "number") return String(data).trim();
    if (data && typeof data === "object") {
      const rec = data as Record<string, unknown>;
      const nested =
        rec.domain ?? rec.data ?? rec.hostname ?? rec.host ?? rec.value;
      if (typeof nested === "string") return nested.trim().toLowerCase();
      if (nested != null && nested !== false) {
        return String(nested).trim().toLowerCase();
      }
    }
    if (data == null || data === false) return "";
    const s = String(data).trim().toLowerCase();
    // Tránh "[object object]" nếu envelope lỡ chưa unwrap
    if (!s || s === "[object object]") return "";
    return s;
  },

  /** Cập nhật domain riêng (CNAME trỏ gate) — chỉ manager. */
  async editDomain(domain: string): Promise<void> {
    await api.post(API_ZALO_SHOP.DOMAIN_EDIT, {
      domain: domain.trim().toLowerCase(),
    });
  },

  /** Tra cứu id_user từ hostname domain riêng (POST /api/shop/get_user { domain }) */
  async getIdDomain(hostname: string): Promise<string | number | null> {
    try {
      const cleanHost = hostname.replace(/^https?:\/\//i, "").split(":")[0].trim();
      const response = await publicApi.post(API_ZALO_SHOP.GET_DOMAIN_ID, {
        domain: cleanHost,
      });
      const data = response.data;
      const idUser = data?.id_user ?? data?.id_employee ?? data?.id;
      if (idUser) return idUser;
      return null;
    } catch {
      return null;
    }
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

  /**
   * Thêm giỏ — interceptor đã unwrap envelope → `response.data` = cart
   * (session_key, items, total_amount…).
   */
  async addToCart(payload: AddToCartPayload): Promise<ShopCart> {
    const response = await publicApi.post(API_ZALO_SHOP.CART_ADD, payload);
    return (response.data ?? {}) as ShopCart;
  },

  async updateCartQuantity(payload: {
    id_employee: number | string;
    session_key: string;
    /** BE: id variant SP, không phải id dòng cart */
    id_variant: number;
    quantity: number;
  }): Promise<void> {
    await publicApi.post(API_ZALO_SHOP.CART_UPDATE, payload);
  },

  async createOrder(payload: CreateOrderPayload): Promise<void> {
    await publicApi.post(API_ZALO_SHOP.ORDER_CREATE, payload);
  },

  async listOrders(params?: ListOrdersParams): Promise<ShopOrdersResponse> {
    const search = new URLSearchParams();
    if (params?.pageSize) search.set("number_per_page", String(params.pageSize));
    if (params?.page) search.set("page", String(params.page));
    if (params?.status !== undefined && params?.status !== "" && params?.status !== null) {
      search.set("status", String(params.status));
    }
    if (params?.key) search.set("key", params.key);
    if (params?.start_date) search.set("start_date", params.start_date);
    if (params?.end_date) search.set("end_date", params.end_date);
    if (params?.id_employee) search.set("id_employee", String(params.id_employee));
    const qs = search.toString();
    const response = await api.get(
      qs ? `${API_ZALO_SHOP.ORDER}?${qs}` : API_ZALO_SHOP.ORDER,
    );
    const normalized = normalizePaginated<ShopOrder>(response.data);
    return { ...normalized };
  },

  async confirmOrder(orderId: number): Promise<void> {
    await api.post(API_ZALO_SHOP.ORDER_CONFIRM, { id_order: orderId });
  },

  async cancelOrder(orderId: number): Promise<void> {
    await api.post(API_ZALO_SHOP.ORDER_CANCEL, { id_order: orderId });
  },

  async deleteOrders(orderIds: number[]): Promise<void> {
    await api.post(API_ZALO_SHOP.ORDER_DELETE, { id_orders: orderIds });
  },

  async updateOrder(payload: Record<string, unknown>): Promise<void> {
    await api.post(API_ZALO_SHOP.ORDER_UPDATE, payload);
  },

  async listCities(): Promise<ShopLocation[]> {
    const response = await publicApi.get(API_ZALO_SHOP.CITY);
    return normalizeList<ShopLocation>(response.data);
  },

  async listWards(cityId: number): Promise<ShopLocation[]> {
    const response = await publicApi.post(API_ZALO_SHOP.WARD, { id_city: cityId });
    return normalizeList<ShopLocation>(response.data);
  },

  /**
   * Import file `Vietnam_province_new.json` trên BE → City/Ward DB.
   * GET /api/shop/city/load (cần JWT).
   */
  async loadCityData(): Promise<{ cities_count?: number; wards_count?: number }> {
    const response = await api.get(API_ZALO_SHOP.CITY_LOAD);
    return (response.data ?? {}) as {
      cities_count?: number;
      wards_count?: number;
    };
  },

  async listCoupons(): Promise<ShopCoupon[]> {
    const response = await api.get(API_ZALO_SHOP.COUPON);
    return normalizeList<ShopCoupon>(response.data);
  },

  async createCoupons(payload: CreateCouponsPayload): Promise<string[]> {
    const response = await api.post(API_ZALO_SHOP.COUPON_CREATE, payload);
    const data = response.data as { codes?: string[] } | null;
    return Array.isArray(data?.codes) ? data.codes : [];
  },

  async deleteCoupons(ids: number[]): Promise<void> {
    await api.post(API_ZALO_SHOP.COUPON_DELETE, { ids });
  },

  /** Gán nick gửi tin đơn hàng — body `{ id_account }` (0 = tắt). */
  async setOrderNotificationAccount(accountId: number): Promise<void> {
    await api.post(API_ZALO_SHOP.ORDER_NOTIFICATION_ACCOUNT, {
      id_account: accountId,
    });
  },

  async updateOrderSuccessfulMessage(message: string): Promise<void> {
    await api.post(API_ZALO_SHOP.ORDER_SUCCESS_MESSAGE, {
      order_successful_message: message,
    });
  },

  async updateOrderConfirmMessage(message: string): Promise<void> {
    await api.post(API_ZALO_SHOP.ORDER_CONFIRM_MESSAGE, {
      confirm_message: message,
    });
  },

  /**
   * Parse QR Zalo cá nhân/OA → link chat.
   * BE field: `Link_zalo` (Care1 legacy).
   */
  async getLinkZaloFromQr(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("qr_code_image", file);
    const response = await api.post(API_ZALO_SHOP.LINK_QR_ZALO, formData);
    const data = response.data as {
      Link_zalo?: string;
      link_zalo?: string;
    } | null;
    const link = (data?.Link_zalo ?? data?.link_zalo ?? "").trim();
    if (!link) {
      throw new Error("EMPTY_ZALO_LINK");
    }
    return link;
  },

  /**
   * Lấy personalization storefront.
   * - Admin (JWT): không truyền `id_employee`
   * - Public storefront: `id_employee` = sellerId trên URL
   * Chưa setup → `id: null`, `data: {}`
   */
  async getPersonalization(
    employeeId?: number | string,
  ): Promise<ShopPersonalizationRecord> {
    const client = employeeId != null && employeeId !== "" ? publicApi : api;
    const url =
      employeeId != null && employeeId !== ""
        ? `${API_ZALO_SHOP.PERSONALIZATION}?id_employee=${employeeId}`
        : API_ZALO_SHOP.PERSONALIZATION;
    const response = await client.get(url);
    const raw = (response.data ?? {}) as ShopPersonalizationRecord;
    const data =
      raw.data && typeof raw.data === "object" && !Array.isArray(raw.data)
        ? raw.data
        : {};
    return {
      id: raw.id ?? null,
      user: raw.user,
      data,
      created_at: raw.created_at,
      updated_at: raw.updated_at,
    };
  },

  /** Ghi đè toàn bộ `data` của user đang login (auth bắt buộc). */
  async savePersonalization(
    data: ShopPersonalizationData | Record<string, unknown>,
  ): Promise<ShopPersonalizationRecord> {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new Error("DATA_INVALID");
    }
    const response = await api.post(API_ZALO_SHOP.PERSONALIZATION_CREATE, {
      data,
    });
    const raw = (response.data ?? {}) as ShopPersonalizationRecord;
    return {
      id: raw.id ?? null,
      user: raw.user,
      data:
        raw.data && typeof raw.data === "object" && !Array.isArray(raw.data)
          ? raw.data
          : data,
      created_at: raw.created_at,
      updated_at: raw.updated_at,
    };
  },

  /** Xóa personalization của user login → GET lại `{}`. */
  async deletePersonalization(): Promise<void> {
    await api.post(API_ZALO_SHOP.PERSONALIZATION_DELETE, {});
  },
};