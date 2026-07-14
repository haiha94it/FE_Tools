"use client";

import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { USER_PERMISSION_CREATE_OPTIONS } from "@/lib/zalo-user-admin-utils";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { zaloUserAdminService } from "@/services/zalo-user-admin.service";
import type { UserPermissionValue } from "@/types/zalo-user-admin";
import { useEffect, useState } from "react";

interface CreateUserModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const emptyForm = {
  username: "",
  password: "",
  fullname: "",
  phone_number: "",
  facebook_link: "",
  mail: "",
  permission: "" as UserPermissionValue | "",
  employee_limit: "1",
  account_limit: "1",
  chatbot_limit: "0",
  expiration_date: "",
  employee_expiration_date: "",
  chatbot_expiration_date: "",
};

export default function CreateUserModal({
  open,
  onClose,
  onSuccess,
}: CreateUserModalProps) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) setForm(emptyForm);
  }, [open]);

  const updateField = (name: keyof typeof emptyForm, value: string) => {
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
    if (form.password.length < 6) {
      toast.error("Mật khẩu phải ít nhất 6 ký tự.");
      return false;
    }
    if (!form.permission) {
      toast.error("Bạn phải chọn ít nhất một quyền.");
      return false;
    }
    if (!form.mail.trim()) {
      toast.error("Email không được để trống.");
      return false;
    }
    const emailRe = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRe.test(form.mail.trim().toLowerCase())) {
      toast.error("Email không hợp lệ.");
      return false;
    }
    const phoneRe = /^(0[3|5|7|8|9])+([0-9]{8})$/;
    if (!phoneRe.test(form.phone_number)) {
      toast.error("Số điện thoại không hợp lệ.");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await zaloUserAdminService.createUser({
        facebook_link: form.facebook_link,
        username: form.username.trim(),
        fullname: form.fullname.trim(),
        password: form.password,
        phone_number: form.phone_number,
        employee_limit: Number(form.employee_limit) || 1,
        expiration_date: form.expiration_date || undefined,
        mail: form.mail.trim(),
        account_limit: Number(form.account_limit) || 1,
        permission: form.permission as UserPermissionValue,
        chatbot_limit: Number(form.chatbot_limit) || 0,
        chatbot_expiration_date: form.chatbot_expiration_date || undefined,
        employee_expiration_date: form.employee_expiration_date || undefined,
      });
      toast.success("Tạo tài khoản thành công.");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} className="max-w-3xl p-6 sm:p-8">
      <h3 className="mb-1 text-xl font-semibold text-gray-900 dark:text-white">
        Thông tin tài khoản
      </h3>
      <p className="mb-6 text-sm text-gray-500">Tạo người dùng mới trên hệ thống.</p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Tên đăng nhập">
          <Input value={form.username} onChange={(e) => updateField("username", e.target.value)} />
        </Field>
        <Field label="Mật khẩu">
          <Input
            type="password"
            value={form.password}
            onChange={(e) => updateField("password", e.target.value)}
          />
        </Field>
        <Field label="Họ tên">
          <Input value={form.fullname} onChange={(e) => updateField("fullname", e.target.value)} />
        </Field>
        <Field label="Số điện thoại">
          <Input
            value={form.phone_number}
            onChange={(e) => updateField("phone_number", e.target.value)}
          />
        </Field>
        <Field label="Link Facebook">
          <Input
            value={form.facebook_link}
            onChange={(e) => updateField("facebook_link", e.target.value)}
          />
        </Field>
        <Field label="Email">
          <Input value={form.mail} onChange={(e) => updateField("mail", e.target.value)} />
        </Field>
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
        <Field label="Số lượng nhân viên">
          <Input
            type="number"
            min="1"
            value={form.employee_limit}
            onChange={(e) => updateField("employee_limit", e.target.value)}
          />
        </Field>
        <Field label="Hạn sử dụng nhân viên">
          <Input
            type="date"
            value={form.employee_expiration_date}
            onChange={(e) => updateField("employee_expiration_date", e.target.value)}
          />
        </Field>
        <Field label="Số lượng tài khoản">
          <Input
            type="number"
            min="1"
            value={form.account_limit}
            onChange={(e) => updateField("account_limit", e.target.value)}
          />
        </Field>
        <Field label="Hạn sử dụng">
          <Input
            type="date"
            value={form.expiration_date}
            onChange={(e) => updateField("expiration_date", e.target.value)}
          />
        </Field>
        <Field label="Số lượng chatbot">
          <Input
            type="number"
            min="0"
            value={form.chatbot_limit}
            onChange={(e) => updateField("chatbot_limit", e.target.value)}
          />
        </Field>
        <Field label="Hạn sử dụng chatbot">
          <Input
            type="date"
            value={form.chatbot_expiration_date}
            onChange={(e) => updateField("chatbot_expiration_date", e.target.value)}
          />
        </Field>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose} disabled={saving}>
          Hủy
        </Button>
        <Button onClick={() => void handleSave()} disabled={saving}>
          {saving ? "Đang tạo..." : "Tạo"}
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