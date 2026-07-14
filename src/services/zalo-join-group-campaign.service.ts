import { API_ZALO_JOIN_GROUP_CAMPAIGN } from "@/config/api";
import api from "@/lib/axios";
import type { PaginatedResponse } from "@/types/api";
import type {
  JoinGroupCampaign,
  JoinGroupCampaignFormPayload,
  JoinGroupCampaignResult,
  JoinGroupCampaignStatistics,
  JoinGroupFailedLinksResponse,
} from "@/types/zalo-join-group-campaign";

function normalizeCampaignList(body: unknown): JoinGroupCampaign[] {
  if (Array.isArray(body)) return body as JoinGroupCampaign[];
  if (body && typeof body === "object" && Array.isArray((body as { results?: unknown }).results)) {
    return (body as { results: JoinGroupCampaign[] }).results;
  }
  return [];
}

function normalizeCampaignDetail(body: unknown): JoinGroupCampaign | null {
  if (!body) return null;
  if (Array.isArray(body)) {
    return (body[0] as JoinGroupCampaign) ?? null;
  }
  return body as JoinGroupCampaign;
}

export const zaloJoinGroupCampaignService = {
  async listCampaigns(): Promise<JoinGroupCampaign[]> {
    const response = await api.get(API_ZALO_JOIN_GROUP_CAMPAIGN.LIST);
    return normalizeCampaignList(response.data);
  },

  async getCampaignById(id: number): Promise<JoinGroupCampaign | null> {
    const response = await api.get(API_ZALO_JOIN_GROUP_CAMPAIGN.LIST, {
      params: { id_category: id },
    });
    return normalizeCampaignDetail(response.data);
  },

  async createOrEditCampaign(
    payload: JoinGroupCampaignFormPayload,
  ): Promise<void> {
    await api.post(API_ZALO_JOIN_GROUP_CAMPAIGN.CREATE_OR_EDIT, payload);
  },

  async deleteCampaign(id: number): Promise<void> {
    await api.post(API_ZALO_JOIN_GROUP_CAMPAIGN.DELETE, { id_category: id });
  },

  async copyCampaign(id: number, name: string): Promise<void> {
    await api.post(API_ZALO_JOIN_GROUP_CAMPAIGN.COPY, {
      id_category: id,
      name,
    });
  },

  async startCampaigns(
    ids: number[],
    type: "new" | "continue" = "new",
  ): Promise<void> {
    await api.post(API_ZALO_JOIN_GROUP_CAMPAIGN.START, {
      id_categories: ids,
      type: type === "new" ? "new" : "",
    });
  },

  async stopCampaigns(ids: number[]): Promise<void> {
    await api.post(API_ZALO_JOIN_GROUP_CAMPAIGN.STOP, {
      id_categories: ids,
    });
  },

  async fetchResults(options: {
    categoryId: number;
    page?: number;
    perPage?: number;
  }): Promise<PaginatedResponse<JoinGroupCampaignResult>> {
    const response = await api.get(API_ZALO_JOIN_GROUP_CAMPAIGN.RESULTS, {
      params: {
        id_category: options.categoryId,
        page: options.page ?? 1,
        number_per_page: options.perPage ?? 100,
      },
    });
    const body = response.data;
    if (body && typeof body === "object" && "results" in body) {
      return body as PaginatedResponse<JoinGroupCampaignResult>;
    }
    return {
      results: Array.isArray(body) ? (body as JoinGroupCampaignResult[]) : [],
      count: 0,
      next: null,
      previous: null,
    };
  },

  async deleteResults(ids: number[]): Promise<void> {
    await api.post(API_ZALO_JOIN_GROUP_CAMPAIGN.DELETE_RESULTS, {
      id_results: ids,
    });
  },

  async fetchStatistics(
    categoryId: number,
  ): Promise<JoinGroupCampaignStatistics> {
    const response = await api.get(API_ZALO_JOIN_GROUP_CAMPAIGN.STATISTICS, {
      params: { id_category: categoryId },
    });
    return (response.data ?? {}) as JoinGroupCampaignStatistics;
  },

  async fetchFailedLinks(categoryId: number): Promise<string[]> {
    const response = await api.get<JoinGroupFailedLinksResponse>(
      API_ZALO_JOIN_GROUP_CAMPAIGN.FAILED_LINKS,
      { params: { id_category: categoryId } },
    );
    return response.data?.link_groups_failed ?? [];
  },
};