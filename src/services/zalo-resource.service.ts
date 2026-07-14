import { API_UPLOAD, API_ZALO_RESOURCE } from "@/config/api";
import api from "@/lib/axios";
import type {
  ZaloProductAppFormPayload,
  ZaloProductAppItem,
  ZaloResourceFormPayload,
  ZaloResourceItem,
} from "@/types/zalo-resource";

function normalizeList<T>(body: unknown): T[] {
  if (Array.isArray(body)) return body as T[];
  return [];
}

export const zaloResourceService = {
  async listResources(): Promise<ZaloResourceItem[]> {
    const response = await api.get(API_ZALO_RESOURCE.LIST);
    return normalizeList<ZaloResourceItem>(response.data);
  },

  async createOrEditResource(payload: ZaloResourceFormPayload): Promise<void> {
    await api.post(API_ZALO_RESOURCE.CREATE_OR_EDIT, payload);
  },

  async deleteResource(id: number): Promise<void> {
    await api.post(API_ZALO_RESOURCE.DELETE, { id });
  },

  async listProductApps(): Promise<ZaloProductAppItem[]> {
    const response = await api.get(API_ZALO_RESOURCE.PRODUCT_LIST);
    return normalizeList<ZaloProductAppItem>(response.data);
  },

  async createOrEditProductApp(payload: ZaloProductAppFormPayload): Promise<void> {
    await api.post(API_ZALO_RESOURCE.PRODUCT_CREATE_OR_EDIT, payload);
  },

  async deleteProductApp(id: number): Promise<void> {
    await api.post(API_ZALO_RESOURCE.PRODUCT_DELETE, { id });
  },

  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("image", file);
    const response = await api.post<{ image?: string }>(API_UPLOAD.SERVER, formData, {
      timeout: 120_000,
    });
    const image = response.data?.image;
    if (!image) {
      throw new Error("Không nhận được link ảnh sau khi upload.");
    }
    return image;
  },
};