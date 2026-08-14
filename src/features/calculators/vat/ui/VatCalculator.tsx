"use client";

import { Tooltip, TooltipProvider } from "../../../../components/ui/tooltip/Tooltip";
import { forwardRef, useMemo, useReducer, useRef } from "react";
import { FiAlertTriangle, FiCheckCircle, FiHelpCircle, FiInfo } from "react-icons/fi";

import {
  calculateExclusiveToInclusive,
  calculateInclusiveToExclusive,
} from "../domain/calculator";
import type {
  VatCalculationMode,
  VatCalculationOutcome,
  VatCalculationResult,
} from "../domain/types";
import { formatVnd, parseVnd } from "../money/vietnamese-money";
import { VAT_POLICY, type VatStatus } from "../policy/vat-policy";
import type { VatValidationError } from "../validation/vat-validation";

export type VatUiStatus =
  | "idle"
  | "editing"
  | "invalid"
  | "policy_blocked"
  | "calculated"
  | "unexpected_error";

type VisibleVatStatus = Exclude<VatStatus, "not_required_to_declare">;

export interface VatDraft {
  amount: string;
  vatStatus: "" | VisibleVatStatus;
  calculationDate: string;
  reductionEligibilityConfirmed: boolean;
}

export interface VatUiState {
  mode: VatCalculationMode;
  status: VatUiStatus;
  drafts: Record<VatCalculationMode, VatDraft>;
  result: VatCalculationResult | null;
  errors: readonly VatValidationError[];
}

export type VatUiAction =
  | { type: "change_mode"; mode: VatCalculationMode }
  | { type: "edit"; field: keyof VatDraft; value: string | boolean }
  | { type: "calculated"; result: VatCalculationResult }
  | { type: "invalid"; errors: readonly VatValidationError[]; policyBlocked: boolean }
  | { type: "unexpected_error" };

