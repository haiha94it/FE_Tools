import { API_ZALO_PHONE_INVITE_GROUP_CAMPAIGN } from "@/config/api";
import { createCampaignService } from "@/lib/campaign-service";
import api from "@/lib/axios";
import type {
  PhoneInviteGroupCampaign,
  PhoneInviteGroupCampaignFormPayload,
  PhoneInviteGroupCampaignResult,
  PhoneInviteGroupCampaignStatistics,
  PhoneInviteGroupItem,
} from "@/types/zalo-phone-invite-group-campaign";

function normalizeGroupList(body: unknown): PhoneInviteGroupItem[] {
  if (Array.isArray(body)) return body as PhoneInviteGroupItem[];
  if (
    body &&
    typeof body === "object" &&
    Array.isArray((body as { results?: unknown }).results)
  ) {
    return (body as { results: PhoneInviteGroupItem[] }).results;
  }
  return [];
}

const base = createCampaignService<
  PhoneInviteGroupCampaign,
  PhoneInviteGroupCampaign,
  PhoneInviteGroupCampaignFormPayload,
  PhoneInviteGroupCampaignResult,
  PhoneInviteGroupCampaignStatistics
>(API_ZALO_PHONE_INVITE_GROUP_CAMPAIGN);

export const zaloPhoneInviteGroupCampaignService = {
  ...base,
  fetchFailedPhones: base.fetchFailedPhones,
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