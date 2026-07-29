"use client";

import {
  resolveConsentDisplayMode,
  resolveConsentMediaUrl,
  sanitizeConsentHtml,
} from "@/lib/consent-utils";
import type { ConsentDisplayMode } from "@/types/consent";
import { CONSENT_CONFIRM_TERMS_TEXT } from "@/types/consent";
import { memo, useEffect, useState } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";

interface ConsentTermsViewerProps {
  title?: string;
  bodyHtml?: string | null;
  hasBodyHtml?: boolean;
  contractPdfUrl?: string | null;
  hasContractPdf?: boolean;
  displayMode?: ConsentDisplayMode;
  companyName?: string;
  companyTaxCode?: string;
  companyAddress?: string;
  /** 1 ảnh chữ ký + con dấu (ghép sẵn) */
  companySignatureUrl?: string | null;
  userSignatureUrl?: string | null;
  userName?: string;
  showPartyBPlaceholder?: boolean;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  isEditableCheckbox?: boolean;
  className?: string;
}

function ConsentTermsViewer({
  title,
  bodyHtml,
  hasBodyHtml,
  contractPdfUrl,
  hasContractPdf,
  displayMode,
  companyName,
  companyTaxCode,
  companyAddress,
  companySignatureUrl,
  userSignatureUrl,
  userName,
  showPartyBPlaceholder = false,
  checked = false,
  onChange,
  isEditableCheckbox = false,
  className = "",
}: ConsentTermsViewerProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [sigBFailed, setSigBFailed] = useState(false);
  const mode = resolveConsentDisplayMode({
    display_mode: displayMode,
    has_body_html: hasBodyHtml,
    has_contract_pdf: hasContractPdf,
    body_html: bodyHtml ?? "",
    contract_pdf_url: contractPdfUrl,
  });

  const showPdf = mode === "pdf" || mode === "pdf_and_html";
  const showHtml = mode === "html" || mode === "pdf_and_html";
  const pdfUrl = resolveConsentMediaUrl(contractPdfUrl);
  const sigA = resolveConsentMediaUrl(companySignatureUrl);
  const sigB = resolveConsentMediaUrl(userSignatureUrl);
  const safeHtml = sanitizeConsentHtml(bodyHtml);

  // Đổi URL (vd. media 502 → data_url) phải reset lỗi load
  useEffect(() => {
    setSigBFailed(false);
  }, [sigB]);

  return (
    <div className={`space-y-5 ${className}`.trim()}>
      {title ? (
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
      ) : null}

      {mode === "empty" ? (
        <p className="rounded-lg bg-warning-50 px-3 py-2 text-sm text-warning-700 dark:bg-warning-500/10 dark:text-warning-400">
          Chưa cấu hình điều khoản.
        </p>
      ) : null}

      {showPdf && pdfUrl ? (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              File PDF hợp đồng
            </p>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
            >
              Mở PDF full
            </a>
          </div>
          {isMobile ? (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center rounded-xl border border-brand-200 bg-brand-50 px-4 py-6 text-sm font-medium text-brand-700 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300"
            >
              Mở PDF điều khoản
            </a>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-900">
              <iframe
                src={`${pdfUrl}#toolbar=0&navpanes=0`}
                title="PDF điều khoản"
                className="h-[min(42dvh,380px)] w-full bg-white"
              />
            </div>
          )}
        </div>
      ) : null}

      {showHtml && safeHtml ? (
        <div className="space-y-2">
          {showPdf ? (
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Nội dung văn bản
            </p>
          ) : null}
          <div
            className="dialog-quill text-sm leading-relaxed text-gray-700 dark:text-gray-300"
            dangerouslySetInnerHTML={{ __html: safeHtml }}
          />
        </div>
      ) : null}

      {/* Khối Xác nhận đồng ý Bên B — chỉ dòng đồng ý HĐ */}
      <div className={`mb-4 rounded-xl border p-4 transition ${
        isEditableCheckbox
          ? checked
            ? "border-brand-500 bg-brand-50/30 dark:border-brand-500/40 dark:bg-brand-500/10"
            : "border-brand-200 bg-brand-50/10 hover:bg-brand-50/20 dark:border-brand-500/20 dark:bg-brand-500/5 cursor-pointer"
          : "border-gray-200 bg-gray-50/50 dark:border-gray-800 dark:bg-white/[0.02]"
      }`}>
        <p className="text-xs font-bold uppercase tracking-wide text-gray-900 dark:text-white">
          Xác nhận đồng ý Bên B
        </p>
        {isEditableCheckbox ? (
          <label className="mt-1.5 flex cursor-pointer select-none items-start gap-2.5 text-sm font-normal text-gray-900 dark:text-white">
            <input
              type="checkbox"
              id="accept-terms-internal-checkbox"
              checked={checked}
              onChange={(e) => onChange?.(e.target.checked)}
              className="mt-0.5 size-4 shrink-0 cursor-pointer rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <span>{CONSENT_CONFIRM_TERMS_TEXT}</span>
          </label>
        ) : (
          <p className="mt-1.5 flex items-start gap-2.5 text-sm font-normal text-gray-900 dark:text-white">
            {sigB ? (
              <span className="inline-flex size-4 shrink-0 items-center justify-center rounded border border-brand-500 bg-brand-500 text-[10px] font-bold text-white">
                ✓
              </span>
            ) : (
              <span className="inline-flex size-4 shrink-0 rounded border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800" />
            )}
            <span>{CONSENT_CONFIRM_TERMS_TEXT}</span>
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 rounded-xl border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-700 dark:bg-white/[0.03]">
        {/* Bên A */}
        <div className="flex flex-col justify-between min-h-[140px] text-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Bên A
            </p>
          </div>
          <div className="flex-1 py-6" />
        </div>

        {/* Bên B */}
        <div className="flex flex-col justify-between border-l border-gray-200 pl-4 dark:border-gray-800 min-h-[140px] text-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Bên B
            </p>
          </div>
          <div className="flex-1 flex flex-col justify-end items-center">
            <div className="py-2 flex min-h-16 w-full items-center justify-center">
              {sigB && !sigBFailed ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={sigB}
                  src={sigB}
                  alt="Chữ ký bên B"
                  className="mx-auto h-16 w-auto max-w-full bg-white object-contain"
                  onError={() => setSigBFailed(true)}
                />
              ) : sigB && sigBFailed ? (
                <p className="text-xs text-error-600 dark:text-error-400">
                  Không tải được ảnh chữ ký
                </p>
              ) : (
                <div className="h-16 w-full" />
              )}
            </div>
            {userName ? (
              <p className="text-sm font-semibold text-gray-900 dark:text-white w-full">
                {userName}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(ConsentTermsViewer);
