"use client";

import ConsentTermsViewer from "@/components/consent/ConsentTermsViewer";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import {
  formatConsentDateTime,
  resolveConsentMediaUrl,
} from "@/lib/consent-utils";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { consentService } from "@/services/consent.service";
import type { ConsentUserContract } from "@/types/consent";
import type { ManagedUser } from "@/types/zalo-user-admin";
import { memo, useCallback, useEffect, useState } from "react";

interface UserConsentDetailDrawerProps {
  open: boolean;
  user: ManagedUser | null;
  onClose: () => void;
}

function UserConsentDetailDrawer({
  open,
  user,
  onClose,
}: UserConsentDetailDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [contract, setContract] = useState<ConsentUserContract | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (userId: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await consentService.getUserContract(userId);
      setContract(data);
    } catch (err) {
      setContract(null);
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open || !user) {
      setContract(null);
      setError(null);
      return;
    }
    void load(user.id);
  }, [open, user, load]);

  const handleDownloadPdf = async () => {
    if (!user) return;
    setDownloading(true);
    try {
      await consentService.downloadAdminUserPdf(
        user.id,
        `consent_message_processing_${user.id}.pdf`,
      );
      toast.success("Đã tải PDF chứng từ đồng thuận");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setDownloading(false);
    }
  };

  const signed = Boolean(contract?.signed);
  const originPdfUrl = resolveConsentMediaUrl(
    contract?.terms?.contract_pdf_url,
  );

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      showCloseButton
      className="w-full max-w-2xl min-w-0"
      layer="top"
    >
      <div className="flex max-h-[min(90dvh,720px)] flex-col">
        <div className="shrink-0 border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:px-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Chi tiết đồng thuận xử lý tin nhắn
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {user?.fullname || user?.username || "—"}
            {user?.username ? ` (@${user.username})` : null}
          </p>
        </div>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            </div>
          ) : error ? (
            <p className="rounded-lg bg-error-50 px-3 py-2 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
              {error}
            </p>
          ) : !signed ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Người dùng chưa ký đồng thuận xử lý tin nhắn.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 text-sm dark:border-gray-700 dark:bg-white/[0.03]">
                <p>
                  <span className="text-gray-500 dark:text-gray-400">Email tài khoản: </span>
                  {contract?.user?.mail || user?.mail || "—"}
                </p>
                <p className="mt-1">
                  <span className="text-gray-500 dark:text-gray-400">Họ tên lúc ký: </span>
                  {contract?.signer_full_name || "—"}
                </p>
                <p className="mt-1">
                  <span className="text-gray-500 dark:text-gray-400">SĐT lúc ký: </span>
                  {contract?.signer_phone || "—"}
                </p>
                <p className="mt-1">
                  <span className="text-gray-500 dark:text-gray-400">Thời điểm ký: </span>
                  {formatConsentDateTime(contract?.signed_at)}
                </p>
                <p className="mt-1">
                  <span className="text-gray-500 dark:text-gray-400">IP: </span>
                  {contract?.ip || "—"}
                </p>
                {contract?.client_platform ? (
                  <p className="mt-1">
                    <span className="text-gray-500 dark:text-gray-400">Nền tảng: </span>
                    {contract.client_platform}
                  </p>
                ) : null}
              </div>

              <ConsentTermsViewer
                title={contract?.terms?.title}
                bodyHtml={contract?.terms?.body_html}
                hasBodyHtml={contract?.terms?.has_body_html}
                contractPdfUrl={contract?.terms?.contract_pdf_url}
                hasContractPdf={contract?.terms?.has_contract_pdf}
                displayMode={contract?.terms?.display_mode}
                companyName={contract?.company_name}
                companyTaxCode={contract?.company_tax_code}
                companyAddress={contract?.company_address}
                companySignatureUrl={contract?.company_signature_url}
                userSignatureUrl={contract?.signature_url}
              />
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-gray-100 px-5 py-4 dark:border-gray-800 sm:flex-row sm:justify-end sm:px-6">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Đóng
          </Button>
          {signed && originPdfUrl ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                window.open(originPdfUrl, "_blank", "noopener,noreferrer")
              }
            >
              Mở PDF gốc
            </Button>
          ) : null}
          {signed ? (
            <Button
              type="button"
              size="sm"
              disabled={downloading}
              onClick={() => void handleDownloadPdf()}
            >
              {downloading ? "Đang tải..." : "Tải PDF chứng từ"}
            </Button>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}

export default memo(UserConsentDetailDrawer);
