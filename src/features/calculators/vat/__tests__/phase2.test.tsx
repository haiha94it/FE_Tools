import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { calculateExclusiveToInclusive } from "../domain/calculator";
import {
  createInitialVatUiState,
  ResultPlaceholder,
  VatResultCard,
  vatUiReducer,
} from "../ui/VatCalculator";

describe("Phase 2 state machine flow", () => {
  test("keeps independent RAM drafts when switching Mode A/B", () => {
    let state = createInitialVatUiState("2026-08-14");
    state = vatUiReducer(state, { type: "edit", field: "amount", value: "10000000" });
    state = vatUiReducer(state, { type: "change_mode", mode: "inclusive_to_exclusive" });
    state = vatUiReducer(state, { type: "edit", field: "amount", value: "11000000" });
    assert.equal(state.drafts.exclusive_to_inclusive.amount, "10000000");
    assert.equal(state.drafts.inclusive_to_exclusive.amount, "11000000");
  });

  test("editing invalidates and hides a previous result", () => {
    const outcome = calculateExclusiveToInclusive({ amount: "10000000", vatStatus: "rate_10", calculationDate: "2026-08-14" });
    if (!outcome.ok) assert.fail("Expected acceptance fixture to calculate");
    let state = vatUiReducer(createInitialVatUiState("2026-08-14"), { type: "calculated", result: outcome.result });
    assert.equal(state.status, "calculated");
    state = vatUiReducer(state, { type: "edit", field: "amount", value: "12000000" });
    assert.equal(state.status, "editing");
    assert.equal(state.result, null);
  });

  test("maps expired temporary policy to policy_blocked without fallback", () => {
    const errors = [{ code: "policy_unavailable", field: "calculation_date", message: "Chính sách này cần được cập nhật trước khi tiếp tục tính." }] as const;
    const state = vatUiReducer(createInitialVatUiState("2027-01-01"), { type: "invalid", errors, policyBlocked: true });
    assert.equal(state.status, "policy_blocked");
    assert.equal(state.result, null);
  });

  test("clears a previous 8% confirmation when switching status", () => {
    let state = createInitialVatUiState("2026-08-14");
    state = vatUiReducer(state, { type: "edit", field: "vatStatus", value: "temporary_rate_8" });
    state = vatUiReducer(state, { type: "edit", field: "reductionEligibilityConfirmed", value: true });
    state = vatUiReducer(state, { type: "edit", field: "vatStatus", value: "rate_10" });
    assert.equal(state.drafts.exclusive_to_inclusive.reductionEligibilityConfirmed, false);
  });
});

describe("Phase 2 result component", () => {
  test("Mode A renders total as the primary result and audit sections", () => {
    const outcome = calculateExclusiveToInclusive({ amount: "10000000", vatStatus: "rate_10", calculationDate: "2026-08-14" });
    if (!outcome.ok) assert.fail("Expected acceptance fixture to calculate");
    const html = renderToStaticMarkup(<VatResultCard result={outcome.result} />);
    assert.match(html, /Tổng thanh toán/);
    assert.match(html, /11\.000\.000 ₫/);
    assert.match(html, /Cách tính/);
    assert.match(html, /Căn cứ/);
    assert.match(html, /Policy VAT-VN-2026\.1/);
  });

  test("policy blocked UI uses the required expiry message", () => {
    const html = renderToStaticMarkup(<ResultPlaceholder status="policy_blocked" />);
    assert.match(html, /Chính sách này cần được cập nhật trước khi tiếp tục tính/);
    assert.match(html, /không tự đổi sang mức 10%/);
  });
});