/** Ngày hiện tại theo múi giờ Việt Nam, không để UTC làm đổi ngày. */
export function todayInVietnam(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export function createInitialVatUiState(date = todayInVietnam()): VatUiState {
  const draft = (): VatDraft => ({
    amount: "",
    vatStatus: "",
    calculationDate: date,
    reductionEligibilityConfirmed: false,
  });
  return {
    mode: "exclusive_to_inclusive",
    status: "idle",
    drafts: {
      exclusive_to_inclusive: draft(),
      inclusive_to_exclusive: draft(),
    },
    result: null,
    errors: [],
  };
}

/** State machine UI: mọi edit làm kết quả cũ hết hiệu lực ngay. */
export function vatUiReducer(state: VatUiState, action: VatUiAction): VatUiState {
  if (action.type === "change_mode") {
    return { ...state, mode: action.mode, status: "editing", result: null, errors: [] };
  }
  if (action.type === "edit") {
    const current = state.drafts[state.mode];
    const nextDraft = { ...current, [action.field]: action.value };
    if (action.field === "vatStatus" && action.value !== "temporary_rate_8") {
      nextDraft.reductionEligibilityConfirmed = false;
    }
    return {
      ...state,
      status: "editing",
      result: null,
      errors: [],
      drafts: { ...state.drafts, [state.mode]: nextDraft },
    };
  }
  if (action.type === "calculated") {
    return { ...state, status: "calculated", result: action.result, errors: [] };
  }
  if (action.type === "invalid") {
    return {
      ...state,
      status: action.policyBlocked ? "policy_blocked" : "invalid",
      result: null,
      errors: action.errors,
    };
  }
  return { ...state, status: "unexpected_error", result: null, errors: [] };
}

const STATUS_OPTIONS: readonly { value: VisibleVatStatus; label: string }[] = [
  { value: "rate_0", label: "Thuế suất 0%" },
  { value: "rate_5", label: "Thuế suất 5%" },
  { value: "temporary_rate_8", label: "Thuế suất 8% tạm thời" },
  { value: "rate_10", label: "Thuế suất 10%" },
  { value: "non_taxable", label: "Không chịu thuế GTGT" },
];

const STATUS_LABELS: Record<VisibleVatStatus, string> = Object.fromEntries(
  STATUS_OPTIONS.map((option) => [option.value, option.label]),
) as Record<VisibleVatStatus, string>;

const POLICY_ERROR_CODES = new Set(["temporary_rate_out_of_range", "policy_unavailable"]);

function Help({ content, href, label }: { content: string; href: string; label: string }) {
  return (
    <Tooltip content={<><span>{content}</span><a className="mt-1 block font-bold text-lime-300 underline" href={href}>Xem giải thích</a></>} side="top">
      <button type="button" aria-label={label} className="grid min-h-11 min-w-11 place-items-center rounded-full text-slate-500 hover:bg-emerald-50 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600">
        <FiHelpCircle aria-hidden="true" className="size-4" />
      </button>
    </Tooltip>
  );
}

function fieldErrors(errors: readonly VatValidationError[], field: VatValidationError["field"]) {
  return errors.filter((error) => error.field === field);
}

/** Calculator client-side duy nhất của VAT V1; không API, storage hay analytics. */
export default function VatCalculator() {
  const [state, dispatch] = useReducer(vatUiReducer, undefined, () => createInitialVatUiState());
  const draft = state.drafts[state.mode];
  const amountRef = useRef<HTMLInputElement>(null);
  const statusRef = useRef<HTMLSelectElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const eligibilityRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLElement>(null);
  const errorsByField = useMemo(() => ({
    amount: fieldErrors(state.errors, "amount"),
    vat_status: fieldErrors(state.errors, "vat_status"),
    calculation_date: fieldErrors(state.errors, "calculation_date"),
    eligibility: fieldErrors(state.errors, "eligibility"),
  }), [state.errors]);

  function changeMode(mode: VatCalculationMode) {
    dispatch({ type: "change_mode", mode });
  }

  function handleTabKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (!(["ArrowLeft", "ArrowRight"] as string[]).includes(event.key)) return;
    event.preventDefault();
    changeMode(state.mode === "exclusive_to_inclusive" ? "inclusive_to_exclusive" : "exclusive_to_inclusive");
    const targetId = state.mode === "exclusive_to_inclusive" ? "vat-tab-inclusive" : "vat-tab-exclusive";
    requestAnimationFrame(() => document.getElementById(targetId)?.focus());
  }

  function focusFirstError(errors: readonly VatValidationError[]) {
    const refs = { amount: amountRef, vat_status: statusRef, calculation_date: dateRef, eligibility: eligibilityRef };
    const firstError = errors[0];
    if (firstError) refs[firstError.field].current?.focus();
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const input = {
        amount: draft.amount,
        vatStatus: draft.vatStatus,
        calculationDate: draft.calculationDate,
        reductionEligibilityConfirmed: draft.reductionEligibilityConfirmed,
      };
      const outcome: VatCalculationOutcome = state.mode === "exclusive_to_inclusive"
        ? calculateExclusiveToInclusive(input)
        : calculateInclusiveToExclusive(input);
      if (!outcome.ok) {
        const policyBlocked = outcome.errors.some((error) => POLICY_ERROR_CODES.has(error.code));
        dispatch({ type: "invalid", errors: outcome.errors, policyBlocked });
        requestAnimationFrame(() => focusFirstError(outcome.errors));
        return;
      }
      dispatch({ type: "calculated", result: outcome.result });
      requestAnimationFrame(() => resultRef.current?.focus());
    } catch {
      dispatch({ type: "unexpected_error" });
    }
  }

  function formatAmountOnBlur() {
    const parsed = parseVnd(draft.amount);
    if (parsed.ok) dispatch({ type: "edit", field: "amount", value: formatVnd(parsed.value, false) });
  }

  const amountLabel = state.mode === "exclusive_to_inclusive" ? "Giá chưa VAT" : "Giá đã gồm VAT";
  const amountHelp = state.mode === "exclusive_to_inclusive"
    ? "Số tiền chưa cộng thuế GTGT."
    : "Tổng tiền đã bao gồm thuế GTGT.";

  return (
    <TooltipProvider>
      <section aria-labelledby="calculator-title" className="mt-8">
        <aside className="mb-5 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          <FiInfo aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <p><strong>Lưu ý:</strong> Kết quả chỉ để tham khảo. Công cụ không tự xác định thuế suất hoặc nghĩa vụ thuế áp dụng cho trường hợp của bạn.</p>
        </aside>

        <div role="tablist" aria-label="Chọn cách tính VAT" className="grid grid-cols-2 rounded-2xl bg-emerald-950 p-1.5 text-sm font-bold text-white shadow-sm">
          <button id="vat-tab-exclusive" role="tab" type="button" aria-selected={state.mode === "exclusive_to_inclusive"} aria-controls="vat-calculator-panel" tabIndex={state.mode === "exclusive_to_inclusive" ? 0 : -1} onClick={() => changeMode("exclusive_to_inclusive")} onKeyDown={handleTabKeyDown} className="min-h-11 rounded-xl px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300 data-[selected=true]:bg-white data-[selected=true]:text-emerald-950" data-selected={state.mode === "exclusive_to_inclusive"}>
            Giá chưa VAT
          </button>
          <button id="vat-tab-inclusive" role="tab" type="button" aria-selected={state.mode === "inclusive_to_exclusive"} aria-controls="vat-calculator-panel" tabIndex={state.mode === "inclusive_to_exclusive" ? 0 : -1} onClick={() => changeMode("inclusive_to_exclusive")} onKeyDown={handleTabKeyDown} className="min-h-11 rounded-xl px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300 data-[selected=true]:bg-white data-[selected=true]:text-emerald-950" data-selected={state.mode === "inclusive_to_exclusive"}>
            Giá đã gồm VAT
          </button>
        </div>

        <div id="vat-calculator-panel" role="tabpanel" aria-labelledby={state.mode === "exclusive_to_inclusive" ? "vat-tab-exclusive" : "vat-tab-inclusive"} className="mt-5 grid min-w-0 gap-6 lg:grid-cols-[1.02fr_.98fr]">
          <form noValidate onSubmit={handleSubmit} className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_50px_-35px_rgba(15,23,42,.35)] sm:p-7">
            <p className="text-xs font-bold uppercase tracking-[.12em] text-emerald-700">Thông tin đầu vào</p>
            <h2 id="calculator-title" className="mt-1 text-xl font-extrabold text-slate-900">Tính thuế GTGT</h2>

            <div className="mt-6 space-y-5">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="vat-amount" className="text-sm font-bold text-slate-800">{amountLabel}</label>
                  <Help content={amountHelp} href={state.mode === "exclusive_to_inclusive" ? "#huong-dan-mode-a" : "#huong-dan-mode-b"} label={`Giải thích ${amountLabel}`} />
                </div>
                <div className="relative">
                  <input ref={amountRef} id="vat-amount" name="amount" inputMode="numeric" autoComplete="off" value={draft.amount} onChange={(event) => dispatch({ type: "edit", field: "amount", value: event.target.value })} onBlur={formatAmountOnBlur} aria-invalid={errorsByField.amount.length > 0} aria-describedby={errorsByField.amount.length ? "vat-amount-error" : "vat-amount-help"} className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 pr-12 text-base font-semibold text-slate-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 aria-[invalid=true]:border-red-600" placeholder="Ví dụ: 10.000.000" />
                  <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-4 flex items-center font-bold text-slate-500">₫</span>
                </div>
                <p id="vat-amount-help" className="mt-1.5 text-xs leading-5 text-slate-500">Nhập số VND nguyên đồng; có thể dùng dấu chấm hoặc khoảng trắng.</p>
                {errorsByField.amount.map((error) => <p id="vat-amount-error" role="alert" key={error.code} className="mt-1.5 text-sm font-semibold text-red-700">{error.message}</p>)}
              </div>

              <div>
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="vat-status" className="text-sm font-bold text-slate-800">Thuế suất / trạng thái</label>
                  <Help content="Công cụ không tự phân loại; hãy đối chiếu chứng từ và quy định." href="#can-cu-vat" label="Giải thích cách chọn thuế suất" />
                </div>
                <select ref={statusRef} id="vat-status" value={draft.vatStatus} onChange={(event) => dispatch({ type: "edit", field: "vatStatus", value: event.target.value })} aria-invalid={errorsByField.vat_status.length > 0} aria-describedby={errorsByField.vat_status.length ? "vat-status-error" : undefined} className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 aria-[invalid=true]:border-red-600">
                  <option value="">Chọn mức / trạng thái</option>
                  {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                {errorsByField.vat_status.map((error) => <p id="vat-status-error" role="alert" key={error.code} className="mt-1.5 text-sm font-semibold text-red-700">{error.message}</p>)}
                {draft.vatStatus === "rate_0" && <p className="mt-2 text-xs leading-5 text-slate-600">Thuế suất 0% là một mức thuế suất; không đồng nghĩa không chịu thuế.</p>}
                {draft.vatStatus === "non_taxable" && <p className="mt-2 text-xs leading-5 text-slate-600">Không chịu thuế là trạng thái pháp lý khác thuế suất 0%.</p>}
              </div>

              <div>
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="vat-date" className="text-sm font-bold text-slate-800">Ngày áp dụng</label>
                  <Help content="Ngày được dùng để xác định chính sách thuế áp dụng cho phép tính. Mặc định là hôm nay." href="#can-cu-vat" label="Giải thích ngày áp dụng" />
                </div>
                <input ref={dateRef} id="vat-date" type="date" value={draft.calculationDate} onChange={(event) => dispatch({ type: "edit", field: "calculationDate", value: event.target.value })} aria-invalid={errorsByField.calculation_date.length > 0} aria-describedby={errorsByField.calculation_date.length ? "vat-date-error" : "vat-date-help"} className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 aria-[invalid=true]:border-red-600" />
                <p id="vat-date-help" className="mt-1.5 text-xs leading-5 text-slate-500">Dùng để kiểm tra hiệu lực của chính sách theo thời gian.</p>
                {errorsByField.calculation_date.map((error) => <p id="vat-date-error" role="alert" key={error.code} className="mt-1.5 text-sm font-semibold text-red-700">{error.message}</p>)}
              </div>

              {draft.vatStatus === "temporary_rate_8" && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm leading-6 text-amber-950">
                  <input ref={eligibilityRef} type="checkbox" checked={draft.reductionEligibilityConfirmed} onChange={(event) => dispatch({ type: "edit", field: "reductionEligibilityConfirmed", value: event.target.checked })} aria-invalid={errorsByField.eligibility.length > 0} aria-describedby={errorsByField.eligibility.length ? "vat-eligibility-error" : "vat-eligibility-help"} className="mt-1 size-5 shrink-0 accent-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600" />
                  <span>Tôi xác nhận đã tự kiểm tra hàng hóa/dịch vụ và điều kiện áp dụng mức 8% theo quy định hiện hành.</span>
                </label>
                <p id="vat-eligibility-help" className="mt-2 text-xs leading-5 text-amber-900">Chính sách có thời hạn; công cụ không xác nhận bạn thuộc đối tượng được áp dụng.</p>
                {errorsByField.eligibility.map((error) => <p id="vat-eligibility-error" role="alert" key={error.code} className="mt-1.5 text-sm font-semibold text-red-700">{error.message}</p>)}
              </div>}

              <button type="submit" className="min-h-12 w-full rounded-xl bg-emerald-800 px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 active:translate-y-px motion-reduce:transition-none">Tính thuế GTGT</button>
            </div>
          </form>

          <div className="min-w-0" aria-live="polite" aria-atomic="true">
            {state.status === "calculated" && state.result ? <VatResultCard ref={resultRef} result={state.result} /> : <ResultPlaceholder status={state.status} />}
          </div>
        </div>
      </section>
    </TooltipProvider>
  );
}

