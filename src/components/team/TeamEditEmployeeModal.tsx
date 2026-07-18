"use client";

import Input from "@/components/form/input/InputField";
import PasswordInput from "@/components/form/input/PasswordInput";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { validatePassword } from "@/lib/auth-validation";
import { confirm } from "@/lib/confirm";
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
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open || !employee) return;
    setFullname(employee.fullname?.trim() ?? "");
    setPassword("");
    setErrors({});
  }, [employee, open]);

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!fullname.trim()) next.fullname = "Vui lòng nhập họ tên nhân viên";
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
    const label = employee.fullname?.trim() || employee.username;
    const ok = await confirm({
      title: "Xóa nhân viên",
      message: `Xóa nhân viên "${label}" (@${employee.username})? Nick gán và quyền chiến dịch sẽ bị gỡ. Hành động không thể hoàn tác.`,
      confirmText: "Xóa",
      variant: "danger",
    });
    if (!ok) return;

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

  const assignedCount =
    employee?.account_count ?? employee?.logged_account_count ?? 0;
  const packageLimit = employee?.account_limit ?? 0;

  return (
    <Modal isOpen={open} onClose={onClose} layer="top" className="max-w-lg p-5 sm:p-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
        Sửa nhân viên
      </h3>
      {employee ? (
        <p className="mt-1 text-sm text-gray-500">
          @{employee.username}
          {` · Đã gán ${assignedCount} · Gói quản lý ${packageLimit}`}
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
            {employee && (employee.raw_password || employee.password)
              ? `Mật khẩu mới (hiện tại: ${employee.raw_password || employee.password})`
              : "Mật khẩu mới (tùy chọn)"}
          </label>
          <PasswordInput
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Để trống nếu không đổi"
            error={Boolean(errors.password)}
            hint={errors.password}
            autoComplete="new-password"
          />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap justify-between gap-3">
        <Button
          variant="outline"
          onClick={() => void handleDelete()}
          disabled={deleting || submitting}
          className="text-error-600 hover:text-error-700"
        >
          {deleting ? "Đang xóa..." : "Xóa"}
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={submitting || deleting}>
            Hủy
          </Button>
          <Button
            onClick={() => void handleSave()}
            disabled={submitting || deleting}
          >
            {submitting ? "Đang lưu..." : "Lưu"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
