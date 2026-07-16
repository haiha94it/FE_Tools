import { API_UPLOAD, API_ZALO_SEND_MESS_MEMBER_GR_CAMPAIGN } from "@/config/api";
import { createCampaignService } from "@/lib/campaign-service";
import { parseUploadedFileLink } from "@/lib/zalo-messenger-send-utils";
import api from "@/lib/axios";
import type {
  SendMessMemberGrCampaign,
  SendMessMemberGrCampaignDetail,
  SendMessMemberGrCampaignFormPayload,
  SendMessMemberGrCampaignResult,
  SendMessMemberGrCampaignStatistics,
} from "@/types/zalo-send-mess-member-gr-campaign";

const base = createCampaignService<
  SendMessMemberGrCampaign,
  SendMessMemberGrCampaignDetail,
  SendMessMemberGrCampaignFormPayload,
  SendMessMemberGrCampaignResult,
  SendMessMemberGrCampaignStatistics
>(API_ZALO_SEND_MESS_MEMBER_GR_CAMPAIGN);

export const zaloSendMessMemberGrCampaignService = {
  ...base,
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