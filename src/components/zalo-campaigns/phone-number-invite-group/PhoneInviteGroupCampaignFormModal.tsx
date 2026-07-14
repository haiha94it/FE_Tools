"use client";

import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import TimePicker from "@/components/form/time-picker";
import { Modal } from "@/components/ui/modal";
import {
  campaignFormBodyClass,
  campaignFormMainClass,
  campaignFormModalPanelClass,
  campaignFormScrollPaneClass,
  campaignFormSidePaneClass,
} from "@/components/zalo-campaigns/CampaignFormModalLayout";
import { GroupIcon } from "@/icons";
import {
  MAX_PHONE_NUMBERS,
  buildGroupInviteString,
  formatTimeForApi,
  getGroupAvatar,
  isZaloAccountRunnable,
  normalizePhoneNumbers,
  parseGroupInviteString,
  parseTimeToDate,
  splitLines,
} from "@/lib/zalo-phone-invite-group-campaign-utils";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { zaloPhoneInviteGroupCampaignService } from "@/services/zalo-phone-invite-group-campaign.service";
import { useZaloPhoneInviteGroupCampaignStore } from "@/stores/use-zalo-phone-invite-group-campaign-store";
import type {
  PhoneInviteGroupCampaign,
  PhoneInviteGroupItem,
} from "@/types/zalo-phone-invite-group-campaign";
import type { ZaloAccount } from "@/types/zalo-account";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

interface PhoneInviteGroupCampaignFormModalProps {
  open: boolean;
  editingCampaign: PhoneInviteGroupCampaign | null;
  accounts: ZaloAccount[];
  accountsLoading: boolean;
  onClose: () => void;
  readOnly?: boolean;
}

const textareaClassName =
  "w-full resize-none rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-800 shadow-theme-xs outline-none placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

const defaultStart = () => {
  const date = new Date();
  date.setHours(7, 0, 0, 0);
  return date;
};

const defaultEnd = () => {
  const date = new Date();
  date.setHours(21, 0, 0, 0);
  return date;
};

