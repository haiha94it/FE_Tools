"use client";

import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { zaloUserAdminService } from "@/services/zalo-user-admin.service";
import type { ManagedUser } from "@/types/zalo-user-admin";
import { useEffect, useState } from "react";
import { HiOutlineSearch } from "react-icons/hi";

interface AddLimitModalProps {
  open: boolean;
  type: "account" | "employee" | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddLimitModal({
  open,
  type,
  onClose,
  onSuccess,
}: AddLimitModalProps) {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [limitValue, setLimitValue] = useState("1");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setUsers([]);
      setSelectedUser(null);
      setLimitValue("1");
    }
  }, [open]);

  const isAccountType = type === "account";
  const title = isAccountType ? "Thêm giới hạn nick" : "Thêm giới hạn nhân viên";

  const searchUsers = async () => {
    if (!search.trim()) return;
    setLoading(true);
    try {
      const results = await zaloUserAdminService.searchManagers(search.trim());
      setUsers(results);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedUser) {
      toast.error("Vui lòng chọn người dùng.");
      return;
    }
    const limit = Number(limitValue);
    if (!limit || limit <= 0) {
      toast.error(
        isAccountType
          ? "Số lượng tài khoản phải lớn hơn 0."
          : "Số lượng nhân viên phải lớn hơn 0.",
      );
      return;
    }
    setSubmitting(true);
    try {
      if (isAccountType) {
        await zaloUserAdminService.addAccountLimit(selectedUser.id, limit);
      } else {
        await zaloUserAdminService.addEmployeeLimit(selectedUser.id, limit);
      }
      toast.success("Cập nhật giới hạn thành công.");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  if (!type) return null;

  return (
    <Modal isOpen={open} onClose={onClose} className="max-w-3xl p-6">
      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>

      <div className="space-y-4">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Tìm kiếm người dùng
          </span>
          <div className="flex gap-2">
            <Input
              placeholder="Nhập tên đăng nhập, họ tên hoặc SĐT..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button
              size="sm"
              startIcon={<HiOutlineSearch />}
              onClick={() => void searchUsers()}
              disabled={loading}
            >
              Tìm
            </Button>
          </div>
        </label>

        {users.length > 0 ? (
          <div className="max-h-60 overflow-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="min-w-full text-left text-sm">
              <thead className="sticky top-0 bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-3 py-2">Tên đăng nhập</th>
                  <th className="px-3 py-2">Họ tên</th>
                  <th className="px-3 py-2">SĐT</th>
                  <th className="px-3 py-2">Giới hạn hiện tại</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className={`cursor-pointer border-t border-gray-100 dark:border-white/[0.05] ${
                      selectedUser?.id === user.id ? "bg-brand-50 dark:bg-brand-500/10" : ""
                    }`}
                    onClick={() => setSelectedUser(user)}
                  >
                    <td className="px-3 py-2">{user.username}</td>
                    <td className="px-3 py-2">{user.fullname ?? "—"}</td>
                    <td className="px-3 py-2">{user.phone_number ?? "—"}</td>
                    <td className="px-3 py-2">
                      {isAccountType
                        ? user.account_limit ?? 0
                        : user.employee_limit ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {selectedUser ? (
          <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
            Đã chọn: {selectedUser.username} — {selectedUser.fullname}
          </p>
        ) : null}

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {isAccountType ? "Số lượng tài khoản cộng thêm" : "Số lượng nhân viên cộng thêm"}
          </span>
          <Input
            type="number"
            min="1"
            value={limitValue}
            onChange={(e) => setLimitValue(e.target.value)}
          />
        </label>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose} disabled={submitting}>
          Hủy
        </Button>
        <Button onClick={() => void handleSubmit()} disabled={submitting || !selectedUser}>
          {submitting ? "Đang lưu..." : "Xác nhận"}
        </Button>
      </div>
    </Modal>
  );
}