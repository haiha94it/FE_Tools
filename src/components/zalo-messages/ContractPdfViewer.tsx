"use client";

import { prepareContractPdfBytes } from "@/lib/contract-pdf";
import { memo, useEffect, useState } from "react";

interface ContractPdfViewerProps {
  className?: string;
}

function ContractPdfViewer({ className = "" }: ContractPdfViewerProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const bytes = await prepareContractPdfBytes();
        if (cancelled) return;
        objectUrl = URL.createObjectURL(
          new Blob([bytes as BlobPart], { type: "application/pdf" }),
        );
        setPdfUrl(objectUrl);
      } catch (cause) {
        if (cancelled) return;
        console.error("[contract-pdf-viewer]", cause);
        setError("Không tải được hợp đồng PDF.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, []);

  return (
    <div
      className={`overflow-hidden rounded-xl border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-900 ${className}`.trim()}
    >
      {loading ? (
        <div className="flex h-[min(42dvh,380px)] items-center justify-center text-sm text-gray-500 dark:text-gray-400">
          Đang tải hợp đồng...
        </div>
      ) : error ? (
        <div className="flex h-[min(42dvh,380px)] items-center justify-center px-4 text-center text-sm text-error-600 dark:text-error-400">
          {error}
        </div>
      ) : (
        <iframe
          src={`${pdfUrl}#toolbar=0&navpanes=0`}
          title="Hợp đồng sử dụng phần mềm"
          className="h-[min(42dvh,380px)] w-full bg-white"
        />
      )}
    </div>
  );
}

export default memo(ContractPdfViewer);