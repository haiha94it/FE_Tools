"use client";

import ConsentTermsViewer from "@/components/consent/ConsentTermsViewer";
import Select from "@/components/form/Select";
import Label from "@/components/form/Label";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import {
  formatConsentDateTime,
  resolveConsentMediaUrl,
} from "@/lib/consent-utils";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { consentService } from "@/services/consent.service";
import {
  DEFAULT_CONSENT_REVOKE_REASON_OPTIONS,
  type ConsentUserContract,
} from "@/types/consent";
import type { ManagedUser } from "@/types/zalo-user-admin";
import { memo, useCallback, useEffect, useMemo, useState } from "react";

interface UserConsentDetailDrawerProps {
  open: boolean;
  user: ManagedUser | null;
  onClose: () => void;
  /** Sau admin revoke — refresh list user */
  onRevoked?: () => void;
}

function statusBadge(contract: ConsentUserContract | null) {
  if (!contract) return null;
  if (contract.is_active || (contract.signed && !contract.revoked)) {
    return (
      <Badge size="sm" color="success">
        Đang hiệu lực
      </Badge>
    );
  }
  if (contract.revoked || contract.status === "revoked") {
    if (contract.revoke_source === "user") {
      return (
        <Badge size="sm" color="warning">
          Đã thu hồi (user)
        </Badge>
      );
    }
    if (contract.revoke_source === "admin") {
      return (
        <Badge size="sm" color="error">
          Đã thu hồi (admin)
        </Badge>
      );
    }
    return (
      <Badge size="sm" color="warning">
        Đã thu hồi
      </Badge>
    );
  }
  if (!contract.signed) {
    return (
      <Badge size="sm" color="light">
        Chưa ký
      </Badge>
    );
  }
  return null;
}

