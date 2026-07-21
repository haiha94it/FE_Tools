"use client";

import Button from "@/components/ui/button/Button";
import {
  consentCanUseChat,
  consentNeedsWizard,
  consentShowPending,
  consentShowRejected,
  formatConsentDateTime,
} from "@/lib/consent-utils";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { consentService } from "@/services/consent.service";
import { useAuthStore } from "@/stores/use-auth-store";
import { useConsentStore } from "@/stores/use-consent-store";
import { memo, useCallback, useEffect, useState } from "react";
import MessageConsentModal from "./MessageConsentModal";

function useMessageConsentStatus(options?: { fetchOnMount?: boolean }) {
  const fetchOnMount = options?.fetchOnMount ?? false;
  const isBootstrapped = useAuthStore((s) => s.isBootstrapped);
  const user = useAuthStore((s) => s.user);
  const status = useConsentStore((s) => s.status);
  const statusLoading = useConsentStore((s) => s.statusLoading);
  const forceWizardOpen = useConsentStore((s) => s.forceWizardOpen);
  const fetchStatus = useConsentStore((s) => s.fetchStatus);
  const applyStatus = useConsentStore((s) => s.applyStatus);
  const closeConsentWizard = useConsentStore((s) => s.closeConsentWizard);
  const openConsentWizard = useConsentStore((s) => s.openConsentWizard);

  useEffect(() => {
    if (!fetchOnMount) return;
    if (!isBootstrapped || !user) return;
    void fetchStatus();
  }, [fetchOnMount, isBootstrapped, user, fetchStatus]);

  return {
    ready: Boolean(isBootstrapped && user),
    status,
    statusLoading,
    forceWizardOpen,
    fetchStatus,
    applyStatus,
    closeConsentWizard,
    openConsentWizard,
  };
}

/**
 * Nút Tải PDF — chỉ khi đã approved (có hồ sơ). Không thu hồi.
 */
export function MessageConsentToolbar() {
  const { ready, status } = useMessageConsentStatus({ fetchOnMount: false });
  const [pdfLoading, setPdfLoading] = useState(false);

  const canDownload =
    ready &&
    consentCanUseChat(status) &&
    status?.system_activated &&
    status?.status === "approved";

  const handleDownloadPdf = useCallback(async () => {
    setPdfLoading(true);
    try {
      await consentService.downloadUserPdf();
      toast.success("Đã tải PDF thỏa thuận");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setPdfLoading(false);
    }
  }, []);

  if (!canDownload) return null;

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="!px-3 !py-1.5 text-xs"
        disabled={pdfLoading}
        onClick={() => void handleDownloadPdf()}
      >
        {pdfLoading ? "Đang tải..." : "Tải PDF thỏa thuận"}
      </Button>
    </div>
  );
}

/**
 * Banner trạng thái chờ duyệt / bị từ chối (không banner 24h, không revoke).
 */
export function MessageConsentBanner() {
  const { ready, status, openConsentWizard } = useMessageConsentStatus({
    fetchOnMount: false,
  });

  if (!ready || !status?.system_activated) return null;

  if (consentShowPending(status)) {
    return (
      <div
        className="shrink-0 rounded-xl border border-warning-200 bg-warning-50 px-3 py-2.5 text-sm text-warning-900 dark:border-warning-500/40 dark:bg-warning-500/15 dark:text-warning-100"
        role="status"
      >
        <p className="font-medium leading-relaxed">
          {status.pending_message?.trim() ||
            "Hồ sơ đang chờ duyệt. Bạn chưa thể dùng tin nhắn."}
        </p>
        {status.submitted_at ? (
          <p className="mt-1 text-xs opacity-90">
            Gửi lúc: {formatConsentDateTime(status.submitted_at)}
          </p>
        ) : null}
      </div>
    );
  }

  if (consentShowRejected(status)) {
    return (
      <div
        className="shrink-0 rounded-xl border border-error-200 bg-error-50 px-3 py-2.5 text-sm text-error-800 dark:border-error-500/40 dark:bg-error-500/15 dark:text-error-200"
        role="alert"
      >
        <p className="font-medium leading-relaxed">
          {status.rejected_message?.trim() ||
            "Thỏa thuận không được duyệt. Vui lòng tạo / ký lại để dùng tin nhắn."}
        </p>
        {status.reject_reason ? (
          <p className="mt-1 text-xs opacity-90">
            Lý do: {status.reject_reason}
          </p>
        ) : null}
        <div className="mt-2">
          <Button
            type="button"
            size="sm"
            className="!px-3 !py-1.5 text-xs"
            onClick={() => openConsentWizard()}
          >
            Tạo / ký lại
          </Button>
        </div>
      </div>
    );
  }

  return null;
}

/**
 * Gate trong khung chat: loading + pending overlay + wizard.
 */
function MessageConsentGate() {
  const {
    ready,
    status,
    statusLoading,
    forceWizardOpen,
    fetchStatus,
    closeConsentWizard,
    openConsentWizard,
  } = useMessageConsentStatus({ fetchOnMount: true });

  const showPending = consentShowPending(status);
  const showRejected = consentShowRejected(status);
  const canChat = consentCanUseChat(status);

  // Auto wizard chỉ khi chưa có hồ sơ (none) — rejected chỉ mở khi bấm “Tạo / ký lại”
  const autoWizard =
    Boolean(status?.system_activated) &&
    !canChat &&
    !showPending &&
    !showRejected &&
    consentNeedsWizard(status);

  const wizardOpen = forceWizardOpen || autoWizard;
  const mandatoryWizard = autoWizard;

  const handleSubmitted = useCallback(() => {
    closeConsentWizard();
    void fetchStatus({ force: true });
  }, [closeConsentWizard, fetchStatus]);

  if (!ready) return null;

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

      {/* Chặn chat khi pending / chưa approved (không che wizard) */}
      {!canChat && status && !wizardOpen ? (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-white/75 p-4 backdrop-blur-[1px] dark:bg-gray-900/70"
          aria-hidden={showPending || showRejected}
        >
          <div className="max-w-md rounded-2xl border border-gray-200 bg-white p-5 text-center shadow-theme-lg dark:border-gray-700 dark:bg-gray-900">
            {showPending ? (
              <>
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  Đang chờ duyệt
                </p>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  {status.pending_message?.trim() ||
                    "Hồ sơ đang chờ admin duyệt. Chat bị tạm khóa."}
                </p>
              </>
            ) : showRejected ? (
              <>
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  Thỏa thuận không được duyệt
                </p>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  {status.rejected_message?.trim() ||
                    "Vui lòng tạo / ký lại để dùng tin nhắn."}
                </p>
                {status.reject_reason ? (
                  <p className="mt-1 text-xs text-gray-500">
                    Lý do: {status.reject_reason}
                  </p>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  className="mt-4"
                  onClick={() => openConsentWizard()}
                >
                  Tạo / ký lại
                </Button>
              </>
            ) : (
              <>
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  Cần hoàn tất thỏa thuận
                </p>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  Đồng ý điều khoản, ký và xác nhận để gửi hồ sơ chờ duyệt.
                </p>
                <Button
                  type="button"
                  size="sm"
                  className="mt-4"
                  onClick={() => openConsentWizard()}
                >
                  Bắt đầu
                </Button>
              </>
            )}
          </div>
        </div>
      ) : null}

      <MessageConsentModal
        open={wizardOpen}
        mandatory={mandatoryWizard}
        onClose={
          mandatoryWizard ? undefined : () => closeConsentWizard()
        }
        onSubmitted={handleSubmitted}
      />
    </>
  );
}

export default memo(MessageConsentGate);
