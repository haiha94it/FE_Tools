import type { ExactDecimal } from "../money/vietnamese-money";
import type { VatStatus } from "../policy/vat-policy";
import type {
  VatCalculationInput,
  VatValidationError,
} from "../validation/vat-validation";

export type VatCalculationMode =
  | "exclusive_to_inclusive"
  | "inclusive_to_exclusive";

export interface VatExplanationStep {
  id: "input" | "rate" | "formula" | "rounding" | "result";
  text: string;
  ruleIds: readonly string[];
}

export interface VatComparisonAtTenPercent {
  vatAtTenPercent: bigint;
  vatAtEightPercent: bigint;
  vatDifference: bigint;
}

export interface VatCalculationResult {
  toolSlug: "tinh-thue-gtgt";
  calculationVersion: string;
  policyVersion: string;
  mode: VatCalculationMode;
  vatStatus: VatStatus;
  effectiveRatePercent: bigint;
  calculationDate?: string;
  resultStatus: "calculated";
  exact: {
    amountExcludingVat: ExactDecimal;
    vatAmount: ExactDecimal;
    amountIncludingVat: ExactDecimal;
  };
  displayed: {
    amountExcludingVat: bigint;
    vatAmount: bigint;
    amountIncludingVat: bigint;
  };
  comparisonAtTenPercent?: VatComparisonAtTenPercent;
  explanationSteps: readonly VatExplanationStep[];
  warnings: readonly string[];
  ruleIds: readonly string[];
}

export type VatCalculationOutcome =
  | { ok: true; result: VatCalculationResult }
  | { ok: false; errors: readonly VatValidationError[] };

export type CalculateVatInput = VatCalculationInput;
