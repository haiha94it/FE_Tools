import { API_UPLOAD, API_ZALO_GUIDE } from "@/config/api";
import api from "@/lib/axios";
import type { GuideSystemKey, ZaloGuideFormPayload, ZaloGuideItem } from "@/types/zalo-guide";

function normalizeList(body: unknown): ZaloGuideItem[] {
  if (Array.isArray(body)) return body as ZaloGuideItem[];
  return [];
}

export const zaloGuideService = {
  async listGuides(system: GuideSystemKey): Promise<ZaloGuideItem[]> {
    const response = await api.get(API_ZALO_GUIDE.LIST, {
      params: { systems: system },
    });
    return normalizeList(response.data);
  },

  async createOrEditGuide(payload: ZaloGuideFormPayload): Promise<void> {
    await api.post(API_ZALO_GUIDE.CREATE_OR_EDIT, payload);
  },

  async deleteGuide(id: number): Promise<void> {
    await api.post(API_ZALO_GUIDE.DELETE, { id });
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