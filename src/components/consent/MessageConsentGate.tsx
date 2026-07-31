"use client";

import Button from "@/components/ui/button/Button";
import {
  consentCanUseChat,
  consentEmployeeMessage,
  consentIsEmployee,
  consentNeedsWizard,
  consentShowPending,
  consentShowRejected,
  consentShowWaitManager,
  formatConsentDateTime,
} from "@/lib/consent-utils";
import { getApiErrorMessage } from "@/lib/errors";
import { isEmployeeUser } from "@/lib/team-collaboration-utils";
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
    closeConsentWizard,
    openConsentWizard,
  };
}

/**
 * Nút Tải PDF — chỉ **quản lý** (đã approved).
 * Nhân viên: không hiển thị (HĐ thuộc QL, NV không tải PDF).
 */
export function MessageConsentToolbar() {
  const { ready, status } = useMessageConsentStatus({ fetchOnMount: false });
  const authUser = useAuthStore((s) => s.user);
  const [pdfLoading, setPdfLoading] = useState(false);

  // Ưu tiên role auth + flag consent BE (phòng status chưa load / thiếu is_employee)
  const isEmployee =
    isEmployeeUser(authUser) || consentIsEmployee(status);

  const canDownload =
    ready &&
    !isEmployee &&
    Boolean(status?.system_activated) &&
    consentCanUseChat(status) &&
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
 * Banner: NV (nhờ QL) / pending / rejected (non-NV CTA ký lại).
 */
export function MessageConsentBanner() {
  const { ready, status, openConsentWizard } = useMessageConsentStatus({
    fetchOnMount: false,
  });

  if (!ready || !status?.system_activated) return null;
  if (consentCanUseChat(status)) return null;

  const isEmployee = consentIsEmployee(status);

  // NV: luôn banner employee_message khi chặn — không CTA ký
  if (isEmployee) {
    return (
      <div
        className="shrink-0 rounded-xl border border-warning-200 bg-warning-50 px-3 py-2.5 text-sm text-warning-900 dark:border-warning-500/40 dark:bg-warning-500/15 dark:text-warning-100"
        role="status"
      >
        <p className="font-medium leading-relaxed whitespace-pre-line">
          {consentEmployeeMessage(status)}
        </p>
      </div>
    );
  }

  if (consentShowPending(status)) {
    return (
      <div
        className="shrink-0 rounded-xl border border-warning-200 bg-warning-50 px-3 py-2.5 text-sm text-warning-900 dark:border-warning-500/40 dark:bg-warning-500/15 dark:text-warning-100"
        role="status"
      >
        <p className="font-medium leading-relaxed">
          Hồ sơ đang chờ duyệt chậm nhất trong vòng 48h. Bạn chưa thể dùng tin nhắn.
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
    const reason = status.reject_reason?.trim() || "";
    return (
      <div
        className="shrink-0 rounded-xl border border-error-200 bg-error-50 px-3 py-2.5 text-sm text-error-800 dark:border-error-500/40 dark:bg-error-500/15 dark:text-error-200"
        role="alert"
      >
        <p className="font-medium leading-relaxed">
          Thỏa thuận chưa được duyệt
        </p>
        {reason ? (
          <p className="mt-1 text-xs opacity-90">Lý do: {reason}</p>
        ) : (
          <p className="mt-1 text-xs opacity-90">
            Vui lòng tạo / ký lại để dùng tin nhắn.
          </p>
        )}
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
 * Gate trong khung chat:
 * - NV: chặn + message nhờ QL (không wizard / không sign)
 * - Non-NV: pending / rejected / wizard
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

  const isEmployee = consentIsEmployee(status);
  const showPending = consentShowPending(status);
  const showRejected = consentShowRejected(status);
  const showWaitManager = consentShowWaitManager(status);
  const canChat = consentCanUseChat(status);

  // NV: never wizard. Non-NV: auto wizard khi need_wizard và chưa pending/reject UI
  const autoWizard =
    !isEmployee &&
    Boolean(status?.system_activated) &&
    !canChat &&
    !showPending &&
    !showRejected &&
    consentNeedsWizard(status);

  const wizardOpen =
    !isEmployee && (forceWizardOpen || autoWizard);
  const mandatoryWizard = autoWizard;

  const handleSubmitted = useCallback(() => {
    closeConsentWizard();
    void fetchStatus({ force: true });
  }, [closeConsentWizard, fetchStatus]);

  if (!ready) return null;

  const blockChat = Boolean(status?.system_activated && !canChat && !wizardOpen);

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

      {blockChat && status ? (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-white/75 p-4 backdrop-blur-[1px] dark:bg-gray-900/70"
        >
          <div className="max-w-md rounded-2xl border border-gray-200 bg-white p-5 text-center shadow-theme-lg dark:border-gray-700 dark:bg-gray-900">
            {isEmployee ? (
              <>
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  {showPending
                    ? "Quản lý đang chờ duyệt"
                    : showRejected
                      ? "Thỏa thuận quản lý chưa được duyệt"
                      : showWaitManager
                        ? "Cần quản lý ký thỏa thuận"
                        : "Chưa thể dùng tin nhắn"}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300 whitespace-pre-line">
                  {consentEmployeeMessage(status)}
                </p>
              </>
            ) : showPending ? (
              <>
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  Đang chờ duyệt
                </p>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  Hồ sơ đang chờ duyệt. Chat bị tạm khóa.
                </p>
              </>
            ) : showRejected ? (
              <>
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  Thỏa thuận chưa được duyệt
                </p>
                {status.reject_reason?.trim() ? (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    Lý do: {status.reject_reason.trim()}
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    Vui lòng tạo / ký lại để dùng tin nhắn.
                  </p>
                )}
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

      {!isEmployee && wizardOpen ? (
        <MessageConsentModal
          mandatory={mandatoryWizard}
          onClose={
            mandatoryWizard ? undefined : () => closeConsentWizard()
          }
          onSubmitted={handleSubmitted}
        />
      ) : null}
    </>
  );
}

export default memo(MessageConsentGate);
