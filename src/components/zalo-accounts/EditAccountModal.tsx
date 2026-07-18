"use client";

import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import { Modal } from "@/components/ui/modal";
import CustomSelect from "@/components/form/CustomSelect";
import {
  formatZaloProxyOptionLabel,
  getActiveZaloProxies,
} from "@/lib/zalo-proxy-utils";
import type { ZaloAccount } from "@/types/zalo-account";
import type { ZaloProxyItem } from "@/types/zalo-proxy";

interface EditAccountModalProps {
  isOpen: boolean;
  account: ZaloAccount | null;
  note: string;
  password: string;
  proxyId: number | null;
  proxies: ZaloProxyItem[];
  isLoadingProxies: boolean;
  isSaving: boolean;
  canSkipProxy?: boolean;
  onNoteChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onProxyChange: (value: number | null) => void;
  onClose: () => void;
  onSave: () => void;
}

export default function EditAccountModal({
  isOpen,
  account,
  note,
  password,
  proxyId,
  proxies,
  isLoadingProxies,
  isSaving,
  canSkipProxy = false,
  onNoteChange,
  onPasswordChange,
  onProxyChange,
  onClose,
  onSave,
}: EditAccountModalProps) {
  if (!account) return null;

  const activeProxies = getActiveZaloProxies(proxies);
  const currentProxy = proxies.find((item) => item.id === proxyId);
  const showInactiveProxyWarning =
    Boolean(currentProxy) && currentProxy?.status !== true;

  const proxyOptions = [
    ...(canSkipProxy
      ? [{ value: "", label: "Không dùng proxy" }]
      : []),
    ...activeProxies.map((item) => ({
      value: String(item.id),
      label: formatZaloProxyOptionLabel(item),
    })),
    ...(showInactiveProxyWarning && currentProxy
      ? [
          {
            value: String(currentProxy.id),
            label: `${formatZaloProxyOptionLabel(currentProxy)} (không hoạt động)`,
          },
        ]
      : []),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-[720px] p-5 lg:p-10"
      showCloseButton={!isSaving}
    >
      <h4 className="mb-2 text-lg font-medium text-gray-800 dark:text-white/90">
        Chỉnh sửa thông tin
      </h4>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
        {canSkipProxy
          ? "Proxy không bắt buộc. Có thể cập nhật ghi chú hoặc mật khẩu rồi bấm Lưu."
          : 'Quy trình: Lựa chọn và thay đổi Proxy → Mật khẩu không cần nhập → Ghi chú nếu có → Bấm nút "Lưu dữ liệu"'}
      </p>

      <div className="space-y-5">
        {/*
          Chặn browser autofill: khi mở modal có password, Chrome hay
          nhét username vào ô tìm kiếm trang (vd. "admin") + password vào form.
        */}
        <div
          aria-hidden
          className="pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0"
        >
          <input type="text" name="prevent-autofill-user" tabIndex={-1} autoComplete="username" />
          <input
            type="password"
            name="prevent-autofill-pass"
            tabIndex={-1}
            autoComplete="current-password"
          />
        </div>

        <div>
          <Label>Tên tài khoản</Label>
          <Input
            type="text"
            name="zalo-account-display-name"
            value={account.name || ""}
            disabled
            readOnly
            placeholder="Chưa có tên"
            autoComplete="off"
          />
        </div>

        <div>
          <Label>
            Proxy {!canSkipProxy && <span className="text-error-500">*</span>}
          </Label>
          <CustomSelect
            value={proxyId != null ? String(proxyId) : ""}
            onChange={(value) =>
              onProxyChange(value ? Number(value) : null)
            }
            placeholder={
              isLoadingProxies ? "Đang tải proxy..." : "Chọn Proxy"
            }
            disabled={isLoadingProxies || isSaving}
            options={proxyOptions}
          />
          {!isLoadingProxies && activeProxies.length === 0 && (
            <p className="mt-1.5 text-theme-xs text-warning-600 dark:text-warning-500">
              {canSkipProxy
                ? "Chưa có proxy hoạt động. Bạn có thể lưu mà không chọn proxy."
                : "Chưa có proxy hoạt động. Vui lòng thêm proxy trước khi lưu."}
            </p>
          )}
        </div>

        <div>
          <Label>Mật khẩu</Label>
          <Input
            type="password"
            name="zalo-nick-password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder="Nhập mật khẩu nick Zalo này vào đây, sau đó bấm nút lưu dữ liệu"
            disabled={isSaving}
            autoComplete="new-password"
          />
        </div>

        <div>
          <Label>Ghi chú</Label>
          <Input
            type="text"
            name="zalo-account-note"
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder="Nhập ghi chú..."
            disabled={isSaving}
            autoComplete="off"
          />
        </div>

        {showInactiveProxyWarning && (
          <Alert
            variant="warning"
            title="Proxy hiện tại"
            message="Proxy đang gán cho tài khoản không còn hoạt động. Hãy chọn proxy khác trước khi lưu."
          />
        )}
      </div>

      <div className="mt-6 flex w-full items-center justify-end gap-3">
        <Button size="sm" variant="outline" onClick={onClose} disabled={isSaving}>
          Hủy
        </Button>
        <Button
          size="sm"
          onClick={onSave}
          disabled={
            isSaving || (!canSkipProxy && (!proxyId || isLoadingProxies))
          }
        >
          {isSaving ? "Đang lưu..." : "Lưu dữ liệu"}
        </Button>
      </div>
    </Modal>
  );
}