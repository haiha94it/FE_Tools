"use client";

import { getDataFbAccount } from "@/lib/zalo-video/session";
import useZaloVideoWebSocket from "@/lib/zalo-video/websocket-compat";
import { useZaloVideoStore } from "@/stores/use-zalo-video-store";
import { useEffect, useRef, useState } from "react";

interface VideoCreatorQrPanelProps {
  accountId: number;
}

export default function VideoCreatorQrPanel({ accountId }: VideoCreatorQrPanelProps) {
  const { socketRef, imageQrSCan } = useZaloVideoWebSocket();
  const fetchAccounts = useZaloVideoStore((s) => s.fetchAccounts);
  const activateAccount = useZaloVideoStore((s) => s.activateAccount);

  const account = getDataFbAccount(accountId);
  const label = account?.name?.trim() || `Tài khoản #${accountId}`;
  const qrImage = imageQrSCan?.qr ?? "";
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!qrImage) return;
    setCountdown(60);
    const timer = window.setInterval(() => {
      setCountdown((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [qrImage]);

  const lastQrResultRef = useRef<unknown>(null);

  useEffect(() => {
    if (!imageQrSCan?.result) return;
    if (lastQrResultRef.current === imageQrSCan.result) return;

    lastQrResultRef.current = imageQrSCan.result;
    void fetchAccounts();
    void activateAccount(accountId, { force: true });
  }, [imageQrSCan?.result, accountId, fetchAccounts, activateAccount]);

  const requestQr = () => {
    socketRef.current.send(
      JSON.stringify({
        command: "login_qr",
        proxy: account?.proxy?.proxy,
      }),
    );
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-4 sm:p-8">
      <div className="max-w-sm text-center">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Quét mã QR
        </h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Quét mã để xác thực kênh video của{" "}
          <strong className="text-gray-700 dark:text-gray-200">{label}</strong>
        </p>

        {qrImage && qrImage !== "timeout" ? (
          <div className="mt-6">
            <img
              src={qrImage}
              alt="Mã QR Zalo"
              className="mx-auto rounded-xl border border-gray-200 shadow-theme-sm dark:border-gray-700"
              width={220}
              height={220}
            />
            <p
              className={`mt-3 text-sm font-medium ${
                countdown === 0 ? "text-error-500" : "text-brand-600"
              }`}
            >
              {countdown === 0
                ? "Mã QR đã hết hạn"
                : `Mã QR hết hạn sau ${countdown}s`}
            </p>
          </div>
        ) : (
          <div className="mt-6 flex h-[220px] items-center justify-center rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
            <p className="text-sm text-gray-400">Chưa có mã QR</p>
          </div>
        )}

        <div className="mt-6 flex justify-center gap-3">
          {(!qrImage || countdown === 0) && (
            <button
              type="button"
              onClick={requestQr}
              className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600"
            >
              Lấy mã QR
            </button>
          )}
        </div>
      </div>
    </div>
  );
}