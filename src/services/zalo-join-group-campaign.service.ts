import { API_ZALO_JOIN_GROUP_CAMPAIGN } from "@/config/api";
import { createCampaignService } from "@/lib/campaign-service";
import type {
  JoinGroupCampaign,
  JoinGroupCampaignFormPayload,
  JoinGroupCampaignResult,
  JoinGroupCampaignStatistics,
} from "@/types/zalo-join-group-campaign";

const base = createCampaignService<
  JoinGroupCampaign,
  JoinGroupCampaign,
  JoinGroupCampaignFormPayload,
  JoinGroupCampaignResult,
  JoinGroupCampaignStatistics
>(API_ZALO_JOIN_GROUP_CAMPAIGN);

export const zaloJoinGroupCampaignService = {
  ...base,
  fetchFailedLinks: base.fetchFailedLinks,
  fetchAccountLimit: base.fetchAccountLimit,
};