export default function PhoneInviteGroupCampaignFormModal({
  open,
  editingCampaign,
  accounts,
  accountsLoading,
  onClose,
  readOnly = false,
}: PhoneInviteGroupCampaignFormModalProps) {
  const createOrEditCampaign = useZaloPhoneInviteGroupCampaignStore(
    (s) => s.createOrEditCampaign,
  );
  const saving = useZaloPhoneInviteGroupCampaignStore((s) => s.saving);

  const [name, setName] = useState("");
  const [delayTime, setDelayTime] = useState("350");
  const [numberCount, setNumberCount] = useState("20");
  const [phoneNumbers, setPhoneNumbers] = useState("");
  const [groupLink, setGroupLink] = useState("");
  const [startTime, setStartTime] = useState(defaultStart);
  const [endTime, setEndTime] = useState(defaultEnd);
  const [selectedAccountIds, setSelectedAccountIds] = useState<number[]>([]);
  const [groups, setGroups] = useState<PhoneInviteGroupItem[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<PhoneInviteGroupItem | null>(
    null,
  );
  const [groupSearch, setGroupSearch] = useState("");
  const [groupsLoading, setGroupsLoading] = useState(false);

  const runnableAccounts = useMemo(
    () => accounts.filter(isZaloAccountRunnable),
    [accounts],
  );

  const phoneLineCount = splitLines(phoneNumbers).length;

  const filteredGroups = useMemo(() => {
    const key = groupSearch.trim().toLowerCase();
    if (!key) return groups;
    return groups.filter((item) => item.name.toLowerCase().includes(key));
  }, [groups, groupSearch]);

  const resetForm = useCallback(() => {
    setName("");
    setDelayTime("350");
    setNumberCount("20");
    setPhoneNumbers("");
    setGroupLink("");
    setStartTime(defaultStart());
    setEndTime(defaultEnd());
    setSelectedAccountIds([]);
    setGroups([]);
    setSelectedGroup(null);
    setGroupSearch("");
  }, []);

  useEffect(() => {
    if (!open) return;

    if (!editingCampaign) {
      resetForm();
      return;
    }

    setName(editingCampaign.name ?? "");
    setDelayTime(String(editingCampaign.delay_time ?? 350));
    setNumberCount(String(editingCampaign.number_count ?? 20));
    setPhoneNumbers(normalizePhoneNumbers(editingCampaign.phone_numbers));
    setGroupLink(editingCampaign.group_link ?? "");
    setStartTime(parseTimeToDate(editingCampaign.from_time) ?? defaultStart());
    setEndTime(parseTimeToDate(editingCampaign.to_time) ?? defaultEnd());

    const accountIds =
      editingCampaign.accounts ??
      (editingCampaign.account ? [editingCampaign.account] : []);
    setSelectedAccountIds(accountIds);
    setSelectedGroup(null);
    setGroups([]);
    setGroupSearch("");
  }, [open, editingCampaign, resetForm]);

  const loadGroupsForEdit = useCallback(async () => {
    if (!editingCampaign?.group_invite || !selectedAccountIds.length) return;
    try {
      setGroupsLoading(true);
      const loaded = await zaloPhoneInviteGroupCampaignService.fetchGroupsByAccounts({
        accountIds: selectedAccountIds,
      });
      setGroups(loaded);
      const parsed = parseGroupInviteString(editingCampaign.group_invite);
      if (parsed) {
        const matched =
          loaded.find((item) => item.name === parsed.name) ?? null;
        setSelectedGroup(matched);
      }
    } catch {
      toast.error("Không tải được danh sách nhóm.");
    } finally {
      setGroupsLoading(false);
    }
  }, [editingCampaign, selectedAccountIds]);

  useEffect(() => {
    if (!open || !editingCampaign?.group_invite || !selectedAccountIds.length) {
      return;
    }
    void loadGroupsForEdit();
  }, [open, editingCampaign, selectedAccountIds, loadGroupsForEdit]);

  const toggleAccount = (accountId: number) => {
    setSelectedAccountIds((prev) => {
      const next = prev.includes(accountId)
        ? prev.filter((id) => id !== accountId)
        : [...prev, accountId];
      if (next.length !== prev.length) {
        setGroups([]);
        setSelectedGroup(null);
      }
      return next;
    });
  };

  const toggleSelectAllAccounts = () => {
    const allIds = runnableAccounts.map((item) => item.id);
    const allSelected =
      allIds.length > 0 &&
      allIds.every((id) => selectedAccountIds.includes(id));
    setSelectedAccountIds(allSelected ? [] : allIds);
    setGroups([]);
    setSelectedGroup(null);
  };

  const handleLoadGroups = async (keyword?: string) => {
    if (!selectedAccountIds.length) {
      toast.error("Chọn ít nhất một tài khoản.");
      return;
    }
    try {
      setGroupsLoading(true);
      const loaded = await zaloPhoneInviteGroupCampaignService.fetchGroupsByAccounts({
        accountIds: selectedAccountIds,
        keyword: keyword ?? groupSearch,
      });
      setGroups(loaded);
      if (!loaded.length) {
        toast.error("Không tìm thấy nhóm nào.");
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setGroupsLoading(false);
    }
  };

  const handlePhoneChange = (value: string) => {
    const count = splitLines(value).length;
    if (count > MAX_PHONE_NUMBERS) {
      toast.error(`Không được quá ${MAX_PHONE_NUMBERS} số.`);
      return;
    }
    setPhoneNumbers(value);
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Vui lòng nhập tên kịch bản.");
      return;
    }
    if (!selectedAccountIds.length) {
      toast.error("Chọn ít nhất một tài khoản Zalo.");
      return;
    }
    if (!selectedGroup) {
      toast.error("Chọn nhóm để mời tham gia.");
      return;
    }
    const phones = splitLines(phoneNumbers);
    if (!phones.length) {
      toast.error("Nhập ít nhất một số điện thoại.");
      return;
    }
    const delay = Number(delayTime);
    const count = Number(numberCount);
    if (!Number.isFinite(delay) || delay <= 0) {
      toast.error("Thời gian chờ không hợp lệ.");
      return;
    }
    if (!Number.isFinite(count) || count <= 0) {
      toast.error("Số lượt mời không hợp lệ.");
      return;
    }

    const payload = {
      id_category: editingCampaign?.id ?? null,
      name: trimmedName,
      delay_time: delay,
      number_count: count,
      id_accounts: selectedAccountIds,
      group_link: groupLink.trim() || undefined,
      phone_numbers: phones,
      from_time: formatTimeForApi(startTime),
      to_time: formatTimeForApi(endTime),
      group_invite: buildGroupInviteString(selectedGroup),
    };

    try {
      await createOrEditCampaign(payload);
      toast.success(
        editingCampaign ? "Đã cập nhật kịch bản." : "Đã tạo kịch bản mới.",
      );
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      className={campaignFormModalPanelClass.lg}
      showCloseButton
    >
      <div className={campaignFormBodyClass}>
        <div className="mb-4 shrink-0 pr-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {editingCampaign
              ? readOnly
                ? "Xem kịch bản mời SĐT tham gia nhóm"
                : "Sửa kịch bản mời SĐT tham gia nhóm"
              : "Thêm kịch bản mời SĐT tham gia nhóm"}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Cấu hình kịch bản bên trái · chọn tài khoản và nhóm bên phải
          </p>
        </div>

        <div className={campaignFormMainClass}>
          <fieldset disabled={readOnly} className="contents">
            <div className="grid h-full min-h-0 flex-1 gap-4 overflow-hidden max-lg:grid-cols-1 max-lg:grid-rows-[minmax(0,1fr)_minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:grid-rows-1">
              <div className={campaignFormScrollPaneClass}>
                <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
                Tên kịch bản
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập tên kịch bản"
                disabled={saving}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
                  Thời gian chờ (giây)
                </label>
                <Input
                  type="number"
                  value={delayTime}
                  onChange={(e) => setDelayTime(e.target.value)}
                  disabled={saving}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
                  Số lượt mời / ngày
                </label>
                <Input
                  type="number"
                  value={numberCount}
                  onChange={(e) => setNumberCount(e.target.value)}
                  disabled={saving}
                />
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 dark:border-gray-700 dark:bg-white/[0.02]">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Khung giờ chạy
              </span>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-theme-xs text-gray-500">Từ</span>
                  <TimePicker value={startTime} onChange={setStartTime} disabled={saving} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-theme-xs text-gray-500">Đến</span>
                  <TimePicker value={endTime} onChange={setEndTime} disabled={saving} />
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
                Link nhóm Zalo
              </label>
              <Input
                value={groupLink}
                onChange={(e) => setGroupLink(e.target.value)}
                placeholder="https://zalo.me/g/..."
                disabled={saving}
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Danh sách SĐT (mỗi dòng một số)
                </label>
                <span className="text-theme-xs tabular-nums text-gray-500">
                  {phoneLineCount}/{MAX_PHONE_NUMBERS}
                </span>
              </div>
              <textarea
                value={phoneNumbers}
                onChange={(e) => handlePhoneChange(e.target.value)}
                rows={6}
                disabled={saving}
                placeholder={"09xxxxxxxx\n09xxxxxxxx"}
                className={textareaClassName}
              />
            </div>

            <p className="text-xs leading-5 text-error-600 dark:text-error-400">
              Lưu ý: Hiện tại Zalo chỉ cho phép mời vào nhóm cộng đồng khi là bạn bè.
            </p>
                </div>
              </div>

              <div
                className={`${campaignFormSidePaneClass} gap-3 rounded-2xl border border-gray-200 bg-gray-50/40 p-3 dark:border-gray-800 dark:bg-white/[0.02]`}
              >
            <div className="shrink-0">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                  Tài khoản chạy kịch bản
                </p>
                <button
                  type="button"
                  disabled={saving || !runnableAccounts.length}
                  onClick={toggleSelectAllAccounts}
                  className="text-theme-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
                >
                  Chọn tất cả
                </button>
              </div>
              <div className="custom-scrollbar flex gap-2 overflow-x-auto pb-0.5">
                {accountsLoading ? (
                  <p className="px-2 py-3 text-sm text-gray-500">Đang tải tài khoản...</p>
                ) : runnableAccounts.length === 0 ? (
                  <p className="px-2 py-3 text-sm text-gray-500">
                    Không có tài khoản hoạt động
                  </p>
                ) : (
                  runnableAccounts.map((account) => {
                    const active = selectedAccountIds.includes(account.id);
                    const label = account.name || `Tài khoản #${account.id}`;
                    return (
                      <button
                        key={account.id}
                        type="button"
                        onClick={() => toggleAccount(account.id)}
                        className={`flex shrink-0 items-center gap-2.5 rounded-xl border px-2.5 py-2 transition ${
                          active
                            ? "border-brand-300 bg-white shadow-theme-xs ring-2 ring-brand-500/15 dark:border-brand-500/40 dark:bg-gray-900"
                            : "border-gray-200 bg-white/80 hover:border-gray-300 hover:bg-white dark:border-gray-700 dark:bg-gray-900/60 dark:hover:border-gray-600"
                        }`}
                      >
                        <span
                          className={`relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800 ${
                            active ? "ring-2 ring-brand-400/40" : ""
                          }`}
                        >
                          {account.avatar ? (
                            <Image
                              src={account.avatar}
                              alt=""
                              fill
                              unoptimized
                              className="object-cover"
                            />
                          ) : null}
                        </span>
                        <span className="min-w-0 max-w-[140px] text-left">
                          <span className="block truncate text-sm font-medium text-gray-800 dark:text-white/90">
                            {label}
                          </span>
                          <span className="block truncate text-theme-xs text-gray-500">
                            {account.phone_number || "—"}
                          </span>
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.02]">
              <div className="flex shrink-0 items-center gap-2 border-b border-gray-100 px-2.5 py-2 dark:border-gray-800">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                  <GroupIcon className="size-3.5" />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-800 dark:text-white/90">
                  Chọn nhóm
                </span>
                {selectedGroup ? (
                  <span className="shrink-0 rounded-full bg-brand-50 px-1.5 py-0.5 text-[11px] font-medium text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                    Đã chọn
                  </span>
                ) : null}
              </div>

              <div className="flex shrink-0 items-center gap-1.5 border-b border-gray-100 px-2.5 py-2 dark:border-gray-800">
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 px-2.5 text-xs"
                  disabled={groupsLoading || saving || !selectedAccountIds.length}
                  onClick={() => void handleLoadGroups("")}
                >
                  {groupsLoading ? "Đang tải..." : "Lấy danh sách nhóm"}
                </Button>
                <div className="min-w-0 flex-1">
                  <Input
                    value={groupSearch}
                    onChange={(e) => setGroupSearch(e.target.value)}
                    placeholder="Tìm nhóm..."
                    disabled={!selectedAccountIds.length || saving}
                    className="!h-8 !px-2.5 !py-1.5 !text-xs"
                  />
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 px-2.5 text-xs"
                  disabled={groupsLoading || saving || !selectedAccountIds.length}
                  onClick={() => void handleLoadGroups(groupSearch)}
                >
                  Tìm
                </Button>
              </div>

              <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain p-1">
                {!selectedAccountIds.length ? (
                  <p className="px-3 py-5 text-center text-xs text-gray-500">
                    Chọn tài khoản để lấy danh sách nhóm
                  </p>
                ) : groupsLoading && !groups.length ? (
                  <p className="px-3 py-5 text-center text-xs text-gray-500">
                    Đang tải nhóm...
                  </p>
                ) : !groups.length ? (
                  <p className="px-3 py-5 text-center text-xs text-gray-500">
                    Bấm &quot;Lấy danh sách nhóm&quot; để tải nhóm
                  </p>
                ) : filteredGroups.length === 0 ? (
                  <p className="px-3 py-5 text-center text-xs text-gray-500">
                    Không tìm thấy nhóm phù hợp
                  </p>
                ) : (
                  <div className="space-y-1">
                    {filteredGroups.map((group, index) => {
                      const active =
                        selectedGroup?.name === group.name &&
                        getGroupAvatar(selectedGroup) === getGroupAvatar(group);
                      const avatar = getGroupAvatar(group);
                      return (
                        <button
                          key={`${group.name}-${index}`}
                          type="button"
                          disabled={saving}
                          onClick={() => setSelectedGroup(group)}
                          className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition ${
                            active
                              ? "bg-brand-50 ring-1 ring-brand-200 dark:bg-brand-500/10 dark:ring-brand-500/30"
                              : "hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                          }`}
                        >
                          <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                            {avatar ? (
                              <Image
                                src={avatar}
                                alt=""
                                fill
                                unoptimized
                                className="object-cover"
                              />
                            ) : null}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-xs font-medium text-gray-800 dark:text-white/90">
                            {group.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
              </div>
            </div>
          </fieldset>
        </div>

        <div className="mt-4 flex shrink-0 justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
          {readOnly ? (
            <Button size="sm" variant="outline" onClick={onClose}>
              Đóng
            </Button>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={onClose} disabled={saving}>
                Hủy
              </Button>
              <Button size="sm" disabled={saving} onClick={() => void handleSave()}>
                {saving ? "Đang lưu..." : editingCampaign ? "Sửa kịch bản" : "Lưu kịch bản"}
              </Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}