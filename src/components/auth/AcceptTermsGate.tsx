"use client";

import Checkbox from "@/components/form/input/Checkbox";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { normalizeHtmlContent } from "@/lib/admin-settings-utils";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { popupService } from "@/services/popup.service";
import { useAuthStore } from "@/stores/use-auth-store";
import { memo, useCallback, useEffect, useState } from "react";

/**
 * Popup điều khoản đăng nhập lần đầu — logic ZaloCN ModalAcceptTerms.
 * user.accept_terms === false + popup term active → chặn; tick + Đồng ý → GET accept-terms.
 */
function AcceptTermsGate() {
  const user = useAuthStore((s) => s.user);
  const isBootstrapped = useAuthStore((s) => s.isBootstrapped);
  const isLoading = useAuthStore((s) => s.isLoading);
  const acceptTerms = useAuthStore((s) => s.acceptTerms);

  const [open, setOpen] = useState(false);
  const [contentHtml, setContentHtml] = useState("");
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingContent, setLoadingContent] = useState(false);

  const canDismiss = Boolean(user?.isAdmin);
  const needsAcceptance = Boolean(user && !user.acceptTerms);

  useEffect(() => {
    if (!isBootstrapped || !user) {
      setOpen(false);
      return;
    }
    if (user.acceptTerms) {
      setOpen(false);
      setChecked(false);
      return;
    }

    let cancelled = false;
    setLoadingContent(true);
    void (async () => {
      try {
        const term = await popupService.getTerm();
        if (cancelled) return;
        // active mặc định true nếu API chưa có field (tương thích DB cũ)
        const active = term?.active !== false;
        const html = normalizeHtmlContent(term?.content);
        setContentHtml(html);
        // ZaloCN: mở khi !accept_terms; thêm gate active admin
        setOpen(active && Boolean(html?.trim()));
      } catch {
        if (!cancelled) {
          // Lỗi load — vẫn mở nếu có user chưa accept (nội dung rỗng + toast khi đồng ý)
          setContentHtml("");
          setOpen(true);
        }
      } finally {
        if (!cancelled) setLoadingContent(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isBootstrapped, user]);

  const handleClose = useCallback(() => {
    // User thường không đóng được — giống ZaloCN closable=admin only
    if (canDismiss) setOpen(false);
  }, [canDismiss]);

  const handleAccept = useCallback(async () => {
    if (!checked) {
      toast.error("Vui lòng tick xác nhận đã đọc và đồng ý điều khoản.");
      return;
    }
    setSubmitting(true);
    try {
      await acceptTerms();
      setOpen(false);
      setChecked(false);
      toast.success("Đã xác nhận điều khoản sử dụng.");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }, [acceptTerms, checked]);

  if (!isBootstrapped || !user || !needsAcceptance) return null;
  if (!open) return null;

  return (
    <Modal
      isOpen={open}
      onClose={handleClose}
      showCloseButton={canDismiss}
      className="max-w-3xl p-5 sm:p-6"
      layer="top"
    >
      <h3 className="pr-10 text-lg font-semibold text-gray-800 dark:text-white/90">
        Điều khoản sử dụng
      </h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Vui lòng đọc và đồng ý để tiếp tục sử dụng hệ thống.
      </p>

      <div className="custom-scrollbar mt-4 max-h-[min(55vh,480px)] overflow-y-auto rounded-xl border border-gray-200 bg-gray-50/60 p-4 dark:border-gray-700 dark:bg-white/[0.02]">
        {loadingContent ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          </div>
        ) : contentHtml ? (
          <div
            className="dialog-quill prose prose-sm max-w-none text-gray-700 dark:prose-invert dark:text-gray-300"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        ) : (
          <p className="text-sm text-gray-500">
            Không tải được nội dung điều khoản. Liên hệ quản trị viên.
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="inline-flex cursor-pointer items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
          <span className="mt-0.5 shrink-0">
            <Checkbox checked={checked} onChange={setChecked} />
          </span>
          <span>
            Tôi đã đọc, hiểu rõ và đồng ý với toàn bộ nội dung thoả thuận
          </span>
        </label>
        <Button
          size="sm"
          onClick={() => void handleAccept()}
          disabled={!checked || submitting || isLoading}
          className={!checked ? "opacity-50" : undefined}
        >
          {submitting ? "Đang xác nhận..." : "Đồng ý"}
        </Button>
      </div>
    </Modal>
  );
}

export default memo(AcceptTermsGate);
