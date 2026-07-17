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
   * POST body `{ id_accounts, keyword }`.
   * - spam-link-group (legacy)
   * - invite-phone-group: nhóm chung theo multi-nick (1 nick = all groups; ≥2 = intersection)
   * - invite-group: **không** có route này (404) — dùng GET /api/group/
   */
  ALL_GROUPS: string;
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
    // spam-link-group + invite-phone-group (intersection multi-nick)
    ALL_GROUPS: `${base}/category/all-group/`,
  };
}
