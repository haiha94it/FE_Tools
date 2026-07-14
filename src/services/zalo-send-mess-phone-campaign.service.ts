import { API_UPLOAD, API_ZALO_SEND_MESS_PHONE_CAMPAIGN } from "@/config/api";
import { parseUploadedFileLink } from "@/lib/zalo-messenger-send-utils";
import api from "@/lib/axios";
import type { PaginatedResponse } from "@/types/api";
import type {
  SendMessPhoneCampaign,
  SendMessPhoneCampaignDetail,
  SendMessPhoneCampaignFormPayload,
  SendMessPhoneCampaignResult,
  SendMessPhoneCampaignStatistics,
} from "@/types/zalo-send-mess-phone-campaign";

function normalizeCampaignList(body: unknown): SendMessPhoneCampaign[] {
  if (Array.isArray(body)) return body as SendMessPhoneCampaign[];
  if (body && typeof body === "object" && Array.isArray((body as { results?: unknown }).results)) {
    return (body as { results: SendMessPhoneCampaign[] }).results;
  }
  return [];
}

function normalizeCampaignDetail(body: unknown): SendMessPhoneCampaignDetail | null {
  if (!body) return null;
  if (Array.isArray(body)) {
    return (body[0] as SendMessPhoneCampaignDetail) ?? null;
  }
  return body as SendMessPhoneCampaignDetail;
}

export const zaloSendMessPhoneCampaignService = {
  async listCampaigns(): Promise<SendMessPhoneCampaign[]> {
    const response = await api.get(API_ZALO_SEND_MESS_PHONE_CAMPAIGN.LIST);
    return normalizeCampaignList(response.data);
  },

  async getCampaignById(id: number): Promise<SendMessPhoneCampaignDetail | null> {
    const response = await api.get(API_ZALO_SEND_MESS_PHONE_CAMPAIGN.LIST, {
      params: { id_category: id },
    });
    return normalizeCampaignDetail(response.data);
  },

  async createOrEditCampaign(payload: SendMessPhoneCampaignFormPayload): Promise<void> {
    await api.post(API_ZALO_SEND_MESS_PHONE_CAMPAIGN.CREATE_OR_EDIT, payload);
  },

  async deleteCampaign(id: number): Promise<void> {
    await api.post(API_ZALO_SEND_MESS_PHONE_CAMPAIGN.DELETE, { id_category: id });
  },

  async copyCampaign(id: number, name: string): Promise<void> {
    await api.post(API_ZALO_SEND_MESS_PHONE_CAMPAIGN.COPY, { id_category: id, name });
  },

  async startCampaigns(
    ids: number[],
    type: "new" | "continue" = "new",
  ): Promise<void> {
    await api.post(API_ZALO_SEND_MESS_PHONE_CAMPAIGN.START, {
      id_categories: ids,
      type: type === "new" ? "new" : "",
    });
  },

  async stopCampaigns(ids: number[]): Promise<void> {
    await api.post(API_ZALO_SEND_MESS_PHONE_CAMPAIGN.STOP, { id_categories: ids });
  },

  async fetchResults(options: {
    categoryId: number;
    page?: number;
    perPage?: number;
  }): Promise<PaginatedResponse<SendMessPhoneCampaignResult>> {
    const response = await api.get(API_ZALO_SEND_MESS_PHONE_CAMPAIGN.RESULTS, {
      params: {
        id_category: options.categoryId,
        page: options.page ?? 1,
        number_per_page: options.perPage ?? 100,
      },
    });
    const body = response.data;
    if (body && typeof body === "object" && "results" in body) {
      return body as PaginatedResponse<SendMessPhoneCampaignResult>;
    }
    return {
      results: Array.isArray(body) ? (body as SendMessPhoneCampaignResult[]) : [],
      count: 0,
      next: null,
      previous: null,
    };
  },

  async deleteResults(ids: number[]): Promise<void> {
    await api.post(API_ZALO_SEND_MESS_PHONE_CAMPAIGN.DELETE_RESULTS, {
      id_results: ids,
    });
  },

  async fetchStatistics(
    categoryId: number,
  ): Promise<SendMessPhoneCampaignStatistics> {
    const response = await api.get(API_ZALO_SEND_MESS_PHONE_CAMPAIGN.STATISTICS, {
      params: { id_category: categoryId },
    });
    return (response.data ?? {}) as SendMessPhoneCampaignStatistics;
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