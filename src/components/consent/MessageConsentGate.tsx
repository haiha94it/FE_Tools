"use client";

import Button from "@/components/ui/button/Button";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { consentService } from "@/services/consent.service";
import { useAuthStore } from "@/stores/use-auth-store";
import { useConsentStore } from "@/stores/use-consent-store";
import { memo, useCallback, useEffect, useState } from "react";
import MessageConsentModal from "./MessageConsentModal";

/**
 * Gate trang Tin nhắn: GET status → nếu need_sign thì overlay ký (chỉ che chat).
 * Sidebar/menu admin vẫn dùng được — user có thể sang module khác nếu chưa muốn ký.
 */
function MessageConsentGate() {
  const isBootstrapped = useAuthStore((s) => s.isBootstrapped);
  const user = useAuthStore((s) => s.user);

  const status = useConsentStore((s) => s.status);
  const statusLoading = useConsentStore((s) => s.statusLoading);
  const forceModalOpen = useConsentStore((s) => s.forceModalOpen);
  const fetchStatus = useConsentStore((s) => s.fetchStatus);
  const closeConsentModal = useConsentStore((s) => s.closeConsentModal);

  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    if (!isBootstrapped || !user) return;
    void fetchStatus();
  }, [isBootstrapped, user, fetchStatus]);

  const needSign = Boolean(status?.need_sign);
  const userSigned = Boolean(status?.user_signed);
  const modalOpen = needSign || forceModalOpen;

  const handleSigned = useCallback(() => {
    closeConsentModal();
    void fetchStatus({ force: true });
  }, [closeConsentModal, fetchStatus]);

  const handleDownloadPdf = useCallback(async () => {
    setPdfLoading(true);
    try {
      await consentService.downloadUserPdf();
      toast.success("Đã tải PDF đồng thuận");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setPdfLoading(false);
    }
  }, []);

  if (!isBootstrapped || !user) return null;

  return (
    <>
      {statusLoading && !status ? (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-white/60 dark:bg-gray-900/50"
          aria-busy
        >
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        </div>
      ) : null}

      {userSigned && !needSign ? (
        <div className="absolute right-3 top-3 z-20 hidden items-center gap-2 lg:flex">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="!px-2.5 !py-1 text-[11px]"
            disabled={pdfLoading}
            onClick={() => void handleDownloadPdf()}
          >
            {pdfLoading ? "Đang tải..." : "Tải PDF đồng thuận"}
          </Button>
        </div>
      ) : null}

      <MessageConsentModal
        open={modalOpen}
        mandatory={needSign}
        onClose={needSign ? undefined : () => closeConsentModal()}
        onSigned={handleSigned}
      />
    </>
  );
}

export default memo(MessageConsentGate);
