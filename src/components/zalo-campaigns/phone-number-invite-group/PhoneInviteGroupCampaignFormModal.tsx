"use client";

import AvatarText from "@/components/ui/avatar/AvatarText";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import TimePicker from "@/components/form/time-picker";
import { Modal } from "@/components/ui/modal";
import {
  campaignFormBodyClass,
  campaignFormMainClass,
  campaignFormModalPanelClass,
  campaignFormModalPanelClassWizard,
  campaignFormScrollPaneClass,
  campaignFormSidePaneClass,
  campaignFormWizardListScrollClass,
  campaignFormWizardSelectionPanelClass,
  CAMPAIGN_WIZARD_LIST_MAX_HEIGHT,
} from "@/components/zalo-campaigns/CampaignFormModalLayout";
import {
  CampaignFormWizardFooter,
  CampaignFormWizardHeader,
  type CampaignWizardStep,
} from "@/components/zalo-campaigns/CampaignFormWizard";
import { useCampaignFormWizard } from "@/hooks/use-campaign-form-wizard";
import { GroupIcon } from "@/icons";
import {
  GROUP_NOT_ON_ALL_ACCOUNTS,
  GROUP_NOT_ON_ALL_ACCOUNTS_MESSAGE,
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
import { getApiErrorCode, getApiErrorMessage } from "@/lib/errors";
import { canSkipZaloProxyRequirement } from "@/lib/map-auth-user";
import { toast } from "@/lib/toast";
import { zaloPhoneInviteGroupCampaignService } from "@/services/zalo-phone-invite-group-campaign.service";
import { useAuthStore } from "@/stores/use-auth-store";
import { useZaloPhoneInviteGroupCampaignStore } from "@/stores/use-zalo-phone-invite-group-campaign-store";
import type {
  PhoneInviteGroupCampaign,
  PhoneInviteGroupItem,
} from "@/types/zalo-phone-invite-group-campaign";
import type { ZaloAccount } from "@/types/zalo-account";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

function accountIdsKey(ids: number[]): string {
  return [...ids].sort((a, b) => a - b).join(",");
}

const GROUP_PAGE_SIZE = 50;
const GROUP_SEARCH_DEBOUNCE_MS = 350;

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
  const user = useAuthStore((s) => s.user);
  const canSkipProxy = canSkipZaloProxyRequirement(user);
  const { isWizard, wizardStep, setWizardStep, goBack, goNext } =
    useCampaignFormWizard(open);

  const [name, setName] = useState("");
  const [delayTime, setDelayTime] = useState("350");
  const [numberCount, setNumberCount] = useState("20");
  const [phoneNumbers, setPhoneNumbers] = useState("");
  const [startTime, setStartTime] = useState(defaultStart);
  const [endTime, setEndTime] = useState(defaultEnd);
  const [selectedAccountIds, setSelectedAccountIds] = useState<number[]>([]);
  const [groups, setGroups] = useState<PhoneInviteGroupItem[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<PhoneInviteGroupItem | null>(
    null,
  );
  const [groupSearch, setGroupSearch] = useState("");
  const [debouncedGroupSearch, setDebouncedGroupSearch] = useState("");
  const [groupPage, setGroupPage] = useState(1);
  const [groupTotal, setGroupTotal] = useState(0);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsLoaded, setGroupsLoaded] = useState(false);

  /** Match group_invite khi edit sau khi all-group trả về */
  const pendingGroupInviteRef = useRef<string | null>(null);
  const loadSeqRef = useRef(0);

  const runnableAccounts = useMemo(
    () => accounts.filter((a) => isZaloAccountRunnable(a, canSkipProxy)),
    [accounts, canSkipProxy],
  );

  const phoneLineCount = splitLines(phoneNumbers).length;
  const selectedKey = accountIdsKey(selectedAccountIds);
  const multiNick = selectedAccountIds.length >= 2;
  const allRunnableSelected =
    runnableAccounts.length > 0 &&
    runnableAccounts.every((account) => selectedAccountIds.includes(account.id));

  const groupTotalPages = Math.max(
    1,
    Math.ceil(groupTotal / GROUP_PAGE_SIZE) || 1,
  );

  const resetGroupPaging = useCallback(() => {
    setGroupPage(1);
    setGroupTotal(0);
    setGroups([]);
    setGroupSearch("");
    setDebouncedGroupSearch("");
    setGroupsLoaded(false);
  }, []);

  const resetForm = useCallback(() => {
    setName("");
    setDelayTime("350");
    setNumberCount("20");
    setPhoneNumbers("");
    setStartTime(defaultStart());
    setEndTime(defaultEnd());
    setSelectedAccountIds([]);
    setSelectedGroup(null);
    resetGroupPaging();
    pendingGroupInviteRef.current = null;
  }, [resetGroupPaging]);

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
    setStartTime(parseTimeToDate(editingCampaign.from_time) ?? defaultStart());
    setEndTime(parseTimeToDate(editingCampaign.to_time) ?? defaultEnd());

    const accountIds =
      editingCampaign.accounts ??
      (editingCampaign.account ? [editingCampaign.account] : []);
    setSelectedAccountIds(accountIds);
    setSelectedGroup(null);
    resetGroupPaging();
    pendingGroupInviteRef.current = editingCampaign.group_invite ?? null;
  }, [open, editingCampaign, resetForm, resetGroupPaging]);

  // Drop nick không còn runnable (checkpoint/proxy) sau khi accounts load.
  useEffect(() => {
    if (!open || accountsLoading || !runnableAccounts.length) return;
    setSelectedAccountIds((prev) => {
      const next = prev.filter((id) =>
        runnableAccounts.some((account) => account.id === id),
      );
      return next.length === prev.length ? prev : next;
    });
  }, [open, accountsLoading, runnableAccounts]);

  // Debounce tìm nhóm → BE keyword + reset page
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      setDebouncedGroupSearch(groupSearch.trim());
      setGroupPage(1);
    }, GROUP_SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [groupSearch, open]);

  const loadGroups = useCallback(
    async (
      accountIds: number[],
      keyword: string,
      page: number,
      options?: { silentEmpty?: boolean },
    ) => {
      if (!accountIds.length) {
        setGroups([]);
        setSelectedGroup(null);
        setGroupTotal(0);
        setGroupsLoaded(false);
        return;
      }

      const seq = ++loadSeqRef.current;
      try {
        setGroupsLoading(true);
        const data =
          await zaloPhoneInviteGroupCampaignService.fetchGroupsByAccountsPage({
            accountIds,
            keyword: keyword || undefined,
            page,
            pageSize: GROUP_PAGE_SIZE,
          });
        if (seq !== loadSeqRef.current) return;

        const loaded = data.results;
        setGroups(loaded);
        setGroupTotal(data.count);
        setGroupsLoaded(true);

        const pendingInvite = pendingGroupInviteRef.current;
        if (pendingInvite) {
          const parsed = parseGroupInviteString(pendingInvite);
          if (parsed) {
            const matched =
              loaded.find((item) => item.name === parsed.name) ??
              loaded.find(
                (item) =>
                  item.name === parsed.name &&
                  (getGroupAvatar(item) ?? "") === parsed.avt,
              ) ??
              null;
            if (matched) {
              setSelectedGroup(matched);
              pendingGroupInviteRef.current = null;
            } else if (page === 1 && !keyword) {
              // Fallback: tìm full list (không page) để match group_invite khi edit
              try {
                const all =
                  await zaloPhoneInviteGroupCampaignService.fetchGroupsByAccounts(
                    { accountIds },
                  );
                if (seq !== loadSeqRef.current) return;
                const found =
                  all.find((item) => item.name === parsed.name) ??
                  all.find(
                    (item) =>
                      item.name === parsed.name &&
                      (getGroupAvatar(item) ?? "") === parsed.avt,
                  ) ??
                  null;
                setSelectedGroup(found);
                if (found) pendingGroupInviteRef.current = null;
              } catch {
                /* ignore match miss */
              }
            }
          }
        } else {
          setSelectedGroup((prev) => {
            if (!prev) return null;
            return (
              loaded.find((item) => item.id != null && item.id === prev.id) ??
              loaded.find(
                (item) =>
                  item.name === prev.name &&
                  getGroupAvatar(item) === getGroupAvatar(prev),
              ) ??
              prev
            );
          });
        }

        if (!loaded.length && data.count === 0 && !options?.silentEmpty) {
          toast.error(
            accountIds.length >= 2
              ? "Không có nhóm chung giữa các nick đã chọn."
              : "Không tìm thấy nhóm nào.",
          );
        }
      } catch (error) {
        if (seq !== loadSeqRef.current) return;
        setGroups([]);
        setGroupTotal(0);
        setGroupsLoaded(true);
        toast.error(getApiErrorMessage(error));
      } finally {
        if (seq === loadSeqRef.current) {
          setGroupsLoading(false);
        }
      }
    },
    [],
  );

  // Gọi all-group paginated khi đổi nick / search / page
  useEffect(() => {
    if (!open) return;
    if (!selectedAccountIds.length) {
      setGroups([]);
      setSelectedGroup(null);
      setGroupTotal(0);
      setGroupsLoaded(false);
      return;
    }
    void loadGroups(selectedAccountIds, debouncedGroupSearch, groupPage, {
      silentEmpty: true,
    });
  }, [
    open,
    selectedKey,
    editingCampaign?.id,
    loadGroups,
    selectedAccountIds,
    debouncedGroupSearch,
    groupPage,
  ]);

  const toggleAccount = (accountId: number) => {
    setSelectedAccountIds((prev) => {
      const next = prev.includes(accountId)
        ? prev.filter((id) => id !== accountId)
        : [...prev, accountId];
      if (next.length !== prev.length) {
        setSelectedGroup(null);
        resetGroupPaging();
        pendingGroupInviteRef.current = null;
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
    setSelectedGroup(null);
    resetGroupPaging();
    pendingGroupInviteRef.current = null;
  };

  const handleRefreshGroups = async () => {
    if (!selectedAccountIds.length) {
      toast.error("Chọn ít nhất một tài khoản.");
      return;
    }
    setGroupPage(1);
    await loadGroups(selectedAccountIds, debouncedGroupSearch, 1);
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
      if (getApiErrorCode(error) === GROUP_NOT_ON_ALL_ACCOUNTS) {
        toast.error(GROUP_NOT_ON_ALL_ACCOUNTS_MESSAGE);
        return;
      }
      toast.error(getApiErrorMessage(error));
    }
  };

  const wizardSteps: CampaignWizardStep[] = useMemo(
    () => [
      {
        id: "config",
        title: "Cấu hình",
        hint: "Tên, tốc độ mời và khung giờ chạy",
      },
      {
        id: "phones",
        title: "SĐT",
        hint: "Danh sách số điện thoại mời (mỗi dòng một số)",
      },
      {
        id: "accounts",
        title: "Nick Zalo",
        hint: "Chọn nick chạy kịch bản (nhóm chung khi ≥ 2 nick)",
      },
      {
        id: "group",
        title: "Nhóm",
        hint: multiNick
          ? "Chọn nhóm chung giữa các nick đã chọn"
          : "Chọn nhóm để mời SĐT tham gia",
      },
    ],
    [multiNick],
  );

  const validateWizardStep = useCallback(
    (step: number): boolean => {
      if (step === 0) {
        if (!name.trim()) {
          toast.error("Vui lòng nhập tên kịch bản.");
          return false;
        }
        const delay = Number(delayTime);
        const count = Number(numberCount);
        if (!Number.isFinite(delay) || delay <= 0) {
          toast.error("Thời gian chờ không hợp lệ.");
          return false;
        }
        if (!Number.isFinite(count) || count <= 0) {
          toast.error("Số lượt mời không hợp lệ.");
          return false;
        }
        return true;
      }
      if (step === 1) {
        if (!splitLines(phoneNumbers).length) {
          toast.error("Nhập ít nhất một số điện thoại.");
          return false;
        }
        return true;
      }
      if (step === 2) {
        if (!selectedAccountIds.length) {
          toast.error("Chọn ít nhất một tài khoản Zalo.");
          return false;
        }
        return true;
      }
      return true;
    },
    [name, delayTime, numberCount, phoneNumbers, selectedAccountIds],
  );

  const modalTitle = editingCampaign
    ? readOnly
      ? "Xem kịch bản mời SĐT tham gia nhóm"
      : "Sửa kịch bản mời SĐT tham gia nhóm"
    : "Thêm kịch bản mời SĐT tham gia nhóm";

  const configFields = (
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
    </div>
  );

  const phoneFields = (
    <div className="space-y-4">
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
          rows={isWizard ? 12 : 6}
          disabled={saving}
          placeholder={"09xxxxxxxx\n09xxxxxxxx"}
          className={textareaClassName}
        />
      </div>

      <p className="text-xs leading-5 text-gray-500 dark:text-gray-400">
        SĐT là <strong>1 queue chung</strong> — các nick thay phiên mời vào{" "}
        <strong>cùng nhóm chung</strong>. Nick mất group / proxy / limit sẽ
        không nhận SĐT (số không bị nuốt).
      </p>
      <p className="text-xs leading-5 text-error-600 dark:text-error-400">
        Lưu ý: Hiện tại Zalo chỉ cho phép mời vào nhóm cộng đồng khi là bạn bè.
      </p>
    </div>
  );

  const accountsPanel = isWizard ? (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
      <div className="shrink-0 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
            Tài khoản chạy kịch bản
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={saving || !runnableAccounts.length}
              onClick={toggleSelectAllAccounts}
              className="text-theme-xs font-semibold text-brand-600 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-40 dark:text-brand-400 dark:hover:text-brand-300"
            >
              {allRunnableSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
            </button>
            <span className="text-theme-xs text-gray-500">
              {selectedAccountIds.length} đã chọn
            </span>
          </div>
        </div>
        {multiNick ? (
          <p className="text-theme-xs text-gray-500 dark:text-gray-400">
            ≥ 2 nick: chỉ hiện <strong>nhóm chung</strong> (mọi nick đều đã
            join).
          </p>
        ) : null}
      </div>
      <div
        className={`${campaignFormWizardListScrollClass} mt-3 space-y-1`}
        style={{
          maxHeight: CAMPAIGN_WIZARD_LIST_MAX_HEIGHT,
          height: CAMPAIGN_WIZARD_LIST_MAX_HEIGHT,
          WebkitOverflowScrolling: "touch",
          touchAction: "pan-y",
        }}
      >
        {accountsLoading ? (
          <p className="py-8 text-center text-sm text-gray-500">
            Đang tải tài khoản...
          </p>
        ) : runnableAccounts.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">
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
                className={`flex w-full min-w-0 items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition active:bg-brand-50/80 ${
                  active
                    ? "border-brand-300 bg-brand-50 dark:border-brand-500/30 dark:bg-brand-500/10"
                    : "border-transparent hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                }`}
              >
                <span
                  className={`relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800 ${
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
                  ) : (
                    <AvatarText name={label} size="sm" className="!h-9 !w-9" />
                  )}
                </span>
                <span className="min-w-0">
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
  ) : (
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
                  ) : (
                    <AvatarText name={label} size="md" className="!h-10 !w-10" />
                  )}
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
      {multiNick ? (
        <p className="mt-2 text-theme-xs text-gray-500 dark:text-gray-400">
          ≥ 2 nick: chỉ hiện <strong>nhóm chung</strong> (mọi nick đều đã
          join).
        </p>
      ) : null}
    </div>
  );

  const groupsPanel = (
    <div
      className={
        isWizard
          ? campaignFormWizardSelectionPanelClass
          : "flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.02] max-lg:h-[min(42dvh,300px)] max-lg:flex-none lg:min-h-0"
      }
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-gray-100 px-2.5 py-2 dark:border-gray-800">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
          <GroupIcon className="size-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-gray-800 dark:text-white/90">
            {multiNick ? "Chọn nhóm chung" : "Chọn nhóm"}
          </span>
          <span className="block text-[11px] leading-tight text-gray-500">
            1 nhóm / kịch bản · all-group phân trang
          </span>
        </div>
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
          onClick={() => void handleRefreshGroups()}
        >
          {groupsLoading ? "Đang tải..." : "Làm mới"}
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
      </div>

      <div
        className={
          isWizard
            ? campaignFormWizardListScrollClass
            : "custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain p-1"
        }
        style={
          isWizard
            ? {
                maxHeight: CAMPAIGN_WIZARD_LIST_MAX_HEIGHT,
                height: CAMPAIGN_WIZARD_LIST_MAX_HEIGHT,
                WebkitOverflowScrolling: "touch",
                touchAction: "pan-y",
              }
            : undefined
        }
      >
        {!selectedAccountIds.length ? (
          <p className="px-3 py-5 text-center text-xs text-gray-500">
            Chọn tài khoản đang hoạt động để lấy danh sách nhóm
          </p>
        ) : groupsLoading && !groups.length ? (
          <p className="px-3 py-5 text-center text-xs text-gray-500">
            Đang tải nhóm...
          </p>
        ) : groupsLoaded && !groups.length && groupTotal === 0 ? (
          <p className="px-3 py-5 text-center text-xs text-gray-500">
            {multiNick
              ? "Không có nhóm chung. Bỏ bớt nick hoặc sync nhóm rồi làm mới."
              : "Không tìm thấy nhóm. Sync nhóm trên nick rồi làm mới."}
          </p>
        ) : !groups.length ? (
          <p className="px-3 py-5 text-center text-xs text-gray-500">
            Đang chờ danh sách nhóm...
          </p>
        ) : (
          <div className="space-y-1">
            {groups.map((group, index) => {
              const active =
                (selectedGroup?.id != null &&
                  group.id != null &&
                  selectedGroup.id === group.id) ||
                (selectedGroup?.name === group.name &&
                  getGroupAvatar(selectedGroup) === getGroupAvatar(group));
              const avatar = getGroupAvatar(group);
              return (
                <button
                  key={`${group.id ?? group.uid ?? group.name}-${index}`}
                  type="button"
                  disabled={saving || readOnly}
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
                  {active ? (
                    <span className="shrink-0 text-brand-600 dark:text-brand-400">
                      ✓
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selectedAccountIds.length > 0 && groupTotal > 0 ? (
        <div className="flex shrink-0 items-center justify-between gap-2 border-t border-gray-100 px-2.5 py-2 dark:border-gray-800">
          <span className="text-theme-xs text-gray-500">
            Trang {groupPage}/{groupTotalPages} — {groupTotal} nhóm
          </span>
          <div className="flex gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="!px-2 !text-xs"
              disabled={groupPage <= 1 || groupsLoading || saving}
              onClick={() => setGroupPage((p) => Math.max(1, p - 1))}
            >
              Trước
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="!px-2 !text-xs"
              disabled={
                groupPage >= groupTotalPages || groupsLoading || saving
              }
              onClick={() =>
                setGroupPage((p) => Math.min(groupTotalPages, p + 1))
              }
            >
              Sau
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );

  const wizardBody =
    wizardStep === 0
      ? configFields
      : wizardStep === 1
        ? phoneFields
        : wizardStep === 2
          ? accountsPanel
          : groupsPanel;

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      className={
        isWizard
          ? campaignFormModalPanelClassWizard
          : campaignFormModalPanelClass.lg
      }
      showCloseButton
    >
      <div className={campaignFormBodyClass}>
        {isWizard ? (
          <>
            <div className="mb-1 min-w-0 max-w-full shrink-0 pr-9">
              <h3 className="text-sm font-semibold leading-snug break-words text-gray-900 dark:text-white">
                {modalTitle}
              </h3>
            </div>
            <CampaignFormWizardHeader
              steps={wizardSteps}
              current={wizardStep}
              onJump={(i) => {
                if (i < wizardStep) setWizardStep(i);
              }}
            />
            <div
              className={
                wizardStep >= 2
                  ? "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
                  : "custom-scrollbar min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain"
              }
              style={
                wizardStep < 2
                  ? { WebkitOverflowScrolling: "touch", touchAction: "pan-y" }
                  : undefined
              }
            >
              <fieldset
                disabled={readOnly}
                className={
                  wizardStep >= 2
                    ? "flex min-h-0 flex-1 flex-col border-0 p-0"
                    : "min-w-0 border-0 p-0"
                }
              >
                {wizardBody}
              </fieldset>
            </div>
            <div className="relative z-10 shrink-0 border-t border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900">
              <CampaignFormWizardFooter
                current={wizardStep}
                total={wizardSteps.length}
                onBack={goBack}
                onNext={() => {
                  if (!validateWizardStep(wizardStep)) return;
                  goNext(wizardSteps.length - 1);
                }}
                onCancel={onClose}
                onSubmit={() => void handleSave()}
                saving={saving}
                readOnly={readOnly}
                submitLabel={
                  editingCampaign ? "Sửa kịch bản" : "Lưu kịch bản"
                }
              />
            </div>
          </>
        ) : (
          <>
            <div className="mb-4 shrink-0 pr-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {modalTitle}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Cấu hình kịch bản bên trái · chọn tài khoản và nhóm bên phải
              </p>
            </div>

            <div className={campaignFormMainClass}>
              <fieldset disabled={readOnly} className="contents">
                <div className="grid gap-4 max-lg:grid-cols-1 max-lg:auto-rows-auto lg:h-full lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:grid-rows-1 lg:overflow-hidden">
                  <div className={campaignFormScrollPaneClass}>
                    <div className="space-y-4">
                      {configFields}
                      {phoneFields}
                    </div>
                  </div>

                  <div
                    className={`${campaignFormSidePaneClass} gap-3 rounded-2xl border border-gray-200 bg-gray-50/40 p-3 dark:border-gray-800 dark:bg-white/[0.02]`}
                  >
                    {accountsPanel}
                    {groupsPanel}
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
          </>
        )}
      </div>
    </Modal>
  );
}
