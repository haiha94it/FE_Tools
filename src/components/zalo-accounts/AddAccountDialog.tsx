"use client";

import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import { Modal } from "@/components/ui/modal";
import CustomSelect from "@/components/form/CustomSelect";
import {
  getZaloCookieValidationMessage,
  parseZaloCookieInput,
  resolveZaloCookieProxy,
  type ZaloCookieAccountPayload,
} from "@/lib/zalo-account-cookie-utils";
import {
  formatZaloProxyOptionLabel,
  getActiveZaloProxies,
  getZaloProxyDisplayValue,
} from "@/lib/zalo-proxy-utils";
import type { ZaloProxyItem } from "@/types/zalo-proxy";
import Link from "next/link";
import { useMemo, useState } from "react";

type AddMode = "qr" | "cookie";

interface AddAccountDialogProps {
  isOpen: boolean;
  isRelogin: boolean;
  qrProxy: string;
  qrImage: string | null;
  qrCountdown: number;
  cookieLoading: boolean;
  cookieTaskId: string | number | null;
  proxies: ZaloProxyItem[];
  isLoadingProxies: boolean;
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
  proxies,
  isLoadingProxies,
  canSkipProxy = false,
  onClose,
  onQrProxyChange,
  onSendQr,
  onSubmitCookie,
}: AddAccountDialogProps) {
  const [addMode, setAddMode] = useState<AddMode>("qr");
  const [cookieInput, setCookieInput] = useState("");
  const [manualProxyInput, setManualProxyInput] = useState("");
  const [cookieError, setCookieError] = useState<string | null>(null);

  const activeMode: AddMode = isRelogin ? "qr" : addMode;
  const isCookieBusy = cookieLoading || Boolean(cookieTaskId);
  const hasProxy = Boolean(qrProxy.trim());
  const hasCookieProxy = Boolean(manualProxyInput.trim() || qrProxy.trim());
  const hasProxyForCurrentMode =
    activeMode === "cookie" ? hasCookieProxy : hasProxy;
  const activeProxies = useMemo(() => getActiveZaloProxies(proxies), [proxies]);

  const selectedProxyId = useMemo(() => {
    const current = qrProxy.trim();
    if (!current) return "";
    const matched = proxies.find(
      (item) => getZaloProxyDisplayValue(item) === current,
    );
    return matched ? String(matched.id) : "";
  }, [proxies, qrProxy]);

  const proxyOptions = useMemo(() => {
    const options = [
      ...(canSkipProxy
        ? [{ value: "", label: "Không dùng proxy" }]
        : []),
      ...activeProxies.map((item) => ({
        value: String(item.id),
        label: formatZaloProxyOptionLabel(item),
      })),
    ];

    // Relogin: proxy hiện tại có thể inactive — vẫn hiện trong dropdown
    if (
      qrProxy.trim() &&
      !options.some((opt) => opt.value === selectedProxyId)
    ) {
      const inactive = proxies.find(
        (item) => getZaloProxyDisplayValue(item) === qrProxy.trim(),
      );
      if (inactive) {
        options.push({
          value: String(inactive.id),
          label: `${formatZaloProxyOptionLabel(inactive)} (không hoạt động)`,
        });
      } else {
        options.push({
          value: `__custom__${qrProxy.trim()}`,
          label: `${qrProxy.trim()} (từ tài khoản)`,
        });
      }
    }

    return options;
  }, [activeProxies, canSkipProxy, proxies, qrProxy, selectedProxyId]);

  const parsedPreview = useMemo(
    () => parseZaloCookieInput(cookieInput)[0] ?? null,
    [cookieInput],
  );

  const cookieMissingProxy = Boolean(
    parsedPreview &&
      (parsedPreview.imei || parsedPreview.cookie) &&
      !parsedPreview.proxy.trim(),
  );
  const needsCookieProxy = !canSkipProxy && cookieMissingProxy;
  const cookieProxyIsExternal = Boolean(
    parsedPreview?.proxy.trim() &&
      !proxies.some(
        (item) =>
          getZaloProxyDisplayValue(item) === parsedPreview.proxy.trim(),
      ),
  );
  const manualProxyExists = Boolean(
    manualProxyInput.trim() &&
      proxies.some(
        (item) =>
          getZaloProxyDisplayValue(item) === manualProxyInput.trim(),
      ),
  );

  const handleProxySelect = (value: string) => {
    if (!value) {
      onQrProxyChange("");
      return;
    }
    setManualProxyInput("");
    if (value.startsWith("__custom__")) {
      onQrProxyChange(value.replace("__custom__", ""));
      return;
    }
    const proxy = proxies.find((item) => String(item.id) === value);
    onQrProxyChange(proxy ? getZaloProxyDisplayValue(proxy) : "");
  };

  const handleSubmitCookie = () => {
    const payloads = parseZaloCookieInput(cookieInput);
    const validation = getZaloCookieValidationMessage(payloads, {
      fallbackProxy: manualProxyInput.trim() || qrProxy,
      requireProxy: !canSkipProxy,
    });

    if (validation) {
      setCookieError(validation);
      return;
    }

    const first = payloads[0];
    onSubmitCookie({
      ...first,
      proxy: resolveZaloCookieProxy(
        first,
        manualProxyInput.trim() || qrProxy,
      ),
    });
    setCookieError(null);
  };

  const title = isRelogin
    ? "Đăng nhập lại Zalo bằng QR"
    : "Thêm tài khoản Zalo";

  const proxySelect = (
    <div>
      <Label>
        Proxy {!canSkipProxy && <span className="text-error-500">*</span>}
      </Label>
      <CustomSelect
        value={
          selectedProxyId ||
          (qrProxy.trim() ? `__custom__${qrProxy.trim()}` : "")
        }
        onChange={handleProxySelect}
        placeholder={
          isLoadingProxies ? "Đang tải proxy..." : "Chọn proxy từ danh sách"
        }
        disabled={isLoadingProxies || isCookieBusy}
        options={proxyOptions}
      />
      {!isLoadingProxies && activeProxies.length === 0 ? (
        <p className="mt-1.5 text-theme-xs text-warning-600 dark:text-warning-500">
          {canSkipProxy
            ? "Chưa có proxy hoạt động. Bạn có thể tiếp tục không chọn proxy."
            : "Chưa có proxy hoạt động. Vui lòng thêm proxy trước."}{" "}
          <Link
            href="/zalo-accounts/proxy"
            className="font-medium text-brand-600 underline-offset-2 hover:underline dark:text-brand-400"
          >
            Quản lý proxy
          </Link>
        </p>
      ) : !canSkipProxy && !hasProxyForCurrentMode ? (
        <p className="mt-1.5 text-theme-xs text-error-500">
          Bắt buộc chọn hoặc nhập proxy trước khi tiếp tục.
        </p>
      ) : canSkipProxy && !hasProxyForCurrentMode ? (
        <p className="mt-1.5 text-theme-xs text-gray-500 dark:text-gray-400">
          Không bắt buộc với tài khoản quản trị/sale.
        </p>
      ) : null}
    </div>
  );

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
        {activeMode === "qr"
          ? "Chọn proxy (nếu có), rồi quét mã QR bằng app Zalo để đăng nhập."
          : "Dán dữ liệu cookie từ extension Chốt Nhanh. Có thể chọn proxy bổ sung nếu dòng cookie thiếu proxy."}
      </p>

      {!isRelogin && (
        <div className="mb-6 flex gap-2">
          <Button
            size="sm"
            variant={activeMode === "qr" ? "primary" : "outline"}
            onClick={() => setAddMode("qr")}
            disabled={isCookieBusy}
          >
            Quét QR
          </Button>
          <Button
            size="sm"
            variant={activeMode === "cookie" ? "primary" : "outline"}
            onClick={() => setAddMode("cookie")}
            disabled={isCookieBusy}
          >
            Nhập Cookie
          </Button>
        </div>
      )}

      {activeMode === "qr" && (
        <div className="space-y-5">
          {proxySelect}

          <Button
            className="w-full"
            onClick={onSendQr}
            disabled={
              isLoadingProxies || (!canSkipProxy && !hasProxy)
            }
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

      {activeMode === "cookie" && (
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

          {cookieMissingProxy ? (
            <div className="space-y-3">
              {proxySelect}
              <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                hoặc
                <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
              </div>
              <div>
                <Label>Nhập proxy mới</Label>
                <Input
                  type="text"
                  value={manualProxyInput}
                  onChange={(event) => {
                    const value = event.target.value;
                    setManualProxyInput(value);
                    if (value.trim()) onQrProxyChange("");
                    if (cookieError) setCookieError(null);
                  }}
                  placeholder="IP:Port:Username:Password"
                  disabled={isCookieBusy}
                  hint={
                    manualProxyExists
                      ? "Proxy này đã có trên hệ thống và sẽ được dùng lại."
                      : "Proxy chưa có sẽ được tự động thêm với hạn dùng 1 tháng."
                  }
                />
              </div>
            </div>
          ) : null}

          {cookieProxyIsExternal ? (
            <Alert
              variant="info"
              title="Proxy mới"
              message="Proxy trong dòng cookie chưa có trên hệ thống. Hệ thống sẽ tự thêm proxy với hạn dùng 1 tháng trước khi thêm tài khoản."
            />
          ) : null}

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
            disabled={
              isCookieBusy ||
              isLoadingProxies ||
              (needsCookieProxy && !hasCookieProxy)
            }
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