export function ResultPlaceholder({ status }: { status: VatUiStatus }) {
  const isError = status === "unexpected_error";
  const isBlocked = status === "policy_blocked";
  return (
    <section className={`flex min-h-72 flex-col justify-center rounded-3xl border p-6 sm:p-7 ${isError || isBlocked ? "border-amber-200 bg-amber-50 text-amber-950" : "border-emerald-800/10 bg-emerald-950 text-white"}`}>
      {isError || isBlocked ? <FiAlertTriangle aria-hidden="true" className="size-7" /> : <FiCheckCircle aria-hidden="true" className="size-7 text-lime-300" />}
      <h2 className="mt-4 text-xl font-extrabold">{isBlocked ? "Chính sách này cần được cập nhật trước khi tiếp tục tính" : isError ? "Không thể tính lúc này" : "Kết quả sẽ hiện tại đây"}</h2>
      <p className={`mt-2 leading-7 ${isError || isBlocked ? "text-amber-900" : "text-emerald-100"}`}>{isBlocked ? "Vui lòng kiểm tra ngày áp dụng và điều kiện của mức 8%. Không có kết quả và công cụ không tự đổi sang mức 10%." : isError ? "Dữ liệu bạn nhập vẫn được giữ lại. Vui lòng thử lại." : status === "editing" ? "Thông tin đã thay đổi. Hãy tính lại để nhận kết quả mới." : "Nhập số tiền, chọn thuế suất rồi nhấn “Tính thuế GTGT”."}</p>
    </section>
  );
}

