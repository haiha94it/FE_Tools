import { API_ZALO_PHONE_INVITE_GROUP_CAMPAIGN } from "@/config/api";
import api from "@/lib/axios";
import { createCampaignService } from "@/lib/campaign-service";
import {
  fetchCampaignCommonGroups,
  fetchCampaignCommonGroupsPage,
} from "@/services/zalo-campaign-all-group.service";
import type {
  PhoneInviteGroupCampaign,
  PhoneInviteGroupCampaignFormPayload,
  PhoneInviteGroupCampaignResult,
  PhoneInviteGroupCampaignStatistics,
  PhoneInviteGroupItem,
} from "@/types/zalo-phone-invite-group-campaign";

const base = createCampaignService<
  PhoneInviteGroupCampaign,
  PhoneInviteGroupCampaign,
  PhoneInviteGroupCampaignFormPayload,
  PhoneInviteGroupCampaignResult,
  PhoneInviteGroupCampaignStatistics
>(API_ZALO_PHONE_INVITE_GROUP_CAMPAIGN);

function stripCategoryId(
  payload: PhoneInviteGroupCampaignFormPayload,
): Omit<PhoneInviteGroupCampaignFormPayload, "id_category"> {
  const { id_category: _omit, ...rest } = payload;
  void _omit;
  return rest;
}

/**
 * Picker nhóm chung — POST /api/campaign/all-group/ (URL dùng chung).
 * - 1 nick: toàn bộ nhóm nick đã join (có global)
 * - ≥ 2 nick: chỉ nhóm chung (mọi nick đều trong nhóm)
 * - Không chung: data []
 */
export const zaloPhoneInviteGroupCampaignService = {
  ...base,
  fetchFailedPhones: base.fetchFailedPhones,

  /**
   * Update: PUT (doc) — shared campaign-service dùng PATCH; override cho resource này.
   * Create: POST .../category/
   * Body: group_invite only (không group_link).
   */
  async createOrEditCampaign(
    payload: PhoneInviteGroupCampaignFormPayload,
  ): Promise<void> {
    const body = stripCategoryId(payload);
    if (payload.id_category) {
      await api.put(
        API_ZALO_PHONE_INVITE_GROUP_CAMPAIGN.detail(payload.id_category),
        body,
      );
    } else {
      await api.post(API_ZALO_PHONE_INVITE_GROUP_CAMPAIGN.LIST, body);
    }
  },

  async fetchGroupsByAccounts(options: {
    accountIds: number[];
    keyword?: string;
  }): Promise<PhoneInviteGroupItem[]> {
    const items = await fetchCampaignCommonGroups(options);
    return items.map((item) => ({
      id: item.id,
      uid: item.uid,
      name: item.name,
      avt: item.avt,
      avatar: item.avatar ?? item.avt,
      link_group: item.link_group,
      total_member: item.total_member,
      is_joined: item.is_joined,
      is_blocked_chat: item.is_blocked_chat,
      globalId: item.globalId,
    }));
  },

  /** Phân trang picker — POST all-group + page/number_per_page. */
  async fetchGroupsByAccountsPage(options: {
    accountIds: number[];
    keyword?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{
    results: PhoneInviteGroupItem[];
    count: number;
    page: number;
    number_per_page: number;
    total_pages: number;
  }> {
    const data = await fetchCampaignCommonGroupsPage(options);
    return {
      results: data.results.map((item) => ({
        id: item.id,
        uid: item.uid,
        name: item.name,
        avt: item.avt,
        avatar: item.avatar ?? item.avt,
        link_group: item.link_group,
        total_member: item.total_member,
        is_joined: item.is_joined,
        is_blocked_chat: item.is_blocked_chat,
        globalId: item.globalId,
      })),
      count: data.count,
      page: data.page,
      number_per_page: data.number_per_page,
      total_pages: data.total_pages,
    };
  },
};
