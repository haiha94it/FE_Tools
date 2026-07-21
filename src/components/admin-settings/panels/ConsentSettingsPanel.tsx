"use client";

import ConsentPdfUploadField from "@/components/consent/ConsentPdfUploadField";
import ConsentRichTextEditor from "@/components/consent/ConsentRichTextEditor";
import ConsentTermsViewer from "@/components/consent/ConsentTermsViewer";
import SettingsImageField from "@/components/admin-settings/shared/SettingsImageField";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import ContactAvatar from "@/components/zalo-contacts/shared/ContactAvatar";
import { useScanTaskPoll } from "@/hooks/use-scan-task-poll";
import { getApiErrorCode } from "@/lib/api-response";
import { confirm } from "@/lib/confirm";
import {
  isQuillHtmlEmpty,
  resolveConsentMediaUrl,
} from "@/lib/consent-utils";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import {
  getScanTaskStatus,
  isScanTaskDone,
} from "@/lib/zalo-contacts-utils";
import { consentService } from "@/services/consent.service";
import { zaloAccountService } from "@/services/zalo-account.service";
import { zaloGroupService } from "@/services/zalo-group.service";
import type {
  ConsentActivateChecklistItem,
  ConsentAdminSetup,
} from "@/types/consent";
import { CONSENT_SETUP_INCOMPLETE } from "@/types/consent";
import type { ZaloAccount } from "@/types/zalo-account";
import type { ScanTaskResponse, ZaloGroupItem } from "@/types/zalo-contacts";
import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";

function extractSetupFromError(error: unknown): ConsentAdminSetup | null {
  if (!axios.isAxiosError(error)) return null;
  const data = error.response?.data;
  if (!data || typeof data !== "object") return null;
  const payload = (data as { data?: unknown }).data;
  if (!payload || typeof payload !== "object") return null;
  return payload as ConsentAdminSetup;
}

