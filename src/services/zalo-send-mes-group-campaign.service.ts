import { API_UPLOAD, API_ZALO_SEND_MES_GROUP_CAMPAIGN } from "@/config/api";
import { createCampaignService } from "@/lib/campaign-service";
import { parseUploadedFileLink } from "@/lib/zalo-messenger-send-utils";
import api from "@/lib/axios";
import type {
  SendMesGroupCampaign,
  SendMesGroupCampaignDetail,
  SendMesGroupCampaignFormPayload,
  SendMesGroupCampaignResult,
  SendMesGroupCampaignStatistics,
} from "@/types/zalo-send-mes-group-campaign";

const base = createCampaignService<
  SendMesGroupCampaign,
  SendMesGroupCampaignDetail,
  SendMesGroupCampaignFormPayload,
  SendMesGroupCampaignResult,
  SendMesGroupCampaignStatistics
>(API_ZALO_SEND_MES_GROUP_CAMPAIGN);

export const zaloSendMesGroupCampaignService = {
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