"use client";

import ConsentTermsViewer from "@/components/consent/ConsentTermsViewer";
import Label from "@/components/form/Label";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import {
  consentStatusLabel,
  formatConsentDateTime,
  normalizeConsentStatus,
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
  /** Sau approve / reject — refresh list user */
  onUpdated?: () => void;
  /** @deprecated dùng onUpdated */
  onRevoked?: () => void;
}

function statusBadge(contract: ConsentUserContract | null) {
  if (!contract) return null;
  const s = normalizeConsentStatus(
    contract.status ??
      (contract.signed ? "approved" : "none"),
  );
  if (s === "approved") {
    return (
      <Badge size="sm" color="success">
        {consentStatusLabel(s)}
      </Badge>
    );
  }
  if (s === "pending_approval") {
    return (
      <Badge size="sm" color="warning">
        {consentStatusLabel(s)}
      </Badge>
    );
  }
  if (s === "rejected") {
    return (
      <Badge size="sm" color="error">
        {consentStatusLabel(s)}
      </Badge>
    );
  }
  return (
    <Badge size="sm" color="light">
      {consentStatusLabel(s)}
    </Badge>
  );
}

function UserConsentDetailDrawer({
  open,
  user,
  onClose,
  onUpdated,
  onRevoked,
}: UserConsentDetailDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [acting, setActing] = useState(false);
  const [contract, setContract] = useState<ConsentUserContract | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState<string | null>(null);

  const notifyUpdated = useCallback(() => {
    onUpdated?.();
    onRevoked?.();
  }, [onUpdated, onRevoked]);

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
      setRejectOpen(false);
      setRejectReason("");
      setRejectError(null);
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
      toast.success("Đã tải PDF chứng từ thỏa thuận");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setDownloading(false);
    }
  };

  const handleApprove = async () => {
    if (!user) return;
    setActing(true);
    try {
      const data = await consentService.adminApprove(user.id);
      setContract(data);
      toast.success("Đã duyệt thỏa thuận");
      notifyUpdated();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setActing(false);
    }
  };

  const handleReject = async () => {
    if (!user) return;
    setActing(true);
    setRejectError(null);
    try {
      const data = await consentService.adminReject(user.id, {
        reason: rejectReason.trim(),
      });
      setContract(data);
      setRejectOpen(false);
      setRejectReason("");
      toast.success("Đã từ chối hồ sơ (hủy pending)");
      notifyUpdated();
    } catch (err) {
      setRejectError(getApiErrorMessage(err));
    } finally {
      setActing(false);
    }
  };

  const status = normalizeConsentStatus(
    contract?.status ?? (contract?.signed ? "approved" : "none"),
  );
  const isPending = status === "pending_approval";
  const isApproved = status === "approved";
  const isRejected = status === "rejected";
  const hasRecord =
    status !== "none" ||
    Boolean(contract?.signature_url) ||
    Boolean(contract?.signer_full_name);
  const canShowDetail = hasRecord && Boolean(contract);
  const originPdfUrl = resolveConsentMediaUrl(
    contract?.terms?.contract_pdf_url,
  );
  const canApprove =
    isPending ||
    contract?.can_admin_approve === true;
  const canReject =
    isPending ||
    (contract?.can_admin_reject === true && !isApproved);
  const showPdfActions =
    Boolean(contract?.signature_url) ||
    isApproved ||
    isPending ||
    isRejected;

  return (
    <>
      <Modal
        isOpen={open}
        onClose={onClose}
        showCloseButton
        className="w-full max-w-2xl min-w-0"
        layer="top"
      >
        <div className="flex max-h-[min(90dvh,720px)] flex-col">
          <div className="shrink-0 border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:px-6">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Chi tiết thỏa thuận xử lý tin nhắn
              </h2>
              {statusBadge(contract)}
            </div>
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
            ) : !canShowDetail ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Người dùng chưa gửi hồ sơ thỏa thuận.
              </p>
            ) : (
              <div className="space-y-4">
                {isRejected ? (
                  <div className="rounded-xl border border-error-200 bg-error-50/80 p-4 text-sm text-error-800 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-200">
                    <p className="font-medium">Hồ sơ bị từ chối</p>
                    {contract?.reject_reason ? (
                      <p className="mt-1">Lý do: {contract.reject_reason}</p>
                    ) : null}
                    <p className="mt-1 text-xs opacity-90">
                      Thời điểm: {formatConsentDateTime(contract?.reviewed_at)}
                    </p>
                  </div>
                ) : null}

                {isPending ? (
                  <div className="rounded-xl border border-warning-200 bg-warning-50/80 p-4 text-sm text-warning-900 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-100">
                    <p className="font-medium">Đang chờ duyệt</p>
                    <p className="mt-1 text-xs opacity-90">
                      Gửi lúc: {formatConsentDateTime(contract?.submitted_at || contract?.signed_at)}
                    </p>
                  </div>
                ) : null}

                <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 text-sm dark:border-gray-700 dark:bg-white/[0.03]">
                  <p>
                    <span className="text-gray-500 dark:text-gray-400">
                      Email tài khoản:{" "}
                    </span>
                    {contract?.user?.mail || user?.mail || "—"}
                  </p>
                  <p className="mt-1">
                    <span className="text-gray-500 dark:text-gray-400">
                      Họ tên lúc ký:{" "}
                    </span>
                    {contract?.signer_full_name || "—"}
                  </p>
                  <p className="mt-1">
                    <span className="text-gray-500 dark:text-gray-400">
                      SĐT lúc ký:{" "}
                    </span>
                    {contract?.signer_phone || "—"}
                  </p>
                  {contract?.signer_email ? (
                    <p className="mt-1">
                      <span className="text-gray-500 dark:text-gray-400">
                        Email lúc ký:{" "}
                      </span>
                      {contract.signer_email}
                    </p>
                  ) : null}
                  {contract?.signer_address ? (
                    <p className="mt-1">
                      <span className="text-gray-500 dark:text-gray-400">
                        Địa chỉ:{" "}
                      </span>
                      {contract.signer_address}
                    </p>
                  ) : null}
                  {contract?.entity_type ? (
                    <p className="mt-1">
                      <span className="text-gray-500 dark:text-gray-400">
                        Loại:{" "}
                      </span>
                      {contract.entity_type === "business"
                        ? "HKD / Công ty"
                        : "Cá nhân"}
                    </p>
                  ) : null}
                  <p className="mt-1">
                    <span className="text-gray-500 dark:text-gray-400">
                      Thời điểm gửi:{" "}
                    </span>
                    {formatConsentDateTime(
                      contract?.submitted_at || contract?.signed_at,
                    )}
                  </p>
                  {contract?.reviewed_at ? (
                    <p className="mt-1">
                      <span className="text-gray-500 dark:text-gray-400">
                        Duyệt lúc:{" "}
                      </span>
                      {formatConsentDateTime(contract.reviewed_at)}
                    </p>
                  ) : null}
                  <p className="mt-1">
                    <span className="text-gray-500 dark:text-gray-400">IP: </span>
                    {contract?.ip || "—"}
                  </p>
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

          <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-gray-100 px-5 py-4 dark:border-gray-800 sm:flex-row sm:flex-wrap sm:justify-end sm:px-6">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Đóng
            </Button>
            {canReject && !isApproved ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="!border-error-200 !text-error-600 dark:!border-error-500/40 dark:!text-error-400"
                disabled={acting}
                onClick={() => {
                  setRejectError(null);
                  setRejectReason("");
                  setRejectOpen(true);
                }}
              >
                Từ chối
              </Button>
            ) : null}
            {canApprove && isPending ? (
              <Button
                type="button"
                size="sm"
                disabled={acting}
                className="!bg-success-500 hover:!bg-success-600"
                onClick={() => void handleApprove()}
              >
                {acting ? "Đang duyệt..." : "Duyệt"}
              </Button>
            ) : null}
            {showPdfActions && originPdfUrl ? (
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
            {showPdfActions ? (
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

      <Modal
        isOpen={rejectOpen}
        onClose={() => !acting && setRejectOpen(false)}
        showCloseButton={!acting}
        className="w-full max-w-md"
        layer="top"
      >
        <div className="p-5 sm:p-6">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Từ chối hồ sơ
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Hủy pending — user có thể tạo / ký lại.
          </p>

          <div className="mt-4 space-y-3">
            <div>
              <Label htmlFor="admin-reject-reason">Lý do</Label>
              <textarea
                id="admin-reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                disabled={acting}
                placeholder="Ghi chú gửi user"
                className="mt-1.5 w-full resize-y rounded-xl border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-800 outline-none focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
            </div>
            {rejectError ? (
              <p className="text-sm text-error-600 dark:text-error-400">
                {rejectError}
              </p>
            ) : null}
          </div>

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={acting}
              onClick={() => setRejectOpen(false)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={acting}
              className="!bg-error-500 hover:!bg-error-600"
              onClick={() => void handleReject()}
            >
              {acting ? "Đang xử lý..." : "Xác nhận từ chối"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default memo(UserConsentDetailDrawer);
