/** Cấu hình thông báo chiến dịch — GET /api/campaign/campaign-notification */
export interface CampaignNotificationConfig {
  id?: number;
  account?: number | null;
  group?: number | null;
  active?: boolean;
}

export interface CampaignNotificationSetupPayload {
  id_account: number;
  id_group: number;
  active: boolean;
}
