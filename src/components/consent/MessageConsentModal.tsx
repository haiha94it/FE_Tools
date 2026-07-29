"use client";

import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import {
  buildConsentAgreementPayload,
  resolveConsentFormDefaults,
  validateConsentAgreementForm,
} from "@/lib/consent-utils";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { ChatIcon, CheckCircleIcon, LockIcon } from "@/icons";
import { consentService } from "@/services/consent.service";
import { useAuthStore } from "@/stores/use-auth-store";
import { useConsentStore } from "@/stores/use-consent-store";
import type {
  ConsentEntityType,
  MessageProcessingTerms,
} from "@/types/consent";
import { CONSENT_CONFIRM_SYNC_TEXT } from "@/types/consent";
import { useRouter } from "next/navigation";
import { memo, useCallback, useEffect, useState } from "react";
import ConsentSignatureFullscreen from "./ConsentSignatureFullscreen";
import ConsentSignaturePad, {
  type ConsentSignatureValue,
} from "./ConsentSignaturePad";
import ConsentTermsViewer from "./ConsentTermsViewer";

type WizardStep = "agree" | "terms" | "form";

interface MessageConsentModalProps {
  open: boolean;
  /** false = có thể đóng (vd. rejected bấm ký lại) */
  mandatory?: boolean;
  onClose?: () => void;
  onSubmitted?: () => void;
}

const emptySignature = (): ConsentSignatureValue => ({
  hasSignature: false,
  dataUrl: null,
  strokeCount: 0,
  width: 0,
  height: 0,
});

/**
 * Wizard: Đồng ý → HĐ → Form + chữ ký → POST sign/ → pending.
 * Không OTP.
 */
