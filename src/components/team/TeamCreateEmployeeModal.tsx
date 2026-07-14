"use client";

import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { validatePassword, validateUsername } from "@/lib/auth-validation";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { teamPermissionsService } from "@/services/team-permissions.service";
import Link from "next/link";
import { useEffect, useState } from "react";

interface TeamCreateEmployeeModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  employeeLimit: number;
}

const EMPTY_FORM = {
  username: "",
  password: "",
  fullname: "",
  account_limit: "",
};

export default function TeamCreateEmployeeModal({
  open,
  onClose,
  onCreated,
  employeeLimit,
}: TeamCreateEmployeeModalProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const canCreate = employeeLimit > 0;

  useEffect(() => {
    if (!open) {
      setForm(EMPTY_FORM);
      setErrors({});
    }
  }, [open]);

  const updateField = (field: keyof typeof EMPTY_FORM, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    const usernameError = validateUsername(form.username);
    const passwordError = validatePassword(form.password);

    if (usernameError) next.username = usernameError;
    if (passwordError) next.password = passwordError;
    if (!form.fullname.trim()) next.fullname = "Vui lòng nhập họ tên nhân viên";
    if (!form.account_limit.trim()) {
      next.account_limit = "Vui lòng nhập số lượng tài khoản";
    } else if (!/^\d+$/.test(form.account_limit) || Number(form.account_limit) < 0) {
      next.account_limit = "Số lượng tài khoản phải là số nguyên không âm";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!canCreate) return;
    if (!validate()) return;

    setSubmitting(true);
    try {
      await teamPermissionsService.createEmployee({
        username: form.username.trim(),
        password: form.password,
        fullname: form.fullname.trim(),
        account_limit: Number(form.account_limit),
        listener_limit: 0,
      });
      toast.success("Đã tạo tài khoản nhân viên.");
      onCreated();
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} layer="top" className="max-w-lg p-5 sm:p-6">
      {canCreate ? (
        <>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Thêm tài khoản nhân viên
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Tạo tài khoản đăng nhập cho nhân viên và cấp giới hạn nick Zalo.
          </p>

          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tên đăng nhập
              </label>
              <Input
                value={form.username}
                onChange={(e) => updateField("username", e.target.value)}
                placeholder="Tên đăng nhập"
                error={Boolean(errors.username)}
                hint={errors.username}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Mật khẩu
              </label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => updateField("password", e.target.value)}
                placeholder="Mật khẩu đăng nhập"
                error={Boolean(errors.password)}
                hint={errors.password}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Họ tên nhân viên
              </label>
              <Input
                value={form.fullname}
                onChange={(e) => updateField("fullname", e.target.value)}
                placeholder="Họ tên nhân viên"
                error={Boolean(errors.fullname)}
                hint={errors.fullname}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Cấp tài khoản (nick Zalo)
              </label>
              <Input
                type="text"
                value={form.account_limit}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^\d*$/.test(value)) updateField("account_limit", value);
                }}
                placeholder="Số lượng tài khoản"
                error={Boolean(errors.account_limit)}
                hint={errors.account_limit}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button onClick={() => void handleSubmit()} disabled={submitting}>
              Tạo nhân viên
            </Button>
          </div>
        </>
      ) : (
        <>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Thông tin tài khoản
          </h3>
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            Tài khoản của bạn chưa đủ quyền để thực hiện chức năng này. Vui lòng
            nâng cấp gói để tạo thêm nhân viên.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Đóng
            </Button>
            <Link
              href="/zalo-messenger"
              className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-5 py-3.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
            >
              Nâng cấp ngay
            </Link>
          </div>
        </>
      )}
    </Modal>
  );
}