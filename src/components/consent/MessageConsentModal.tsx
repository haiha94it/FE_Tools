"use client";

import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import {
  detectConsentClientPlatform,
  isConsentFullNameValid,
  isConsentPhoneValid,
  validateConsentSignerFields,
} from "@/lib/consent-utils";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { consentService } from "@/services/consent.service";
import { useAuthStore } from "@/stores/use-auth-store";
import { useConsentStore } from "@/stores/use-consent-store";
import type { MessageProcessingTerms } from "@/types/consent";
import { memo, useCallback, useEffect, useState } from "react";
import ConsentSignatureFullscreen from "./ConsentSignatureFullscreen";
import ConsentSignaturePad, {
  type ConsentSignatureValue,
} from "./ConsentSignaturePad";
import ConsentTermsViewer from "./ConsentTermsViewer";

interface MessageConsentModalProps {
  open: boolean;
  mandatory?: boolean;
  onClose?: () => void;
  onSigned?: () => void;
}

/**
 * Overlay ký đồng thuận — chỉ trong vùng trang Tin nhắn (absolute),
 * không portal full-screen → sidebar/menu vẫn bấm được để sang module khác.
 */
function MessageConsentModal({
  open,
  mandatory = true,
  onClose,
  onSigned,
}: MessageConsentModalProps) {
  const applySignedStatus = useConsentStore((s) => s.applySignedStatus);
  const authUser = useAuthStore((s) => s.user);

  const [terms, setTerms] = useState<MessageProcessingTerms | null>(null);
  const [loadingTerms, setLoadingTerms] = useState(false);
  const [termsError, setTermsError] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandOpen, setExpandOpen] = useState(false);
  const [signature, setSignature] = useState<ConsentSignatureValue>({
    hasSignature: false,
    dataUrl: null,
    strokeCount: 0,
    width: 0,
    height: 0,
  });
  const [importedPreview, setImportedPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setAgreed(false);
    setError(null);
    setTermsError(null);
    setExpandOpen(false);
    setImportedPreview(null);
    setSignature({
      hasSignature: false,
      dataUrl: null,
      strokeCount: 0,
      width: 0,
      height: 0,
    });
    setFullName((authUser?.name || "").trim());
    setPhone((authUser?.phone || "").trim());

    let cancelled = false;
    setLoadingTerms(true);
    void (async () => {
      try {
        const data = await consentService.getTerms();
        if (!cancelled) {
          setTerms(data);
          setTermsError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setTerms(null);
          setTermsError(getApiErrorMessage(err));
        }
      } finally {
        if (!cancelled) setLoadingTerms(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, authUser?.name, authUser?.phone]);

  const handleSignatureChange = useCallback((value: ConsentSignatureValue) => {
    setSignature(value);
    if (value.hasSignature) {
      setImportedPreview(null);
    }
  }, []);

  const handleExpandConfirm = useCallback((value: ConsentSignatureValue) => {
    setSignature(value);
    setImportedPreview(value.dataUrl);
  }, []);

  const nameOk = isConsentFullNameValid(fullName);
  const phoneOk = isConsentPhoneValid(phone);
  const signatureOk =
    signature.hasSignature &&
    signature.strokeCount >= 1 &&
    Boolean(signature.dataUrl);

  const canSubmit =
    agreed &&
    nameOk &&
    phoneOk &&
    signatureOk &&
    !submitting &&
    !loadingTerms;

  const handleSubmit = async () => {
    const fieldError = validateConsentSignerFields(fullName, phone);
    if (fieldError) {
      setError(fieldError);
      return;
    }
    if (!signatureOk || !signature.dataUrl) {
      setError("Vui lòng ký tên trước khi xác nhận");
      return;
    }
    if (!agreed) {
      setError("Vui lòng xác nhận đã đọc và đồng ý điều khoản");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const result = await consentService.sign({
        full_name: fullName.trim(),
        phone: phone.trim(),
        signature: {
          format: "png",
          image_base64: signature.dataUrl,
          width: signature.width || 600,
          height: signature.height || 200,
          stroke_count: signature.strokeCount,
        },
        client_platform: detectConsentClientPlatform(),
      });

      if (result.status) {
        applySignedStatus(result.status);
      } else {
        applySignedStatus({
          system_activated: true,
          user_signed: true,
          need_sign: false,
          can_use_chat: true,
          signed_at: result.signed_at,
        });
      }

      toast.success("Đã ghi nhận đồng thuận xử lý tin nhắn Zalo");
      onSigned?.();
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

  return (
    <>
      {/* Chỉ phủ vùng messenger (parent relative) — không fixed/portal body */}
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
          <div className="shrink-0 border-b border-gray-100 px-4 py-3 dark:border-gray-800 sm:px-5 sm:py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2
                  id="message-consent-title"
                  className="text-base font-semibold text-gray-900 dark:text-white"
                >
                  {terms?.title || "Đồng thuận xử lý tin nhắn Zalo"}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                  Đọc điều khoản, nhập họ tên + SĐT, ký xác nhận để dùng tin nhắn.
                  Bạn vẫn có thể chọn menu bên trái để làm việc khác nếu chưa ký.
                </p>
              </div>
              {!mandatory ? (
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700 dark:hover:text-white"
                  aria-label="Đóng"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      d="M6.04 16.54a1 1 0 0 0 1.42 1.42L12 13.41l4.54 4.54a1 1 0 0 0 1.42-1.42L13.41 12l4.55-4.54a1 1 0 0 0-1.42-1.42L12 10.59 7.46 6.04a1 1 0 0 0-1.42 1.42L10.59 12l-4.55 4.54Z"
                      fill="currentColor"
                    />
                  </svg>
                </button>
              ) : null}
            </div>
          </div>

          <div className="custom-scrollbar min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 py-4 sm:px-5">
            {loadingTerms ? (
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
              />
            )}

            <div className="mt-5 space-y-4">
              <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-700 dark:bg-white/[0.03]">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Bên B — Thông tin người ký *
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label htmlFor="consent-full-name">
                      Họ tên đầy đủ <span className="text-error-500">*</span>
                    </Label>
                    <Input
                      id="consent-full-name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      disabled={submitting || loadingTerms}
                      autoComplete="name"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="consent-phone">
                      Số điện thoại <span className="text-error-500">*</span>
                    </Label>
                    <Input
                      id="consent-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder=""
                      disabled={submitting || loadingTerms}
                      autoComplete="tel"
                    />
                  </div>
                </div>
              </div>

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
                        setSignature({
                          hasSignature: false,
                          dataUrl: null,
                          strokeCount: 0,
                          width: 0,
                          height: 0,
                        });
                      }}
                    >
                      Ký lại
                    </button>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={importedPreview}
                    alt="Chữ ký"
                    className="h-28 w-full object-contain bg-white"
                  />
                </div>
              ) : (
                <ConsentSignaturePad
                  onChange={handleSignatureChange}
                  disabled={submitting || loadingTerms}
                  heightClassName="h-40 sm:h-48"
                  onRequestExpand={() => setExpandOpen(true)}
                />
              )}

              <div className="rounded-xl border border-[#86aff3] bg-[#d0e1fd] p-4 text-gray-800 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-gray-200">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={agreed}
                    onChange={setAgreed}
                    disabled={submitting}
                  />
                  <p className="min-w-0 flex-1 text-sm leading-6">
                    Tôi đã đọc và đồng ý với điều khoản trên
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="shrink-0 border-t border-gray-100 px-4 py-3 dark:border-gray-800 sm:px-5 sm:py-4">
            {error ? (
              <p className="mb-3 rounded-lg bg-error-50 px-3 py-2 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
                {error}
              </p>
            ) : null}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
              {!mandatory ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={submitting}
                  onClick={handleClose}
                >
                  Đóng
                </Button>
              ) : null}
              <Button
                type="button"
                size="sm"
                disabled={!canSubmit}
                onClick={() => void handleSubmit()}
              >
                {submitting ? "Đang xác nhận..." : "Ký và đồng ý"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {expandOpen ? (
        <ConsentSignatureFullscreen
          key="consent-pad-expand"
          open
          disabled={submitting}
          onClose={() => setExpandOpen(false)}
          onConfirm={handleExpandConfirm}
        />
      ) : null}
    </>
  );
}

export default memo(MessageConsentModal);
