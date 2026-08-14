import type {
  CalculateVatInput,
  VatCalculationMode,
} from "../domain/types";
import { VAT_POLICY_VERSION } from "../policy/vat-policy";

export interface VatAcceptanceFixture {
  id: string;
  formula: string;
  ruleSourceIds: readonly string[];
  policyVersion: string;
  mode: VatCalculationMode;
  input: CalculateVatInput;
  expected: {
    base: bigint;
    vat: bigint;
    total: bigint;
  };
}

const metadata = {
  policyVersion: VAT_POLICY_VERSION,
  ruleSourceIds: ["SRC-L48"],
} as const;

/** Mỗi fixture tự khai báo Formula, Rule Source ID và Policy Version để audit. */
export const ACCEPTANCE_FIXTURES: readonly VatAcceptanceFixture[] = [
  {
    ...metadata,
    id: "A01",
    formula: "10,000,000 × 10%; total = base + rounded VAT",
    mode: "exclusive_to_inclusive",
    input: { amount: "10000000", vatStatus: "rate_10" },
    expected: { base: 10_000_000n, vat: 1_000_000n, total: 11_000_000n },
  },
  {
    ...metadata,
    id: "A02",
    formula: "10,000,000 × 5%; total = base + rounded VAT",
    mode: "exclusive_to_inclusive",
    input: { amount: "10.000.000", vatStatus: "rate_5" },
    expected: { base: 10_000_000n, vat: 500_000n, total: 10_500_000n },
  },
  {
    ...metadata,
    id: "A03",
    formula: "rate_0 resolves to 0%; total = base",
    mode: "exclusive_to_inclusive",
    input: { amount: "10 000 000", vatStatus: "rate_0" },
    expected: { base: 10_000_000n, vat: 0n, total: 10_000_000n },
  },
  {
    ...metadata,
    id: "A04",
    formula: "non_taxable has computational rate 0%; total = base",
    mode: "exclusive_to_inclusive",
    input: { amount: "10000000", vatStatus: "non_taxable" },
    expected: { base: 10_000_000n, vat: 0n, total: 10_000_000n },
  },
  {
    ...metadata,
    id: "A05",
    formula: "not_required_to_declare has computational rate 0%; total = base",
    mode: "exclusive_to_inclusive",
    input: { amount: "10000000", vatStatus: "not_required_to_declare" },
    expected: { base: 10_000_000n, vat: 0n, total: 10_000_000n },
  },
  {
    policyVersion: VAT_POLICY_VERSION,
    ruleSourceIds: ["SRC-NQ204", "SRC-ND174"],
    id: "A06",
    formula: "10,000,000 × temporary 8%; valid date and confirmation required",
    mode: "exclusive_to_inclusive",
    input: {
      amount: "10000000",
      vatStatus: "temporary_rate_8",
      calculationDate: "2026-08-14",
      reductionEligibilityConfirmed: true,
    },
    expected: { base: 10_000_000n, vat: 800_000n, total: 10_800_000n },
  },
  {
    ...metadata,
    id: "B01",
    formula: "11,000,000 ÷ 1.10; VAT = input total − rounded base",
    mode: "inclusive_to_exclusive",
    input: { amount: "11000000", vatStatus: "rate_10" },
    expected: { base: 10_000_000n, vat: 1_000_000n, total: 11_000_000n },
  },
  {
    ...metadata,
    id: "B02",
    formula: "10,500,000 ÷ 1.05; VAT = input total − rounded base",
    mode: "inclusive_to_exclusive",
    input: { amount: "10500000", vatStatus: "rate_5" },
    expected: { base: 10_000_000n, vat: 500_000n, total: 10_500_000n },
  },
  {
    policyVersion: VAT_POLICY_VERSION,
    ruleSourceIds: ["SRC-NQ204", "SRC-ND174"],
    id: "B03",
    formula: "10,800,000 ÷ 1.08; VAT = input total − rounded base",
    mode: "inclusive_to_exclusive",
    input: {
      amount: "10800000",
      vatStatus: "temporary_rate_8",
      calculationDate: "2026-08-14",
      reductionEligibilityConfirmed: true,
    },
    expected: { base: 10_000_000n, vat: 800_000n, total: 10_800_000n },
  },
  {
    ...metadata,
    id: "B04",
    formula: "Regression: divide total by 1.10; never total × 10%",
    mode: "inclusive_to_exclusive",
    input: { amount: "11000000", vatStatus: "rate_10" },
    expected: { base: 10_000_000n, vat: 1_000_000n, total: 11_000_000n },
  },
  {
    ...metadata,
    id: "B05",
    formula: "100,000 ÷ 1.10 = 90,909.09…; HALF_UP base; VAT = total − base",
    mode: "inclusive_to_exclusive",
    input: { amount: "100000", vatStatus: "rate_10" },
    expected: { base: 90_909n, vat: 9_091n, total: 100_000n },
  },
];
