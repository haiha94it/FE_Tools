/**
 * Key localStorage — đồng bộ MANAGE_CN để dùng chung token trên cùng domain.
 */
export const STORAGE_KEYS = {
  ACCESS_TOKEN: "access",
  REFRESH_TOKEN: "refresh",
  CARE_ACCESS_TOKEN: "access_care",
  /** Giữ đúng key cũ từ MANAGE_CN (typo refesh) */
  CARE_REFRESH_TOKEN: "refesh_care",
  REFERRAL_CODE: "ref_code_care",
} as const;