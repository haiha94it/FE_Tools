"use client";

import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { LockIcon, CheckCircleIcon } from "@/icons";
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
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400">
            <LockIcon className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">Bảo mật</h3>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              Cập nhật mật khẩu đăng nhập của bạn
            </p>
          </div>
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
        <div className="flex flex-wrap items-center gap-4 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <CheckCircleIcon className="size-4 text-success-500" />
            Mật khẩu được mã hóa và bảo vệ an toàn
          </div>
        </div>
      ) : (
        <div className="space-y-4 px-5 py-5 sm:px-6">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Mật khẩu hiện tại
            </span>
            <Input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Nhập mật khẩu hiện tại"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Mật khẩu mới
            </span>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Tối thiểu 8 ký tự"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Nhập lại mật khẩu mới
            </span>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Xác nhận mật khẩu mới"
            />
            {passwordMismatch ? (
              <p className="text-xs text-error-600">Mật khẩu xác nhận chưa khớp.</p>
            ) : null}
          </label>
          <div className="flex flex-wrap justify-end gap-3 pt-1">
            <Button
              variant="outline"
              onClick={() => {
                resetForm();
                setExpanded(false);
              }}
              disabled={saving}
            >
              Hủy
            </Button>
            <Button onClick={() => void handleSave()} disabled={saving || !isValid}>
              {saving ? "Đang cập nhật…" : "Cập nhật mật khẩu"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}