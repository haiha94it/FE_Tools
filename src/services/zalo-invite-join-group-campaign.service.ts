import { API_ZALO_INVITE_JOIN_GROUP_CAMPAIGN } from "@/config/api";
import api from "@/lib/axios";
import type { PaginatedResponse } from "@/types/api";
import type {
  InviteJoinGroupCampaign,
  InviteJoinGroupCampaignFormPayload,
  InviteJoinGroupCampaignResult,
  InviteJoinGroupCampaignStatistics,
  InviteJoinGroupFailedPhonesResponse,
} from "@/types/zalo-invite-join-group-campaign";

function normalizeCampaignList(body: unknown): InviteJoinGroupCampaign[] {
  if (Array.isArray(body)) return body as InviteJoinGroupCampaign[];
  if (body && typeof body === "object" && Array.isArray((body as { results?: unknown }).results)) {
    return (body as { results: InviteJoinGroupCampaign[] }).results;
  }
  return [];
}

function normalizeCampaignDetail(body: unknown): InviteJoinGroupCampaign | null {
  if (!body) return null;
  if (Array.isArray(body)) {
    return (body[0] as InviteJoinGroupCampaign) ?? null;
  }
  return body as InviteJoinGroupCampaign;
}

export const zaloInviteJoinGroupCampaignService = {
  async listCampaigns(): Promise<InviteJoinGroupCampaign[]> {
    const response = await api.get(API_ZALO_INVITE_JOIN_GROUP_CAMPAIGN.LIST);
    return normalizeCampaignList(response.data);
  },

  async getCampaignById(id: number): Promise<InviteJoinGroupCampaign | null> {
    const response = await api.get(API_ZALO_INVITE_JOIN_GROUP_CAMPAIGN.LIST, {
      params: { id_category: id },
    });
    return normalizeCampaignDetail(response.data);
  },

  async createOrEditCampaign(
    payload: InviteJoinGroupCampaignFormPayload,
  ): Promise<void> {
    await api.post(API_ZALO_INVITE_JOIN_GROUP_CAMPAIGN.CREATE_OR_EDIT, payload);
  },

  async deleteCampaign(id: number): Promise<void> {
    await api.post(API_ZALO_INVITE_JOIN_GROUP_CAMPAIGN.DELETE, { id_category: id });
  },

  async copyCampaign(id: number, name: string): Promise<void> {
    await api.post(API_ZALO_INVITE_JOIN_GROUP_CAMPAIGN.COPY, {
      id_category: id,
      name,
    });
  },

  async startCampaigns(
    ids: number[],
    type: "new" | "continue" = "new",
  ): Promise<void> {
    await api.post(API_ZALO_INVITE_JOIN_GROUP_CAMPAIGN.START, {
      id_categories: ids,
      type: type === "new" ? "new" : "",
    });
  },

  async stopCampaigns(ids: number[]): Promise<void> {
    await api.post(API_ZALO_INVITE_JOIN_GROUP_CAMPAIGN.STOP, {
      id_categories: ids,
    });
  },

  async fetchResults(options: {
    categoryId: number;
    page?: number;
    perPage?: number;
  }): Promise<PaginatedResponse<InviteJoinGroupCampaignResult>> {
    const response = await api.get(API_ZALO_INVITE_JOIN_GROUP_CAMPAIGN.RESULTS, {
      params: {
        id_category: options.categoryId,
        page: options.page ?? 1,
        number_per_page: options.perPage ?? 100,
      },
    });
    const body = response.data;
    if (body && typeof body === "object" && "results" in body) {
      return body as PaginatedResponse<InviteJoinGroupCampaignResult>;
    }
    return {
      results: Array.isArray(body) ? (body as InviteJoinGroupCampaignResult[]) : [],
      count: 0,
      next: null,
      previous: null,
    };
  },

  async deleteResults(ids: number[]): Promise<void> {
    await api.post(API_ZALO_INVITE_JOIN_GROUP_CAMPAIGN.DELETE_RESULTS, {
      id_results: ids,
    });
  },

  async fetchStatistics(
    categoryId: number,
  ): Promise<InviteJoinGroupCampaignStatistics> {
    const response = await api.get(API_ZALO_INVITE_JOIN_GROUP_CAMPAIGN.STATISTICS, {
      params: { id_category: categoryId },
    });
    return (response.data ?? {}) as InviteJoinGroupCampaignStatistics;
  },

  async fetchFailedPhones(categoryId: number): Promise<string[]> {
    const response = await api.get<InviteJoinGroupFailedPhonesResponse>(
      API_ZALO_INVITE_JOIN_GROUP_CAMPAIGN.FAILED_PHONES,
      { params: { id_category: categoryId } },
    );
    return response.data?.phone_numbers_failed ?? [];
  },
};