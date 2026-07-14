import { API_UPLOAD, API_ZALO_SEND_MES_GROUP_CAMPAIGN } from "@/config/api";
import { parseUploadedFileLink } from "@/lib/zalo-messenger-send-utils";
import api from "@/lib/axios";
import type { PaginatedResponse } from "@/types/api";
import type {
  SendMesGroupCampaign,
  SendMesGroupCampaignDetail,
  SendMesGroupCampaignFormPayload,
  SendMesGroupCampaignResult,
  SendMesGroupCampaignStatistics,
} from "@/types/zalo-send-mes-group-campaign";

function normalizeCampaignList(body: unknown): SendMesGroupCampaign[] {
  if (Array.isArray(body)) return body as SendMesGroupCampaign[];
  if (body && typeof body === "object" && Array.isArray((body as { results?: unknown }).results)) {
    return (body as { results: SendMesGroupCampaign[] }).results;
  }
  return [];
}

function normalizeCampaignDetail(body: unknown): SendMesGroupCampaignDetail | null {
  if (!body) return null;
  if (Array.isArray(body)) {
    return (body[0] as SendMesGroupCampaignDetail) ?? null;
  }
  return body as SendMesGroupCampaignDetail;
}

export const zaloSendMesGroupCampaignService = {
  async listCampaigns(): Promise<SendMesGroupCampaign[]> {
    const response = await api.get(API_ZALO_SEND_MES_GROUP_CAMPAIGN.LIST);
    return normalizeCampaignList(response.data);
  },

  async getCampaignById(id: number): Promise<SendMesGroupCampaignDetail | null> {
    const response = await api.get(API_ZALO_SEND_MES_GROUP_CAMPAIGN.LIST, {
      params: { id_category: id },
    });
    return normalizeCampaignDetail(response.data);
  },

  async createOrEditCampaign(payload: SendMesGroupCampaignFormPayload): Promise<void> {
    await api.post(API_ZALO_SEND_MES_GROUP_CAMPAIGN.CREATE_OR_EDIT, payload);
  },

  async deleteCampaign(id: number): Promise<void> {
    await api.post(API_ZALO_SEND_MES_GROUP_CAMPAIGN.DELETE, { id_category: id });
  },

  async copyCampaign(id: number, name: string): Promise<void> {
    await api.post(API_ZALO_SEND_MES_GROUP_CAMPAIGN.COPY, { id_category: id, name });
  },

  async startCampaigns(
    ids: number[],
    type: "new" | "continue" = "new",
  ): Promise<void> {
    await api.post(API_ZALO_SEND_MES_GROUP_CAMPAIGN.START, {
      id_categories: ids,
      type: type === "new" ? "new" : "",
    });
  },

  async stopCampaigns(ids: number[]): Promise<void> {
    await api.post(API_ZALO_SEND_MES_GROUP_CAMPAIGN.STOP, { id_categories: ids });
  },

  async fetchResults(options: {
    categoryId: number;
    page?: number;
    perPage?: number;
  }): Promise<PaginatedResponse<SendMesGroupCampaignResult>> {
    const response = await api.get(API_ZALO_SEND_MES_GROUP_CAMPAIGN.RESULTS, {
      params: {
        id_category: options.categoryId,
        page: options.page ?? 1,
        number_per_page: options.perPage ?? 100,
      },
    });
    const body = response.data;
    if (body && typeof body === "object" && "results" in body) {
      return body as PaginatedResponse<SendMesGroupCampaignResult>;
    }
    return {
      results: Array.isArray(body) ? (body as SendMesGroupCampaignResult[]) : [],
      count: 0,
      next: null,
      previous: null,
    };
  },

  async deleteResults(ids: number[]): Promise<void> {
    await api.post(API_ZALO_SEND_MES_GROUP_CAMPAIGN.DELETE_RESULTS, {
      id_results: ids,
    });
  },

  async fetchStatistics(
    categoryId: number,
  ): Promise<SendMesGroupCampaignStatistics> {
    const response = await api.get(API_ZALO_SEND_MES_GROUP_CAMPAIGN.STATISTICS, {
      params: { id_category: categoryId },
    });
    return (response.data ?? {}) as SendMesGroupCampaignStatistics;
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