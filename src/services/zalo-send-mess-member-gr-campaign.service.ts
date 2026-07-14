import { API_UPLOAD, API_ZALO_SEND_MESS_MEMBER_GR_CAMPAIGN } from "@/config/api";
import { parseUploadedFileLink } from "@/lib/zalo-messenger-send-utils";
import api from "@/lib/axios";
import type { PaginatedResponse } from "@/types/api";
import type {
  SendMessMemberGrCampaign,
  SendMessMemberGrCampaignDetail,
  SendMessMemberGrCampaignFormPayload,
  SendMessMemberGrCampaignResult,
  SendMessMemberGrCampaignStatistics,
} from "@/types/zalo-send-mess-member-gr-campaign";

function normalizeCampaignList(body: unknown): SendMessMemberGrCampaign[] {
  if (Array.isArray(body)) return body as SendMessMemberGrCampaign[];
  if (body && typeof body === "object" && Array.isArray((body as { results?: unknown }).results)) {
    return (body as { results: SendMessMemberGrCampaign[] }).results;
  }
  return [];
}

function normalizeCampaignDetail(
  body: unknown,
): SendMessMemberGrCampaignDetail | null {
  if (!body) return null;
  if (Array.isArray(body)) {
    return (body[0] as SendMessMemberGrCampaignDetail) ?? null;
  }
  return body as SendMessMemberGrCampaignDetail;
}

export const zaloSendMessMemberGrCampaignService = {
  async listCampaigns(): Promise<SendMessMemberGrCampaign[]> {
    const response = await api.get(API_ZALO_SEND_MESS_MEMBER_GR_CAMPAIGN.LIST);
    return normalizeCampaignList(response.data);
  },

  async getCampaignById(id: number): Promise<SendMessMemberGrCampaignDetail | null> {
    const response = await api.get(API_ZALO_SEND_MESS_MEMBER_GR_CAMPAIGN.LIST, {
      params: { id_category: id },
    });
    return normalizeCampaignDetail(response.data);
  },

  async createOrEditCampaign(
    payload: SendMessMemberGrCampaignFormPayload,
  ): Promise<void> {
    await api.post(API_ZALO_SEND_MESS_MEMBER_GR_CAMPAIGN.CREATE_OR_EDIT, payload);
  },

  async deleteCampaign(id: number): Promise<void> {
    await api.post(API_ZALO_SEND_MESS_MEMBER_GR_CAMPAIGN.DELETE, { id_category: id });
  },

  async copyCampaign(id: number, name: string): Promise<void> {
    await api.post(API_ZALO_SEND_MESS_MEMBER_GR_CAMPAIGN.COPY, {
      id_category: id,
      name,
    });
  },

  async startCampaigns(
    ids: number[],
    type: "new" | "continue" = "new",
  ): Promise<void> {
    await api.post(API_ZALO_SEND_MESS_MEMBER_GR_CAMPAIGN.START, {
      id_categories: ids,
      type: type === "new" ? "new" : "",
    });
  },

  async stopCampaigns(ids: number[]): Promise<void> {
    await api.post(API_ZALO_SEND_MESS_MEMBER_GR_CAMPAIGN.STOP, { id_categories: ids });
  },

  async fetchResults(options: {
    categoryId: number;
    page?: number;
    perPage?: number;
  }): Promise<PaginatedResponse<SendMessMemberGrCampaignResult>> {
    const response = await api.get(API_ZALO_SEND_MESS_MEMBER_GR_CAMPAIGN.RESULTS, {
      params: {
        id_category: options.categoryId,
        page: options.page ?? 1,
        number_per_page: options.perPage ?? 100,
      },
    });
    const body = response.data;
    if (body && typeof body === "object" && "results" in body) {
      return body as PaginatedResponse<SendMessMemberGrCampaignResult>;
    }
    return {
      results: Array.isArray(body) ? (body as SendMessMemberGrCampaignResult[]) : [],
      count: 0,
      next: null,
      previous: null,
    };
  },

  async deleteResults(ids: number[]): Promise<void> {
    await api.post(API_ZALO_SEND_MESS_MEMBER_GR_CAMPAIGN.DELETE_RESULTS, {
      id_results: ids,
    });
  },

  async fetchStatistics(
    categoryId: number,
  ): Promise<SendMessMemberGrCampaignStatistics> {
    const response = await api.get(API_ZALO_SEND_MESS_MEMBER_GR_CAMPAIGN.STATISTICS, {
      params: { id_category: categoryId },
    });
    return (response.data ?? {}) as SendMessMemberGrCampaignStatistics;
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