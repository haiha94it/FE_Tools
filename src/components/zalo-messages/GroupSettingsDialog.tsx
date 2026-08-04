"use client";

import ContactAvatar from "@/components/zalo-contacts/shared/ContactAvatar";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Switch from "@/components/form/switch/Switch";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/lib/toast";
import { zaloGroupService } from "@/services/zalo-group.service";
import { zaloMessengerService } from "@/services/zalo-messenger.service";
import type { ZaloGroupMember } from "@/types/zalo-contacts";
import {
  emptyGroupSetting,
  GROUP_SETTING_TOGGLES,
  mergeGroupSetting,
  type ZaloGroupSettingKey,
  type ZaloGroupSettingPayload,
} from "@/types/zalo-group-settings";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface GroupSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  accountId: number;
  /** Zalo uid nick đang chat — map self trong roster */
  accountUid?: string | null;
  groupId: number;
  groupUid: string;
  groupName: string;
  groupAvatar?: string | null;
  members: ZaloGroupMember[];
  /** Sau đổi tên/avatar/admin — refresh list member + conversation */
  onUpdated?: () => void;
}

/**
 * Phân quyền (dialog cài đặt — chỉ profile + toggle):
 * - is_creator / is_admin (phó): đổi tên/ảnh + bật-tắt option nhóm
 * - thành viên: chỉ xem option
 * Ủy quyền phó → `GroupMembersPanel` (danh sách thành viên).
 */
function resolveSelfRole(
  members: ZaloGroupMember[],
  accountUid?: string | null,
): { isCreator: boolean; isAdminOnly: boolean; isMemberOnly: boolean } {
  const uid = accountUid?.trim() ? String(accountUid) : null;
  if (uid) {
    const self = members.find(
      (m) => m.friend?.uid && String(m.friend.uid) === uid,
    );
    if (self) {
      const isCreator = Boolean(self.is_creator);
      const isAdmin = Boolean(self.is_admin || self.is_creator);
      return {
        isCreator,
        isAdminOnly: isAdmin && !isCreator,
        isMemberOnly: !isAdmin,
      };
    }
  }
  // Không map được self → coi như thành viên (an toàn)
  return { isCreator: false, isAdminOnly: false, isMemberOnly: true };
}

