"use client";

import PasswordInput from "@/components/form/input/PasswordInput";
import Button from "@/components/ui/button/Button";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { CheckCircleIcon } from "@/icons";
import { authService } from "@/services/auth.service";
import { useState } from "react";

export default function AccountChangePasswordCard() {
  const [expanded, setExpanded] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const passwordMismatch =
    Boolean(newPassword) && Boolean(confirmPassword) && newPassword !== confirmPassword;
  const isValid =
    oldPassword.trim().length > 0 &&
    newPassword.trim().length >= 8 &&
    confirmPassword.trim().length >= 8 &&
    !passwordMismatch;

  const resetForm = () => {
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleSave = async () => {
    if (!isValid) {
      toast.error("Vui lòng nhập đầy đủ và xác nhận đúng mật khẩu mới (tối thiểu 8 ký tự).");
      return;
    }
    setSaving(true);
    try {
      await authService.changePassword(oldPassword, newPassword);
      toast.success("Đổi mật khẩu thành công.");
      resetForm();
      setExpanded(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 dark:border-gray-800 sm:px-5">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Bảo mật</h3>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            Cập nhật mật khẩu đăng nhập
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setExpanded((prev) => !prev);
            if (expanded) resetForm();
          }}
        >
          {expanded ? "Ẩn form" : "Đổi mật khẩu"}
        </Button>
      </div>

      {!expanded ? (
        <div className="flex items-center gap-2 px-4 py-3 text-xs text-gray-500 sm:px-5 sm:text-sm dark:text-gray-400">
          <CheckCircleIcon className="size-4 shrink-0 text-success-500" />
          Mật khẩu được mã hóa và bảo vệ an toàn
        </div>
      ) : (
        <div className="space-y-3 px-4 py-4 sm:px-5">
          <label className="block space-y-1">
            <span className="text-xs font-medium text-gray-700 sm:text-sm dark:text-gray-300">
              Mật khẩu hiện tại
            </span>
            <PasswordInput
              name="current-password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Nhập mật khẩu hiện tại"
              autoComplete="current-password"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1">
              <span className="text-xs font-medium text-gray-700 sm:text-sm dark:text-gray-300">
                Mật khẩu mới
              </span>
              <PasswordInput
                name="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Tối thiểu 8 ký tự"
                autoComplete="new-password"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-gray-700 sm:text-sm dark:text-gray-300">
                Nhập lại mật khẩu mới
              </span>
              <PasswordInput
                name="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Xác nhận mật khẩu mới"
                autoComplete="new-password"
              />
              {passwordMismatch ? (
                <p className="text-xs text-error-600">Mật khẩu xác nhận chưa khớp.</p>
              ) : null}
            </label>
          </div>
          <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                resetForm();
                setExpanded(false);
              }}
              disabled={saving}
            >
              Hủy
            </Button>
            <Button size="sm" onClick={() => void handleSave()} disabled={saving || !isValid}>
              {saving ? "Đang cập nhật…" : "Cập nhật mật khẩu"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
