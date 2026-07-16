"use client";

import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import {
  CONTRACT_CONTENT_PAGE_COUNT,
  CONTRACT_PDF_URL,
  CONTRACT_SIGNATURE_PAGE_LAYOUT,
  CONTRACT_USER_SIGNATURE_SLOT,
} from "@/constants/contract";
import { toast } from "@/lib/toast";
import MessengerTermsDialog, {
  type MessengerTermsAcceptResult,
} from "@/components/zalo-messages/MessengerTermsDialog";
import { useCallback, useState } from "react";

export default function ContractPdfTestView() {
  const [signOpen, setSignOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [signerName, setSignerName] = useState("Nguyễn Văn Test");
  const [lastResult, setLastResult] = useState<string | null>(null);

  const handleAccept = useCallback(async (result: MessengerTermsAcceptResult) => {
    setLastResult(
      [
        `File: ${result.contractFilename}`,
        `Chữ ký: ${Math.round(result.signature.length / 1024)} KB (data URL)`,
        `PDF base64: ${Math.round(result.contractPdfBase64.length / 1024)} KB`,
      ].join("\n"),
    );

    toast.success(`PDF "${result.contractFilename}" đã tải về máy.`);
    setSignOpen(false);
    setViewOpen(false);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 dark:bg-gray-900 sm:px-6">
      <div className="mx-auto w-full max-w-5xl space-y-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Test hợp đồng PDF
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Không cần đăng nhập — test xem PDF và tải file đã ký. Trang{" "}
            {CONTRACT_CONTENT_PAGE_COUNT + 1} có khối Bên A / Bên B để căn chữ ký.
          </p>
          <p className="mt-1 font-mono text-xs text-gray-400">/dev/contract-pdf</p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 dark:border-amber-500/30 dark:bg-amber-500/10">
          <p className="text-sm text-amber-900 dark:text-amber-100">
            Trang test tách riêng, chưa gắn vào{" "}
            <code className="rounded bg-white/60 px-1 text-xs dark:bg-black/20">
              /zalo-messages
            </code>
            . Chỉnh tọa độ chữ ký trong{" "}
            <code className="rounded bg-white/60 px-1 text-xs dark:bg-black/20">
              src/constants/contract.ts
            </code>
            .
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="mb-4">
              <Label>Tên file tải về (test)</Label>
              <Input
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="Chỉ đặt tên file PDF — không in lên hợp đồng"
              />
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                &quot;Bên sử dụng phần mềm&quot;, tên, ngày ký đã có sẵn trên mẫu PDF.
                Hệ thống chỉ ghép ảnh chữ ký vào ô ký.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" onClick={() => setSignOpen(true)}>
                Ký và tải PDF
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setViewOpen(true)}
              >
                Xem mẫu PDF
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  window.open(CONTRACT_PDF_URL, "_blank", "noopener,noreferrer")
                }
              >
                Mở PDF tab mới
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Tọa độ trên PDF
            </h3>
            <pre className="custom-scrollbar mt-3 max-h-48 overflow-auto rounded-xl bg-gray-50 p-3 text-xs text-gray-700 dark:bg-gray-900 dark:text-gray-300">
              {JSON.stringify(
                {
                  signaturePage: CONTRACT_CONTENT_PAGE_COUNT + 1,
                  layout: CONTRACT_SIGNATURE_PAGE_LAYOUT,
                  overlaySlot: CONTRACT_USER_SIGNATURE_SLOT,
                },
                null,
                2,
              )}
            </pre>
          </div>
        </div>

        {lastResult ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Kết quả lần test gần nhất
            </h3>
            <pre className="mt-2 whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-400">
              {lastResult}
            </pre>
          </div>
        ) : null}
      </div>

      <MessengerTermsDialog
        open={signOpen}
        signerName={signerName}
        mandatory={false}
        onClose={() => setSignOpen(false)}
        onDisagree={() => {
          setSignOpen(false);
          toast.info("Đã hủy — không tải PDF.");
        }}
        onAccept={handleAccept}
      />

      <MessengerTermsDialog
        open={viewOpen}
        signerName={signerName}
        viewOnly
        mandatory={false}
        onClose={() => setViewOpen(false)}
        onAccept={handleAccept}
      />
    </div>
  );
}