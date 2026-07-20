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
import { confirm } from "@/lib/confirm";
import {
  isQuillHtmlEmpty,
  resolveConsentMediaUrl,
} from "@/lib/consent-utils";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { consentService } from "@/services/consent.service";
import { useCallback, useEffect, useState } from "react";

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

  const applySetup = useCallback(
    (data: Awaited<ReturnType<typeof consentService.getAdminSetup>>) => {
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
    },
    [],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await consentService.getAdminSetup();
      applySetup(data);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [applySetup]);

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

  const hasHtmlLocal = !isQuillHtmlEmpty(bodyHtml);
  const hasPdfLocal =
    Boolean(contractPdfFile) ||
    (hasContractPdfServer && !clearContractPdf && Boolean(contractPdfUrl));
  const hasContent = hasHtmlLocal || hasPdfLocal;
  const hasSignature = Boolean(signatureUrl || signatureFile);
  const canActivateLocal = hasContent && hasSignature;

  const handleSave = async () => {
    // Lưu nháp được — không bắt buộc A/B
    setSaving(true);
    try {
      const data = await consentService.saveAdminSetup({
        title: title.trim(),
        body_html: bodyHtml,
        company_name: companyName.trim(),
        company_tax_code: companyTaxCode.trim(),
        company_address: companyAddress.trim(),
        company_signature: signatureFile,
        contract_pdf: contractPdfFile,
        clear_contract_pdf: clearContractPdf && !contractPdfFile,
      });
      toast.success("Đã lưu cấu hình đồng thuận.");
      applySetup(data);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async () => {
    if (!canActivateLocal) {
      toast.error(
        "Cần soạn điều khoản (rich text hoặc PDF) và 1 ảnh chữ ký + con dấu công ty trước khi kích hoạt.",
      );
      return;
    }

    const ok = await confirm({
      title: "Kích hoạt yêu cầu ký?",
      message:
        "User chưa ký sẽ bị chặn quét tin / chat. Tiếp tục?",
      confirmText: "Kích hoạt",
      cancelText: "Hủy",
      variant: "danger",
    });
    if (!ok) return;

    setActivating(true);
    try {
      // Lưu trước để BE có bản mới nhất (nếu user vừa sửa chưa save)
      const saved = await consentService.saveAdminSetup({
        title: title.trim(),
        body_html: bodyHtml,
        company_name: companyName.trim(),
        company_tax_code: companyTaxCode.trim(),
        company_address: companyAddress.trim(),
        company_signature: signatureFile,
        contract_pdf: contractPdfFile,
        clear_contract_pdf: clearContractPdf && !contractPdfFile,
      });
      applySetup(saved);

      const data = await consentService.activate();
      setIsActivated(Boolean(data.is_activated));
      setActivatedAt(data.activated_at);
      toast.success("Đã kích hoạt yêu cầu ký đồng thuận.");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setActivating(false);
    }
  };

  const handleDeactivate = async () => {
    const ok = await confirm({
      title: "Tắt kích hoạt?",
      message:
        "User sẽ chat bình thường dù chưa ký. Chữ ký đã lưu vẫn được giữ.",
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
          Soạn điều khoản bằng rich text và/hoặc upload PDF. Chỉ cần một trong hai
          (cùng chữ ký/dấu CT) là kích hoạt được. Chưa bật → user chat bình thường.
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
            Ghép chữ ký và con dấu thành 1 ảnh (PNG/JPG) rồi upload tại đây. Hệ
            thống không tự đè dấu lên chữ ký.
          </p>
        </div>
      </section>

      {!hasContent ? (
        <p className="text-xs text-warning-600 dark:text-warning-400">
          Kích hoạt cần ít nhất rich text hoặc PDF hợp đồng.
        </p>
      ) : null}
      {!hasSignature ? (
        <p className="text-xs text-warning-600 dark:text-warning-400">
          Kích hoạt cần 1 ảnh chữ ký + con dấu công ty (ghép sẵn).
        </p>
      ) : null}

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
            disabled={activating || saving || !canActivateLocal}
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
