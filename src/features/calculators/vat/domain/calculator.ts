import {
  exactDecimal,
  formatVnd,
  roundHalfUp,
  type ExactDecimal,
} from "../money/vietnamese-money";
import {
  resolveVatRate,
  VAT_POLICY,
  type VatStatus,
} from "../policy/vat-policy";
import { validateVatInput } from "../validation/vat-validation";
import type {
  CalculateVatInput,
  VatCalculationMode,
  VatCalculationOutcome,
  VatCalculationResult,
  VatExplanationStep,
} from "./types";

const ZERO_STATUS_WARNINGS: Partial<Record<VatStatus, string>> = {
  rate_0: "Thuế suất 0% là một mức thuế suất, không đồng nghĩa không chịu thuế.",
  non_taxable: "Trạng thái không chịu thuế GTGT không phải thuế suất 0%.",
  not_required_to_declare:
    "Trạng thái không phải kê khai, tính nộp GTGT không phải thuế suất 0%.",
};

function statusRuleId(status: VatStatus): string {
  const ids: Record<VatStatus, string> = {
    rate_0: "VAT-RATE-0",
    rate_5: "VAT-RATE-5",
    temporary_rate_8: "VAT-TEMP-8",
    rate_10: "VAT-RATE-10",
    non_taxable: "VAT-STATUS-NON-TAXABLE",
    not_required_to_declare: "VAT-STATUS-NOT-REQUIRED-DECLARE",
  };
  return ids[status];
}

function rateLabel(rate: bigint): string {
  return `${rate.toString()}%`;
}

function comparisonAtTenPercent(
  baseExact: ExactDecimal,
  vatAtEightPercent: bigint,
) {
  const vatAtTenPercent = roundHalfUp(
    exactDecimal(baseExact.numerator * 10n, baseExact.denominator * 100n),
  );
  return {
    vatAtTenPercent,
    vatAtEightPercent,
    vatDifference: vatAtTenPercent - vatAtEightPercent,
  };
}

function buildWarnings(status: VatStatus): readonly string[] {
  const warnings: string[] = [];
  const zeroWarning = ZERO_STATUS_WARNINGS[status];
  if (zeroWarning) warnings.push(zeroWarning);
  if (status === "temporary_rate_8") {
    warnings.push(
      "Mức 8% có thời hạn; kết quả dựa trên xác nhận điều kiện của bạn và không tự phân loại hàng hóa, dịch vụ.",
    );
  }
  return warnings;
}

function buildResult(params: {
  mode: VatCalculationMode;
  status: VatStatus;
  rate: bigint;
  calculationDate?: string;
  exactBase: ExactDecimal;
  exactVat: ExactDecimal;
  exactTotal: ExactDecimal;
  displayedBase: bigint;
  displayedVat: bigint;
  displayedTotal: bigint;
  explanationSteps: readonly VatExplanationStep[];
}): VatCalculationResult {
  const ruleIds = [statusRuleId(params.status)];
  ruleIds.push(
    params.mode === "exclusive_to_inclusive" ? "VAT-MATH-ADD" : "VAT-MATH-EXTRACT",
    "ROUNDING-MONEY",
  );
  if (params.status === "temporary_rate_8") ruleIds.push("VAT-TEMP-8-VALIDITY");

  const result: VatCalculationResult = {
    toolSlug: "tinh-thue-gtgt",
    calculationVersion: VAT_POLICY.calculationVersion,
    policyVersion: VAT_POLICY.version,
    mode: params.mode,
    vatStatus: params.status,
    effectiveRatePercent: params.rate,
    calculationDate: params.calculationDate,
    resultStatus: "calculated",
    exact: {
      amountExcludingVat: params.exactBase,
      vatAmount: params.exactVat,
      amountIncludingVat: params.exactTotal,
    },
    displayed: {
      amountExcludingVat: params.displayedBase,
      vatAmount: params.displayedVat,
      amountIncludingVat: params.displayedTotal,
    },
    explanationSteps: params.explanationSteps,
    warnings: buildWarnings(params.status),
    ruleIds,
  };
  if (params.status === "temporary_rate_8") {
    result.comparisonAtTenPercent = comparisonAtTenPercent(
      params.exactBase,
      params.displayedVat,
    );
  }
  return result;
}

