import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  calculateExclusiveToInclusive,
  calculateInclusiveToExclusive,
} from "../domain/calculator";
import type {
  CalculateVatInput,
  VatCalculationOutcome,
} from "../domain/types";
import {
  exactDecimal,
  formatVnd,
  parseVnd,
  roundHalfUp,
} from "../money/vietnamese-money";
import {
  VAT_POLICY,
  VAT_POLICY_VERSION,
  resolveTemporaryVatPolicy,
} from "../policy/vat-policy";
import { VAT_ERROR_MESSAGES } from "../validation/vat-validation";
import { ACCEPTANCE_FIXTURES } from "./fixtures";
import "./phase2.test";

function requireSuccess(outcome: VatCalculationOutcome) {
  if (outcome.ok) return outcome.result;
  assert.fail(`Expected success, got ${JSON.stringify(outcome.errors)}`);
}

function requireFailure(outcome: VatCalculationOutcome) {
  if (!outcome.ok) return outcome.errors;
  assert.fail("Expected validation failure");
}

function calculate(mode: string, input: CalculateVatInput) {
  return mode === "exclusive_to_inclusive"
    ? calculateExclusiveToInclusive(input)
    : calculateInclusiveToExclusive(input);
}

describe("Acceptance Matrix A01–B05", () => {
  for (const fixture of ACCEPTANCE_FIXTURES) {
    test(`${fixture.id}: ${fixture.formula}`, () => {
      assert.equal(fixture.policyVersion, VAT_POLICY_VERSION);
      assert.ok(fixture.ruleSourceIds.length > 0);
      const result = requireSuccess(calculate(fixture.mode, fixture.input));
      assert.deepEqual(result.displayed, {
        amountExcludingVat: fixture.expected.base,
        vatAmount: fixture.expected.vat,
        amountIncludingVat: fixture.expected.total,
      });
      assert.equal(
        result.displayed.amountExcludingVat + result.displayed.vatAmount,
        result.displayed.amountIncludingVat,
      );
      assert.ok(result.explanationSteps.length >= 4);
      assert.equal(result.policyVersion, fixture.policyVersion);
    });
  }
});

describe("Policy 8% boundaries and confirmation", () => {
  const input = (calculationDate?: string, confirmed = true): CalculateVatInput => ({
    amount: "10000000",
    vatStatus: "temporary_rate_8",
    calculationDate,
    reductionEligibilityConfirmed: confirmed,
  });

  test("rejects the day before valid_from without fallback", () => {
    const errors = requireFailure(calculateExclusiveToInclusive(input("2025-06-30")));
    assert.equal(errors[0]?.code, "temporary_rate_out_of_range");
    assert.equal(errors[0]?.message, VAT_ERROR_MESSAGES.temporary_rate_out_of_range);
  });

  test("accepts valid_from inclusively in both modes", () => {
    assert.equal(requireSuccess(calculateExclusiveToInclusive(input("2025-07-01"))).effectiveRatePercent, 8n);
    assert.equal(requireSuccess(calculateInclusiveToExclusive(input("2025-07-01"))).effectiveRatePercent, 8n);
  });

  test("accepts valid_to inclusively in both modes", () => {
    assert.equal(requireSuccess(calculateExclusiveToInclusive(input("2026-12-31"))).effectiveRatePercent, 8n);
    assert.equal(requireSuccess(calculateInclusiveToExclusive(input("2026-12-31"))).effectiveRatePercent, 8n);
  });

  test("locks the day after valid_to as LEGAL_REVIEW_REQUIRED without fallback", () => {
    const errors = requireFailure(calculateInclusiveToExclusive(input("2027-01-01")));
    assert.equal(errors[0]?.code, "policy_unavailable");
    assert.equal(errors[0]?.message, VAT_ERROR_MESSAGES.policy_unavailable);
  });

  test("requires application date", () => {
    const errors = requireFailure(calculateExclusiveToInclusive(input(undefined)));
    assert.equal(errors[0]?.code, "date_required");
    assert.equal(errors[0]?.message, VAT_ERROR_MESSAGES.date_required);
  });

  test("rejects invalid calendar date", () => {
    const errors = requireFailure(calculateExclusiveToInclusive(input("2026-02-30")));
    assert.equal(errors[0]?.code, "date_invalid");
  });

  test("requires explicit eligibility confirmation", () => {
    const errors = requireFailure(calculateExclusiveToInclusive(input("2026-08-14", false)));
    assert.equal(errors[0]?.code, "eligibility_confirmation_required");
    assert.equal(errors[0]?.message, VAT_ERROR_MESSAGES.eligibility_confirmation_required);
  });

  test("resolver marks before valid_from as OUT_OF_RANGE", () => {
    assert.equal(resolveTemporaryVatPolicy("2025-06-30").status, "OUT_OF_RANGE");
  });

  test("resolver marks both inclusive boundaries as VERIFIED", () => {
    assert.equal(resolveTemporaryVatPolicy("2025-07-01").status, "VERIFIED");
    assert.equal(resolveTemporaryVatPolicy("2026-12-31").status, "VERIFIED");
  });

  test("resolver marks post-expiry current/future branch LEGAL_REVIEW_REQUIRED", () => {
    assert.equal(resolveTemporaryVatPolicy("2027-01-01", "2027-01-01").status, "LEGAL_REVIEW_REQUIRED");
  });

  test("resolver permits historical verified date even when current date is post-expiry", () => {
    const resolution = resolveTemporaryVatPolicy("2026-08-14", "2027-02-01");
    assert.equal(resolution.status, "VERIFIED");
    assert.equal(resolution.isHistorical, true);
    assert.equal(requireSuccess(calculateExclusiveToInclusive(input("2026-08-14"))).effectiveRatePercent, 8n);
  });
});

