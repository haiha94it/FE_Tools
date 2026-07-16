"use client";

import Checkbox from "@/components/form/input/Checkbox";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { LEGAL_BRAND_NAME } from "@/constants/brand";
import { CONTRACT_PDF_URL } from "@/constants/contract";
import {
  buildSignedContractFilename,
  downloadContractPdf,
  generateSignedContractPdf,
  uint8ArrayToBase64,
} from "@/lib/contract-pdf";
import { memo, useCallback, useEffect, useState } from "react";
import ContractPdfViewer from "./ContractPdfViewer";
import ContractSignatureSection from "./ContractSignatureSection";

export interface MessengerTermsAcceptResult {
  signature: string;
  contractPdfBase64: string;
  contractFilename: string;
}

interface MessengerTermsDialogProps {
  open: boolean;
  signerName?: string;
  mandatory?: boolean;
  viewOnly?: boolean;
  submitting?: boolean;
  onClose?: () => void;
  onDisagree?: () => void;
  onAccept: (result: MessengerTermsAcceptResult) => Promise<void>;
}

function MessengerTermsDialog({
  open,
  signerName,
  mandatory = false,
  viewOnly = false,
  submitting = false,
  onClose,
  onDisagree,
  onAccept,
}: MessengerTermsDialogProps) {
  const [agreed, setAgreed] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAgreed(false);
    setHasSignature(false);
    setSignatureDataUrl(null);
    setError(null);
    setGeneratingPdf(false);
  }, [open]);

  const handleSignatureChange = useCallback(
    (nextHasSignature: boolean, dataUrl: string | null) => {
      setHasSignature(nextHasSignature);
      setSignatureDataUrl(dataUrl);
    },
    [],
  );

  const canSubmit =
    agreed &&
    hasSignature &&
    Boolean(signatureDataUrl) &&
    !submitting &&
    !generatingPdf;

  const handleAccept = async () => {
    if (!canSubmit || !signatureDataUrl) {
      setError("Vui lòng đọc hợp đồng, đồng ý điều khoản và ký trước khi xác nhận.");
      return;
    }

    setError(null);
    setGeneratingPdf(true);
    try {
      const signedPdf = await generateSignedContractPdf({ signatureDataUrl });
      const contractPdfBase64 = uint8ArrayToBase64(signedPdf);
      const contractFilename = buildSignedContractFilename(
        signerName ?? "user",
      );

      downloadContractPdf(signedPdf, contractFilename);

      await onAccept({
        signature: signatureDataUrl,
        contractPdfBase64,
        contractFilename,
      });
    } catch (cause) {
      console.error("[contract-pdf]", cause);
      const message =
        cause instanceof Error && cause.message
          ? cause.message
          : "Không tạo được file PDF hợp đồng. Vui lòng thử lại.";
      setError(message);
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleClose = () => {
    if (mandatory) return;
    onClose?.();
  };

  const handleDownloadTemplate = () => {
    window.open(CONTRACT_PDF_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <Modal
      isOpen={open}
      onClose={handleClose}
      showCloseButton={!mandatory}
      layer="top"
      className="w-full max-w-4xl min-w-0"
    >
      <div className="flex h-[min(92dvh,calc(100dvh-2rem))] w-full min-w-0 flex-col">
        <div className="shrink-0 border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Hợp đồng sử dụng phần mềm
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                Đọc PDF, cuộn tới trang cuối (Bên A đã ký, Bên B có ô chữ ký), ký bên
                dưới — hệ thống ghép chữ ký vào đúng ô Bên B.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="cursor-pointer shrink-0 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-brand-300 hover:text-brand-600 dark:border-gray-700 dark:text-gray-400 dark:hover:text-brand-400"
            >
              Tải mẫu PDF
            </button>
          </div>
        </div>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-5 py-4 sm:px-6">
          <ContractPdfViewer />

          {!viewOnly ? (
            <div className="mt-5 space-y-4">
              <ContractSignatureSection
                disabled={submitting || generatingPdf}
                onSignatureChange={handleSignatureChange}
              />

              <div className="rounded-xl border border-[#86aff3] bg-[#d0e1fd] p-4 text-gray-800 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-gray-200">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={agreed}
                    onChange={setAgreed}
                    disabled={submitting || generatingPdf}
                  />
                  <p className="min-w-0 flex-1 text-sm leading-6">
                    Tôi đã đọc toàn bộ hợp đồng PDF, đồng ý điều khoản sử dụng dịch vụ{" "}
                    {LEGAL_BRAND_NAME} và xác nhận chữ ký điện tử của tôi có giá trị
                    pháp lý tương đương chữ ký trên hợp đồng giấy.
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="shrink-0 border-t border-gray-100 px-5 py-4 dark:border-gray-800 sm:px-6">
          {error ? (
            <p className="mb-3 rounded-lg bg-error-50 px-3 py-2 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
              {error}
            </p>
          ) : null}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            {!viewOnly && onDisagree ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={submitting || generatingPdf}
                className="w-full border-error-200 text-error-600 hover:bg-error-50 dark:border-error-500/30 dark:text-error-400 dark:hover:bg-error-500/10 sm:w-auto"
                onClick={onDisagree}
              >
                Không đồng ý
              </Button>
            ) : null}

            <div className="flex flex-col-reverse gap-2 sm:ml-auto sm:flex-row">
              {viewOnly || !mandatory ? (
                <Button
                  type="button"
                  variant={viewOnly ? "primary" : "outline"}
                  size="sm"
                  disabled={submitting || generatingPdf}
                  onClick={handleClose}
                >
                  Đóng
                </Button>
              ) : null}
              {!viewOnly ? (
                <Button
                  type="button"
                  size="sm"
                  disabled={!canSubmit}
                  onClick={() => void handleAccept()}
                >
                  {generatingPdf
                    ? "Đang tạo PDF hợp đồng..."
                    : submitting
                      ? "Đang lưu xác nhận..."
                      : "Ký và tải hợp đồng PDF"}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default memo(MessengerTermsDialog);