export default function ConsentSettingsPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activating, setActivating] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyTaxCode, setCompanyTaxCode] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [contractPdfUrl, setContractPdfUrl] = useState<string | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [contractPdfFile, setContractPdfFile] = useState<File | null>(null);
  const [clearContractPdf, setClearContractPdf] = useState(false);
  const [signaturePreview, setSignaturePreview] = useState("");
  const [isActivated, setIsActivated] = useState(false);
  const [activatedAt, setActivatedAt] = useState<string | null>(null);
  const [hasContractPdfServer, setHasContractPdfServer] = useState(false);
  const [previewLocalPdfUrl, setPreviewLocalPdfUrl] = useState<string | null>(
    null,
  );

  const [notifyAccountId, setNotifyAccountId] = useState<number | null>(null);
  const [notifyGroupId, setNotifyGroupId] = useState<string>("");
  const [notifyGroupName, setNotifyGroupName] = useState<string>("");
  const [zaloAccounts, setZaloAccounts] = useState<ZaloAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [groups, setGroups] = useState<ZaloGroupItem[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [scanTaskId, setScanTaskId] = useState<string | number | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  /** Checklist từ BE (sau GET/POST setup) */
  const [canActivateServer, setCanActivateServer] = useState(false);
  const [activateBlockReason, setActivateBlockReason] = useState<string | null>(
    null,
  );
  const [activateMissing, setActivateMissing] = useState<string[]>([]);
  const [activateChecklist, setActivateChecklist] = useState<
    ConsentActivateChecklistItem[]
  >([]);

  const applySetup = useCallback((data: ConsentAdminSetup) => {
    setTitle(data.title ?? "");
    setBodyHtml(data.body_html ?? "");
    setCompanyName(data.company_name ?? "");
    setCompanyTaxCode(data.company_tax_code ?? "");
    setCompanyAddress(data.company_address ?? "");
    setSignatureUrl(data.company_signature_url);
    setContractPdfUrl(data.contract_pdf_url ?? null);
    setSignaturePreview(
      resolveConsentMediaUrl(data.company_signature_url) ?? "",
    );
    setSignatureFile(null);
    setContractPdfFile(null);
    setClearContractPdf(false);
    setIsActivated(Boolean(data.is_activated));
    setActivatedAt(data.activated_at);
    setHasContractPdfServer(
      data.has_contract_pdf ?? Boolean(data.contract_pdf_url),
    );
    setNotifyAccountId(
      data.notify_zalo_account_id ?? data.notify_zalo_account?.id ?? null,
    );
    setNotifyGroupId((data.notify_group_id || "").trim());
    setNotifyGroupName((data.notify_group_name || "").trim());
    setCanActivateServer(Boolean(data.can_activate));
    setActivateBlockReason(data.activate_block_reason ?? null);
    setActivateMissing(
      Array.isArray(data.activate_missing) ? data.activate_missing : [],
    );
    setActivateChecklist(
      Array.isArray(data.activate_checklist) ? data.activate_checklist : [],
    );
  }, []);

  const loadGroups = useCallback(async (accountId: number) => {
    setGroupsLoading(true);
    try {
      // detail: true → không gửi type=simple → đủ name/avatar/total_member
      // (type=simple chỉ trả id + name tối thiểu)
      const page = await zaloGroupService.list({
        accountId,
        page: 1,
        pageSize: 200,
        detail: true,
      });
      setGroups(page.results ?? []);
    } catch (error) {
      setGroups([]);
      toast.error(getApiErrorMessage(error));
    } finally {
      setGroupsLoading(false);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setAccountsLoading(true);
    try {
      const [data, accounts] = await Promise.all([
        consentService.getAdminSetup(),
        zaloAccountService.list().catch(() => [] as ZaloAccount[]),
      ]);
      applySetup(data);
      const activeAccounts = accounts.filter((a) => a.checkpoint !== true);
      setZaloAccounts(activeAccounts);

      const accountId =
        data.notify_zalo_account_id ?? data.notify_zalo_account?.id ?? null;
      if (accountId) {
        await loadGroups(accountId);
      } else {
        setGroups([]);
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setLoading(false);
      setAccountsLoading(false);
    }
  }, [applySetup, loadGroups]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!contractPdfFile) {
      setPreviewLocalPdfUrl(null);
      return;
    }
    const url = URL.createObjectURL(contractPdfFile);
    setPreviewLocalPdfUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [contractPdfFile]);

  const handleScanResult = useCallback(
    (result: ScanTaskResponse) => {
      const status = getScanTaskStatus(result);
      if (!isScanTaskDone(status)) return;
      setIsScanning(false);
      setScanTaskId(null);
      if (status === "SUCCESS") {
        toast.success("Đã quét lại danh sách nhóm.");
        if (notifyAccountId) void loadGroups(notifyAccountId);
      } else {
        toast.error(result.message || result.error || "Quét nhóm thất bại.");
      }
    },
    [loadGroups, notifyAccountId],
  );

  useScanTaskPoll({
    taskId: scanTaskId,
    poll: zaloGroupService.pollScanResult,
    onResult: handleScanResult,
  });

  const handleSelectAccount = (accountId: number) => {
    const next = notifyAccountId === accountId ? null : accountId;
    setNotifyAccountId(next);
    setNotifyGroupId("");
    setNotifyGroupName("");
    setGroups([]);
    if (next) void loadGroups(next);
  };

  const handleSelectGroup = (group: ZaloGroupItem) => {
    const gid = String(group.id);
    if (notifyGroupId === gid) {
      setNotifyGroupId("");
      setNotifyGroupName("");
      return;
    }
    setNotifyGroupId(gid);
    setNotifyGroupName((group.name || "").trim() || `Nhóm #${group.id}`);
  };

  const handleReloadGroups = async () => {
    if (!notifyAccountId) {
      toast.error("Chọn nick Zalo trước khi quét nhóm.");
      return;
    }
    setIsScanning(true);
    try {
      const id = await zaloGroupService.startScan([notifyAccountId]);
      if (!id) {
        toast.error("Không nhận được mã tác vụ quét.");
        setIsScanning(false);
        return;
      }
      setScanTaskId(id);
      toast.info("Đang quét lại danh sách nhóm...");
    } catch (error) {
      setIsScanning(false);
      toast.error(getApiErrorMessage(error));
    }
  };

  const hasHtmlLocal = !isQuillHtmlEmpty(bodyHtml);
  const hasPdfLocal =
    Boolean(contractPdfFile) ||
    (hasContractPdfServer && !clearContractPdf && Boolean(contractPdfUrl));
  const hasContent = hasHtmlLocal || hasPdfLocal;
  const hasSignature = Boolean(signatureUrl || signatureFile);
  const hasCompanyName = Boolean(companyName.trim());
  const hasCompanyTax = Boolean(companyTaxCode.trim());
  const hasCompanyAddress = Boolean(companyAddress.trim());
  const hasNotifyAccount = notifyAccountId != null;
  const hasNotifyGroup = Boolean(notifyGroupId.trim());

  /** Preview checklist local (chưa save) — khớp BE activate_checklist */
  const localChecklist = useMemo((): ConsentActivateChecklistItem[] => {
    return [
      {
        key: "terms",
        ok: hasContent,
        message: hasContent
          ? "Đã có nội dung hợp đồng"
          : "Chưa có nội dung hợp đồng (soạn rich text hoặc upload PDF)",
      },
      {
        key: "company_name",
        ok: hasCompanyName,
        message: hasCompanyName
          ? "Đã có tên công ty (bên A)"
          : "Chưa nhập tên công ty (bên A)",
      },
      {
        key: "company_tax_code",
        ok: hasCompanyTax,
        message: hasCompanyTax
          ? "Đã có MST công ty"
          : "Chưa nhập mã số thuế công ty (bên A)",
      },
      {
        key: "company_address",
        ok: hasCompanyAddress,
        message: hasCompanyAddress
          ? "Đã có địa chỉ công ty"
          : "Chưa nhập địa chỉ công ty (bên A)",
      },
      {
        key: "company_signature",
        ok: hasSignature,
        message: hasSignature
          ? "Đã có ảnh chữ ký + con dấu bên A"
          : "Chưa upload ảnh chữ ký kèm con dấu bên A",
      },
      {
        key: "notify_zalo_account",
        ok: hasNotifyAccount,
        message: hasNotifyAccount
          ? "Đã chọn nick gửi thông báo"
          : "Chưa chọn nick Zalo gửi thông báo nhóm",
      },
      {
        key: "notify_group",
        ok: hasNotifyGroup,
        message: hasNotifyGroup
          ? "Đã chọn nhóm nhận thông báo"
          : "Chưa chọn nhóm nhận thông báo (sau khi chọn nick)",
      },
    ];
  }, [
    hasContent,
    hasCompanyName,
    hasCompanyTax,
    hasCompanyAddress,
    hasSignature,
    hasNotifyAccount,
    hasNotifyGroup,
  ]);

  const localMissing = localChecklist
    .filter((i) => !i.ok)
    .map((i) => i.message);
  const canActivateLocal = localMissing.length === 0;
  /**
   * Disable nút khi form local thiếu (F11).
   * Khi bấm Kích hoạt: save → đọc `can_activate` BE; 400 CONSENT_SETUP_INCOMPLETE → refresh checklist.
   */
  const formDirtyUploads = Boolean(signatureFile || contractPdfFile);
  const displayChecklist =
    formDirtyUploads || activateChecklist.length === 0
      ? localChecklist
      : activateChecklist;
  const displayMissing =
    formDirtyUploads || activateMissing.length === 0
      ? localMissing
      : activateMissing;
  const displayBlockReason = !canActivateLocal
    ? localMissing.length === 1
      ? localMissing[0]
      : `Chưa đủ cấu hình để kích hoạt: ${localMissing.join("; ")}`
    : activateBlockReason;
  // can_activate server chỉ tin cậy khi form đã save; local thiếu thì luôn disable
  const canActivate = canActivateLocal;

  const buildSavePayload = () => ({
    title: title.trim(),
    body_html: bodyHtml,
    company_name: companyName.trim(),
    company_tax_code: companyTaxCode.trim(),
    company_address: companyAddress.trim(),
    company_signature: signatureFile,
    contract_pdf: contractPdfFile,
    clear_contract_pdf: clearContractPdf && !contractPdfFile,
    notify_zalo_account_id: notifyAccountId,
    notify_group_id: notifyGroupId.trim() || null,
    notify_group_name: notifyGroupName.trim() || null,
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = await consentService.saveAdminSetup(buildSavePayload());
      toast.success("Đã lưu cấu hình đồng thuận.");
      applySetup(data);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async () => {
    // Không gọi activate khi thiếu setup (tránh spam 400)
    if (!canActivateLocal) {
      toast.error(
        displayBlockReason ||
          "Chưa đủ cấu hình để kích hoạt. Kiểm tra checklist bên dưới.",
      );
      return;
    }

    const ok = await confirm({
      title: "Kích hoạt yêu cầu ký?",
      message:
        "User chưa được duyệt sẽ bị chặn quét tin / chat. Tiếp tục?",
      confirmText: "Kích hoạt",
      cancelText: "Hủy",
      variant: "danger",
    });
    if (!ok) return;

    setActivating(true);
    try {
      // Lưu trước để BE có bản mới nhất
      const saved = await consentService.saveAdminSetup(buildSavePayload());
      applySetup(saved);

      if (saved.can_activate === false) {
        toast.error(
          saved.activate_block_reason ||
            "Chưa đủ cấu hình để kích hoạt. Xem checklist.",
        );
        return;
      }

      const data = await consentService.activate();
      applySetup(data);
      toast.success("Đã kích hoạt yêu cầu ký đồng thuận.");
    } catch (error) {
      const setupFromErr = extractSetupFromError(error);
      if (
        getApiErrorCode(error) === CONSENT_SETUP_INCOMPLETE ||
        setupFromErr
      ) {
        if (setupFromErr) applySetup(setupFromErr);
        toast.error(
          getApiErrorMessage(error) ||
            setupFromErr?.activate_block_reason ||
            "Chưa đủ cấu hình để kích hoạt.",
        );
      } else {
        toast.error(getApiErrorMessage(error));
      }
    } finally {
      setActivating(false);
    }
  };

  const handleDeactivate = async () => {
    const ok = await confirm({
      title: "Tắt kích hoạt?",
      message:
        "User sẽ chat bình thường dù chưa ký. Hồ sơ đã lưu vẫn được giữ.",
      confirmText: "Tắt kích hoạt",
      cancelText: "Hủy",
    });
    if (!ok) return;

    setDeactivating(true);
    try {
      const data = await consentService.deactivate();
      setIsActivated(Boolean(data.is_activated));
      toast.success("Đã tắt kích hoạt yêu cầu ký.");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setDeactivating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Badge size="sm" color={isActivated ? "success" : "light"}>
          {isActivated ? "Đang bật" : "Đang tắt"}
        </Badge>
        {activatedAt ? (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Kích hoạt lúc: {new Date(activatedAt).toLocaleString("vi-VN")}
          </span>
        ) : null}
        <p className="w-full text-sm text-gray-500 dark:text-gray-400">
          User ký và xác nhận → chờ duyệt. BE bắn @All vào nhóm đã chọn khi có
          hồ sơ mới.
        </p>
      </div>

      <div>
        <Label htmlFor="consent-title">Tiêu đề hợp đồng</Label>
        <Input
          id="consent-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Đồng thuận xử lý tin nhắn Zalo"
        />
      </div>

      <section className="space-y-3 rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
        <div>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">
            Soạn nội dung điều khoản
          </h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Soạn như văn bản. Hệ thống tự lưu định dạng.
          </p>
        </div>
        <ConsentRichTextEditor
          value={bodyHtml}
          onChange={setBodyHtml}
          disabled={saving}
        />
      </section>

      <section className="space-y-3 rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
        <ConsentPdfUploadField
          existingUrl={contractPdfUrl}
          file={contractPdfFile}
          clearExisting={clearContractPdf}
          disabled={saving}
          onSelect={(file) => {
            setContractPdfFile(file);
            setClearContractPdf(false);
          }}
          onClear={() => {
            setContractPdfFile(null);
            if (contractPdfUrl) setClearContractPdf(true);
          }}
          onError={(message) => toast.error(message)}
        />
      </section>

      <section className="space-y-4 rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">
          Thông tin / chữ ký bên A
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="consent-company-name">Tên công ty</Label>
            <Input
              id="consent-company-name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="consent-tax">Mã số thuế</Label>
            <Input
              id="consent-tax"
              value={companyTaxCode}
              onChange={(e) => setCompanyTaxCode(e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="consent-address">Địa chỉ</Label>
            <Input
              id="consent-address"
              value={companyAddress}
              onChange={(e) => setCompanyAddress(e.target.value)}
            />
          </div>
        </div>
        <div className="max-w-md">
          <SettingsImageField
            label="Ảnh chữ ký + con dấu (ghép sẵn)"
            imagePath={signaturePreview}
            onSelect={(file) => {
              setSignatureFile(file);
              setSignaturePreview(URL.createObjectURL(file));
            }}
            required
          />
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Ghép chữ ký và con dấu thành 1 ảnh (PNG/JPG) rồi upload tại đây.
          </p>
        </div>
      </section>

      {/* Nick + nhóm thông báo — sau chữ ký bên A */}
      <section className="space-y-4 rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
        <div>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">
            Chọn nick và nhóm nhận thông báo hồ sơ mới
          </h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            1) Chọn nick → 2) Chọn nhóm (hoặc Quét lại nếu thiếu) → 3) Lưu /
            Kích hoạt.
          </p>
        </div>

        <div>
          <Label>1. Nick Zalo gửi tin nhóm</Label>
          {accountsLoading ? (
            <p className="py-4 text-center text-sm text-gray-500">
              Đang tải danh sách nick...
            </p>
          ) : zaloAccounts.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-500">
              Chưa có nick hoạt động. Thêm nick tại Quản lý tài khoản Zalo.
            </p>
          ) : (
            <div className="custom-scrollbar mt-2 max-h-48 space-y-2 overflow-y-auto rounded-xl border border-gray-200 p-2 dark:border-gray-700">
              {zaloAccounts.map((account) => {
                const selected = notifyAccountId === account.id;
                const name =
                  account.name?.trim() ||
                  account.phone_number?.trim() ||
                  `Nick #${account.id}`;
                return (
                  <button
                    key={account.id}
                    type="button"
                    disabled={saving}
                    onClick={() => handleSelectAccount(account.id)}
                    className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                      selected
                        ? "border-brand-300 bg-brand-50 dark:border-brand-500/40 dark:bg-brand-500/10"
                        : "border-transparent hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                    }`}
                  >
                    <ContactAvatar
                      name={name}
                      avatar={account.avatar}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-800 dark:text-white/90">
                        {name}
                      </p>
                      {account.phone_number ? (
                        <p className="truncate text-xs text-gray-500">
                          {account.phone_number}
                        </p>
                      ) : null}
                    </div>
                    {selected ? (
                      <Badge size="sm" color="success">
                        Đã chọn
                      </Badge>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label>2. Nhóm nhận @All</Label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!notifyAccountId || isScanning || saving}
              onClick={() => void handleReloadGroups()}
            >
              {isScanning ? "Đang quét..." : "Quét lại danh sách nhóm"}
            </Button>
          </div>

          {!notifyAccountId ? (
            <p className="mt-2 text-sm text-gray-500">
              Chọn nick ở bước 1 để tải danh sách nhóm.
            </p>
          ) : groupsLoading ? (
            <p className="mt-2 py-4 text-center text-sm text-gray-500">
              Đang tải nhóm...
            </p>
          ) : groups.length === 0 ? (
            <div className="mt-2 rounded-xl border border-dashed border-gray-300 px-4 py-6 text-center dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Chưa có nhóm — bấm <strong>Quét lại danh sách nhóm</strong>.
              </p>
            </div>
          ) : (
            <div className="custom-scrollbar mt-2 max-h-56 space-y-2 overflow-y-auto rounded-xl border border-gray-200 p-2 dark:border-gray-700">
              {groups.map((group) => {
                const gid = String(group.id);
                const selected = notifyGroupId === gid;
                const name = group.name?.trim() || `Nhóm #${group.id}`;
                return (
                  <button
                    key={group.id}
                    type="button"
                    disabled={saving}
                    onClick={() => handleSelectGroup(group)}
                    className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                      selected
                        ? "border-brand-300 bg-brand-50 dark:border-brand-500/40 dark:bg-brand-500/10"
                        : "border-transparent hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                    }`}
                  >
                    <ContactAvatar
                      name={name}
                      avatar={group.avatar || group.avt}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-800 dark:text-white/90">
                        {name}
                      </p>
                      {group.total_member != null ? (
                        <p className="text-xs text-gray-500">
                          {group.total_member} thành viên
                        </p>
                      ) : null}
                    </div>
                    {selected ? (
                      <Badge size="sm" color="success">
                        Đã chọn
                      </Badge>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}

          {notifyGroupId ? (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Đang chọn:{" "}
              <span className="font-medium text-gray-700 dark:text-gray-200">
                {notifyGroupName || notifyGroupId}
              </span>
            </p>
          ) : null}
        </div>
      </section>

      {/* Checklist kích hoạt — BE can_activate / activate_checklist */}
      <section className="space-y-3 rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">
            Điều kiện kích hoạt
          </h3>
          <Badge size="sm" color={canActivate ? "success" : "warning"}>
            {canActivate ? "Đủ điều kiện" : "Chưa đủ"}
          </Badge>
        </div>
        {displayBlockReason && !canActivate ? (
          <p className="text-sm text-warning-700 dark:text-warning-300">
            {displayBlockReason}
          </p>
        ) : null}
        <ul className="space-y-1.5">
          {displayChecklist.map((item) => (
            <li
              key={item.key}
              className={`flex items-start gap-2 text-sm ${
                item.ok
                  ? "text-success-700 dark:text-success-300"
                  : "text-gray-600 dark:text-gray-300"
              }`}
            >
              <span className="mt-0.5 shrink-0" aria-hidden>
                {item.ok ? "✓" : "○"}
              </span>
              <span>{item.message}</span>
            </li>
          ))}
        </ul>
        {displayMissing.length > 1 ? (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Còn thiếu: {displayMissing.join("; ")}
          </p>
        ) : null}
      </section>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => void handleSave()} disabled={saving}>
          {saving ? "Đang lưu..." : "Lưu cấu hình"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setPreviewOpen(true)}
          disabled={saving}
        >
          Xem trước
        </Button>
        {!isActivated ? (
          <Button
            size="sm"
            onClick={() => void handleActivate()}
            disabled={activating || saving || !canActivate}
            className="!bg-success-500 hover:!bg-success-600"
          >
            {activating ? "Đang kích hoạt..." : "Kích hoạt"}
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => void handleDeactivate()}
            disabled={deactivating || saving}
            className="!border-error-200 !text-error-600 dark:!border-error-500/30 dark:!text-error-400"
          >
            {deactivating ? "Đang tắt..." : "Tắt kích hoạt"}
          </Button>
        )}
      </div>

      <Modal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        showCloseButton
        className="w-full max-w-2xl"
        layer="top"
      >
        <div className="max-h-[min(85dvh,640px)] overflow-y-auto p-5 sm:p-6">
          <ConsentTermsViewer
            title={title || "Xem trước điều khoản"}
            bodyHtml={bodyHtml}
            hasBodyHtml={hasHtmlLocal}
            contractPdfUrl={
              previewLocalPdfUrl ??
              (clearContractPdf ? null : contractPdfUrl)
            }
            hasContractPdf={hasPdfLocal}
            companyName={companyName}
            companyTaxCode={companyTaxCode}
            companyAddress={companyAddress}
            companySignatureUrl={signaturePreview || signatureUrl}
          />
        </div>
      </Modal>
    </div>
  );
}
