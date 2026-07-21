import { API_UPLOAD, API_ZALO_SEND_MESS_PHONE_CAMPAIGN } from "@/config/api";
import { createCampaignService } from "@/lib/campaign-service";
import { parseUploadedFileLink } from "@/lib/zalo-messenger-send-utils";
import api from "@/lib/axios";
import type {
  SendMessPhoneCampaign,
  SendMessPhoneCampaignDetail,
  SendMessPhoneCampaignFormPayload,
  SendMessPhoneCampaignResult,
  SendMessPhoneCampaignStatistics,
  SendMessPhoneSavePayload,
} from "@/types/zalo-send-mess-phone-campaign";

const base = createCampaignService<
  SendMessPhoneCampaign,
  SendMessPhoneCampaignDetail,
  SendMessPhoneCampaignFormPayload,
  SendMessPhoneCampaignResult,
  SendMessPhoneCampaignStatistics
>(API_ZALO_SEND_MESS_PHONE_CAMPAIGN);

export const zaloSendMessPhoneCampaignService = {
  ...base,
  fetchFailedPhones: base.fetchFailedPhones,
  fetchPhoneNumbersError: base.fetchPhoneNumbersError,
  fetchAccountLimit: base.fetchAccountLimit,

  async createOrEditCampaign(payload: SendMessPhoneSavePayload): Promise<void> {
    const { id_category, ...rest } = payload;
    if (id_category) {
      await api.patch(
        API_ZALO_SEND_MESS_PHONE_CAMPAIGN.detail(id_category),
        rest,
      );
    } else {
      await api.post(API_ZALO_SEND_MESS_PHONE_CAMPAIGN.LIST, rest);
    }
  },

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
