/** Cấu hình thông báo chiến dịch — GET /api/campaign/campaign-notification */
export interface CampaignNotificationConfig {
  id?: number;
  account?: number | null;
  phone_number?: string | null;
  active?: boolean;
}

export interface CampaignNotificationSetupPayload {
  id_account: number;
  phone_number: string;
  active: boolean;
}