function UserConsentDetailDrawer({
  open,
  user,
  onClose,
  onRevoked,
}: UserConsentDetailDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [contract, setContract] = useState<ConsentUserContract | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [reasonCode, setReasonCode] = useState("wrong_name");
  const [reasonText, setReasonText] = useState("");
  const [revokeError, setRevokeError] = useState<string | null>(null);

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
      setRevokeDialogOpen(false);
      setReasonCode("wrong_name");
      setReasonText("");
      setRevokeError(null);
      return;
    }
    void load(user.id);
  }, [open, user, load]);

  const reasonOptions = useMemo(() => {
    const opts =
      contract?.revoke_reason_options?.length
        ? contract.revoke_reason_options
        : DEFAULT_CONSENT_REVOKE_REASON_OPTIONS;
    return opts.map((o) => ({ value: o.code, label: o.label }));
  }, [contract?.revoke_reason_options]);

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

  const handleAdminRevoke = async () => {
    if (!user) return;
    if (!reasonCode) {
      setRevokeError("Vui lòng chọn lý do thu hồi");
      return;
    }
    if (reasonCode === "other" && !reasonText.trim()) {
      setRevokeError("Vui lòng nhập ghi chú khi chọn Lý do khác");
      return;
    }

    setRevoking(true);
    setRevokeError(null);
    try {
      const data = await consentService.adminRevoke(user.id, {
        reason_code: reasonCode,
        reason_text: reasonText.trim(),
      });
      setContract(data);
      setRevokeDialogOpen(false);
      toast.success("Đã thu hồi thỏa thuận của người dùng");
      onRevoked?.();
    } catch (err) {
      setRevokeError(getApiErrorMessage(err));
    } finally {
      setRevoking(false);
    }
  };

  const hasRecord =
    Boolean(contract?.signed) ||
    Boolean(contract?.revoked) ||
    Boolean(contract?.signature_url) ||
    Boolean(contract?.signer_full_name);
  const canShowDetail = hasRecord && Boolean(contract);
  const originPdfUrl = resolveConsentMediaUrl(
    contract?.terms?.contract_pdf_url,
  );
  const canAdminRevoke = Boolean(contract?.can_admin_revoke);
  const showPdfActions =
    Boolean(contract?.signed) || Boolean(contract?.signature_url);

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
                Chi tiết đồng thuận xử lý tin nhắn
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
                Người dùng chưa ký đồng thuận xử lý tin nhắn.
              </p>
            ) : (
              <div className="space-y-4">
                {contract?.revoked ? (
                  <div className="rounded-xl border border-error-200 bg-error-50/80 p-4 text-sm text-error-800 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-200">
                    <p className="font-medium">
                      {contract.revoke_source === "admin"
                        ? "Admin đã thu hồi thỏa thuận"
                        : contract.revoke_source === "user"
                          ? "User đã tự thu hồi thỏa thuận"
                          : "Thỏa thuận đã bị thu hồi"}
                    </p>
                    {contract.revoke_reason_label ? (
                      <p className="mt-1">
                        Lý do: {contract.revoke_reason_label}
                      </p>
                    ) : null}
                    {contract.revoke_reason_text ? (
                      <p className="mt-1">Ghi chú: {contract.revoke_reason_text}</p>
                    ) : null}
                    <p className="mt-1 text-xs opacity-90">
                      Thời điểm: {formatConsentDateTime(contract.revoked_at)}
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
                  <p className="mt-1">
                    <span className="text-gray-500 dark:text-gray-400">
                      Thời điểm ký:{" "}
                    </span>
                    {formatConsentDateTime(contract?.signed_at)}
                  </p>
                  <p className="mt-1">
                    <span className="text-gray-500 dark:text-gray-400">IP: </span>
                    {contract?.ip || "—"}
                  </p>
                  {contract?.client_platform ? (
                    <p className="mt-1">
                      <span className="text-gray-500 dark:text-gray-400">
                        Nền tảng:{" "}
                      </span>
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

          <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-gray-100 px-5 py-4 dark:border-gray-800 sm:flex-row sm:flex-wrap sm:justify-end sm:px-6">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Đóng
            </Button>
            {canAdminRevoke ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="!border-error-200 !text-error-600 dark:!border-error-500/40 dark:!text-error-400"
                onClick={() => {
                  setRevokeError(null);
                  setReasonCode(reasonOptions[0]?.value || "wrong_name");
                  setReasonText("");
                  setRevokeDialogOpen(true);
                }}
              >
                Thu hồi thỏa thuận
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
        isOpen={revokeDialogOpen}
        onClose={() => !revoking && setRevokeDialogOpen(false)}
        showCloseButton={!revoking}
        className="w-full max-w-md"
        layer="top"
      >
        <div className="p-5 sm:p-6">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Thu hồi thỏa thuận
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            User sẽ phải ký lại để dùng tin nhắn. Tin cũ vẫn giữ.
          </p>

          <div className="mt-4 space-y-3">
            <div>
              <Label>
                Lý do thu hồi <span className="text-error-500">*</span>
              </Label>
              <Select
                options={reasonOptions}
                value={reasonCode}
                onChange={setReasonCode}
                placeholder="Chọn lý do"
              />
            </div>
            <div>
              <Label htmlFor="admin-revoke-note">
                Ghi chú
                {reasonCode === "other" ? (
                  <span className="text-error-500"> *</span>
                ) : null}
              </Label>
              <textarea
                id="admin-revoke-note"
                value={reasonText}
                onChange={(e) => setReasonText(e.target.value)}
                rows={3}
                disabled={revoking}
                placeholder={
                  reasonCode === "other"
                    ? "Bắt buộc khi chọn Lý do khác"
                    : "Tùy chọn"
                }
                className="mt-1.5 w-full resize-y rounded-xl border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-800 outline-none focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
            </div>
            {revokeError ? (
              <p className="text-sm text-error-600 dark:text-error-400">
                {revokeError}
              </p>
            ) : null}
          </div>

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={revoking}
              onClick={() => setRevokeDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={revoking}
              className="!bg-error-500 hover:!bg-error-600"
              onClick={() => void handleAdminRevoke()}
            >
              {revoking ? "Đang thu hồi..." : "Xác nhận thu hồi"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default memo(UserConsentDetailDrawer);
