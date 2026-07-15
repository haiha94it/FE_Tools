import { API_ZALO_CAMPAIGN_NOTIFICATION } from "@/config/api";
import { unwrapApiBody } from "@/lib/api-response";
import {
  getCeleryTaskStatus,
  normalizeCeleryPollResponse,
} from "@/lib/celery-poll";
import api from "@/lib/axios";
import type {
  CampaignNotificationConfig,
  CampaignNotificationSetupPayload,
} from "@/types/zalo-campaign-notification";
import type { ScanTaskResponse } from "@/types/zalo-contacts";

function normalizeConfig(body: unknown): CampaignNotificationConfig | null {
  if (!body || typeof body !== "object") return null;
  return body as CampaignNotificationConfig;
}

export const zaloCampaignNotificationService = {
  async getConfig(): Promise<CampaignNotificationConfig | null> {
    try {
      const response = await api.get(API_ZALO_CAMPAIGN_NOTIFICATION.GET);
      const raw = response.data;
      if (raw && typeof raw === "object" && "success" in raw) {
        return normalizeConfig(unwrapApiBody<unknown>(raw));
      }
      return normalizeConfig(raw);
    } catch {
      return null;
    }
  },

  async setup(
    payload: CampaignNotificationSetupPayload,
  ): Promise<string | number | null> {
    const response = await api.post(API_ZALO_CAMPAIGN_NOTIFICATION.SETUP, payload);
    const raw = response.data;
    if (raw && typeof raw === "object" && "success" in raw) {
      const body = unwrapApiBody<{ id_task?: string | number }>(raw);
      return body.id_task ?? null;
    }
    const legacy = raw as { id_task?: string | number };
    return legacy?.id_task ?? null;
  },

  async pollSetupResult(taskId: string | number): Promise<ScanTaskResponse> {
    const response = await api.post(API_ZALO_CAMPAIGN_NOTIFICATION.RESULT, {
      id_task: taskId,
    });
    const raw = response.data;
    const body =
      raw && typeof raw === "object" && "success" in raw
        ? unwrapApiBody<ScanTaskResponse>(raw)
        : (raw as ScanTaskResponse);
    return normalizeCeleryPollResponse(body);
  },

  extractSetupOutcome(result: ScanTaskResponse): string | null {
    const status = getCeleryTaskStatus(result);
    if (status !== "SUCCESS" && status !== "FAILURE") return null;
    const payload = result.data ?? result.result;
    if (payload && typeof payload === "object") {
      const record = payload as { success?: string; error?: string };
      return record.success || record.error || null;
    }
    if (typeof payload === "string") return payload;
    return result.message || result.error || null;
  },
};