import { API_ZALO_PHONE_INVITE_GROUP_CAMPAIGN } from "@/config/api";
import api from "@/lib/axios";
import type { PaginatedResponse } from "@/types/api";
import type {
  PhoneInviteGroupCampaign,
  PhoneInviteGroupCampaignFormPayload,
  PhoneInviteGroupCampaignResult,
  PhoneInviteGroupCampaignStatistics,
  PhoneInviteGroupItem,
} from "@/types/zalo-phone-invite-group-campaign";

function normalizeCampaignList(body: unknown): PhoneInviteGroupCampaign[] {
  if (Array.isArray(body)) return body as PhoneInviteGroupCampaign[];
  if (body && typeof body === "object" && Array.isArray((body as { results?: unknown }).results)) {
    return (body as { results: PhoneInviteGroupCampaign[] }).results;
  }
  return [];
}

function normalizeCampaignDetail(body: unknown): PhoneInviteGroupCampaign | null {
  if (!body) return null;
  if (Array.isArray(body)) {
    return (body[0] as PhoneInviteGroupCampaign) ?? null;
  }
  return body as PhoneInviteGroupCampaign;
}

function normalizeGroupList(body: unknown): PhoneInviteGroupItem[] {
  if (Array.isArray(body)) return body as PhoneInviteGroupItem[];
  if (body && typeof body === "object" && Array.isArray((body as { results?: unknown }).results)) {
    return (body as { results: PhoneInviteGroupItem[] }).results;
  }
  return [];
}

export const zaloPhoneInviteGroupCampaignService = {
  async listCampaigns(): Promise<PhoneInviteGroupCampaign[]> {
    const response = await api.get(API_ZALO_PHONE_INVITE_GROUP_CAMPAIGN.LIST);
    return normalizeCampaignList(response.data);
  },

  async getCampaignById(id: number): Promise<PhoneInviteGroupCampaign | null> {
    const response = await api.get(API_ZALO_PHONE_INVITE_GROUP_CAMPAIGN.LIST, {
      params: { id_category: id },
    });
    return normalizeCampaignDetail(response.data);
  },

  async createOrEditCampaign(
    payload: PhoneInviteGroupCampaignFormPayload,
  ): Promise<void> {
    await api.post(API_ZALO_PHONE_INVITE_GROUP_CAMPAIGN.CREATE_OR_EDIT, payload);
  },

  async deleteCampaign(id: number): Promise<void> {
    await api.post(API_ZALO_PHONE_INVITE_GROUP_CAMPAIGN.DELETE, { id_category: id });
  },

  async copyCampaign(id: number, name: string): Promise<void> {
    await api.post(API_ZALO_PHONE_INVITE_GROUP_CAMPAIGN.COPY, {
      id_category: id,
      name,
    });
  },

  async startCampaigns(
    ids: number[],
    type: "new" | "continue" = "new",
  ): Promise<void> {
    await api.post(API_ZALO_PHONE_INVITE_GROUP_CAMPAIGN.START, {
      id_categories: ids,
      type: type === "new" ? "new" : "",
    });
  },

  async stopCampaigns(ids: number[]): Promise<void> {
    await api.post(API_ZALO_PHONE_INVITE_GROUP_CAMPAIGN.STOP, {
      id_categories: ids,
    });
  },

  async fetchResults(options: {
    categoryId: number;
    page?: number;
    perPage?: number;
  }): Promise<PaginatedResponse<PhoneInviteGroupCampaignResult>> {
    const response = await api.get(API_ZALO_PHONE_INVITE_GROUP_CAMPAIGN.RESULTS, {
      params: {
        id_category: options.categoryId,
        page: options.page ?? 1,
        number_per_page: options.perPage ?? 100,
      },
    });
    const body = response.data;
    if (body && typeof body === "object" && "results" in body) {
      return body as PaginatedResponse<PhoneInviteGroupCampaignResult>;
    }
    return {
      results: Array.isArray(body) ? (body as PhoneInviteGroupCampaignResult[]) : [],
      count: 0,
      next: null,
      previous: null,
    };
  },

  async deleteResults(ids: number[]): Promise<void> {
    await api.post(API_ZALO_PHONE_INVITE_GROUP_CAMPAIGN.DELETE_RESULTS, {
      id_results: ids,
    });
  },

  async fetchStatistics(
    categoryId: number,
  ): Promise<PhoneInviteGroupCampaignStatistics> {
    const response = await api.get(API_ZALO_PHONE_INVITE_GROUP_CAMPAIGN.STATISTICS, {
      params: { id_category: categoryId },
    });
    return (response.data ?? {}) as PhoneInviteGroupCampaignStatistics;
  },

  async fetchGroupsByAccounts(options: {
    accountIds: number[];
    keyword?: string;
  }): Promise<PhoneInviteGroupItem[]> {
    const response = await api.post(
      API_ZALO_PHONE_INVITE_GROUP_CAMPAIGN.ALL_GROUPS,
      {
        id_accounts: options.accountIds,
        keyword: options.keyword ?? "",
      },
    );
    return normalizeGroupList(response.data);
  },
};