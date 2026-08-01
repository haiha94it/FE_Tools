"use client";

import Checkbox from "@/components/form/input/Checkbox";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import ContactAvatar from "@/components/zalo-contacts/shared/ContactAvatar";
import { SHOW_SPAM_LINK_GROUP_FEATURES } from "@/config/feature-flags";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { teamPermissionsService } from "@/services/team-permissions.service";
import { zaloAccountService } from "@/services/zalo-account.service";
import type {
  CampaignPermissionsMap,
  CampaignTypeKey,
  TeamEmployee,
} from "@/types/team-collaboration";
import type { ZaloAccount } from "@/types/zalo-account";
import { useEffect, useState } from "react";

const PERMISSION_LABELS: Record<CampaignTypeKey, string> = {
  add_friend: "Kết bạn SĐT (legacy)",
  join_group: "Tham gia nhóm",
  invite_group: "Mời vào nhóm",
  invite_phone_group: "Mời SĐT vào nhóm",
  mess_friend: "Nhắn bạn bè",
  mess_group: "Nhắn nhóm",
  mess_member_group: "Nhắn thành viên nhóm",
  mess_phone: "Nhắn tin / Kết bạn SĐT",
  mess_birthday: "Sinh nhật",
  spam_link_group: "Spam link nhóm",
  auto_inbox: "Auto inbox",
};

const VISIBLE_PERMISSION_KEYS = (
  Object.keys(PERMISSION_LABELS) as CampaignTypeKey[]
).filter(
  (key) =>
    key !== "add_friend" &&
    key !== "auto_inbox" &&
    key !== "mess_birthday" &&
    (SHOW_SPAM_LINK_GROUP_FEATURES || key !== "spam_link_group"),
);

interface TeamEmployeeSetupModalProps {
  employee: TeamEmployee | null;
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export default function TeamEmployeeSetupModal({
  employee,
  open,
  onClose,
  onSaved,
}: TeamEmployeeSetupModalProps) {
  const [managerAccounts, setManagerAccounts] = useState<ZaloAccount[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [permissions, setPermissions] =
    useState<CampaignPermissionsMap | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !employee) return;
    let cancelled = false;

    void (async () => {
      setLoading(true);
      try {
        const [accounts, assignments, permissionData] = await Promise.all([
          zaloAccountService.list(),
          teamPermissionsService.getEmployeeAccountAssignments(employee.id),
          teamPermissionsService.getEmployeeCampaignPermissions(employee.id),
        ]);
        if (cancelled) return;

        const nextPermissions = { ...permissionData.permissions };
        if (!SHOW_SPAM_LINK_GROUP_FEATURES) {
          nextPermissions.spam_link_group = false;
        }
        nextPermissions.mess_birthday = false;
        setManagerAccounts(accounts);
        setSelectedIds(assignments.account_ids ?? []);
        setPermissions(nextPermissions);
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

  const toggleAccount = (id: number) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((accountId) => accountId !== id)
        : [...current, id],
    );
  };

  const togglePermission = (key: CampaignTypeKey) => {
    if (!permissions) return;
    setPermissions({ ...permissions, [key]: !permissions[key] });
  };

  const handleSave = async () => {
    if (!employee || !permissions) return;
    setSaving(true);
    try {
      const nextPermissions = { ...permissions };
      if (!SHOW_SPAM_LINK_GROUP_FEATURES) {
        nextPermissions.spam_link_group = false;
      }
      nextPermissions.mess_birthday = false;
      await Promise.all([
        teamPermissionsService.setEmployeeAccountAssignments({
          employee_id: employee.id,
          account_ids: selectedIds,
        }),
        teamPermissionsService.setEmployeeCampaignPermissions({
          employee_id: employee.id,
          permissions: nextPermissions,
        }),
      ]);
      toast.success("Đã lưu thiết lập cho nhân viên.");
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
    <Modal
      isOpen={open}
      onClose={onClose}
      layer="top"
      className="max-w-4xl p-0"
    >
      <div className="shrink-0 border-b border-gray-200 px-5 py-5 dark:border-gray-800 sm:px-6">
        <h3 className="pr-12 text-lg font-semibold text-gray-800 dark:text-white/90">
          Thiết lập nhân viên
        </h3>
        {employee ? (
          <div className="mt-3 flex items-center gap-3">
            <ContactAvatar name={employeeName} size="md" />
            <div className="min-w-0">
              <p className="font-medium text-gray-800 dark:text-white/90">
                {employeeName}
              </p>
              <p className="text-xs text-gray-500">
                @{employee.username} · Đã gán{" "}
                {employee.account_count ?? employee.logged_account_count ?? 0}{" "}
                nick
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <section>
              <div className="mb-3">
                <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                  Nick Zalo được sử dụng
                </h4>
                <p className="mt-1 text-xs text-gray-500">
                  Chọn các nick thuộc quản lý để gán cho nhân viên.
                </p>
              </div>
              {managerAccounts.length === 0 ? (
                <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-gray-300 px-4 text-center text-sm text-gray-500 dark:border-gray-700">
                  Chưa có nick Zalo để gán.
                </div>
              ) : (
                <div className="custom-scrollbar h-64 space-y-2 overflow-y-auto rounded-xl border border-gray-200 p-2 dark:border-gray-700">
                  {managerAccounts.map((account) => {
                    const accountName =
                      account.name?.trim() ||
                      account.phone_number?.trim() ||
                      `Nick #${account.id}`;
                    return (
                      <label
                        key={account.id}
                        className="flex cursor-pointer items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                      >
                        <Checkbox
                          checked={selectedIds.includes(account.id)}
                          onChange={() => toggleAccount(account.id)}
                        />
                        <ContactAvatar
                          name={accountName}
                          avatar={account.avatar}
                          size="sm"
                        />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-800 dark:text-white/90">
                          {accountName}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </section>

            <section>
              <div className="mb-3">
                <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                  Quyền chạy chiến dịch
                </h4>
                <p className="mt-1 text-xs text-gray-500">
                  Bật các loại chiến dịch nhân viên được phép sử dụng.
                </p>
              </div>
              <div className="custom-scrollbar grid h-64 gap-2 overflow-y-auto rounded-xl border border-gray-200 p-2 sm:grid-cols-2 dark:border-gray-700">
                {VISIBLE_PERMISSION_KEYS.map((key) => (
                  <label
                    key={key}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-transparent px-3 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                  >
                    <Checkbox
                      checked={Boolean(permissions?.[key])}
                      onChange={() => togglePermission(key)}
                    />
                    <span className="text-gray-700 dark:text-gray-300">
                      {PERMISSION_LABELS[key]}
                    </span>
                  </label>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>

      <div className="flex shrink-0 justify-end gap-3 border-t border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-gray-900 sm:px-6">
        <Button variant="outline" onClick={onClose} disabled={saving}>
          Hủy
        </Button>
        <Button
          onClick={() => void handleSave()}
          disabled={saving || loading || !permissions}
        >
          {saving ? "Đang lưu..." : "Lưu thiết lập"}
        </Button>
      </div>
    </Modal>
  );
}
