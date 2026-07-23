"use client";

import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { SHOW_SPAM_LINK_GROUP_FEATURES } from "@/config/feature-flags";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { teamPermissionsService } from "@/services/team-permissions.service";
import type { CampaignPermissionsMap, CampaignTypeKey, TeamEmployee } from "@/types/team-collaboration";
import { useEffect, useMemo, useState } from "react";

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

/** Keys hiển thị: ẩn spam + ẩn add_friend (đã gộp mess_phone) */
const VISIBLE_PERMISSION_KEYS = (
  Object.keys(PERMISSION_LABELS) as CampaignTypeKey[]
).filter(
  (key) =>
    key !== "add_friend" &&
    (SHOW_SPAM_LINK_GROUP_FEATURES || key !== "spam_link_group"),
);

interface TeamEmployeePermissionsModalProps {
  employee: TeamEmployee | null;
  open: boolean;
  onClose: () => void;
}

export default function TeamEmployeePermissionsModal({
  employee,
  open,
  onClose,
}: TeamEmployeePermissionsModalProps) {
  const [permissions, setPermissions] = useState<CampaignPermissionsMap | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const keys = useMemo(() => VISIBLE_PERMISSION_KEYS, []);

  useEffect(() => {
    if (!open || !employee) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const data = await teamPermissionsService.getEmployeeCampaignPermissions(employee.id);
        if (!cancelled) {
          const next = { ...data.permissions };
          // Tạm tắt spam link — không bật lại qua UI khi flag off
          if (!SHOW_SPAM_LINK_GROUP_FEATURES) {
            next.spam_link_group = false;
          }
          setPermissions(next);
        }
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

  const toggle = (key: CampaignTypeKey) => {
    if (!permissions) return;
    if (!SHOW_SPAM_LINK_GROUP_FEATURES && key === "spam_link_group") return;
    setPermissions({ ...permissions, [key]: !permissions[key] });
  };

  const handleSave = async () => {
    if (!employee || !permissions) return;
    setSaving(true);
    try {
      const payload = { ...permissions };
      if (!SHOW_SPAM_LINK_GROUP_FEATURES) {
        payload.spam_link_group = false;
      }
      await teamPermissionsService.setEmployeeCampaignPermissions({
        employee_id: employee.id,
        permissions: payload,
      });
      toast.success("Đã lưu quyền chiến dịch.");
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} layer="top" className="max-w-lg p-5 sm:p-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
        Quyền chiến dịch
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        {employee?.fullname || employee?.username}
      </p>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        </div>
      ) : (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {keys.map((key) => (
            <label
              key={key}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-sm dark:border-gray-700"
            >
              <input
                type="checkbox"
                checked={Boolean(permissions?.[key])}
                onChange={() => toggle(key)}
                className="h-4 w-4 rounded border-gray-300 text-brand-500"
              />
              <span className="text-gray-700 dark:text-gray-300">
                {PERMISSION_LABELS[key]}
              </span>
            </label>
          ))}
        </div>
      )}

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>
          Hủy
        </Button>
        <Button onClick={() => void handleSave()} disabled={saving || loading}>
          Lưu quyền
        </Button>
      </div>
    </Modal>
  );
}