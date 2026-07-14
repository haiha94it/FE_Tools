"use client";

import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import { Modal } from "@/components/ui/modal";
import { useEffect, useMemo, useState } from "react";
import {
  getZaloCookieValidationMessage,
  parseZaloCookieInput,
  resolveZaloCookieProxy,
  type ZaloCookieAccountPayload,
} from "@/lib/zalo-account-cookie-utils";

type AddMode = "qr" | "cookie";

interface AddAccountDialogProps {
  isOpen: boolean;
  isRelogin: boolean;
  qrProxy: string;
  qrImage: string | null;
  qrCountdown: number;
  cookieLoading: boolean;
  cookieTaskId: string | number | null;
  canSkipProxy?: boolean;
  onClose: () => void;
  onQrProxyChange: (value: string) => void;
  onSendQr: () => void;
  onSubmitCookie: (payload: ZaloCookieAccountPayload) => void;
}

export default function AddAccountDialog({
  isOpen,
  isRelogin,
  qrProxy,
  qrImage,
  qrCountdown,
  cookieLoading,
  cookieTaskId,
  canSkipProxy = false,
  onClose,
  onQrProxyChange,
  onSendQr,
  onSubmitCookie,
}: AddAccountDialogProps) {
  const [addMode, setAddMode] = useState<AddMode>("qr");
  const [cookieInput, setCookieInput] = useState("");
  const [cookieError, setCookieError] = useState<string | null>(null);

  const isCookieBusy = cookieLoading || Boolean(cookieTaskId);
  const hasProxy = Boolean(qrProxy.trim());

  const parsedPreview = useMemo(
    () => parseZaloCookieInput(cookieInput)[0] ?? null,
    [cookieInput],
  );

  const needsCookieProxy = Boolean(
    !canSkipProxy &&
      parsedPreview &&
      (parsedPreview.imei || parsedPreview.cookie) &&
      !parsedPreview.proxy.trim(),
  );

  useEffect(() => {
    if (!isOpen) {
      setAddMode("qr");
      setCookieInput("");
      setCookieError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isRelogin) setAddMode("qr");
  }, [isRelogin]);

  const handleSubmitCookie = () => {
    const payloads = parseZaloCookieInput(cookieInput);
    const validation = getZaloCookieValidationMessage(payloads, {
      fallbackProxy: qrProxy,
      requireProxy: !canSkipProxy,
    });

    if (validation) {
      setCookieError(validation);
      return;
    }

    const first = payloads[0];
    onSubmitCookie({
      ...first,
      proxy: resolveZaloCookieProxy(first, qrProxy),
    });
    setCookieError(null);
  };

  const title = isRelogin
    ? "Đăng nhập lại Zalo bằng QR"
    : "Thêm tài khoản Zalo";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-[584px] p-5 lg:p-10"
      showCloseButton={!isCookieBusy}
    >
      <h4 className="mb-2 text-lg font-medium text-gray-800 dark:text-white/90">
        {title}
      </h4>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
        {isRelogin || addMode === "qr"
          ? "Quét mã QR bằng app Zalo để đăng nhập."
          : "Dán dữ liệu cookie từ extension Chốt Nhanh."}
      </p>

      {!isRelogin && (
        <div className="mb-6 flex gap-2">
          <Button
            size="sm"
            variant={addMode === "qr" ? "primary" : "outline"}
            onClick={() => setAddMode("qr")}
            disabled={isCookieBusy}
          >
            Quét QR
          </Button>
          <Button
            size="sm"
            variant={addMode === "cookie" ? "primary" : "outline"}
            onClick={() => setAddMode("cookie")}
            disabled={isCookieBusy}
          >
            Nhập Cookie
          </Button>
        </div>
      )}

      {(addMode === "qr" || isRelogin) && (
        <div className="space-y-5">
          <div>
            <Label>
              Proxy {!canSkipProxy && <span className="text-error-500">*</span>}
            </Label>
            <Input
              type="text"
              value={qrProxy}
              onChange={(e) => onQrProxyChange(e.target.value)}
              placeholder="host:port hoặc host:port:user:pass"
              hint={
                !canSkipProxy && !hasProxy
                  ? "Bắt buộc nhập proxy trước khi lấy mã QR."
                  : canSkipProxy
                    ? "Không bắt buộc với tài khoản quản trị/sale."
                    : undefined
              }
              error={!canSkipProxy && !hasProxy}
            />
          </div>

          <Button
            className="w-full"
            onClick={onSendQr}
            disabled={!canSkipProxy && !hasProxy}
          >
            Lấy mã QR
          </Button>

          {qrImage && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 text-center dark:border-gray-700 dark:bg-gray-800/50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrImage}
                alt="QR đăng nhập Zalo"
                className="mx-auto h-64 w-64 rounded-lg bg-white object-contain p-2 shadow-theme-xs"
              />
              <p className="mt-4 text-sm font-medium text-gray-800 dark:text-white/90">
                Còn {qrCountdown}s
              </p>
              <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
                Dùng app Zalo quét QR và xác nhận đăng nhập.
              </p>
            </div>
          )}
        </div>
      )}

      {addMode === "cookie" && !isRelogin && (
        <div className="space-y-5">
          <div>
            <Label>Dữ liệu cookie</Label>
            <TextArea
              rows={7}
              value={cookieInput}
              onChange={(value) => {
                setCookieInput(value);
                if (cookieError) setCookieError(null);
              }}
              placeholder="imei | proxy | cookie | user_agent"
              disabled={isCookieBusy}
              hint="Mỗi dòng một tài khoản. Hệ thống xử lý dòng đầu tiên."
              className="font-mono text-xs"
            />
          </div>

          {needsCookieProxy && (
            <div>
              <Label>Proxy bổ sung</Label>
              <Input
                type="text"
                value={qrProxy}
                onChange={(e) => onQrProxyChange(e.target.value)}
                placeholder="host:port hoặc host:port:user:pass"
              />
            </div>
          )}

          {cookieError && (
            <Alert variant="error" title="Lỗi" message={cookieError} />
          )}

          {isCookieBusy && (
            <Alert
              variant="warning"
              title="Đang xử lý"
              message="Đang xử lý tài khoản, vui lòng chờ trong giây lát..."
            />
          )}

          <Button
            className="w-full"
            onClick={handleSubmitCookie}
            disabled={isCookieBusy || (needsCookieProxy && !hasProxy)}
          >
            {cookieLoading
              ? "Đang gửi..."
              : cookieTaskId
                ? "Đang xử lý..."
                : "Lưu tài khoản"}
          </Button>
        </div>
      )}
    </Modal>
  );
}