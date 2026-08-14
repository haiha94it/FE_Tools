import { parseVnd } from "../money/vietnamese-money";
import {
  isVatStatus,
  resolveTemporaryVatPolicy,
  type VatStatus,
} from "../policy/vat-policy";

export const VAT_ERROR_MESSAGES = Object.freeze({
  amount_required: "Vui lòng nhập số tiền.",
  amount_invalid: "Số tiền chưa đúng định dạng.",
  amount_non_positive: "Số tiền phải lớn hơn 0.",
  amount_negative: "Doanh thu không được là số âm.",
  vat_status_required: "Vui lòng chọn mức/trạng thái thuế GTGT.",
  date_required: "Vui lòng chọn ngày tính.",
  date_invalid: "Ngày áp dụng không hợp lệ.",
  temporary_rate_out_of_range: "Mức 8% không có hiệu lực tại ngày đã chọn.",
  eligibility_confirmation_required:
    "Hãy xác nhận bạn đã kiểm tra điều kiện áp dụng.",
  activity_group_required: "Vui lòng chọn nhóm hoạt động kinh doanh.",
  policy_unavailable: "Chính sách này cần được cập nhật trước khi tiếp tục tính.",
  calculation_failed: "Không thể tính lúc này. Dữ liệu bạn nhập vẫn được giữ lại.",
});

export type VatErrorCode = keyof typeof VAT_ERROR_MESSAGES;

export interface VatValidationError {
  code: VatErrorCode;
  message: string;
  field: "amount" | "vat_status" | "calculation_date" | "eligibility";
}

export interface VatCalculationInput {
  amount: string;
  vatStatus: unknown;
  calculationDate?: string;
  reductionEligibilityConfirmed?: boolean;
}

export interface ValidatedVatInput {
  amount: bigint;
  vatStatus: VatStatus;
  calculationDate?: string;
  reductionEligibilityConfirmed: boolean;
}

export type VatValidationResult =
  | { ok: true; value: ValidatedVatInput }
  | { ok: false; errors: VatValidationError[] };

function error(
  code: VatErrorCode,
  field: VatValidationError["field"],
): VatValidationError {
  return { code, field, message: VAT_ERROR_MESSAGES[code] };
}

/** Validate ISO local date mà không phụ thuộc timezone runtime. */
export function isValidIsoDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/** Validate input chung A/B và điều kiện policy 8%; không tự fallback rate. */
export function validateVatInput(input: VatCalculationInput): VatValidationResult {
  const errors: VatValidationError[] = [];
  const parsedAmount = parseVnd(input.amount);
  if (!parsedAmount.ok) {
    errors.push(
      error(parsedAmount.reason === "required" ? "amount_required" : "amount_invalid", "amount"),
    );
  } else if (parsedAmount.value <= 0n) {
    errors.push(error("amount_non_positive", "amount"));
  }

  if (input.vatStatus === "" || input.vatStatus === null || input.vatStatus === undefined) {
    errors.push(error("vat_status_required", "vat_status"));
  } else if (!isVatStatus(input.vatStatus)) {
    errors.push(error("vat_status_required", "vat_status"));
  }

  if (input.vatStatus === "temporary_rate_8") {
    if (!input.calculationDate) {
      errors.push(error("date_required", "calculation_date"));
    } else if (!isValidIsoDate(input.calculationDate)) {
      errors.push(error("date_invalid", "calculation_date"));
    } else {
      const resolution = resolveTemporaryVatPolicy(input.calculationDate);
      if (resolution.status === "OUT_OF_RANGE") {
        errors.push(error("temporary_rate_out_of_range", "calculation_date"));
      } else if (resolution.status === "LEGAL_REVIEW_REQUIRED") {
        errors.push(error("policy_unavailable", "calculation_date"));
      }
    }
    if (input.reductionEligibilityConfirmed !== true) {
      errors.push(error("eligibility_confirmation_required", "eligibility"));
    }
  } else if (input.calculationDate && !isValidIsoDate(input.calculationDate)) {
    errors.push(error("date_invalid", "calculation_date"));
  }

  if (errors.length || !parsedAmount.ok || !isVatStatus(input.vatStatus)) {
    return { ok: false, errors };
  }
  return {
    ok: true,
    value: {
      amount: parsedAmount.value,
      vatStatus: input.vatStatus,
      calculationDate: input.calculationDate,
      reductionEligibilityConfirmed: input.reductionEligibilityConfirmed === true,
    },
  };
}
