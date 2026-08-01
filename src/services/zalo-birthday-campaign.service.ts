import { API_UPLOAD, API_ZALO_BIRTHDAY_CAMPAIGN } from "@/config/api";
import { unwrapPaginatedPayload } from "@/lib/campaign-service";
import { parseUploadedFileLink } from "@/lib/zalo-messenger-send-utils";
import api from "@/lib/axios";
import type { PaginatedResponse } from "@/types/api";
import type {
  BirthdayCampaign,
  BirthdayCampaignFormPayload,
  BirthdayCampaignResult,
  BirthdayMediaItem,
} from "@/types/zalo-birthday-campaign";

/** Chuẩn hóa response category dạng object hoặc mảng singleton. */
function normalizeCampaign(body: unknown): BirthdayCampaign | null {
  if (!body || typeof body !== "object") return null;
  if (Array.isArray(body)) return normalizeCampaign(body[0]);
  const record = body as BirthdayCampaign;
  if (record.id) return record;
  return null;
}

/** Bỏ id category khỏi body vì endpoint detail đã nhận id trên URL. */
function stripCategoryId(payload: BirthdayCampaignFormPayload) {
  const body: Partial<BirthdayCampaignFormPayload> = { ...payload };
  delete body.id_category;
  return body;
}

export const zaloBirthdayCampaignService = {
  async getCampaign(): Promise<BirthdayCampaign | null> {
    const listResponse = await api.get(API_ZALO_BIRTHDAY_CAMPAIGN.GET);
    const summary = normalizeCampaign(listResponse.data);
    if (!summary?.id) return null;

    const detailResponse = await api.get(
      API_ZALO_BIRTHDAY_CAMPAIGN.detail(summary.id),
    );
    return normalizeCampaign(detailResponse.data);
  },

  async createOrEditCampaign(payload: BirthdayCampaignFormPayload): Promise<void> {
    if (payload.id_category) {
      await api.patch(
        API_ZALO_BIRTHDAY_CAMPAIGN.detail(payload.id_category),
        stripCategoryId(payload),
      );
    } else {
      await api.post(API_ZALO_BIRTHDAY_CAMPAIGN.LIST, stripCategoryId(payload));
    }
  },

  async startCampaign(id: number): Promise<void> {
    await api.post(API_ZALO_BIRTHDAY_CAMPAIGN.START, {
      id_categories: [id],
    });
  },

  async stopCampaign(id: number): Promise<void> {
    await api.post(API_ZALO_BIRTHDAY_CAMPAIGN.STOP, { id_categories: [id] });
  },

  async runNow(): Promise<void> {
    await api.post(API_ZALO_BIRTHDAY_CAMPAIGN.RUN_NOW);
  },

  async fetchResults(options: {
    page?: number;
    perPage?: number;
  }): Promise<PaginatedResponse<BirthdayCampaignResult>> {
    const response = await api.get(API_ZALO_BIRTHDAY_CAMPAIGN.RESULTS, {
      params: {
        page: options.page ?? 1,
        number_per_page: options.perPage ?? 100,
      },
    });
    return unwrapPaginatedPayload<BirthdayCampaignResult>(response.data);
  },

  async deleteResults(ids: number[]): Promise<void> {
    await api.delete(API_ZALO_BIRTHDAY_CAMPAIGN.RESULTS, {
      data: { id_results: ids },
    });
  },

  async listVideos(): Promise<BirthdayMediaItem[]> {
    // GET /api/message/video — envelope { data: [] } đã unwrap bởi axios interceptor
    const response = await api.get<BirthdayMediaItem[]>(
      API_ZALO_BIRTHDAY_CAMPAIGN.LIST_VIDEOS,
    );
    return Array.isArray(response.data) ? response.data : [];
  },

  async listAlbums(): Promise<BirthdayMediaItem[]> {
    // GET /api/message/album
    const response = await api.get<BirthdayMediaItem[]>(
      API_ZALO_BIRTHDAY_CAMPAIGN.LIST_ALBUMS,
    );
    return Array.isArray(response.data) ? response.data : [];
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