export default function GroupSettingsDialog({
  open,
  onClose,
  accountId,
  accountUid,
  groupId,
  groupUid,
  groupName,
  groupAvatar,
  members,
  onUpdated,
}: GroupSettingsDialogProps) {
  const [name, setName] = useState(groupName);
  const [setting, setSetting] = useState<ZaloGroupSettingPayload>(() =>
    emptyGroupSetting(groupUid),
  );
  const [loadingSetting, setLoadingSetting] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { isCreator, isAdminOnly, isMemberOnly } = useMemo(
    () => resolveSelfRole(members, accountUid),
    [members, accountUid],
  );
  /** Trưởng + phó: đổi tên/ảnh + bật-tắt option nhóm */
  const canEditProfile = isCreator || isAdminOnly;
  const canEditSettings = isCreator || isAdminOnly;

  useEffect(() => {
    if (!open) return;
    setName(groupName);
    setSetting(emptyGroupSetting(groupUid));
    // Member chỉ xem — vẫn load setting để hiển thị read-only
    let cancelled = false;
    setLoadingSetting(true);
    void (async () => {
      try {
        const res = await zaloGroupService.getGroupSetting(accountId, groupId);
        if (cancelled) return;
        if (!res.ok) {
          if (canEditSettings || canEditProfile) {
            toast.error(res.message || "Không tải được cài đặt nhóm.");
          }
          return;
        }
        setSetting(
          mergeGroupSetting(emptyGroupSetting(groupUid), res.setting, groupUid),
        );
      } catch {
        if (!cancelled && (canEditSettings || canEditProfile)) {
          toast.error("Không tải được cài đặt nhóm.");
        }
      } finally {
        if (!cancelled) setLoadingSetting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, accountId, groupId, groupUid, groupName, canEditSettings, canEditProfile]);

  const handleRename = useCallback(async () => {
    if (!canEditProfile) {
      toast.error("Bạn không có quyền đổi tên nhóm.");
      return;
    }
    const next = name.trim();
    if (!next) {
      toast.error("Tên nhóm không được để trống.");
      return;
    }
    if (next === groupName.trim()) return;
    setSavingKey("name");
    try {
      const res = await zaloGroupService.changeGroupName(accountId, groupId, next);
      if (!res.ok) {
        toast.error(res.message || "Đổi tên thất bại.");
        return;
      }
      toast.success(res.message || "Đã đổi tên nhóm.");
      onUpdated?.();
    } catch {
      toast.error("Đổi tên nhóm thất bại.");
    } finally {
      setSavingKey(null);
    }
  }, [accountId, canEditProfile, groupId, groupName, name, onUpdated]);

  const handleAvatarPick = useCallback(
    async (file: File | null) => {
      if (!file) return;
      if (!canEditProfile) {
        toast.error("Bạn không có quyền đổi ảnh nhóm.");
        return;
      }
      setSavingKey("avatar");
      try {
        const path = await zaloMessengerService.uploadFile(file);
        const filePath = path.includes("/media/")
          ? path
          : `/media/files/${path.replace(/^\//, "")}`;
        const res = await zaloGroupService.changeGroupAvatar(
          accountId,
          groupId,
          filePath,
        );
        if (!res.ok) {
          toast.error(res.message || "Đổi ảnh đại diện thất bại.");
          return;
        }
        toast.success(res.message || "Đã đổi ảnh đại diện.");
        onUpdated?.();
      } catch {
        toast.error("Upload / đổi ảnh thất bại.");
      } finally {
        setSavingKey(null);
        if (fileRef.current) fileRef.current.value = "";
      }
    },
    [accountId, canEditProfile, groupId, onUpdated],
  );

  const handleToggle = useCallback(
    async (key: ZaloGroupSettingKey, checked: boolean) => {
      if (!canEditSettings) {
        toast.error("Chỉ trưởng/phó nhóm mới đổi được quyền nhóm.");
        return;
      }
      const next = mergeGroupSetting(
        setting,
        { [key]: checked ? 1 : 0 },
        groupUid,
      );
      setSetting(next);
      setSavingKey(key);
      try {
        const res = await zaloGroupService.changeGroupSetting(accountId, next);
        if (!res.ok) {
          toast.error(res.message || "Cập nhật quyền thất bại.");
          const reload = await zaloGroupService.getGroupSetting(
            accountId,
            groupId,
          );
          if (reload.ok && reload.setting) {
            setSetting(
              mergeGroupSetting(
                emptyGroupSetting(groupUid),
                reload.setting,
                groupUid,
              ),
            );
          }
          return;
        }
        toast.success("Đã cập nhật quyền nhóm.");
      } catch {
        toast.error("Cập nhật quyền nhóm thất bại.");
      } finally {
        setSavingKey(null);
      }
    },
    [accountId, canEditSettings, groupId, groupUid, setting],
  );

  const roleLabel = isCreator
    ? "Trưởng nhóm"
    : isAdminOnly
      ? "Phó nhóm"
      : "Thành viên";

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      className="max-w-lg p-0 sm:p-0"
      showCloseButton
    >
      <div className="custom-scrollbar max-h-[min(88vh,720px)] overflow-y-auto p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50/80 p-3 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="relative shrink-0">
            <ContactAvatar
              name={groupName || "Nhóm"}
              avatar={groupAvatar ?? null}
              size="md"
            />
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-brand-500 px-1.5 py-0.5 text-[9px] font-semibold text-white">
              {roleLabel}
            </span>
          </div>
          <div className="min-w-0 flex-1 pt-1">
            <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
              {groupName || "Nhóm Zalo"}
            </p>
            <p className="text-xs text-gray-500">ID Nhóm: {groupId}</p>
            <p className="mt-0.5 text-[11px] text-gray-400">
              Thêm/gỡ phó nhóm: mở danh sách Thành viên
            </p>
          </div>
        </div>

        {isMemberOnly ? (
          <div className="space-y-4">
            <p className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-3 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-white/[0.02]">
              Bạn là thành viên — chỉ xem quyền nhóm, không tùy chỉnh.
            </p>
            <section>
              <h4 className="mb-2 border-b border-gray-100 pb-1 text-[11px] font-bold uppercase tracking-wide text-gray-500 dark:border-gray-800">
                Quyền nhóm (chỉ xem)
              </h4>
              {loadingSetting ? (
                <p className="py-3 text-center text-xs text-gray-500">
                  Đang tải...
                </p>
              ) : (
                <ul className="space-y-1 opacity-80">
                  {GROUP_SETTING_TOGGLES.map((item) => {
                    const on = Number(setting[item.key]) === 1;
                    return (
                      <li
                        key={item.key}
                        className="flex items-center gap-3 rounded-xl px-2 py-2"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-semibold text-gray-800 dark:text-white/90">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-gray-500">{item.desc}</p>
                        </div>
                        <Switch
                          checked={on}
                          disabled
                          ariaLabel={item.title}
                        />
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        ) : (
          <>
            {canEditProfile ? (
              <div className="mb-4 flex flex-wrap gap-2">
                <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tên nhóm"
                    className="min-w-0 flex-1"
                    disabled={savingKey === "name"}
                  />
                  <Button
                    size="sm"
                    onClick={() => void handleRename()}
                    disabled={savingKey === "name"}
                  >
                    {savingKey === "name" ? "Đang lưu..." : "Đổi tên nhóm"}
                  </Button>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    void handleAvatarPick(e.target.files?.[0] ?? null)
                  }
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={savingKey === "avatar"}
                  onClick={() => fileRef.current?.click()}
                >
                  {savingKey === "avatar" ? "Đang tải..." : "Đổi ảnh đại diện"}
                </Button>
              </div>
            ) : null}

            {canEditSettings ? (
              <section>
                <h4 className="mb-2 border-b border-gray-100 pb-1 text-[11px] font-bold uppercase tracking-wide text-brand-600 dark:border-gray-800">
                  Thiết lập quyền nhóm
                </h4>
                {loadingSetting ? (
                  <p className="py-4 text-center text-xs text-gray-500">
                    Đang tải cấu hình nhóm...
                  </p>
                ) : (
                  <ul className="space-y-1">
                    {GROUP_SETTING_TOGGLES.map((item) => {
                      const on = Number(setting[item.key]) === 1;
                      return (
                        <li
                          key={item.key}
                          className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-semibold text-gray-800 dark:text-white/90">
                              {item.title}
                            </p>
                            <p className="text-[11px] leading-snug text-gray-500">
                              {item.desc}
                            </p>
                          </div>
                          <Switch
                            checked={on}
                            disabled={savingKey === item.key}
                            onChange={(checked) =>
                              void handleToggle(item.key, checked)
                            }
                            ariaLabel={item.title}
                          />
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            ) : null}
          </>
        )}
      </div>
    </Modal>
  );
}
