"use client";

import {
  resolveConsentDisplayMode,
  resolveConsentMediaUrl,
  sanitizeConsentHtml,
} from "@/lib/consent-utils";
import type { ConsentDisplayMode } from "@/types/consent";
import { memo } from "react";
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
  showPartyBPlaceholder?: boolean;
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
  showPartyBPlaceholder = false,
  className = "",
}: ConsentTermsViewerProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
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

      <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-700 dark:bg-white/[0.03]">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Bên A — Công ty
        </p>
        <div className="mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-300">
          {companyName ? <p>Tên: {companyName}</p> : null}
          {companyTaxCode ? <p>MST: {companyTaxCode}</p> : null}
          {companyAddress ? <p>Địa chỉ: {companyAddress}</p> : null}
        </div>
        <div className="mt-3">
          {sigA ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={sigA}
              alt="Chữ ký và con dấu công ty"
              className="h-28 w-auto max-w-full object-contain object-left"
            />
          ) : (
            <p className="text-xs text-gray-400">
              Chưa có ảnh chữ ký + con dấu công ty
            </p>
          )}
        </div>
      </div>

      {sigB || showPartyBPlaceholder ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-700 dark:bg-white/[0.03]">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Bên B — Người dùng
          </p>
          {sigB ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={sigB}
              alt="Chữ ký người dùng"
              className="mt-3 h-24 max-w-full object-contain"
            />
          ) : (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Chữ ký sẽ hiển thị sau khi người dùng ký.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default memo(ConsentTermsViewer);
