import { API_ZALO_ADD_FRIEND_CAMPAIGN } from "@/config/api";
import { createCampaignService } from "@/lib/campaign-service";
import type {
  AddFriendCampaign,
  AddFriendCampaignFormPayload,
  AddFriendCampaignResult,
  AddFriendCampaignStatistics,
} from "@/types/zalo-add-friend-campaign";

const base = createCampaignService<
  AddFriendCampaign,
  AddFriendCampaign,
  AddFriendCampaignFormPayload,
  AddFriendCampaignResult,
  AddFriendCampaignStatistics
>(API_ZALO_ADD_FRIEND_CAMPAIGN);

export const zaloAddFriendCampaignService = {
  ...base,
  fetchFailedPhones: base.fetchFailedPhones,
  fetchAccountLimit: base.fetchAccountLimit,
};