function MessageConsentModal({
  open,
  mandatory = true,
  onClose,
  onSubmitted,
}: MessageConsentModalProps) {
  const router = useRouter();
  const applyStatus = useConsentStore((s) => s.applyStatus);
  const consentStatus = useConsentStore((s) => s.status);
  const authUser = useAuthStore((s) => s.user);

  const [step, setStep] = useState<WizardStep>("agree");
  const [terms, setTerms] = useState<MessageProcessingTerms | null>(null);
  const [loadingTerms, setLoadingTerms] = useState(false);
  const [termsError, setTermsError] = useState<string | null>(null);

  const [entityType, setEntityType] = useState<ConsentEntityType>("personal");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [taxCode, setTaxCode] = useState("");
  const [representativeName, setRepresentativeName] = useState("");
  const [representativeTitle, setRepresentativeTitle] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");

  const [signature, setSignature] = useState<ConsentSignatureValue>(emptySignature);
  const [importedPreview, setImportedPreview] = useState<string | null>(null);
  const [expandOpen, setExpandOpen] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  /** Step agree: tick trước khi vào xem HĐ */
  const [agreeChecked, setAgreeChecked] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  const applyFormDefaults = useCallback(() => {
    const defaults = resolveConsentFormDefaults(consentStatus, authUser);
    setEntityType("personal");
    setFullName(defaults.fullName);
    setEmail(defaults.email);
    setPhone(defaults.phone);
    setAddress("");
    setCompanyName("");
    setTaxCode("");
    setRepresentativeName("");
    setRepresentativeTitle("");
    setCompanyAddress("");
    setCompanyPhone("");
    setCompanyEmail("");
    setSignature(emptySignature());
    setImportedPreview(null);
    setError(null);
    setAgreeChecked(false);
    setAcceptedTerms(false);
    setExpandOpen(false);
    setPreviewLoading(false);
    setPreviewHtml(null);
    setPreviewModalOpen(false);
  }, [consentStatus, authUser]);

  useEffect(() => {
    if (!open) return;
    setStep("agree");
    applyFormDefaults();
    setTerms(null);
    setTermsError(null);
  }, [open, applyFormDefaults]);

  const loadTerms = useCallback(async () => {
    setLoadingTerms(true);
    setTermsError(null);
    try {
      const data = await consentService.getTerms();
      setTerms(data);
    } catch (err) {
      setTerms(null);
      setTermsError(getApiErrorMessage(err));
    } finally {
      setLoadingTerms(false);
    }
  }, []);

  const handleDisagree = () => {
    onClose?.();
    router.replace("/");
  };

  const handleAgree = () => {
    setStep("terms");
    void loadTerms();
  };

  const handleBackFromTerms = () => {
    applyFormDefaults();
    setStep("agree");
  };

  const handleSignatureChange = useCallback((value: ConsentSignatureValue) => {
    setSignature(value);
    if (value.hasSignature) setImportedPreview(null);
  }, []);

  const handleExpandConfirm = useCallback((value: ConsentSignatureValue) => {
    setSignature(value);
    setImportedPreview(value.dataUrl);
  }, []);

  const signatureOk =
    signature.hasSignature &&
    signature.strokeCount >= 1 &&
    Boolean(signature.dataUrl);

  const handlePreview = async () => {
    const fieldError = validateConsentAgreementForm({
      fullName,
      email,
      phone,
      address,
      entityType,
      companyName,
      taxCode,
      representativeName,
      representativeTitle,
      companyAddress,
      companyPhone,
      companyEmail,
    });
    if (fieldError) {
      setError(fieldError);
      return;
    }

    setPreviewLoading(true);
    setError(null);
    try {
      const response = await consentService.preview({
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        entity_type: entityType,
        company_name: entityType === "business" ? companyName.trim() : undefined,
        tax_code: entityType === "business" ? taxCode.trim() : undefined,
        representative_title: entityType === "business" ? representativeTitle.trim() : undefined,
        client_platform: "web_desktop",
      });
      if (response && response.body_html) {
        setPreviewHtml(response.body_html);
        setPreviewModalOpen(true);
      } else {
        toast.error("Không nhận được nội dung xem trước.");
      }
    } catch (err) {
      const message = getApiErrorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSubmit = async () => {
    const fieldError = validateConsentAgreementForm({
      fullName,
      email,
      phone,
      address,
      entityType,
      companyName,
      taxCode,
      representativeName,
      representativeTitle,
      companyAddress,
      companyPhone,
      companyEmail,
    });
    if (fieldError) {
      setError(fieldError);
      return;
    }
    if (!signatureOk || !signature.dataUrl) {
      setError("Vui lòng ký tên trước khi xác nhận");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const result = await consentService.sign(
        buildConsentAgreementPayload({
          fullName,
          email,
          phone,
          address,
          entityType,
          companyName,
          taxCode,
          representativeName,
          representativeTitle,
          companyAddress,
          companyPhone,
          companyEmail,
          signature: {
            dataUrl: signature.dataUrl,
            width: signature.width,
            height: signature.height,
            strokeCount: signature.strokeCount,
          },
        }),
      );
      if (result.status) {
        applyStatus(result.status);
      }
      toast.success(
        result.message?.trim() || "Hồ sơ đang chờ duyệt.",
      );
      onSubmitted?.();
      onClose?.();
    } catch (err) {
      const message = getApiErrorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (mandatory) return;
    onClose?.();
  };

  if (!open) return null;

  const stepTitle =
    step === "agree"
      ? null
      : step === "terms"
        ? terms?.title || "Điều khoản thỏa thuận"
        : "Thông tin & chữ ký";

  const stepSubtitle =
    step === "agree"
      ? null
      : step === "terms"
        ? "Đọc kỹ điều khoản trước khi tiếp tục."
        : "Điền thông tin, ký tay rồi bấm Ký và xác nhận. Hồ sơ sẽ chờ admin duyệt.";

  return (
    <>
      <div
        className="absolute inset-0 z-30 flex items-stretch justify-center overflow-hidden rounded-2xl p-2 sm:p-3 md:p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="message-consent-title"
      >
        <div
          className="absolute inset-0 rounded-2xl bg-gray-900/40 backdrop-blur-[1px] dark:bg-black/45"
          aria-hidden
        />

        <div className="relative z-10 flex min-h-0 w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xl dark:border-gray-800 dark:bg-gray-900">
          {stepTitle || stepSubtitle || !mandatory ? (
            <div className="shrink-0 border-b border-gray-100 px-4 py-3 dark:border-gray-800 sm:px-5 sm:py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {stepTitle ? (
                    <h2
                      id="message-consent-title"
                      className="text-base font-semibold text-gray-900 dark:text-white"
                    >
                      {stepTitle}
                    </h2>
                  ) : (
                    <h2 id="message-consent-title" className="sr-only">
                      Xác nhận đồng bộ tin nhắn
                    </h2>
                  )}
                  {stepSubtitle ? (
                    <p
                      className={`text-sm leading-relaxed text-gray-500 dark:text-gray-400 ${stepTitle ? "mt-1" : ""}`}
                    >
                      {stepSubtitle}
                    </p>
                  ) : null}
                </div>
                {!mandatory ? (
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700 dark:hover:text-white"
                    aria-label="Đóng"
                  >
                    ✕
                  </button>
                ) : null}
              </div>
            </div>
          ) : (
            <h2 id="message-consent-title" className="sr-only">
              Xác nhận đồng bộ tin nhắn
            </h2>
          )}

          {step === "form" ? (
            <div className="shrink-0 border-b border-gray-100 bg-gray-50/50 px-4 py-3 dark:border-gray-800 dark:bg-white/[0.01] sm:px-5">
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["personal", "Cá nhân"],
                    ["business", "HKD / Công ty"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    disabled={submitting}
                    onClick={() => setEntityType(value)}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${entityType === value
                      ? "border-brand-300 bg-brand-50 text-brand-700 dark:border-brand-500/40 dark:bg-brand-500/15 dark:text-brand-200"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
                      }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="custom-scrollbar min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 py-4 sm:px-5">
            {step === "agree" ? (
              <div className="flex flex-col gap-5 py-1 sm:py-2">
                {/* Hero */}
                <div className="relative overflow-hidden rounded-2xl border border-brand-200/70 bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 p-5 text-white shadow-theme-md sm:p-6 dark:border-brand-500/25">
                  <div
                    className="pointer-events-none absolute -right-10 -top-10 size-36 rounded-full bg-white/10"
                    aria-hidden
                  />
                  <div
                    className="pointer-events-none absolute -bottom-12 -left-8 size-32 rounded-full bg-white/5"
                    aria-hidden
                  />
                  <div className="relative flex items-start gap-3.5 sm:gap-4">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white shadow-theme-xs ring-1 ring-white/25">
                      <ChatIcon className="size-6" />
                    </span>
                    <div className="min-w-0">
                      <span className="inline-flex items-center rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white/90 ring-1 ring-white/20">
                        Bước 1 / 3 · Xác nhận
                      </span>
                      <p className="mt-2 text-sm leading-relaxed text-white/90">
                        Hệ thống cần bạn xác nhận trước khi mở trang hợp đồng và
                        ký tay. Chỉ vài bước — bạn dùng chat bình thường.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progress */}
                <ol className="grid grid-cols-3 gap-2 sm:gap-3">
                  {(
                    [
                      { n: 1, label: "Xác nhận", active: true },
                      { n: 2, label: "Hợp đồng", active: false },
                      { n: 3, label: "Ký & gửi", active: false },
                    ] as const
                  ).map((item) => (
                    <li
                      key={item.n}
                      className={`rounded-xl border px-2 py-2.5 text-center sm:px-3 sm:py-3 ${
                        item.active
                          ? "border-brand-300 bg-brand-50 shadow-theme-xs dark:border-brand-500/40 dark:bg-brand-500/15"
                          : "border-gray-200 bg-gray-50/80 dark:border-gray-800 dark:bg-white/[0.02]"
                      }`}
                    >
                      <span
                        className={`mx-auto flex size-7 items-center justify-center rounded-full text-xs font-bold ${
                          item.active
                            ? "bg-brand-500 text-white"
                            : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                        }`}
                      >
                        {item.n}
                      </span>
                      <p
                        className={`mt-1.5 text-[11px] font-semibold sm:text-xs ${
                          item.active
                            ? "text-brand-700 dark:text-brand-200"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {item.label}
                      </p>
                    </li>
                  ))}
                </ol>

                {/* Checkbox commit */}
                <div
                  className={`rounded-2xl border-2 p-4 transition sm:p-5 ${
                    agreeChecked
                      ? "border-brand-500 bg-brand-50/50 shadow-theme-xs dark:border-brand-500/50 dark:bg-brand-500/10"
                      : "border-dashed border-gray-300 bg-gray-50/60 hover:border-brand-300 hover:bg-brand-50/20 dark:border-gray-700 dark:bg-white/[0.02] dark:hover:border-brand-500/40"
                  }`}
                >
                  <div className="mb-3 flex items-center gap-2">
                    <span
                      className={`flex size-8 items-center justify-center rounded-lg ${
                        agreeChecked
                          ? "bg-brand-500 text-white"
                          : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                      }`}
                    >
                      <LockIcon className="size-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        Xác nhận của bạn
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Bắt buộc tick để mở trang xem hợp đồng
                      </p>
                    </div>
                  </div>
                  <label className="flex cursor-pointer select-none items-start gap-3 text-sm leading-relaxed text-gray-800 dark:text-gray-100">
                    <input
                      type="checkbox"
                      id="consent-agree-sync-checkbox"
                      checked={agreeChecked}
                      onChange={(e) => setAgreeChecked(e.target.checked)}
                      className="mt-0.5 size-5 shrink-0 cursor-pointer rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span>{CONSENT_CONFIRM_SYNC_TEXT}</span>
                  </label>
                  {!agreeChecked ? (
                    <p className="mt-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                      Tick ô trên → nút{" "}
                      <span className="text-brand-600 dark:text-brand-400">
                        Chuyển đến xem hợp đồng
                      </span>{" "}
                      sẽ được bật.
                    </p>
                  ) : (
                    <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-success-600 dark:text-success-400">
                      <CheckCircleIcon className="size-4 shrink-0" />
                      Đã xác nhận — bạn có thể tiếp tục.
                    </p>
                  )}
                </div>
              </div>
            ) : null}

            {step === "terms" ? (
              loadingTerms ? (
                <div className="flex justify-center py-16">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                </div>
              ) : termsError ? (
                <p className="rounded-lg bg-error-50 px-3 py-2 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
                  {termsError}
                </p>
              ) : (
                <ConsentTermsViewer
                  bodyHtml={terms?.body_html}
                  hasBodyHtml={terms?.has_body_html}
                  contractPdfUrl={terms?.contract_pdf_url}
                  hasContractPdf={terms?.has_contract_pdf}
                  displayMode={terms?.display_mode}
                  companyName={terms?.company_name}
                  companyTaxCode={terms?.company_tax_code}
                  companyAddress={terms?.company_address}
                  companySignatureUrl={terms?.company_signature_url}
                  checked={acceptedTerms}
                  onChange={setAcceptedTerms}
                  isEditableCheckbox={true}
                />
              )
            ) : null}

            {step === "form" ? (
              <div className="space-y-4">
                {entityType === "personal" ? (
                  <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-700 dark:bg-white/[0.03]">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Thông tin liên hệ (Cá nhân) *
                    </p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <Label htmlFor="consent-full-name">
                          Họ tên cá nhân <span className="text-error-500">*</span>
                        </Label>
                        <Input
                          id="consent-full-name"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          disabled={submitting}
                          autoComplete="name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="consent-email">
                          Email <span className="text-error-500">*</span>
                        </Label>
                        <Input
                          id="consent-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={submitting}
                          autoComplete="email"
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Điền sẵn từ tài khoản — bạn có thể sửa.
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="consent-phone">
                          Số điện thoại <span className="text-error-500">*</span>
                        </Label>
                        <Input
                          id="consent-phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          disabled={submitting}
                          autoComplete="tel"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Label htmlFor="consent-address">
                          Địa chỉ <span className="text-error-500">*</span>
                        </Label>
                        <Input
                          id="consent-address"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          disabled={submitting}
                          autoComplete="street-address"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-700 dark:bg-white/[0.03]">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Thông tin HKD / Công ty & Người đại diện *
                    </p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <Label htmlFor="consent-company-name">
                          Tên công ty / HKD <span className="text-error-500">*</span>
                        </Label>
                        <Input
                          id="consent-company-name"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          disabled={submitting}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Label htmlFor="consent-rep-name">
                          Họ tên Người đại diện <span className="text-error-500">*</span>
                        </Label>
                        <Input
                          id="consent-rep-name"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          disabled={submitting}
                        />
                      </div>
                      <div>
                        <Label htmlFor="consent-tax">
                          Mã số thuế <span className="text-error-500">*</span>
                        </Label>
                        <Input
                          id="consent-tax"
                          value={taxCode}
                          onChange={(e) => setTaxCode(e.target.value)}
                          disabled={submitting}
                        />
                      </div>
                      <div>
                        <Label htmlFor="consent-rep-title">
                          Chức vụ người đại diện
                        </Label>
                        <Input
                          id="consent-rep-title"
                          value={representativeTitle}
                          onChange={(e) =>
                            setRepresentativeTitle(e.target.value)
                          }
                          disabled={submitting}
                        />
                      </div>
                      <div>
                        <Label htmlFor="consent-phone">
                          Số điện thoại liên hệ <span className="text-error-500">*</span>
                        </Label>
                        <Input
                          id="consent-phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          disabled={submitting}
                          autoComplete="tel"
                        />
                      </div>
                      <div>
                        <Label htmlFor="consent-email">
                          Email liên hệ <span className="text-error-500">*</span>
                        </Label>
                        <Input
                          id="consent-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={submitting}
                          autoComplete="email"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Label htmlFor="consent-address">
                          Địa chỉ công ty / HKD <span className="text-error-500">*</span>
                        </Label>
                        <Input
                          id="consent-address"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          disabled={submitting}
                          autoComplete="street-address"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {importedPreview ? (
                  <div className="rounded-xl border border-brand-200 bg-brand-50/40 p-3 dark:border-brand-500/30 dark:bg-brand-500/5">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-xs font-medium text-brand-700 dark:text-brand-300">
                        Chữ ký tay *
                      </p>
                      <button
                        type="button"
                        className="text-xs text-brand-600 hover:underline dark:text-brand-400"
                        onClick={() => {
                          setImportedPreview(null);
                          setSignature(emptySignature());
                        }}
                      >
                        Ký lại
                      </button>
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={importedPreview}
                      alt="Chữ ký"
                      className="h-28 w-full bg-white object-contain"
                    />
                  </div>
                ) : (
                  <ConsentSignaturePad
                    onChange={handleSignatureChange}
                    disabled={submitting}
                    heightClassName="h-40 sm:h-48"
                    onRequestExpand={() => setExpandOpen(true)}
                  />
                )}
              </div>
            ) : null}
          </div>

          <div className="shrink-0 border-t border-gray-100 px-4 py-3 dark:border-gray-800 sm:px-5 sm:py-4">
            {error ? (
              <p className="mb-3 rounded-lg bg-error-50 px-3 py-2 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
                {error}
              </p>
            ) : null}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
              {step === "agree" ? (
                <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                    disabled={submitting}
                    onClick={handleDisagree}
                  >
                    Không đồng ý
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="w-full sm:w-auto sm:min-w-[220px]"
                    disabled={submitting || !agreeChecked}
                    onClick={handleAgree}
                  >
                    Chuyển đến xem hợp đồng
                  </Button>
                </div>
              ) : null}

              {step === "terms" ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={submitting || loadingTerms}
                    onClick={handleBackFromTerms}
                  >
                    Quay lại
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={submitting || loadingTerms || Boolean(termsError) || !acceptedTerms}
                    onClick={() => setStep("form")}
                  >
                    Tiếp tục
                  </Button>
                </>
              ) : null}

              {step === "form" ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={submitting || previewLoading}
                    onClick={() => {
                      setError(null);
                      setStep("terms");
                    }}
                  >
                    Quay lại
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={submitting || previewLoading}
                    onClick={() => void handlePreview()}
                  >
                    {previewLoading ? "Đang tải..." : "Xem trước hợp đồng"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={submitting || previewLoading || !signatureOk}
                    onClick={() => void handleSubmit()}
                  >
                    {submitting ? "Đang gửi..." : "Ký và xác nhận"}
                  </Button>
                </>
              ) : null}
            </div>
          </div>
        </div >
      </div >

      {
        expandOpen ? (
          <ConsentSignatureFullscreen
            key="consent-pad-expand"
            open
            disabled={submitting}
            onClose={() => setExpandOpen(false)
            }
            onConfirm={handleExpandConfirm}
          />
        ) : null}

      {previewModalOpen ? (
        <Modal
          isOpen={previewModalOpen}
          onClose={() => setPreviewModalOpen(false)}
          layer="top"
          className="max-w-4xl p-6 sm:p-8"
        >
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Xem trước văn bản hợp đồng
          </h3>
          <div className="custom-scrollbar max-h-[60vh] overflow-y-auto rounded-xl border border-gray-200 p-4 dark:border-gray-800 bg-white dark:bg-gray-950">
            {previewHtml ? (
              // Chưa ký: 2 ô trống; sau ký admin/PDF dùng ✓ / [x]
              <ConsentTermsViewer
                bodyHtml={previewHtml}
                hasBodyHtml
                companyName={terms?.company_name}
                companyTaxCode={terms?.company_tax_code}
                companyAddress={terms?.company_address}
                companySignatureUrl={terms?.company_signature_url}
                userName={fullName.trim() || undefined}
                showPartyBPlaceholder
              />
            ) : (
              <p className="text-gray-500">Nội dung trống</p>
            )}
          </div>
          <div className="mt-6 flex justify-end">
            <Button size="sm" onClick={() => setPreviewModalOpen(false)}>
              Đóng
            </Button>
          </div>
        </Modal>
      ) : null}
    </>
  );
}

export default memo(MessageConsentModal);
