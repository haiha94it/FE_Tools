"use client";

import AvatarText from "@/components/ui/avatar/AvatarText";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import TimePicker from "@/components/form/time-picker";
import { Modal } from "@/components/ui/modal";
import {
  campaignFormBodyClass,
  campaignFormFooterClass,
  campaignFormMainClass,
  campaignFormModalPanelClass,
  campaignFormScrollPaneClass,
  campaignFormModalPanelClassWizard,
  campaignFormSelectionPanelClass,
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
import { GroupIcon, TimeIcon, UserIcon } from "@/icons";
import { resolveZaloLabelColor } from "@/lib/zalo-label-utils";
import ContactAvatar from "@/components/zalo-contacts/shared/ContactAvatar";
import {
  formatTimeForApi,
  normalizePhoneNumbers,
  parseTimeToDate,
  splitLines,
} from "@/lib/zalo-invite-join-group-campaign-utils";
import {
  getGroupMemberDisplay,
  getZaloFriendDisplayName,
  getZaloGroupAvatar,
  getZaloGroupDisplayName,
} from "@/lib/zalo-contacts-utils";
import {
  SHOW_GROUP_LINK_FEATURES,
  SHOW_INVITE_JOIN_GROUP_PHONE_TYPE,
} from "@/config/feature-flags";
import { getApiErrorMessage } from "@/lib/errors";
import { useMediaQuery } from "@/hooks/use-media-query";
import { toast } from "@/lib/toast";
import { zaloFriendService } from "@/services/zalo-friend.service";
import { zaloGroupService } from "@/services/zalo-group.service";
import { zaloLabelService } from "@/services/zalo-label.service";
import { useZaloInviteJoinGroupCampaignStore } from "@/stores/use-zalo-invite-join-group-campaign-store";
import type {
  InviteJoinGroupCampaign,
  InviteJoinGroupType,
} from "@/types/zalo-invite-join-group-campaign";
import type {
  ZaloFriendItem,
  ZaloGroupItem,
  ZaloGroupMember,
  ZaloLabelCategory,
} from "@/types/zalo-contacts";
import type { ZaloAccount } from "@/types/zalo-account";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

interface InviteJoinGroupCampaignFormModalProps {
  open: boolean;
  editingCampaign: InviteJoinGroupCampaign | null;
  accounts: ZaloAccount[];
  accountsLoading: boolean;
  onClose: () => void;
  readOnly?: boolean;
}

const textareaClassName =
  "w-full resize-none rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-800 shadow-theme-xs outline-none placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

const INVITE_TYPES: { value: InviteJoinGroupType; label: string }[] = [
  { value: "friend", label: "Bạn bè" },
  ...(SHOW_INVITE_JOIN_GROUP_PHONE_TYPE
    ? ([{ value: "phone_number" as const, label: "Số điện thoại" }] as const)
    : []),
  ...(SHOW_GROUP_LINK_FEATURES
    ? ([{ value: "uids" as const, label: "Thành viên link" }] as const)
    : []),
];

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

function LabelColorDot({ color }: { color?: string | null }) {
  const resolved = resolveZaloLabelColor(color);
  return (
    <span
      className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-black/10 dark:ring-white/15"
      style={{ backgroundColor: resolved }}
    />
  );
}

function labelChipClass(active: boolean) {
  return `inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-theme-xs font-medium transition ${
    active
      ? "border-brand-300 bg-brand-50 text-brand-700 shadow-theme-xs dark:border-brand-500/40 dark:bg-brand-500/15 dark:text-brand-300"
      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-gray-600"
  }`;
}

interface LabelChipFilterProps {
  labels: ZaloLabelCategory[];
  value: number | null;
  onChange: (id: number | null) => void;
  disabled?: boolean;
}

function LabelChipFilter({
  labels,
  value,
  onChange,
  disabled = false,
}: LabelChipFilterProps) {
  return (
    <div className="custom-scrollbar flex min-w-0 flex-1 gap-1.5 overflow-x-auto pb-0.5">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(null)}
        className={labelChipClass(value === null)}
      >
        Tất cả
      </button>
      {labels.map((label) => {
        const active = value === label.id;
        const name = label.name || `Nhãn #${label.id}`;
        return (
          <button
            key={label.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(label.id)}
            className={labelChipClass(active)}
            title={name}
          >
            <LabelColorDot color={label.color} />
            <span className="max-w-[88px] truncate">{name}</span>
          </button>
        );
      })}
    </div>
  );
}

