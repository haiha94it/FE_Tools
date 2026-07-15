"use client";

import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { validatePassword } from "@/lib/auth-validation";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { teamPermissionsService } from "@/services/team-permissions.service";
import type { TeamEmployee } from "@/types/team-collaboration";
import { useEffect, useState } from "react";

interface TeamEditEmployeeModalProps {
  employee: TeamEmployee | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function TeamEditEmployeeModal({
  employee,
  open,
  onClose,
  onSaved,
}: TeamEditEmployeeModalProps) {
  const [fullname, setFullname] = useState("");
  const [accountLimit, setAccountLimit] = useState("");
  const [listenerLimit, setListenerLimit] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    if (!open || !employee) return;
    setFullname(employee.fullname?.trim() ?? "");
    setAccountLimit(String(employee.account_limit ?? 0));
    setListenerLimit(String(employee.listener_limit ?? 0));
    setPassword("");
    setErrors({});
  }, [employee, open]);

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!fullname.trim()) next.fullname = "Vui lòng nhập họ tên nhân viên";
    if (!/^\d+$/.test(accountLimit) || Number(accountLimit) < 0) {
      next.account_limit = "Số lượng nick phải là số nguyên không âm";
    }
    if (!/^\d+$/.test(listenerLimit) || Number(listenerLimit) < 0) {
      next.listener_limit = "Số listener phải là số nguyên không âm";
    }
    if (password.trim()) {
      const passwordError = validatePassword(password);
      if (passwordError) next.password = passwordError;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!employee || !validate()) return;
    setSubmitting(true);
    try {
      await teamPermissionsService.editEmployee({
        id_employee: employee.id,
        fullname: fullname.trim(),
        account_limit: Number(accountLimit),
        listener_limit: Number(listenerLimit),
        ...(password.trim() ? { password } : {}),
      });
      toast.success("Đã cập nhật nhân viên.");
      onSaved();
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!employee) return;
    const confirmed = window.confirm(
      `Xóa nhân viên "${employee.fullname || employee.username}"? Hành động không thể hoàn tác.`,
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      await teamPermissionsService.deleteEmployee(employee.id);
      toast.success("Đã xóa nhân viên.");
      onSaved();
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  };

  const handleActivate = async () => {
    if (!employee) return;
    setActivating(true);
    try {
      await teamPermissionsService.activeEmployee(employee.id);
      toast.success("Đã gia hạn nhân viên.");
      onSaved();
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setActivating(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} layer="top" className="max-w-lg p-5 sm:p-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
        Sửa nhân viên
      </h3>
      {employee ? (
        <p className="mt-1 text-sm text-gray-500">
          @{employee.username}
          {employee.logged_account_count != null
            ? ` · Đang đăng nhập ${employee.logged_account_count} nick`
            : ""}
        </p>
      ) : null}

      <div className="mt-5 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Họ tên
          </label>
          <Input
            value={fullname}
            onChange={(e) => setFullname(e.target.value)}
            placeholder="Họ tên nhân viên"
            error={Boolean(errors.fullname)}
            hint={errors.fullname}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Giới hạn nick Zalo
          </label>
          <Input
            value={accountLimit}
            onChange={(e) => {
              const value = e.target.value;
              if (/^\d*$/.test(value)) setAccountLimit(value);
            }}
            placeholder="0"
            error={Boolean(errors.account_limit)}
            hint={errors.account_limit}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Giới hạn listener
          </label>
          <Input
            value={listenerLimit}
            onChange={(e) => {
              const value = e.target.value;
              if (/^\d*$/.test(value)) setListenerLimit(value);
            }}
            placeholder="0"
            error={Boolean(errors.listener_limit)}
            hint={errors.listener_limit}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Mật khẩu mới (tùy chọn)
          </label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Để trống nếu không đổi"
            error={Boolean(errors.password)}
            hint={errors.password}
          />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => void handleActivate()}
            disabled={activating || submitting || deleting}
          >
            Gia hạn
          </Button>
          <Button
            variant="outline"
            onClick={() => void handleDelete()}
            disabled={deleting || submitting || activating}
            className="text-error-600 hover:text-error-700"
          >
            Xóa
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button
            onClick={() => void handleSave()}
            disabled={submitting || deleting || activating}
          >
            Lưu
          </Button>
        </div>
      </div>
    </Modal>
  );
}