import { API_UPLOAD, API_ZALO_BIRTHDAY_CAMPAIGN } from "@/config/api";
import { parseUploadedFileLink } from "@/lib/zalo-messenger-send-utils";
import api from "@/lib/axios";
import type { PaginatedResponse } from "@/types/api";
import type {
  BirthdayCampaign,
  BirthdayCampaignFormPayload,
  BirthdayCampaignResult,
  BirthdayMediaItem,
} from "@/types/zalo-birthday-campaign";

function normalizeCampaign(body: unknown): BirthdayCampaign | null {
  if (!body || typeof body !== "object") return null;
  const record = body as BirthdayCampaign;
  if (record.id) return record;
  if (Array.isArray(body) && body.length > 0) {
    return (body[0] as BirthdayCampaign) ?? null;
  }
  return null;
}

function stripCategoryId(payload: BirthdayCampaignFormPayload) {
  const { id_category: _id, ...rest } = payload;
  return rest;
}

export const zaloBirthdayCampaignService = {
  async getCampaign(): Promise<BirthdayCampaign | null> {
    const response = await api.get(API_ZALO_BIRTHDAY_CAMPAIGN.GET);
    return normalizeCampaign(response.data);
  },

  async createOrEditCampaign(payload: BirthdayCampaignFormPayload): Promise<void> {
    if (payload.id_category) {
      await api.patch(
        API_ZALO_BIRTHDAY_CAMPAIGN.detail(payload.id_category),
        stripCategoryId(payload),
      );
    } else {
      await api.post(API_ZALO_BIRTHDAY_CAMPAIGN.LIST, stripCategoryId(payload));
    }
  },

  async startCampaign(id: number): Promise<void> {
    await api.post(API_ZALO_BIRTHDAY_CAMPAIGN.START, { id_category: id });
  },

  async stopCampaign(id: number): Promise<void> {
    await api.post(API_ZALO_BIRTHDAY_CAMPAIGN.STOP, { id_categories: [id] });
  },

  async fetchResults(options: {
    page?: number;
    perPage?: number;
  }): Promise<PaginatedResponse<BirthdayCampaignResult>> {
    const response = await api.get(API_ZALO_BIRTHDAY_CAMPAIGN.RESULTS, {
      params: {
        page: options.page ?? 1,
        number_per_page: options.perPage ?? 100,
      },
    });
    const body = response.data;
    if (body && typeof body === "object" && "results" in body) {
      return body as PaginatedResponse<BirthdayCampaignResult>;
    }
    return {
      results: Array.isArray(body) ? (body as BirthdayCampaignResult[]) : [],
      count: 0,
      next: null,
      previous: null,
    };
  },

  async deleteResults(ids: number[]): Promise<void> {
    await api.delete(API_ZALO_BIRTHDAY_CAMPAIGN.RESULTS, {
      data: { id_results: ids },
    });
  },

  async listVideos(): Promise<BirthdayMediaItem[]> {
    const response = await api.get<BirthdayMediaItem[]>(
      API_ZALO_BIRTHDAY_CAMPAIGN.SHOW_VIDEOS,
    );
    return Array.isArray(response.data) ? response.data : [];
  },

  async listAlbums(): Promise<BirthdayMediaItem[]> {
    const response = await api.get<BirthdayMediaItem[]>(
      API_ZALO_BIRTHDAY_CAMPAIGN.SHOW_ALBUMS,
    );
    return Array.isArray(response.data) ? response.data : [];
  },

  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<unknown>(API_UPLOAD.FILE, formData, {
      timeout: 120_000,
    });
    const link = parseUploadedFileLink(response.data);
    if (!link) {
      throw new Error("Không nhận được link ảnh sau khi upload.");
    }
    return link;
  },
};