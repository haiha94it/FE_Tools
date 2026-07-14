"use client";

import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { confirm } from "@/lib/confirm";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { zaloUserAdminService } from "@/services/zalo-user-admin.service";
import type { ResetPasswordRequest } from "@/types/zalo-user-admin";
import { useCallback, useEffect, useState } from "react";

interface ResetPasswordModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ResetPasswordModal({ open, onClose }: ResetPasswordModalProps) {
  const [items, setItems] = useState<ResetPasswordRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await zaloUserAdminService.listResetPasswordRequests();
      setItems(data);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) void loadItems();
  }, [open, loadItems]);

  const handleReset = async (item: ResetPasswordRequest) => {
    try {
      await zaloUserAdminService.resetPassword(item.username);
      toast.success("Đặt lại mật khẩu thành công.");
      void loadItems();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleDelete = async (item: ResetPasswordRequest) => {
    if (
      !(await confirm({
        title: "Xóa yêu cầu",
        message: "Bạn có chắc chắn muốn xóa yêu cầu reset mật khẩu này?",
        confirmText: "Xóa",
        variant: "danger",
      }))
    ) {
      return;
    }
    try {
      await zaloUserAdminService.deleteResetPasswordRequest(item.id);
      toast.success("Xóa thành công.");
      void loadItems();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} className="max-w-4xl p-6">
      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
        Reset Password
      </h3>
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-500">STT</th>
              <th className="px-4 py-3 font-medium text-gray-500">Họ tên</th>
              <th className="px-4 py-3 font-medium text-gray-500">Username</th>
              <th className="px-4 py-3 font-medium text-gray-500">Số điện thoại</th>
              <th className="px-4 py-3 font-medium text-gray-500">Tùy chọn</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {items.map((item, index) => (
              <tr key={item.id}>
                <td className="px-4 py-3">{index + 1}</td>
                <td className="px-4 py-3">{item.fullname ?? "—"}</td>
                <td className="px-4 py-3">{item.username}</td>
                <td className="px-4 py-3">{item.phone_number ?? "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => void handleReset(item)}>
                      Reset
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="!text-error-600 !ring-error-300"
                      onClick={() => void handleDelete(item)}
                    >
                      Xóa
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  Không có yêu cầu reset mật khẩu.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}