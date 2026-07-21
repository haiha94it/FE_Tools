/** Path builder — pattern `/api/campaign/{prefix}/category/` (contract 2026-07) */
export interface CampaignApiPaths {
  LIST: string;
  detail: (id: number | string) => string;
  START: string;
  STOP: string;
  copy: (id: number | string) => string;
  results: (id: number | string) => string;
  STATISTICS: string;
  /** Không gắn `/category/` — xem living doc failed-campaigns */
  FAILED_PHONES: string;
  FAILED_LINKS: string;
  ACCOUNT_LIMIT: string;
  PHONE_NUMBERS_ERROR: string;
  /**
   * @deprecated Dùng `API_CAMPAIGN_ALL_GROUP` (`/api/campaign/all-group/`).
   * Path theo prefix (spam/invite) đã bị BE xóa — giữ field để type ổn định.
   */
  ALL_GROUPS: string;
  /** POST members multi-nick — chỉ mess-member-group */
  MEMBERS: string;
}

export function buildCampaignApiPaths(prefix: string): CampaignApiPaths {
  const base = `/api/campaign/${prefix}`;
  return {
    LIST: `${base}/category/`,
    detail: (id) => `${base}/category/${id}/`,
    START: `${base}/category/start/`,
    STOP: `${base}/category/stop/`,
    copy: (id) => `${base}/category/${id}/copy/`,
    results: (id) => `${base}/category/${id}/results/`,
    STATISTICS: `${base}/statistics/`,
    // Phụ: mount trực tiếp dưới prefix — KHÔNG chèn /category/ (404 nếu sai)
    FAILED_PHONES: `${base}/failed-campaigns-phone-numbers/`,
    FAILED_LINKS: `${base}/failed-campaigns-link-group/`,
    ACCOUNT_LIMIT: `${base}/account-limit/`,
    PHONE_NUMBERS_ERROR: `${base}/phone-numbers-error/`,
    // Deprecated: dùng API_CAMPAIGN_ALL_GROUP
    ALL_GROUPS: `${base}/category/all-group/`,
    MEMBERS: `${base}/category/members/`,
  };
}
