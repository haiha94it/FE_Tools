/** Policy VAT Việt Nam được khóa theo Functional SSOT baseline 2026-08-14. */

export const VAT_CALCULATION_VERSION = "1.0";
export const VAT_POLICY_VERSION = "VAT-VN-2026.1";

export const VAT_STATUSES = [
  "rate_0",
  "rate_5",
  "temporary_rate_8",
  "rate_10",
  "non_taxable",
  "not_required_to_declare",
] as const;

export type VatStatus = (typeof VAT_STATUSES)[number];

export interface VatPolicySource {
  id: string;
  title: string;
  citation: string;
  validFrom: string;
  validTo?: string;
  officialUrl: string;
  ruleIds: readonly string[];
}

export interface TemporaryVatPolicy {
  id: string;
  sourceRatePercent: bigint;
  effectiveRatePercent: bigint;
  validFrom: string;
  validTo: string;
  requiresUserConfirmation: true;
  ruleIds: readonly string[];
}

export interface VatPolicy {
  version: string;
  calculationVersion: string;
  verifiedAt: string;
  rounding: {
    unit: "VND";
    scale: 0;
    mode: "ROUND_HALF_UP";
    ruleId: "ROUNDING-MONEY";
  };
  ratesByStatus: Readonly<Record<VatStatus, bigint>>;
  temporaryReduction: TemporaryVatPolicy;
  sources: readonly VatPolicySource[];
}

export type TemporaryVatPolicyStatus =
  | "VERIFIED"
  | "OUT_OF_RANGE"
  | "LEGAL_REVIEW_REQUIRED";

export type TemporaryVatPolicyResolution =
  | { status: "VERIFIED"; policy: TemporaryVatPolicy; isHistorical: boolean }
  | { status: "OUT_OF_RANGE" | "LEGAL_REVIEW_REQUIRED"; policy: null; isHistorical: false };

export const VAT_POLICY: VatPolicy = Object.freeze({
  version: VAT_POLICY_VERSION,
  calculationVersion: VAT_CALCULATION_VERSION,
  verifiedAt: "2026-08-14",
  rounding: Object.freeze({
    unit: "VND",
    scale: 0,
    mode: "ROUND_HALF_UP",
    ruleId: "ROUNDING-MONEY",
  }),
  ratesByStatus: Object.freeze({
    rate_0: 0n,
    rate_5: 5n,
    temporary_rate_8: 8n,
    rate_10: 10n,
    non_taxable: 0n,
    not_required_to_declare: 0n,
  }),
  temporaryReduction: Object.freeze({
    id: "vat-temporary-reduction-2025-2026",
    sourceRatePercent: 10n,
    effectiveRatePercent: 8n,
    validFrom: "2025-07-01",
    validTo: "2026-12-31",
    requiresUserConfirmation: true,
    ruleIds: Object.freeze(["VAT-TEMP-8", "VAT-TEMP-8-VALIDITY"]),
  }),
  sources: Object.freeze([
    Object.freeze({
      id: "SRC-L48",
      title: "Luật Thuế giá trị gia tăng 48/2024/QH15",
      citation: "Điều 5, Điều 7 và Điều 9",
      validFrom: "2025-07-01",
      officialUrl:
        "https://vanban.chinhphu.vn/?docid=212476&orggroupid=1&pageid=27160",
      ruleIds: Object.freeze([
        "VAT-RATE-0",
        "VAT-RATE-5",
        "VAT-RATE-10",
        "VAT-STATUS-NON-TAXABLE",
        "VAT-BASE-SALE",
        "VAT-MATH-ADD",
        "VAT-MATH-EXTRACT",
      ]),
    }),
    Object.freeze({
      id: "SRC-L90",
      title: "Luật 90/2025/QH15",
      citation: "Điều 4 sửa điểm a khoản 1 Điều 9 Luật Thuế GTGT",
      validFrom: "2025-07-01",
      officialUrl:
        "https://vanban.chinhphu.vn/?classid=1&docid=214558&orggroupid=1&pageid=27160",
      ruleIds: Object.freeze(["VAT-RATE-0"]),
    }),
    Object.freeze({
      id: "SRC-NQ204",
      title: "Nghị quyết 204/2025/QH15",
      citation: "Điều 1 khoản 1 và Điều 2",
      validFrom: "2025-07-01",
      validTo: "2026-12-31",
      officialUrl:
        "https://vanban.chinhphu.vn/?classid=1&docid=214209&pageid=27160",
      ruleIds: Object.freeze(["VAT-TEMP-8", "VAT-TEMP-8-VALIDITY"]),
    }),
    Object.freeze({
      id: "SRC-ND174",
      title: "Nghị định 174/2025/NĐ-CP",
      citation: "Điều 1 và Phụ lục I–III",
      validFrom: "2025-07-01",
      validTo: "2026-12-31",
      officialUrl:
        "https://vanban.chinhphu.vn/?classid=1&docid=214310&pageid=27160&typegroupid=4",
      ruleIds: Object.freeze(["VAT-TEMP-8"]),
    }),
  ]),
});

/** Runtime allow-list guard; không tin status/rate do caller tự truyền. */
export function isVatStatus(value: unknown): value is VatStatus {
  return typeof value === "string" && VAT_STATUSES.some((status) => status === value);
}

/** Resolve rate duy nhất từ policy versioned. */
export function resolveVatRate(status: VatStatus): bigint {
  return VAT_POLICY.ratesByStatus[status];
}

/**
 * Resolve policy 8% theo ngày. Ngày sau expiry bị legal gate; ngày lịch sử nằm
 * trong khoảng verified vẫn hợp lệ và tuyệt đối không fallback sang 10%.
 */
export function resolveTemporaryVatPolicy(
  calculationDate: string,
  currentDate = calculationDate,
): TemporaryVatPolicyResolution {
  const policy = VAT_POLICY.temporaryReduction;
  if (calculationDate < policy.validFrom) {
    return { status: "OUT_OF_RANGE", policy: null, isHistorical: false };
  }
  if (calculationDate > policy.validTo) {
    return { status: "LEGAL_REVIEW_REQUIRED", policy: null, isHistorical: false };
  }
  return {
    status: "VERIFIED",
    policy,
    isHistorical: currentDate > policy.validTo,
  };
}
