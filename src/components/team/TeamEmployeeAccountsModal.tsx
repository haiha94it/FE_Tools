"use client";

import Button from "@/components/ui/button/Button";
import Checkbox from "@/components/form/input/Checkbox";
import { Modal } from "@/components/ui/modal";
import ContactAvatar from "@/components/zalo-contacts/shared/ContactAvatar";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { teamPermissionsService } from "@/services/team-permissions.service";
import { zaloAccountService } from "@/services/zalo-account.service";
import type { TeamEmployee } from "@/types/team-collaboration";
import type { ZaloAccount } from "@/types/zalo-account";
import { useEffect, useState } from "react";

interface TeamEmployeeAccountsModalProps {
  employee: TeamEmployee | null;
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export default function TeamEmployeeAccountsModal({
  employee,
  open,
  onClose,
  onSaved,
}: TeamEmployeeAccountsModalProps) {
  const [managerAccounts, setManagerAccounts] = useState<ZaloAccount[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !employee) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const [accounts, assignments] = await Promise.all([
          zaloAccountService.list(),
          teamPermissionsService.getEmployeeAccountAssignments(employee.id),
        ]);
        if (cancelled) return;
        setManagerAccounts(accounts);
        setSelectedIds(assignments.account_ids ?? []);
      } catch (error) {
        toast.error(getApiErrorMessage(error));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, employee]);

  const toggle = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSave = async () => {
    if (!employee) return;
    setSaving(true);
    try {
      await teamPermissionsService.setEmployeeAccountAssignments({
        employee_id: employee.id,
        account_ids: selectedIds,
      });
      toast.success("Đã cập nhật nick gán cho nhân viên.");
      onSaved?.();
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const employeeName =
    employee?.fullname?.trim() || employee?.username || "Nhân viên";

  return (
    <Modal isOpen={open} onClose={onClose} layer="top" className="max-w-lg p-5 sm:p-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
        Gán nick Zalo
      </h3>
      {employee ? (
        <div className="mt-3 flex items-center gap-3">
          <ContactAvatar name={employeeName} size="md" />
          <div className="min-w-0">
            <p className="font-medium text-gray-800 dark:text-white/90">
              {employeeName}
            </p>
            <p className="text-xs text-gray-500">
              @{employee.username}
              {" · "}
              Đã gán {employee.account_count ?? employee.logged_account_count ?? 0}
              {" · "}
              Gói quản lý {employee.account_limit ?? 0}
            </p>
            <p className="mt-0.5 text-xs text-gray-400">
              Chọn nick thuộc quản lý để gán. Không giới hạn theo slot riêng NV.
            </p>
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        </div>
      ) : managerAccounts.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">
          Chưa có nick Zalo để gán.
        </p>
      ) : (
        <div className="custom-scrollbar mt-4 max-h-80 space-y-2 overflow-y-auto">
          {managerAccounts.map((account) => {
            const accountName =
              account.name?.trim() ||
              account.phone_number?.trim() ||
              `Nick #${account.id}`;
            return (
              <label
                key={account.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 px-3 py-2.5 dark:border-gray-700"
              >
                <Checkbox
                  checked={selectedIds.includes(account.id)}
                  onChange={() => toggle(account.id)}
                />
                <ContactAvatar
                  name={accountName}
                  avatar={account.avatar}
                  size="sm"
                />
                <span className="min-w-0 flex-1 text-sm font-medium text-gray-800 dark:text-white/90">
                  {accountName}
                </span>
              </label>
            );
          })}
        </div>
      )}

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>
          Hủy
        </Button>
        <Button onClick={() => void handleSave()} disabled={saving || loading}>
          Lưu gán nick
        </Button>
      </div>
    </Modal>
  );
}