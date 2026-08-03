"use client";

import ContactAvatar, {
  ContactNameCell,
} from "@/components/zalo-contacts/shared/ContactAvatar";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Switch from "@/components/form/switch/Switch";
import { Modal } from "@/components/ui/modal";
import { getGroupMemberDisplay } from "@/lib/zalo-contacts-utils";
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
 * Phân quyền:
 * - is_creator: đổi tên/ảnh + toggle quyền nhóm + thêm/gỡ phó nhóm
 * - is_admin (phó): đổi tên/ảnh + toggle quyền nhóm — KHÔNG gán phó khác
 * - thành viên: chỉ xem
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
  const [busyAdminUid, setBusyAdminUid] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { isCreator, isAdminOnly, isMemberOnly } = useMemo(
    () => resolveSelfRole(members, accountUid),
    [members, accountUid],
  );
  /** Trưởng + phó: đổi tên/ảnh + cài đặt quyền nhóm */
  const canEditProfile = isCreator || isAdminOnly;
  const canEditSettings = isCreator || isAdminOnly;
  /** Chỉ trưởng nhóm — thêm/gỡ phó nhóm */
  const canManageAdmins = isCreator;

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

  const handleAdmin = useCallback(
    async (member: ZaloGroupMember, action: "add" | "remove") => {
      if (!canManageAdmins) {
        toast.error("Chỉ trưởng nhóm mới được thêm/gỡ phó nhóm.");
        return;
      }
      const uid = member.friend?.uid;
      if (!uid) {
        toast.error("Thành viên thiếu UID — làm mới danh sách rồi thử lại.");
        return;
      }
      setBusyAdminUid(uid);
      try {
        const res =
          action === "add"
            ? await zaloGroupService.addGroupAdmin(accountId, groupId, uid)
            : await zaloGroupService.removeGroupAdmin(accountId, groupId, uid);
        if (!res.ok) {
          toast.error(res.message || "Thao tác phó nhóm thất bại.");
          return;
        }
        toast.success(
          action === "add" ? "Đã thêm phó nhóm." : "Đã gỡ phó nhóm.",
        );
        onUpdated?.();
      } catch {
        toast.error("Thao tác phó nhóm thất bại.");
      } finally {
        setBusyAdminUid(null);
      }
    },
    [accountId, canManageAdmins, groupId, onUpdated],
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
          </div>
        </div>

        {/* Thành viên: chỉ xem */}
        {isMemberOnly ? (
          <div className="space-y-4">
            <p className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-4 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-white/[0.02]">
              Bạn là thành viên — chỉ xem thông tin nhóm, không được tùy chỉnh
              hay ủy quyền.
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
            <section>
              <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-gray-500">
                Thành viên
              </h4>
              <ul className="space-y-1">
                {members.map((member) => {
                  const { key, name: mName, avatar } =
                    getGroupMemberDisplay(member);
                  const badge = member.is_creator
                    ? "Trưởng nhóm"
                    : member.is_admin
                      ? "Phó nhóm"
                      : null;
                  return (
                    <li
                      key={key}
                      className="flex items-center justify-between gap-2 rounded-lg px-2 py-2"
                    >
                      <ContactNameCell name={mName} avatar={avatar} />
                      {badge ? (
                        <span className="text-[10px] font-medium text-gray-500">
                          {badge}
                        </span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>
        ) : (
          <>
            {/* Creator + Admin: đổi tên / ảnh */}
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

            {/* Trưởng + phó: toggle quyền nhóm */}
            {canEditSettings ? (
              <section className="mb-5">
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

            {/* Chỉ trưởng: ủy quyền phó — phó không gán phó khác */}
            {canManageAdmins ? (
              <section>
                <h4 className="mb-2 border-b border-gray-100 pb-1 text-[11px] font-bold uppercase tracking-wide text-brand-600 dark:border-gray-800">
                  Ủy quyền ban quản trị
                </h4>
                <ul className="space-y-1 rounded-xl border border-gray-100 bg-gray-50/60 p-2 dark:border-gray-800 dark:bg-white/[0.02]">
                  {members
                    .filter((m) => !m.is_creator)
                    .map((member) => {
                      const { key, name: mName, avatar } =
                        getGroupMemberDisplay(member);
                      const uid = member.friend?.uid ?? "";
                      const busy = busyAdminUid === uid;
                      return (
                        <li
                          key={key}
                          className="flex items-center justify-between gap-2 rounded-lg px-2 py-2"
                        >
                          <ContactNameCell name={mName} avatar={avatar} />
                          <div className="flex shrink-0 items-center gap-2">
                            {member.is_admin ? (
                              <span className="text-[10px] font-medium text-gray-500">
                                Phó nhóm
                              </span>
                            ) : null}
                            <Button
                              size="sm"
                              variant={member.is_admin ? "outline" : "primary"}
                              disabled={busy || !uid}
                              onClick={() =>
                                void handleAdmin(
                                  member,
                                  member.is_admin ? "remove" : "add",
                                )
                              }
                            >
                              {busy
                                ? "..."
                                : member.is_admin
                                  ? "Xóa phó nhóm"
                                  : "Thêm phó nhóm"}
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  {members.filter((m) => !m.is_creator).length === 0 ? (
                    <p className="px-2 py-3 text-center text-xs text-gray-500">
                      Chưa có thành viên khác — làm mới danh sách thành viên.
                    </p>
                  ) : null}
                </ul>
              </section>
            ) : isAdminOnly ? (
              <p className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-3 text-xs text-gray-500 dark:border-gray-800 dark:bg-white/[0.02]">
                Phó nhóm được tùy chỉnh tên, ảnh và quyền nhóm. Chỉ{" "}
                <span className="font-semibold">trưởng nhóm</span> được thêm/gỡ
                phó nhóm.
              </p>
            ) : null}
          </>
        )}
      </div>
    </Modal>
  );
}
