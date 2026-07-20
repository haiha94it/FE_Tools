"use client";

import Button from "@/components/ui/button/Button";
import { confirm } from "@/lib/confirm";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { consentService } from "@/services/consent.service";
import { useAuthStore } from "@/stores/use-auth-store";
import { useConsentStore } from "@/stores/use-consent-store";
import { memo, useCallback, useEffect, useState } from "react";
import MessageConsentModal from "./MessageConsentModal";

/**
 * Gate trang Tin nhắn: status → banner thu hồi + modal ký (chỉ che chat).
 * Sidebar vẫn dùng được.
 */
function MessageConsentGate() {
  const isBootstrapped = useAuthStore((s) => s.isBootstrapped);
  const user = useAuthStore((s) => s.user);

  const status = useConsentStore((s) => s.status);
  const statusLoading = useConsentStore((s) => s.statusLoading);
  const forceModalOpen = useConsentStore((s) => s.forceModalOpen);
  const fetchStatus = useConsentStore((s) => s.fetchStatus);
  const applyStatus = useConsentStore((s) => s.applyStatus);
  const closeConsentModal = useConsentStore((s) => s.closeConsentModal);

  const [pdfLoading, setPdfLoading] = useState(false);
  const [revoking, setRevoking] = useState(false);

  useEffect(() => {
    if (!isBootstrapped || !user) return;
    void fetchStatus();
  }, [isBootstrapped, user, fetchStatus]);

  const needSign = Boolean(status?.need_sign);
  const userSigned = Boolean(status?.user_signed);
  const modalOpen = needSign || forceModalOpen;
  const noticeMessage = status?.notice_message?.trim() || null;
  const showRevokeNotice = Boolean(status?.revoked && noticeMessage);

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

  const handleRevoke = useCallback(async () => {
    const ok = await confirm({
      title: "Thu hồi thỏa thuận?",
      message:
        "Thu hồi sẽ ngừng quét tin mới; tin cũ vẫn giữ. Tiếp tục?",
      confirmText: "Thu hồi",
      cancelText: "Hủy",
      variant: "danger",
    });
    if (!ok) return;

    setRevoking(true);
    try {
      const result = await consentService.revoke();
      if (result.status) {
        applyStatus(result.status);
      } else {
        await fetchStatus({ force: true });
      }
      toast.success("Đã thu hồi thỏa thuận xử lý tin nhắn");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setRevoking(false);
    }
  }, [applyStatus, fetchStatus]);

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

      {/* Banner thu hồi — không ẩn khi còn notice */}
      {showRevokeNotice ? (
        <div className="pointer-events-none absolute left-2 right-2 top-2 z-[25] sm:left-3 sm:right-3 sm:top-3">
          <div
            className={`pointer-events-auto rounded-xl border px-3 py-2.5 text-sm shadow-sm ${
              status?.revoke_source === "admin"
                ? "border-error-200 bg-error-50 text-error-800 dark:border-error-500/40 dark:bg-error-500/15 dark:text-error-200"
                : "border-warning-200 bg-warning-50 text-warning-900 dark:border-warning-500/40 dark:bg-warning-500/15 dark:text-warning-100"
            }`}
            role="alert"
          >
            <p className="font-medium leading-relaxed">{noticeMessage}</p>
            {status?.revoke_source === "admin" && status.revoke_reason_label ? (
              <p className="mt-1 text-xs opacity-90">
                Lý do: {status.revoke_reason_label}
                {status.revoke_reason_text
                  ? ` — ${status.revoke_reason_text}`
                  : ""}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {userSigned && !needSign ? (
        <div className="absolute right-3 top-3 z-20 flex flex-wrap items-center justify-end gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="!px-2.5 !py-1 text-[11px]"
            disabled={pdfLoading || revoking}
            onClick={() => void handleDownloadPdf()}
          >
            {pdfLoading ? "Đang tải..." : "Tải PDF đồng thuận"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="!border-error-200 !px-2.5 !py-1 text-[11px] !text-error-600 dark:!border-error-500/40 dark:!text-error-400"
            disabled={revoking || pdfLoading}
            onClick={() => void handleRevoke()}
          >
            {revoking ? "Đang thu hồi..." : "Thu hồi thỏa thuận"}
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