describe("Money utilities", () => {
  test("parses supported whole-VND forms", () => {
    for (const value of ["10000000", "10.000.000", "10 000 000", "10.000.000 ₫", "10 000 000 VND"]) {
      assert.deepEqual(parseVnd(value), { ok: true, value: 10_000_000n, normalized: "10000000" });
    }
  });

  test("rejects ambiguous decimals and malformed grouping", () => {
    for (const value of ["1,000.50", "1.000,50", "10.00.000", "10 00 000", "12.5", "-1000", "1e6"]) {
      assert.equal(parseVnd(value).ok, false, value);
    }
  });

  test("uses exact ROUND_HALF_UP to whole VND", () => {
    assert.equal(roundHalfUp(exactDecimal(1n, 2n)), 1n);
    assert.equal(roundHalfUp(exactDecimal(49n, 100n)), 0n);
    assert.equal(roundHalfUp(exactDecimal(50n, 100n)), 1n);
  });

  test("formats VND without floating point", () => {
    assert.equal(formatVnd(10_000_000n), "10.000.000 ₫");
  });
});

describe("Domain guards and zero statuses", () => {
  test("rejects arbitrary status/rate from an untrusted caller", () => {
    const errors = requireFailure(calculateExclusiveToInclusive({
      amount: "10000000",
      vatStatus: "7" as never,
    }));
    assert.equal(errors[0]?.code, "vat_status_required");
  });

  test("keeps three zero statuses semantically distinct", () => {
    const statuses = ["rate_0", "non_taxable", "not_required_to_declare"] as const;
    const results = statuses.map((vatStatus) => requireSuccess(
      calculateExclusiveToInclusive({ amount: "1000", vatStatus }),
    ));
    assert.deepEqual(results.map((result) => result.vatStatus), statuses);
    assert.equal(new Set(results.map((result) => result.warnings[0])).size, 3);
    assert.ok(results.every((result) => result.displayed.vatAmount === 0n));
  });

  test("Mode B regression guard forbids multiplying gross total by rate", () => {
    const result = requireSuccess(calculateInclusiveToExclusive({
      amount: "11000000",
      vatStatus: "rate_10",
    }));
    assert.equal(result.displayed.vatAmount, 1_000_000n);
    assert.notEqual(result.displayed.vatAmount, 1_100_000n);
  });

  test("policy is versioned and carries audit sources", () => {
    assert.equal(VAT_POLICY.version, "VAT-VN-2026.1");
    assert.equal(VAT_POLICY.verifiedAt, "2026-08-14");
    assert.equal(VAT_POLICY.rounding.mode, "ROUND_HALF_UP");
    assert.ok(VAT_POLICY.sources.every((source) => source.officialUrl.startsWith("https://")));
  });
});
