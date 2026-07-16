/** Path builder — pattern `/api/campaign/{prefix}/category/` (contract 2026-07) */
export interface CampaignApiPaths {
  LIST: string;
  detail: (id: number | string) => string;
  START: string;
  STOP: string;
  copy: (id: number | string) => string;
  results: (id: number | string) => string;
  STATISTICS: string;
  FAILED_PHONES: string;
  FAILED_LINKS: string;
  ACCOUNT_LIMIT: string;
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
    FAILED_PHONES: `${base}/category/failed-campaigns-phone-numbers/`,
    FAILED_LINKS: `${base}/category/failed-campaigns-link-group/`,
    ACCOUNT_LIMIT: `${base}/category/account-limit/`,
    ALL_GROUPS: `${base}/category/all-group/`,
  };
}