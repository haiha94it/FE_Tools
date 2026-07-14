import { API_UPLOAD, API_ZALO_SEND_MES_FR_CAMPAIGN } from "@/config/api";
import { parseUploadedFileLink } from "@/lib/zalo-messenger-send-utils";
import api from "@/lib/axios";
import type { PaginatedResponse } from "@/types/api";
import type {
  SendMesFrCampaign,
  SendMesFrCampaignDetail,
  SendMesFrCampaignFormPayload,
  SendMesFrCampaignResult,
  SendMesFrCampaignStatistics,
} from "@/types/zalo-send-mes-fr-campaign";

function normalizeCampaignList(body: unknown): SendMesFrCampaign[] {
  if (Array.isArray(body)) return body as SendMesFrCampaign[];
  if (body && typeof body === "object" && Array.isArray((body as { results?: unknown }).results)) {
    return (body as { results: SendMesFrCampaign[] }).results;
  }
  return [];
}

function normalizeCampaignDetail(body: unknown): SendMesFrCampaignDetail | null {
  if (!body) return null;
  if (Array.isArray(body)) {
    return (body[0] as SendMesFrCampaignDetail) ?? null;
  }
  return body as SendMesFrCampaignDetail;
}

export const zaloSendMesFrCampaignService = {
  async listCampaigns(): Promise<SendMesFrCampaign[]> {
    const response = await api.get(API_ZALO_SEND_MES_FR_CAMPAIGN.LIST);
    return normalizeCampaignList(response.data);
  },

  async getCampaignById(id: number): Promise<SendMesFrCampaignDetail | null> {
    const response = await api.get(API_ZALO_SEND_MES_FR_CAMPAIGN.LIST, {
      params: { id_category: id },
    });
    return normalizeCampaignDetail(response.data);
  },

  async createOrEditCampaign(payload: SendMesFrCampaignFormPayload): Promise<void> {
    await api.post(API_ZALO_SEND_MES_FR_CAMPAIGN.CREATE_OR_EDIT, payload);
  },

  async deleteCampaign(id: number): Promise<void> {
    await api.post(API_ZALO_SEND_MES_FR_CAMPAIGN.DELETE, { id_category: id });
  },

  async copyCampaign(id: number, name: string): Promise<void> {
    await api.post(API_ZALO_SEND_MES_FR_CAMPAIGN.COPY, { id_category: id, name });
  },

  async startCampaigns(
    ids: number[],
    type: "new" | "continue" = "new",
  ): Promise<void> {
    await api.post(API_ZALO_SEND_MES_FR_CAMPAIGN.START, {
      id_categories: ids,
      type: type === "new" ? "new" : "",
    });
  },

  async stopCampaigns(ids: number[]): Promise<void> {
    await api.post(API_ZALO_SEND_MES_FR_CAMPAIGN.STOP, { id_categories: ids });
  },

  async fetchResults(options: {
    categoryId: number;
    page?: number;
    perPage?: number;
  }): Promise<PaginatedResponse<SendMesFrCampaignResult>> {
    const response = await api.get(API_ZALO_SEND_MES_FR_CAMPAIGN.RESULTS, {
      params: {
        id_category: options.categoryId,
        page: options.page ?? 1,
        number_per_page: options.perPage ?? 100,
      },
    });
    const body = response.data;
    if (body && typeof body === "object" && "results" in body) {
      return body as PaginatedResponse<SendMesFrCampaignResult>;
    }
    return {
      results: Array.isArray(body) ? (body as SendMesFrCampaignResult[]) : [],
      count: 0,
      next: null,
      previous: null,
    };
  },

  async deleteResults(ids: number[]): Promise<void> {
    await api.post(API_ZALO_SEND_MES_FR_CAMPAIGN.DELETE_RESULTS, {
      id_results: ids,
    });
  },

  async fetchStatistics(categoryId: number): Promise<SendMesFrCampaignStatistics> {
    const response = await api.get(API_ZALO_SEND_MES_FR_CAMPAIGN.STATISTICS, {
      params: { id_category: categoryId },
    });
    return (response.data ?? {}) as SendMesFrCampaignStatistics;
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