interface SelectionPanelProps {
  icon: ReactNode;
  title: string;
  badge?: string;
  toolbar?: ReactNode;
  children: ReactNode;
  /** Wizard step: panel cao hơn, full step */
  wizard?: boolean;
}

function SelectionPanel({
  icon,
  title,
  badge,
  toolbar,
  children,
  wizard = false,
}: SelectionPanelProps) {
  return (
    <div
      className={
        wizard
          ? campaignFormWizardSelectionPanelClass
          : campaignFormSelectionPanelClass
      }
    >
      <div
        className={`flex shrink-0 items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-800 ${
          wizard ? "px-2.5 py-1.5" : "px-3 py-2.5"
        }`}
      >
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={`flex shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 ${
              wizard ? "size-6" : "size-7"
            }`}
          >
            {icon}
          </span>
          <span
            className={`truncate font-semibold text-gray-800 dark:text-white/90 ${
              wizard ? "text-xs" : "text-sm"
            }`}
          >
            {title}
          </span>
        </div>
        {badge ? (
          <span className="shrink-0 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            {badge}
          </span>
        ) : null}
      </div>
      {toolbar ? (
        <div
          className={`shrink-0 space-y-1.5 border-b border-gray-100 dark:border-gray-800 ${
            wizard ? "px-2.5 py-1.5" : "px-3 py-2.5 space-y-2.5"
          }`}
        >
          {toolbar}
        </div>
      ) : null}
      {/*
        Wizard: maxHeight tường minh — iOS Safari chỉ scroll khi container có height bound.
        Desktop panel: flex-1 min-h-0 overflow-y-auto.
      */}
      <div
        className={
          wizard
            ? campaignFormWizardListScrollClass
            : "custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5"
        }
        style={
          wizard
            ? {
                maxHeight: CAMPAIGN_WIZARD_LIST_MAX_HEIGHT,
                height: CAMPAIGN_WIZARD_LIST_MAX_HEIGHT,
                WebkitOverflowScrolling: "touch",
                overscrollBehavior: "contain",
                touchAction: "pan-y",
              }
            : undefined
        }
      >
        {children}
      </div>
    </div>
  );
}

function PanelEmpty({ message }: { message: string }) {
  return (
    <div className="flex min-h-[120px] flex-col items-center justify-center px-4 py-6 text-center sm:min-h-[140px] sm:py-8">
      <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
    </div>
  );
}

