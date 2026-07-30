"use client";

import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { USER_PERMISSION_OPTIONS } from "@/lib/zalo-user-admin-utils";
import type { UserPermissionFilter } from "@/types/zalo-user-admin";
import { useEffect, useState } from "react";

interface FilterUsersModalProps {
  open: boolean;
  permission: UserPermissionFilter;
  dateEnabled: boolean;
  startDate: Date | null;
  endDate: Date | null;
  hideAdminOptions: boolean;
  onClose: () => void;
  onApply: (payload: {
    permission: UserPermissionFilter;
    enabled: boolean;
    startDate: Date | null;
    endDate: Date | null;
  }) => void;
}

function toInputDate(date: Date | null): string {
  if (!date) return "";
  const adjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return adjusted.toISOString().split("T")[0];
}

function fromInputDate(value: string): Date | null {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export default function FilterUsersModal({
  open,
  permission,
  dateEnabled,
  startDate,
  endDate,
  hideAdminOptions,
  onClose,
  onApply,
}: FilterUsersModalProps) {
  const [localPermission, setLocalPermission] = useState<UserPermissionFilter>(permission);
  const [enabled, setEnabled] = useState(dateEnabled);
  const [localStart, setLocalStart] = useState(toInputDate(startDate));
  const [localEnd, setLocalEnd] = useState(toInputDate(endDate));

  useEffect(() => {
    if (!open) return;
    setLocalPermission(permission);
    setEnabled(dateEnabled);
    setLocalStart(toInputDate(startDate));
    setLocalEnd(toInputDate(endDate));
  }, [open, permission, dateEnabled, startDate, endDate]);

  const options = USER_PERMISSION_OPTIONS.filter(
    (item) =>
      !hideAdminOptions ||
      (item.value !== "is_admin" && item.value !== "is_developer"),
  );

  return (
    <Modal isOpen={open} onClose={onClose} className="max-w-md p-6">
      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
        Bộ lọc tìm kiếm
      </h3>

      <div className="space-y-4">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Quyền hạn
          </span>
          <Select
            options={options.map((item) => ({
              value: item.value,
              label: item.label,
            }))}
            placeholder="Chọn quyền"
            value={localPermission}
            onChange={(value) => setLocalPermission(value as UserPermissionFilter)}
          />
        </label>

        <div className="space-y-3 border-t border-gray-100 pt-4 dark:border-white/[0.05]">
          <Checkbox
            label="Lọc theo ngày tạo"
            checked={enabled}
            onChange={setEnabled}
          />
          <label className="block space-y-1.5">
            <span className="text-sm text-gray-600 dark:text-gray-400">Ngày bắt đầu</span>
            <Input
              type="date"
              disabled={!enabled}
              value={localStart}
              onChange={(e) => setLocalStart(e.target.value)}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm text-gray-600 dark:text-gray-400">Ngày kết thúc</span>
            <Input
              type="date"
              disabled={!enabled}
              value={localEnd}
              onChange={(e) => setLocalEnd(e.target.value)}
            />
          </label>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>
          Hủy
        </Button>
        <Button
          onClick={() => {
            onApply({
              permission: localPermission,
              enabled,
              startDate: fromInputDate(localStart),
              endDate: fromInputDate(localEnd),
            });
            onClose();
          }}
        >
          Xác nhận
        </Button>
      </div>
    </Modal>
  );
}
