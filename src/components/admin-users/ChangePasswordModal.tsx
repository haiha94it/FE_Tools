"use client";

import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { zaloUserAdminService } from "@/services/zalo-user-admin.service";
import { useEffect, useState } from "react";

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({
  open,
  onClose,
}: ChangePasswordModalProps) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  }, [open]);

  const handleSave = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Vui lòng nhập chính xác mật khẩu.");
      return;
    }
    setSaving(true);
    try {
      await zaloUserAdminService.changePassword(oldPassword, newPassword);
      toast.success("Đổi mật khẩu thành công.");
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} className="max-w-md p-6">
      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
        Chỉnh sửa mật khẩu
      </h3>
      <div className="space-y-4">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Mật khẩu hiện tại
          </span>
          <Input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Mật khẩu mới</span>
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
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
          />
        </label>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose} disabled={saving}>
          Hủy
        </Button>
        <Button onClick={() => void handleSave()} disabled={saving}>
          {saving ? "Đang cập nhật..." : "Cập nhật"}
        </Button>
      </div>
    </Modal>
  );
}