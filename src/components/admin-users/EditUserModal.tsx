"use client";

import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import {
  USER_PERMISSION_CREATE_OPTIONS,
  formatDateForApi,
} from "@/lib/zalo-user-admin-utils";
import { getApiErrorMessage } from "@/lib/errors";
import { validatePhone } from "@/lib/auth-validation";
import { toast } from "@/lib/toast";
import { zaloUserAdminService } from "@/services/zalo-user-admin.service";
import type { ManagedUser, UserPermissionValue } from "@/types/zalo-user-admin";
import { useEffect, useState } from "react";

interface EditUserModalProps {
  open: boolean;
  user: ManagedUser | null;
  isAdmin: boolean;
  showCurrentPassword: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function toDateInputValue(value?: string | null): string {
  if (!value) return "";
  const raw = value.includes("T") ? value.split("T")[0] : value.split(" ")[0];
  return raw;
}

export default function EditUserModal({
  open,
  user,
  isAdmin,
  showCurrentPassword,
  onClose,
  onSuccess,
}: EditUserModalProps) {
  const [form, setForm] = useState({
    username: "",
    password: "",
    fullname: "",
    phone_number: "",
    mail: "",
    permission: "" as UserPermissionValue | "",
    employee_limit: "",
    account_limit: "",
    expiration_date: "",
    employee_expiration_date: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    setForm({
      username: user.username ?? "",
      password: "",
      fullname: user.fullname ?? "",
      phone_number: user.phone_number ?? "",
      mail: user.mail ?? "",
      permission: (user.permission as UserPermissionValue) ?? "",
      employee_limit: String(user.employee_limit ?? ""),
      account_limit: String(user.account_limit ?? ""),
      expiration_date: toDateInputValue(user.expiration_date),
      employee_expiration_date: toDateInputValue(user.employee_expiration_date),
    });
  }, [open, user]);

  const updateField = (name: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!form.fullname.trim()) {
      toast.error("Họ tên không được để trống.");
      return false;
    }
    if (!form.username.trim()) {
      toast.error("Tên đăng nhập không được để trống.");
      return false;
    }
    if (form.password && form.password.length < 6) {
      toast.error("Mật khẩu phải ít nhất 6 ký tự.");
      return false;
    }
    if (isAdmin && !form.permission) {
      toast.error("Bạn phải chọn một quyền.");
      return false;
    }
    const phoneError = validatePhone(form.phone_number);
    if (phoneError) {
      toast.error(phoneError);
      return false;
    }
    if (!form.mail.trim()) {
      toast.error("Email không được để trống.");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!user || !validate()) return;
    setSaving(true);
    try {
      const expirationDate = form.expiration_date
        ? formatDateForApi(new Date(form.expiration_date))
        : formatDateForApi(new Date());
      const employeeExpirationDate = form.employee_expiration_date
        ? formatDateForApi(new Date(form.employee_expiration_date))
        : null;

      await zaloUserAdminService.editUser({
        id_manager: user.id,
        username: form.username.trim(),
        fullname: form.fullname.trim(),
        phone_number: form.phone_number.trim(),
        employee_limit: form.employee_limit,
        account_limit: form.account_limit,
        expiration_date: expirationDate,
        mail: form.mail.trim(),
        employee_expiration_date: employeeExpirationDate,
        ...(isAdmin && form.permission
          ? { permission: form.permission as UserPermissionValue }
          : {}),
        ...(form.password.trim() ? { password: form.password } : {}),
      });
      toast.success("Cập nhật thành công.");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <Modal isOpen={open} onClose={onClose} className="max-w-2xl p-6 sm:p-8">
      <h3 className="mb-1 text-xl font-semibold text-gray-900 dark:text-white">
        Chỉnh sửa thông tin
      </h3>
      <p className="mb-6 text-sm text-gray-500">{user.username}</p>

      <div className="space-y-4">
        <Field label="Tên đăng nhập">
          <Input value={form.username} onChange={(e) => updateField("username", e.target.value)} />
        </Field>
        <Field
          label={
            showCurrentPassword
              ? `Mật khẩu mới (hiện tại: ${user.raw_password || "******"})`
              : "Mật khẩu mới"
          }
        >
          <Input
            type="password"
            placeholder="Để trống nếu không muốn đổi"
            value={form.password}
            onChange={(e) => updateField("password", e.target.value)}
          />
        </Field>
        <Field label="Họ tên">
          <Input value={form.fullname} onChange={(e) => updateField("fullname", e.target.value)} />
        </Field>
        <Field label="Số điện thoại (*)">
          <Input
            placeholder="Ví dụ: 0912345678"
            value={form.phone_number}
            onChange={(e) => updateField("phone_number", e.target.value)}
          />
        </Field>
        <Field label="Email">
          <Input value={form.mail} onChange={(e) => updateField("mail", e.target.value)} />
        </Field>
        {isAdmin ? (
          <Field label="Phân quyền">
            <Select
              options={USER_PERMISSION_CREATE_OPTIONS.map((item) => ({
                value: item.value,
                label: item.label,
              }))}
              placeholder="Chọn quyền"
              value={form.permission}
              onChange={(value) => updateField("permission", value)}
            />
          </Field>
        ) : null}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Số lượng NV">
            <Input
              type="number"
              value={form.employee_limit}
              onChange={(e) => updateField("employee_limit", e.target.value)}
            />
          </Field>
          <Field label="HSD NV">
            <Input
              type="date"
              value={form.employee_expiration_date}
              onChange={(e) => updateField("employee_expiration_date", e.target.value)}
            />
          </Field>
          <Field label="Số lượng TK">
            <Input
              type="number"
              value={form.account_limit}
              onChange={(e) => updateField("account_limit", e.target.value)}
            />
          </Field>
          <Field label="HSD Tài khoản">
            <Input
              type="date"
              value={form.expiration_date}
              onChange={(e) => updateField("expiration_date", e.target.value)}
            />
          </Field>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose} disabled={saving}>
          Hủy
        </Button>
        <Button onClick={() => void handleSave()} disabled={saving}>
          {saving ? "Đang lưu..." : "Lưu"}
        </Button>
      </div>
    </Modal>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
      {children}
    </label>
  );
}