export default function InviteJoinGroupCampaignFormModal({
  open,
  editingCampaign,
  accounts,
  accountsLoading,
  onClose,
  readOnly = false,
}: InviteJoinGroupCampaignFormModalProps) {
  const createOrEditCampaign = useZaloInviteJoinGroupCampaignStore(
    (s) => s.createOrEditCampaign,
  );
  const saving = useZaloInviteJoinGroupCampaignStore((s) => s.saving);
  /** ≤1023: wizard step; desktop: 2 cột */
  const isWizard = useMediaQuery("(max-width: 1023px)");
  const [wizardStep, setWizardStep] = useState(0);

  const [name, setName] = useState("");
  const [delayTime, setDelayTime] = useState("350");
  const [numberCount, setNumberCount] = useState("10");
  const [inviteType, setInviteType] = useState<InviteJoinGroupType>("friend");
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [groupLink, setGroupLink] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [phoneNumbers, setPhoneNumbers] = useState("");
  const [selectedFriendIds, setSelectedFriendIds] = useState<number[]>([]);
  const [selectedUids, setSelectedUids] = useState<string[]>([]);
  const [startTime, setStartTime] = useState(defaultStart);
  const [endTime, setEndTime] = useState(defaultEnd);

  const [groupSearch, setGroupSearch] = useState("");
  const [friendSearch, setFriendSearch] = useState("");
  const [groupLabelId, setGroupLabelId] = useState<number | null>(null);
  const [friendLabelId, setFriendLabelId] = useState<number | null>(null);
  const [labelCategories, setLabelCategories] = useState<ZaloLabelCategory[]>([]);
  const [labelsLoading, setLabelsLoading] = useState(false);
  const [groups, setGroups] = useState<ZaloGroupItem[]>([]);
  const [friends, setFriends] = useState<ZaloFriendItem[]>([]);
  const [linkMembers, setLinkMembers] = useState<ZaloGroupMember[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);

  const resetForm = () => {
    setName("");
    setDelayTime("350");
    setNumberCount("10");
    setInviteType("friend");
    setSelectedAccountId(null);
    setGroupLink("");
    setSelectedGroupId(null);
    setPhoneNumbers("");
    setSelectedFriendIds([]);
    setSelectedUids([]);
    setStartTime(defaultStart());
    setEndTime(defaultEnd());
    setGroupSearch("");
    setFriendSearch("");
    setGroupLabelId(null);
    setFriendLabelId(null);
    setLabelCategories([]);
    setGroups([]);
    setFriends([]);
    setLinkMembers([]);
  };

  useEffect(() => {
    if (!open) {
      resetForm();
      setWizardStep(0);
      return;
    }

    setWizardStep(0);

    if (!editingCampaign) {
      resetForm();
      return;
    }

    setName(editingCampaign.name ?? "");
    setDelayTime(String(editingCampaign.delay_time ?? 350));
    setNumberCount(String(editingCampaign.number_count ?? 10));
    {
      let nextType = editingCampaign.type ?? "friend";
      // Ẩn type không còn trên UI → fallback bạn bè
      if (!SHOW_GROUP_LINK_FEATURES && nextType === "uids") nextType = "friend";
      if (!SHOW_INVITE_JOIN_GROUP_PHONE_TYPE && nextType === "phone_number") {
        nextType = "friend";
      }
      setInviteType(nextType);
    }
    setSelectedAccountId(editingCampaign.account ?? null);
    setGroupLink(
      SHOW_GROUP_LINK_FEATURES ? (editingCampaign.group_link ?? "") : "",
    );
    setSelectedGroupId(editingCampaign.group ?? null);
    setPhoneNumbers(normalizePhoneNumbers(editingCampaign.phone_numbers));
    setSelectedFriendIds(editingCampaign.friend ?? []);
    setSelectedUids(editingCampaign.uids ?? []);
    setStartTime(parseTimeToDate(editingCampaign.from_time) ?? defaultStart());
    setEndTime(parseTimeToDate(editingCampaign.to_time) ?? defaultEnd());
  }, [open, editingCampaign]);

  const loadGroups = useCallback(
    async (accountId: number, search: string, categoryId: number | null) => {
    setGroupsLoading(true);
    try {
      const page = await zaloGroupService.list({
        accountId,
        page: 1,
        pageSize: 200,
        name: search || undefined,
        categoryId: categoryId ?? undefined,
      });
      const list = page.results ?? [];
      if (!list.length) {
        setGroups([]);
        return;
      }
      const enriched = await zaloGroupService.fetchDetails(list);
      setGroups(enriched);
    } catch {
      setGroups([]);
    } finally {
      setGroupsLoading(false);
    }
  },
    [],
  );

  const loadFriends = useCallback(
    async (accountId: number, search: string, categoryId: number | null) => {
    setFriendsLoading(true);
    try {
      const collected: ZaloFriendItem[] = [];
      let page = 1;
      let hasNext = true;
      while (hasNext && page <= 20) {
        const response = await zaloFriendService.list({
          accountId,
          page,
          pageSize: 100,
          name: search || undefined,
          categoryId: categoryId ?? undefined,
        });
        collected.push(...(response.results ?? []));
        hasNext = Boolean(response.next);
        page += 1;
        if (!search && !categoryId) break;
      }
      if (!collected.length) {
        setFriends([]);
        return;
      }
      const enriched = await zaloFriendService.fetchDetails(collected);
      setFriends(enriched);
    } catch {
      setFriends([]);
    } finally {
      setFriendsLoading(false);
    }
  },
    [],
  );

  useEffect(() => {
    if (!open || !selectedAccountId) {
      setLabelCategories([]);
      setGroupLabelId(null);
      setFriendLabelId(null);
      return;
    }

    let cancelled = false;
    setLabelsLoading(true);
    void zaloLabelService
      .listCategories(selectedAccountId)
      .then((list) => {
        if (!cancelled) setLabelCategories(list);
      })
      .catch(() => {
        if (!cancelled) setLabelCategories([]);
      })
      .finally(() => {
        if (!cancelled) setLabelsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, selectedAccountId]);

  useEffect(() => {
    if (!open || !selectedAccountId) return;
    void loadGroups(selectedAccountId, groupSearch, groupLabelId);
  }, [open, selectedAccountId, groupSearch, groupLabelId, loadGroups]);

  useEffect(() => {
    if (!open || !selectedAccountId || inviteType !== "friend") return;
    void loadFriends(selectedAccountId, friendSearch, friendLabelId);
  }, [
    open,
    selectedAccountId,
    inviteType,
    friendSearch,
    friendLabelId,
    loadFriends,
  ]);

  const handleSelectAccount = (accountId: number) => {
    setSelectedAccountId(accountId);
    setSelectedGroupId(null);
    setGroupLink("");
    setSelectedFriendIds([]);
    setSelectedUids([]);
    setLinkMembers([]);
    setGroupLabelId(null);
    setFriendLabelId(null);
    setGroups([]);
    setFriends([]);
  };

  const handleSelectGroup = (group: ZaloGroupItem) => {
    setSelectedGroupId(group.id);
    if (group.link_group) {
      setGroupLink(group.link_group);
    }
  };

  const handleLoadLinkMembers = async () => {
    if (!selectedAccountId) {
      toast.error("Chọn tài khoản Zalo trước.");
      return;
    }
    const link = groupLink.trim();
    if (!link) {
      toast.error("Nhập link nhóm để tải thành viên.");
      return;
    }
    setMembersLoading(true);
    try {
      const members = await zaloGroupService.showMembersByLink(selectedAccountId, link);
      setLinkMembers(members);
      if (!members.length) {
        toast.error("Không tải được thành viên từ link nhóm.");
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      setLinkMembers([]);
    } finally {
      setMembersLoading(false);
    }
  };

  const toggleFriend = (id: number) => {
    setSelectedFriendIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const toggleUid = (uid: string) => {
    setSelectedUids((prev) =>
      prev.includes(uid) ? prev.filter((item) => item !== uid) : [...prev, uid],
    );
  };

  const filteredGroups = useMemo(() => groups, [groups]);
  const filteredFriends = useMemo(() => friends, [friends]);
  const selectableMemberUids = useMemo(
    () =>
      linkMembers
        .map((member) => member.friend?.uid?.trim())
        .filter((uid): uid is string => Boolean(uid)),
    [linkMembers],
  );
  const allFriendsSelected =
    filteredFriends.length > 0 &&
    filteredFriends.every((friend) => selectedFriendIds.includes(friend.id));
  const allMembersSelected =
    selectableMemberUids.length > 0 &&
    selectableMemberUids.every((uid) => selectedUids.includes(uid));

  /** Chọn hoặc bỏ chọn toàn bộ bạn bè đang hiển thị. */
  const toggleAllFriends = () => {
    const visibleIds = new Set(filteredFriends.map((friend) => friend.id));
    setSelectedFriendIds((current) =>
      allFriendsSelected
        ? current.filter((id) => !visibleIds.has(id))
        : Array.from(new Set([...current, ...visibleIds])),
    );
  };

  /** Chọn hoặc bỏ chọn toàn bộ thành viên hợp lệ lấy từ link nhóm. */
  const toggleAllMembers = () => {
    const visibleUids = new Set(selectableMemberUids);
    setSelectedUids((current) =>
      allMembersSelected
        ? current.filter((uid) => !visibleUids.has(uid))
        : Array.from(new Set([...current, ...visibleUids])),
    );
  };

  const groupPanelBadge = selectedGroupId
    ? "1 đã chọn"
    : groupsLoading
      ? "..."
      : `${filteredGroups.length}`;

  const friendPanelBadge =
    inviteType === "friend"
      ? selectedFriendIds.length > 0
        ? `${selectedFriendIds.length} đã chọn`
        : friendsLoading
          ? "..."
          : `${filteredFriends.length}`
      : inviteType === "uids"
        ? selectedUids.length > 0
          ? `${selectedUids.length} đã chọn`
          : `${linkMembers.length}`
        : undefined;

  const labelFilterDisabled = !selectedAccountId || labelsLoading || saving;

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Vui lòng nhập tên kịch bản.");
      return;
    }
    if (!selectedAccountId) {
      toast.error("Chọn tài khoản Zalo để chạy kịch bản.");
      return;
    }
    if (SHOW_GROUP_LINK_FEATURES) {
      if (!selectedGroupId && !groupLink.trim()) {
        toast.error("Chọn nhóm hoặc nhập link nhóm.");
        return;
      }
    } else if (!selectedGroupId) {
      toast.error("Chọn nhóm Zalo để mời.");
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

    if (inviteType === "friend" && !selectedFriendIds.length) {
      toast.error("Chọn ít nhất một bạn bè để mời.");
      return;
    }
    if (inviteType === "phone_number" && !splitLines(phoneNumbers).length) {
      toast.error("Nhập ít nhất một số điện thoại.");
      return;
    }
    if (
      SHOW_GROUP_LINK_FEATURES &&
      inviteType === "uids" &&
      !selectedUids.length
    ) {
      toast.error("Chọn ít nhất một thành viên từ link nhóm.");
      return;
    }

    const payload = {
      id_category: editingCampaign?.id ?? null,
      name: trimmedName,
      id_account: selectedAccountId,
      ...(SHOW_GROUP_LINK_FEATURES
        ? { group_link: groupLink.trim() || undefined }
        : {}),
      id_group: selectedGroupId,
      type: inviteType === "uids" && !SHOW_GROUP_LINK_FEATURES ? "friend" : inviteType,
      delay_time: delay,
      number_count: count,
      from_time: formatTimeForApi(startTime),
      to_time: formatTimeForApi(endTime),
      ...(inviteType === "friend" ||
      (inviteType === "uids" && !SHOW_GROUP_LINK_FEATURES)
        ? { id_friends: selectedFriendIds }
        : inviteType === "phone_number"
          ? { phone_numbers: splitLines(phoneNumbers) }
          : { uids: selectedUids }),
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

  const wizardSteps: CampaignWizardStep[] = useMemo(() => {
    const targetTitle =
      inviteType === "friend"
        ? "Bạn bè"
        : inviteType === "uids"
          ? "Thành viên"
          : "Đối tượng";
    return [
      {
        id: "config",
        title: "Cấu hình",
        hint: "Tên kịch bản, tốc độ, khung giờ và loại đối tượng mời",
      },
      {
        id: "account",
        title: "Nick Zalo",
        hint: "Chọn nick chạy kịch bản",
      },
      {
        id: "group",
        title: "Nhóm",
        hint: "Chọn nhóm Zalo sẽ mời bạn bè vào",
      },
      {
        id: "targets",
        title: targetTitle,
        hint:
          inviteType === "friend"
            ? "Chọn bạn bè cần mời vào nhóm"
            : inviteType === "uids"
              ? "Chọn thành viên từ link nhóm"
              : "Xác nhận danh sách số điện thoại",
      },
    ];
  }, [inviteType]);

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
        if (inviteType === "phone_number" && !splitLines(phoneNumbers).length) {
          toast.error("Nhập ít nhất một số điện thoại.");
          return false;
        }
        return true;
      }
      if (step === 1) {
        if (!selectedAccountId) {
          toast.error("Chọn tài khoản Zalo để chạy kịch bản.");
          return false;
        }
        return true;
      }
      if (step === 2) {
        if (SHOW_GROUP_LINK_FEATURES) {
          if (!selectedGroupId && !groupLink.trim()) {
            toast.error("Chọn nhóm hoặc nhập link nhóm.");
            return false;
          }
        } else if (!selectedGroupId) {
          toast.error("Chọn nhóm Zalo để mời.");
          return false;
        }
        return true;
      }
      return true;
    },
    [
      name,
      delayTime,
      numberCount,
      inviteType,
      phoneNumbers,
      selectedAccountId,
      selectedGroupId,
      groupLink,
    ],
  );

  const goWizardNext = () => {
    if (!validateWizardStep(wizardStep)) return;
    setWizardStep((s) => Math.min(s + 1, wizardSteps.length - 1));
  };

  const modalTitle = editingCampaign
    ? readOnly
      ? "Xem kịch bản mời bạn bè tham gia nhóm"
      : "Sửa kịch bản mời bạn bè tham gia nhóm"
    : "Thêm kịch bản mời bạn bè tham gia nhóm";

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
        <div className="flex items-center gap-2">
          <TimeIcon className="size-4 text-brand-500 dark:text-brand-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Khung giờ chạy
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-theme-xs text-gray-500">Từ</span>
            <TimePicker
              value={startTime}
              onChange={setStartTime}
              disabled={saving}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-theme-xs text-gray-500">Đến</span>
            <TimePicker value={endTime} onChange={setEndTime} disabled={saving} />
          </div>
        </div>
      </div>

      {INVITE_TYPES.length > 1 ? (
        <div>
          <p className="mb-2 text-xs font-medium text-gray-600 dark:text-gray-400">
            Đối tượng mời
          </p>
          <div className="inline-flex w-full rounded-xl border border-gray-200 bg-gray-50/80 p-1 dark:border-gray-700 dark:bg-white/[0.03]">
            {INVITE_TYPES.map((item) => (
              <button
                key={item.value}
                type="button"
                disabled={saving}
                onClick={() => setInviteType(item.value)}
                className={`flex-1 rounded-lg px-3 py-2 text-center text-xs font-medium transition ${
                  inviteType === item.value
                    ? "bg-white text-brand-600 shadow-theme-xs dark:bg-gray-900 dark:text-brand-400"
                    : "text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {SHOW_GROUP_LINK_FEATURES ? (
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
            Link nhóm Zalo
          </label>
          <div className="flex gap-2">
            <Input
              value={groupLink}
              onChange={(e) => setGroupLink(e.target.value)}
              placeholder="https://zalo.me/g/..."
              disabled={saving}
            />
            {inviteType === "uids" ? (
              <Button
                size="sm"
                variant="outline"
                disabled={membersLoading || saving}
                onClick={() => void handleLoadLinkMembers()}
              >
                {membersLoading ? "Đang tải..." : "Tải TV"}
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {inviteType === "phone_number" ? (
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
            Danh sách SĐT (mỗi dòng một số)
          </label>
          <textarea
            value={phoneNumbers}
            onChange={(e) => setPhoneNumbers(e.target.value)}
            rows={6}
            disabled={saving}
            className={textareaClassName}
          />
        </div>
      ) : null}
    </div>
  );

  const accountPicker = (
    <div className="min-w-0">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
          Tài khoản chạy kịch bản
        </p>
        {selectedAccountId ? (
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-theme-xs font-medium text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
            Đã chọn
          </span>
        ) : null}
      </div>
      <div
        className={`custom-scrollbar flex gap-2 overflow-x-auto pb-0.5 ${
          isWizard ? "flex-col overflow-x-visible sm:flex-row sm:overflow-x-auto" : ""
        }`}
      >
        {accountsLoading ? (
          <p className="px-2 py-3 text-sm text-gray-500">Đang tải tài khoản...</p>
        ) : accounts.length === 0 ? (
          <p className="px-2 py-3 text-sm text-gray-500">Không có tài khoản</p>
        ) : (
          accounts.map((account) => {
            const active = selectedAccountId === account.id;
            const label = account.name || `Tài khoản #${account.id}`;
            return (
              <button
                key={account.id}
                type="button"
                onClick={() => handleSelectAccount(account.id)}
                className={`flex items-center gap-2.5 rounded-xl border px-2.5 py-2.5 transition ${
                  isWizard ? "w-full shrink-0 sm:w-auto" : "shrink-0"
                } ${
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
                <span className="min-w-0 flex-1 text-left sm:max-w-[140px] sm:flex-none">
                  <span className="block truncate text-sm font-medium text-gray-800 dark:text-white/90">
                    {label}
                  </span>
                  <span className="block truncate text-theme-xs text-gray-500">
                    {account.phone_number || "—"}
                  </span>
                </span>
                {active ? (
                  <span className="shrink-0 text-brand-600 sm:hidden">✓</span>
                ) : null}
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  const groupPanel = (
    <SelectionPanel
      wizard={isWizard}
      icon={<GroupIcon className="size-4" />}
      title="Chọn nhóm"
      badge={groupPanelBadge}
      toolbar={
        <>
          <div className="flex min-w-0 items-center gap-2">
            <span className="shrink-0 text-theme-xs font-medium text-gray-500">
              Nhãn
            </span>
            <LabelChipFilter
              labels={labelCategories}
              value={groupLabelId}
              onChange={setGroupLabelId}
              disabled={labelFilterDisabled}
            />
          </div>
          <Input
            value={groupSearch}
            onChange={(e) => setGroupSearch(e.target.value)}
            placeholder="Tìm theo tên nhóm..."
            disabled={!selectedAccountId || saving}
            className="h-9"
          />
        </>
      }
    >
      {!selectedAccountId ? (
        <PanelEmpty message="Chọn tài khoản Zalo để xem danh sách nhóm" />
      ) : groupsLoading ? (
        <PanelEmpty message="Đang tải danh sách nhóm..." />
      ) : filteredGroups.length === 0 ? (
        <PanelEmpty message="Không có nhóm phù hợp" />
      ) : (
        <ul className="space-y-0.5">
          {filteredGroups.map((group) => {
            const active = selectedGroupId === group.id;
            const groupName = getZaloGroupDisplayName(group);
            return (
              <li key={group.id}>
                <button
                  type="button"
                  onClick={() => handleSelectGroup(group)}
                  className={`flex w-full min-w-0 items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left text-sm transition active:bg-brand-50/80 sm:py-2 ${
                    active
                      ? "bg-brand-50 shadow-theme-xs dark:bg-brand-500/10"
                      : "hover:bg-white dark:hover:bg-white/[0.04]"
                  }`}
                >
                  <ContactAvatar
                    name={groupName}
                    avatar={getZaloGroupAvatar(group)}
                    size="sm"
                  />
                  <span className="min-w-0 flex-1 truncate font-medium text-gray-800 dark:text-white/90">
                    {groupName}
                  </span>
                  {group.total_member ? (
                    <span className="shrink-0 rounded-md bg-gray-100 px-1.5 py-0.5 text-theme-xs tabular-nums text-gray-500 dark:bg-gray-800">
                      {group.total_member}
                    </span>
                  ) : null}
                  {active ? (
                    <span className="shrink-0 text-brand-600 dark:text-brand-400">
                      ✓
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </SelectionPanel>
  );

  const targetsPanel = (
    <SelectionPanel
      wizard={isWizard}
      icon={<UserIcon className="size-4" />}
      title={
        inviteType === "friend"
          ? "Chọn bạn bè"
          : inviteType === "uids"
            ? "Thành viên link"
            : "Số điện thoại"
      }
      badge={friendPanelBadge}
      toolbar={
        inviteType === "friend" ? (
          <>
            <button
              type="button"
              onClick={toggleAllFriends}
              disabled={saving || readOnly || !filteredFriends.length}
              className="w-fit text-theme-xs font-semibold text-brand-600 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-40 dark:text-brand-400 dark:hover:text-brand-300"
            >
              {allFriendsSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
            </button>
            <div className="flex min-w-0 items-center gap-2">
              <span className="shrink-0 text-theme-xs font-medium text-gray-500">
                Nhãn
              </span>
              <LabelChipFilter
                labels={labelCategories}
                value={friendLabelId}
                onChange={setFriendLabelId}
                disabled={labelFilterDisabled}
              />
            </div>
            <Input
              value={friendSearch}
              onChange={(e) => setFriendSearch(e.target.value)}
              placeholder="Tìm theo tên bạn bè..."
              disabled={!selectedAccountId || saving}
              className="h-9"
            />
          </>
        ) : inviteType === "uids" ? (
          <button
            type="button"
            onClick={toggleAllMembers}
            disabled={saving || readOnly || !selectableMemberUids.length}
            className="w-fit text-theme-xs font-semibold text-brand-600 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-40 dark:text-brand-400 dark:hover:text-brand-300"
          >
            {allMembersSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
          </button>
        ) : undefined
      }
    >
      {inviteType === "friend" ? (
        !selectedAccountId ? (
          <PanelEmpty message="Chọn tài khoản Zalo để xem danh sách bạn bè" />
        ) : friendsLoading ? (
          <PanelEmpty message="Đang tải danh sách bạn bè..." />
        ) : filteredFriends.length === 0 ? (
          <PanelEmpty message="Không có bạn bè phù hợp" />
        ) : (
          <ul className="space-y-0.5">
            {filteredFriends.map((friend) => {
              const selected = selectedFriendIds.includes(friend.id);
              const friendName = getZaloFriendDisplayName(friend);
              return (
                <li key={friend.id}>
                  <button
                    type="button"
                    onClick={() => toggleFriend(friend.id)}
                    className={`flex w-full min-w-0 items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left text-sm transition active:bg-brand-50/80 sm:py-2 ${
                      selected
                        ? "bg-brand-50 shadow-theme-xs dark:bg-brand-500/10"
                        : "hover:bg-white dark:hover:bg-white/[0.04]"
                    }`}
                  >
                    <ContactAvatar
                      name={friendName}
                      avatar={getZaloGroupAvatar(friend)}
                      size="sm"
                    />
                    <span className="min-w-0 flex-1 truncate text-gray-800 dark:text-white/90">
                      {friendName}
                    </span>
                    {selected ? (
                      <span className="shrink-0 font-medium text-brand-600 dark:text-brand-400">
                        ✓
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )
      ) : inviteType === "uids" ? (
        linkMembers.length === 0 ? (
          <PanelEmpty message='Nhập link nhóm và bấm "Tải TV" ở bước Cấu hình' />
        ) : (
          <ul className="space-y-0.5">
            {linkMembers.map((member) => {
              const uid = member.friend?.uid?.trim();
              if (!uid) return null;
              const display = getGroupMemberDisplay(member);
              const selected = selectedUids.includes(uid);
              return (
                <li key={`${member.id}-${uid}`}>
                  <button
                    type="button"
                    onClick={() => toggleUid(uid)}
                    className={`flex w-full min-w-0 items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left text-sm transition active:bg-brand-50/80 sm:py-2 ${
                      selected
                        ? "bg-brand-50 shadow-theme-xs dark:bg-brand-500/10"
                        : "hover:bg-white dark:hover:bg-white/[0.04]"
                    }`}
                  >
                    <ContactAvatar
                      name={display.name}
                      avatar={display.avatar}
                      size="sm"
                    />
                    <span className="min-w-0 flex-1 truncate text-gray-800 dark:text-white/90">
                      {display.name}
                    </span>
                    {selected ? (
                      <span className="shrink-0 font-medium text-brand-600 dark:text-brand-400">
                        ✓
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )
      ) : (
        <div className="space-y-3 p-2">
          <PanelEmpty message="Danh sách SĐT đã nhập ở bước Cấu hình." />
          {splitLines(phoneNumbers).length > 0 ? (
            <p className="rounded-lg bg-brand-50 px-3 py-2 text-center text-sm font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
              {splitLines(phoneNumbers).length} số điện thoại
            </p>
          ) : null}
        </div>
      )}
    </SelectionPanel>
  );

  const wizardStepBody =
    wizardStep === 0
      ? configFields
      : wizardStep === 1
        ? accountPicker
        : wizardStep === 2
          ? groupPanel
          : targetsPanel;

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
              onJump={(index) => {
                if (index < wizardStep) setWizardStep(index);
              }}
            />
            {/*
              Không dùng fieldset làm flex scroll (Safari bug).
              Step 2–3 (nhóm/bạn): div flex-1 overflow-hidden → panel list height tường minh.
              Step 0–1: scroll cả form.
            */}
            <div
              className={
                wizardStep >= 2
                  ? "flex min-h-0 min-w-0 max-w-full flex-1 flex-col overflow-hidden"
                  : "custom-scrollbar min-h-0 min-w-0 max-w-full flex-1 overflow-y-auto overscroll-contain"
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
                    ? "flex min-h-0 min-w-0 flex-1 flex-col border-0 p-0"
                    : "min-w-0 border-0 p-0"
                }
              >
                {wizardStepBody}
              </fieldset>
            </div>
            <div className="relative z-10 shrink-0 border-t border-gray-100 bg-white px-0 dark:border-gray-800 dark:bg-gray-900">
              <CampaignFormWizardFooter
                current={wizardStep}
                total={wizardSteps.length}
                onBack={() => setWizardStep((s) => Math.max(0, s - 1))}
                onNext={goWizardNext}
                onCancel={onClose}
                onSubmit={() => void handleSave()}
                saving={saving}
                readOnly={readOnly}
                submitLabel="Lưu kịch bản"
                nextLabel="Tiếp theo"
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
                Cấu hình kịch bản bên trái · chọn tài khoản, nhóm và đối tượng mời
                bên phải
              </p>
            </div>

            <div className={campaignFormMainClass}>
              <fieldset disabled={readOnly} className="contents">
                <div className="grid h-full min-h-0 flex-1 gap-4 overflow-hidden lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:grid-rows-1">
                  <div className={campaignFormScrollPaneClass}>
                    {configFields}
                  </div>

                  <div
                    className={`${campaignFormSidePaneClass} gap-3 rounded-2xl border border-gray-200 bg-gray-50/40 p-3 dark:border-gray-800 dark:bg-white/[0.02]`}
                  >
                    {accountPicker}
                    <div className="grid min-h-0 min-w-0 flex-1 gap-3 sm:grid-cols-2">
                      {groupPanel}
                      {targetsPanel}
                    </div>
                  </div>
                </div>
              </fieldset>
            </div>

            <div className={campaignFormFooterClass}>
              {readOnly ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onClose}
                  className="!h-11 w-full sm:!h-9 sm:w-auto"
                >
                  Đóng
                </Button>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onClose}
                    disabled={saving}
                    className="!h-11 w-full sm:!h-9 sm:w-auto"
                  >
                    Hủy
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => void handleSave()}
                    disabled={saving}
                    className="!h-11 w-full sm:!h-9 sm:w-auto"
                  >
                    {saving ? "Đang lưu..." : "Lưu kịch bản"}
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