export const VatResultCard = forwardRef<HTMLElement, { result: VatCalculationResult }>(function VatResultCard({ result }, ref) {
  const prominent = result.mode === "exclusive_to_inclusive" ? result.displayed.amountIncludingVat : result.displayed.amountExcludingVat;
  const prominentLabel = result.mode === "exclusive_to_inclusive" ? "Tổng thanh toán" : "Giá trước VAT";
  const statusLabel = STATUS_LABELS[result.vatStatus as VisibleVatStatus] ?? result.vatStatus;
  const sourceIds = new Set(result.ruleIds.flatMap((ruleId) => VAT_POLICY.sources.filter((source) => source.ruleIds.includes(ruleId)).map((source) => source.id)));
  const sources = VAT_POLICY.sources.filter((source) => sourceIds.has(source.id));
  const generalFormula = result.mode === "exclusive_to_inclusive"
    ? "VAT = Giá chưa VAT × thuế suất; Tổng = Giá chưa VAT + VAT"
    : "Giá trước VAT = Tổng đã VAT ÷ (1 + thuế suất); VAT = Tổng − Giá trước VAT";

  return (
    <article ref={ref} tabIndex={-1} aria-labelledby="vat-result-title" className="min-w-0 rounded-3xl bg-emerald-950 p-5 text-white shadow-[0_22px_55px_-35px_rgba(6,78,59,.7)] outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 sm:p-7">
      <p className="text-xs font-bold uppercase tracking-[.13em] text-lime-300">Kết quả tham khảo</p>
      <h2 id="vat-result-title" className="mt-2 text-xl font-extrabold">{prominentLabel}</h2>
      <p aria-label={`${prominentLabel}: ${formatVnd(prominent)}`} className="mt-3 break-words text-3xl font-black tracking-[-.04em] text-white sm:text-4xl">{formatVnd(prominent)}</p>
      <p className="mt-3 inline-flex rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-emerald-50">{statusLabel}</p>

      <dl className="mt-6 grid gap-3 rounded-2xl bg-white/7 p-4 text-sm sm:grid-cols-3">
        <div><dt className="text-emerald-200">Giá chưa VAT</dt><dd className="mt-1 break-words font-extrabold">{formatVnd(result.displayed.amountExcludingVat)}</dd></div>
        <div><dt className="text-emerald-200">Tiền VAT</dt><dd className="mt-1 break-words font-extrabold">{formatVnd(result.displayed.vatAmount)}</dd></div>
        <div><dt className="text-emerald-200">Tổng thanh toán</dt><dd className="mt-1 break-words font-extrabold">{formatVnd(result.displayed.amountIncludingVat)}</dd></div>
      </dl>

      {result.comparisonAtTenPercent && <div className="mt-4 rounded-2xl border border-lime-300/20 bg-lime-300/10 p-4 text-sm leading-6"><strong>Chênh lệch so với mức 10%:</strong> {formatVnd(result.comparisonAtTenPercent.vatDifference)}. Đây không phải khẳng định bạn chắc chắn được giảm.</div>}
      {result.warnings.map((warning) => <p key={warning} className="mt-4 text-sm leading-6 text-amber-100">⚠ {warning}</p>)}

      <section className="mt-7 border-t border-white/15 pt-6" aria-labelledby="vat-formula-title">
        <h3 id="vat-formula-title" className="text-lg font-extrabold">Cách tính</h3>
        <p className="mt-3 break-words rounded-xl bg-black/15 p-3 text-sm leading-6 text-emerald-50">{generalFormula}</p>
        <ol className="mt-3 space-y-2 text-sm leading-6 text-emerald-100">{result.explanationSteps.map((step) => <li key={step.id}>{step.text}</li>)}</ol>
      </section>

      <section id="can-cu-vat" className="mt-7 border-t border-white/15 pt-6" aria-labelledby="vat-sources-title">
        <h3 id="vat-sources-title" className="text-lg font-extrabold">Căn cứ</h3>
        <p className="mt-2 text-sm leading-6 text-emerald-100">Mức/trạng thái đã dùng: <strong className="text-white">{statusLabel}</strong>. Policy {result.policyVersion}, kiểm tra ngày {VAT_POLICY.verifiedAt.split("-").reverse().join("/")}.</p>
        <ul className="mt-3 space-y-4 text-sm">{sources.map((source) => <li key={source.id} className="leading-6"><p className="text-emerald-100">{source.citation} · Hiệu lực từ {source.validFrom.split("-").reverse().join("/")}{source.validTo ? ` đến ${source.validTo.split("-").reverse().join("/")}` : ""}</p><a href={source.officialUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center font-bold text-lime-300 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300">{source.title} — nguồn chính thức</a></li>)}</ul>
      </section>

      <aside className="mt-7 rounded-2xl border border-amber-200/20 bg-amber-100/10 p-4 text-sm leading-6 text-amber-50"><strong>Lưu ý đầy đủ:</strong> Bạn chịu trách nhiệm chọn đúng phương pháp, thuế suất và điều kiện áp dụng theo chứng từ và quy định hiện hành. Trường hợp đặc thù cần đối chiếu văn bản hoặc chuyên gia thuế.</aside>
      <p className="mt-4 text-xs text-emerald-300">Phiên bản tính {result.calculationVersion} · Policy {result.policyVersion}</p>
    </article>
  );
});

/** Hướng dẫn cố định theo SSOT, ví dụ lấy từ fixtures A01/B03. */
export function VatUsageGuide() {
  return (
    <section id="huong-dan-vat" className="mt-14 border-t border-slate-200 pt-10" aria-labelledby="vat-guide-title">
      <p className="text-xs font-bold uppercase tracking-[.12em] text-emerald-700">Dành cho người mới</p>
      <h2 id="vat-guide-title" className="mt-2 text-2xl font-extrabold tracking-[-.025em] text-slate-900">Hướng dẫn sử dụng</h2>
      <ol className="mt-6 grid gap-3 text-sm leading-6 text-slate-700 sm:grid-cols-2">
        {["Chọn “Giá chưa VAT” hoặc “Giá đã gồm VAT”.", "Nhập số tiền bạn đang biết.", "Chọn đúng thuế suất/trạng thái theo chứng từ.", "Nếu chọn 8%, chọn ngày và xác nhận đã kiểm tra điều kiện.", "Nhấn “Tính thuế GTGT”.", "Đọc giá trước VAT, VAT, tổng và cách tính bên dưới."].map((step, index) => <li key={step} className="flex gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-emerald-100 text-xs font-extrabold text-emerald-900">{index + 1}</span><span>{step}</span></li>)}
      </ol>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <article id="huong-dan-mode-a" className="scroll-mt-20 rounded-2xl border border-emerald-200 bg-emerald-50 p-5"><h3 className="font-extrabold text-emerald-950">Ví dụ: Giá chưa VAT</h3><p className="mt-2 text-sm leading-6 text-emerald-900">10.000.000 ₫, thuế suất 10% → VAT 1.000.000 ₫ → tổng thanh toán 11.000.000 ₫.</p></article>
        <article id="huong-dan-mode-b" className="scroll-mt-20 rounded-2xl border border-sky-200 bg-sky-50 p-5"><h3 className="font-extrabold text-sky-950">Ví dụ: Giá đã gồm VAT</h3><p className="mt-2 text-sm leading-6 text-sky-900">10.800.000 ₫ đã gồm 8% → giá trước VAT 10.000.000 ₫ → VAT 800.000 ₫, khi đủ điều kiện áp dụng 8%.</p></article>
      </div>
    </section>
  );
}
