import { API_ZALO_INVITE_JOIN_GROUP_CAMPAIGN } from "@/config/api";
import { createCampaignService } from "@/lib/campaign-service";
import type {
  InviteJoinGroupCampaign,
  InviteJoinGroupCampaignFormPayload,
  InviteJoinGroupCampaignResult,
  InviteJoinGroupCampaignStatistics,
} from "@/types/zalo-invite-join-group-campaign";

const base = createCampaignService<
  InviteJoinGroupCampaign,
  InviteJoinGroupCampaign,
  InviteJoinGroupCampaignFormPayload,
  InviteJoinGroupCampaignResult,
  InviteJoinGroupCampaignStatistics
>(API_ZALO_INVITE_JOIN_GROUP_CAMPAIGN);

export const zaloInviteJoinGroupCampaignService = {
  ...base,
  fetchFailedPhones: base.fetchFailedPhones,
};