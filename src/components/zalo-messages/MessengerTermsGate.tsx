"use client";

import { toast } from "@/lib/toast";
import { useAuthStore } from "@/stores/use-auth-store";
import { useRouter } from "next/navigation";
import { memo, useCallback, useEffect, useState } from "react";
import MessengerTermsDialog, {
  type MessengerTermsAcceptResult,
} from "./MessengerTermsDialog";

/**
 * Chặn trang tin nhắn cho đến khi user ký hợp đồng PDF.
 * Admin có thể đóng modal để xem trước (đồng bộ ZaloCN).
 */
function MessengerTermsGate() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isBootstrapped = useAuthStore((s) => s.isBootstrapped);
  const isLoading = useAuthStore((s) => s.isLoading);
  const acceptTerms = useAuthStore((s) => s.acceptTerms);

  const [open, setOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const needsAcceptance = Boolean(user && !user.acceptTerms);
  const canDismiss = Boolean(user?.isAdmin);

  useEffect(() => {
    if (!isBootstrapped || !user) {
      setOpen(false);
      return;
    }
    setOpen(!user.acceptTerms);
  }, [isBootstrapped, user]);

  const handleAccept = useCallback(
    async (result: MessengerTermsAcceptResult) => {
      await acceptTerms({
        signature: result.signature,
        contractPdfBase64: result.contractPdfBase64,
        contractFilename: result.contractFilename,
      });
      setOpen(false);
      setPreviewOpen(false);
      toast.success(
        `Đã ký hợp đồng. File PDF "${result.contractFilename}" đã được tải về.`,
      );
    },
    [acceptTerms],
  );

  const handleDisagree = useCallback(() => {
    setOpen(false);
    setPreviewOpen(false);
    toast.info(
      "Bạn cần ký hợp đồng để sử dụng tin nhắn Zalo. Đã chuyển về trang tài khoản.",
    );
    router.push("/zalo-accounts");
  }, [router]);

  if (!isBootstrapped || !user) return null;

  return (
    <>
      {needsAcceptance ? (
        <div
          className="pointer-events-none absolute inset-0 z-20 rounded-2xl bg-gray-900/10 backdrop-blur-[1px] dark:bg-black/20"
          aria-hidden
        />
      ) : null}

      <MessengerTermsDialog
        open={open}
        signerName={user.name || user.username}
        mandatory={needsAcceptance && !canDismiss}
        submitting={isLoading}
        onClose={canDismiss ? () => setOpen(false) : undefined}
        onDisagree={handleDisagree}
        onAccept={handleAccept}
      />

      {user.acceptTerms ? (
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className="absolute right-3 top-3 z-30 hidden cursor-pointer rounded-lg border border-gray-200 bg-white/95 px-2.5 py-1 text-[11px] font-medium text-gray-600 shadow-sm transition hover:text-brand-600 dark:border-gray-700 dark:bg-gray-900/95 dark:text-gray-400 dark:hover:text-brand-400 lg:inline-flex"
        >
          Xem hợp đồng PDF
        </button>
      ) : null}

      <MessengerTermsDialog
        open={previewOpen}
        signerName={user.name || user.username}
        viewOnly
        mandatory={false}
        submitting={isLoading}
        onClose={() => setPreviewOpen(false)}
        onAccept={handleAccept}
      />
    </>
  );
}

export default memo(MessengerTermsGate);