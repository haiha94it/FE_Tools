import { API_ZALO_ADD_FRIEND_CAMPAIGN } from "@/config/api";
import api from "@/lib/axios";
import type { PaginatedResponse } from "@/types/api";
import type {
  AddFriendCampaign,
  AddFriendCampaignFormPayload,
  AddFriendCampaignResult,
  AddFriendCampaignStatistics,
  AddFriendFailedPhonesResponse,
} from "@/types/zalo-add-friend-campaign";

function normalizeCampaignList(body: unknown): AddFriendCampaign[] {
  if (Array.isArray(body)) return body as AddFriendCampaign[];
  if (body && typeof body === "object" && Array.isArray((body as { results?: unknown }).results)) {
    return (body as { results: AddFriendCampaign[] }).results;
  }
  return [];
}

function normalizeCampaignDetail(body: unknown): AddFriendCampaign | null {
  if (!body) return null;
  if (Array.isArray(body)) {
    return (body[0] as AddFriendCampaign) ?? null;
  }
  return body as AddFriendCampaign;
}

export const zaloAddFriendCampaignService = {
  async listCampaigns(): Promise<AddFriendCampaign[]> {
    const response = await api.get(API_ZALO_ADD_FRIEND_CAMPAIGN.LIST);
    return normalizeCampaignList(response.data);
  },

  async getCampaignById(id: number): Promise<AddFriendCampaign | null> {
    const response = await api.get(API_ZALO_ADD_FRIEND_CAMPAIGN.LIST, {
      params: { id_category: id },
    });
    return normalizeCampaignDetail(response.data);
  },

  async createOrEditCampaign(
    payload: AddFriendCampaignFormPayload,
  ): Promise<void> {
    await api.post(API_ZALO_ADD_FRIEND_CAMPAIGN.CREATE_OR_EDIT, payload);
  },

  async deleteCampaign(id: number): Promise<void> {
    await api.post(API_ZALO_ADD_FRIEND_CAMPAIGN.DELETE, { id_category: id });
  },

  async copyCampaign(id: number, name: string): Promise<void> {
    await api.post(API_ZALO_ADD_FRIEND_CAMPAIGN.COPY, {
      id_category: id,
      name,
    });
  },

  async startCampaigns(
    ids: number[],
    type: "new" | "continue" = "new",
  ): Promise<void> {
    await api.post(API_ZALO_ADD_FRIEND_CAMPAIGN.START, {
      id_categories: ids,
      type: type === "new" ? "new" : "",
    });
  },

  async stopCampaigns(ids: number[]): Promise<void> {
    await api.post(API_ZALO_ADD_FRIEND_CAMPAIGN.STOP, {
      id_categories: ids,
    });
  },

  async assignCampaignToAccounts(
    categoryId: number,
    accountIds: number[],
  ): Promise<void> {
    await api.post(API_ZALO_ADD_FRIEND_CAMPAIGN.ADD_TO_ACCOUNT, {
      id_category: categoryId,
      id_accounts: accountIds,
    });
  },

  async fetchResults(options: {
    categoryId: number;
    page?: number;
    perPage?: number;
  }): Promise<PaginatedResponse<AddFriendCampaignResult>> {
    const response = await api.get(API_ZALO_ADD_FRIEND_CAMPAIGN.RESULTS, {
      params: {
        id_category: options.categoryId,
        page: options.page ?? 1,
        number_per_page: options.perPage ?? 100,
      },
    });
    const body = response.data;
    if (body && typeof body === "object" && "results" in body) {
      return body as PaginatedResponse<AddFriendCampaignResult>;
    }
    return {
      results: Array.isArray(body) ? (body as AddFriendCampaignResult[]) : [],
      count: 0,
      next: null,
      previous: null,
    };
  },

  async deleteResults(ids: number[]): Promise<void> {
    await api.post(API_ZALO_ADD_FRIEND_CAMPAIGN.DELETE_RESULTS, {
      id_results: ids,
    });
  },

  async fetchStatistics(
    categoryId: number,
  ): Promise<AddFriendCampaignStatistics> {
    const response = await api.get(API_ZALO_ADD_FRIEND_CAMPAIGN.STATISTICS, {
      params: { id_category: categoryId },
    });
    return (response.data ?? {}) as AddFriendCampaignStatistics;
  },

  async fetchFailedPhones(
    categoryId: number,
  ): Promise<string[]> {
    const response = await api.get<AddFriendFailedPhonesResponse>(
      API_ZALO_ADD_FRIEND_CAMPAIGN.FAILED_PHONES,
      { params: { id_category: categoryId } },
    );
    const body = response.data;
    return body?.phone_numbers_failed ?? [];
  },
};