/** Mode A: giá chưa VAT → VAT + tổng, pure và Decimal chính xác. */
export function calculateExclusiveToInclusive(
  input: CalculateVatInput,
): VatCalculationOutcome {
  const validation = validateVatInput(input);
  if (!validation.ok) return { ok: false, errors: validation.errors };

  const { amount, vatStatus, calculationDate } = validation.value;
  const rate = resolveVatRate(vatStatus);
  const exactBase = exactDecimal(amount);
  const exactVat = exactDecimal(amount * rate, 100n);
  const exactTotal = exactDecimal(
    exactBase.numerator * exactVat.denominator +
      exactVat.numerator * exactBase.denominator,
    exactBase.denominator * exactVat.denominator,
  );
  const displayedBase = amount;
  const displayedVat = roundHalfUp(exactVat);
  const displayedTotal = displayedBase + displayedVat;

  return {
    ok: true,
    result: buildResult({
      mode: "exclusive_to_inclusive",
      status: vatStatus,
      rate,
      calculationDate,
      exactBase,
      exactVat,
      exactTotal,
      displayedBase,
      displayedVat,
      displayedTotal,
      explanationSteps: [
        {
          id: "input",
          text: `Giá chưa VAT: ${formatVnd(displayedBase)}.`,
          ruleIds: ["VAT-BASE-SALE"],
        },
        {
          id: "rate",
          text: `Mức/trạng thái được chọn có rate tính ${rateLabel(rate)}.`,
          ruleIds: [statusRuleId(vatStatus)],
        },
        {
          id: "formula",
          text: `${formatVnd(displayedBase)} × ${rateLabel(rate)} = ${formatVnd(displayedVat)} VAT.`,
          ruleIds: ["VAT-MATH-ADD"],
        },
        {
          id: "result",
          text: `Tổng thanh toán: ${formatVnd(displayedTotal)}.`,
          ruleIds: ["VAT-MATH-ADD", "ROUNDING-MONEY"],
        },
      ],
    }),
  };
}

/** Mode B: tổng đã VAT → base + VAT; displayed base + VAT luôn bằng input. */
export function calculateInclusiveToExclusive(
  input: CalculateVatInput,
): VatCalculationOutcome {
  const validation = validateVatInput(input);
  if (!validation.ok) return { ok: false, errors: validation.errors };

  const { amount, vatStatus, calculationDate } = validation.value;
  const rate = resolveVatRate(vatStatus);
  const exactTotal = exactDecimal(amount);
  const exactBase = exactDecimal(amount * 100n, 100n + rate);
  const exactVat = exactDecimal(
    exactTotal.numerator * exactBase.denominator -
      exactBase.numerator * exactTotal.denominator,
    exactTotal.denominator * exactBase.denominator,
  );
  const displayedTotal = amount;
  const displayedBase = roundHalfUp(exactBase);
  const displayedVat = displayedTotal - displayedBase;

  return {
    ok: true,
    result: buildResult({
      mode: "inclusive_to_exclusive",
      status: vatStatus,
      rate,
      calculationDate,
      exactBase,
      exactVat,
      exactTotal,
      displayedBase,
      displayedVat,
      displayedTotal,
      explanationSteps: [
        {
          id: "input",
          text: `Tổng đã VAT: ${formatVnd(displayedTotal)}.`,
          ruleIds: ["VAT-MATH-EXTRACT"],
        },
        {
          id: "rate",
          text: `Mức/trạng thái được chọn có rate tính ${rateLabel(rate)}.`,
          ruleIds: [statusRuleId(vatStatus)],
        },
        {
          id: "formula",
          text: `${formatVnd(displayedTotal)} ÷ (1 + ${rateLabel(rate)}) = ${formatVnd(displayedBase)} trước VAT.`,
          ruleIds: ["VAT-MATH-EXTRACT"],
        },
        {
          id: "rounding",
          text: `VAT hiển thị = tổng − giá trước VAT = ${formatVnd(displayedVat)}; tổng được bảo toàn.`,
          ruleIds: ["ROUNDING-MONEY"],
        },
        {
          id: "result",
          text: `${formatVnd(displayedBase)} + ${formatVnd(displayedVat)} = ${formatVnd(displayedTotal)}.`,
          ruleIds: ["VAT-MATH-EXTRACT", "ROUNDING-MONEY"],
        },
      ],
    }),
  };
}
