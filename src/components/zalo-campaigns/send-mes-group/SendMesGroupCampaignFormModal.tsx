"use client";

import AvatarText from "@/components/ui/avatar/AvatarText";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import TimePicker from "@/components/form/time-picker";
import Checkbox from "@/components/form/input/Checkbox";
import { Modal } from "@/components/ui/modal";
import {
  campaignFormBodyClass,
  campaignFormGridEqualClass,
  campaignFormMainClass,
  campaignFormModalPanelClass,
  campaignFormModalPanelClassWizard,
  campaignFormScrollPaneClass,
  campaignFormSidePaneClass,
  campaignFormWizardListScrollClass,
  CAMPAIGN_WIZARD_LIST_MAX_HEIGHT,
} from "@/components/zalo-campaigns/CampaignFormModalLayout";
import {
  CampaignFormWizardFooter,
  CampaignFormWizardHeader,
  type CampaignWizardStep,
} from "@/components/zalo-campaigns/CampaignFormWizard";
import { useCampaignFormWizard } from "@/hooks/use-campaign-form-wizard";
import ContactAvatar from "@/components/zalo-contacts/shared/ContactAvatar";
import CampaignAttachmentFields from "@/components/zalo-campaigns/shared/CampaignAttachmentFields";
import SendMesFrContentEditor from "@/components/zalo-campaigns/send-mes-fr/SendMesFrContentEditor";
import { GroupIcon } from "@/icons";
import { useScanTaskPoll } from "@/hooks/use-scan-task-poll";
import { resolveZaloLabelColor } from "@/lib/zalo-label-utils";
import {
  canEditSendMesGroupGroups,
  formatTimeForApi,
  getSendMesGroupMediaUrl,
  parseTimeToDate,
} from "@/lib/zalo-send-mes-group-campaign-utils";
import {
  getZaloGroupAvatar,
  getZaloGroupDisplayName,
  getScanTaskStatus,
  isScanTaskDone,
} from "@/lib/zalo-contacts-utils";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { zaloGroupService } from "@/services/zalo-group.service";
import { zaloLabelService } from "@/services/zalo-label.service";
import { zaloSendMesGroupCampaignService } from "@/services/zalo-send-mes-group-campaign.service";
import { useZaloSendMesGroupCampaignStore } from "@/stores/use-zalo-send-mes-group-campaign-store";
import type {
  SendMesGroupCampaignDetail,
  SendMesGroupContentType,
} from "@/types/zalo-send-mes-group-campaign";
import type { ZaloGroupItem, ZaloLabelCategory } from "@/types/zalo-contacts";
import type { ScanTaskResponse } from "@/types/zalo-contacts";
import type { ZaloAccount } from "@/types/zalo-account";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

interface SendMesGroupCampaignFormModalProps {
  open: boolean;
  editingCampaign: SendMesGroupCampaignDetail | null;
  accounts: ZaloAccount[];
  accountsLoading: boolean;
  onClose: () => void;
  readOnly?: boolean;
}

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

export default function SendMesGroupCampaignFormModal({
  open,
  editingCampaign,
  accounts,
  accountsLoading,
  onClose,
  readOnly = false,
}: SendMesGroupCampaignFormModalProps) {
  const createOrEditCampaign = useZaloSendMesGroupCampaignStore(
    (s) => s.createOrEditCampaign,
  );
  const saving = useZaloSendMesGroupCampaignStore((s) => s.saving);
  const { isWizard, wizardStep, setWizardStep, goBack, goNext } =
    useCampaignFormWizard(open);

  const [name, setName] = useState("");
  const [delayTime, setDelayTime] = useState("60");
  const [numberCount, setNumberCount] = useState("20");
  const [loop, setLoop] = useState(false);
  const [tagAll, setTagAll] = useState(false);
  const [contents, setContents] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [contentType, setContentType] = useState<SendMesGroupContentType>("");
  const [selectedMediaId, setSelectedMediaId] = useState<number | null>(null);
  const [startTime, setStartTime] = useState(defaultStart);
  const [endTime, setEndTime] = useState(defaultEnd);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
  const [groupSearch, setGroupSearch] = useState("");
  const [groupLabelId, setGroupLabelId] = useState<number | null>(null);
  const [labelCategories, setLabelCategories] = useState<ZaloLabelCategory[]>([]);
  const [groups, setGroups] = useState<ZaloGroupItem[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [scanningGroups, setScanningGroups] = useState(false);
  const [scanTaskId, setScanTaskId] = useState<string | number | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const groupsEditable = editingCampaign
    ? canEditSendMesGroupGroups(editingCampaign.status)
    : true;

  const activeAccounts = useMemo(
    () => accounts.filter((item) => item.checkpoint === false),
    [accounts],
  );

  const filteredGroups = useMemo(() => {
    const key = groupSearch.trim().toLowerCase();
    if (!key) return groups;
    return groups.filter((item) =>
      getZaloGroupDisplayName(item).toLowerCase().includes(key),
    );
  }, [groups, groupSearch]);

  const allFilteredGroupsSelected =
    filteredGroups.length > 0 &&
    filteredGroups.every((group) => selectedGroupIds.includes(group.id));

  const resetForm = useCallback(() => {
    setName("");
    setDelayTime("60");
    setNumberCount("20");
    setLoop(false);
    setTagAll(false);
    setContents([]);
    setImages([]);
    setContentType("");
    setSelectedMediaId(null);
    setStartTime(defaultStart());
    setEndTime(defaultEnd());
    setSelectedAccountId(null);
    setSelectedGroupIds([]);
    setGroupSearch("");
    setGroupLabelId(null);
    setLabelCategories([]);
    setGroups([]);
  }, []);

  useEffect(() => {
    if (!open) return;
    if (!editingCampaign) {
      resetForm();
      return;
    }
    setName(editingCampaign.name ?? "");
    setDelayTime(String(editingCampaign.delay_time ?? 60));
    setNumberCount(String(editingCampaign.number_count ?? 20));
    setLoop(editingCampaign.loop ?? false);
    setTagAll(editingCampaign.tag_all ?? false);
    setContents(editingCampaign.contents ?? []);
    setImages(editingCampaign.images ?? []);
    const type = editingCampaign.type ?? "";
    setContentType(type);
    setSelectedMediaId(
      type === "video"
        ? (editingCampaign.video ?? null)
        : type === "album"
          ? (editingCampaign.album ?? null)
          : null,
    );
    setStartTime(parseTimeToDate(editingCampaign.from_time) ?? defaultStart());
    setEndTime(parseTimeToDate(editingCampaign.to_time) ?? defaultEnd());
    setSelectedAccountId(editingCampaign.account ?? null);
    setSelectedGroupIds(editingCampaign.group ?? []);
  }, [open, editingCampaign, resetForm]);

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

  useEffect(() => {
    if (!open || !selectedAccountId) return;
    void zaloLabelService
      .listCategories(selectedAccountId)
      .then(setLabelCategories)
      .catch(() => setLabelCategories([]));
    void loadGroups(selectedAccountId, groupSearch, groupLabelId);
  }, [open, selectedAccountId, groupLabelId, loadGroups]);

  useEffect(() => {
    if (!open || !selectedAccountId || !editingCampaign?.group?.length) return;
    void loadGroups(selectedAccountId, "", null);
  }, [open, selectedAccountId, editingCampaign, loadGroups]);

  const handleScanResult = useCallback(
    (result: ScanTaskResponse) => {
      const status = getScanTaskStatus(result);
      if (!isScanTaskDone(status)) return;
      setScanningGroups(false);
      setScanTaskId(null);
      if (status === "SUCCESS") {
        toast.success("Quét danh sách nhóm thành công.");
        if (selectedAccountId) {
          void loadGroups(selectedAccountId, groupSearch, groupLabelId);
        }
      } else {
        toast.error(result.message || result.error || "Quét danh sách nhóm thất bại.");
      }
    },
    [selectedAccountId, groupSearch, groupLabelId, loadGroups],
  );

  useScanTaskPoll({
    taskId: scanTaskId,
    poll: zaloGroupService.pollScanResult,
    onResult: handleScanResult,
  });

  const handleSelectAccount = (accountId: number) => {
    if (selectedAccountId === accountId) return;
    setSelectedAccountId(accountId);
    if (!editingCampaign) {
      setSelectedGroupIds([]);
    }
    setGroups([]);
    setGroupSearch("");
    setGroupLabelId(null);
  };

  const toggleGroup = (groupId: number) => {
    if (!groupsEditable) return;
    setSelectedGroupIds((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId],
    );
  };

  /** Chọn hoặc bỏ chọn toàn bộ nhóm đang hiển thị theo bộ lọc hiện tại. */
  const toggleAllFilteredGroups = () => {
    if (!groupsEditable || !filteredGroups.length) return;
    const filteredIds = new Set(filteredGroups.map((group) => group.id));
    setSelectedGroupIds((current) =>
      allFilteredGroupsSelected
        ? current.filter((id) => !filteredIds.has(id))
        : Array.from(new Set([...current, ...filteredIds])),
    );
  };

  const handleScanGroups = async () => {
    if (!selectedAccountId) return;
    try {
      setScanningGroups(true);
      const taskId = await zaloGroupService.startScan([selectedAccountId]);
      if (!taskId) {
        setScanningGroups(false);
        toast.error("Không gửi được yêu cầu quét nhóm.");
        return;
      }
      setScanTaskId(taskId);
      toast.info("Đang quét danh sách nhóm...");
    } catch (error) {
      setScanningGroups(false);
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleUploadImage = async (file: File) => {
    setUploadingImage(true);
    try {
      return await zaloSendMesGroupCampaignService.uploadImage(file);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Vui lòng nhập tên kịch bản.");
      return;
    }
    if (!selectedAccountId) {
      toast.error("Chọn tài khoản Zalo.");
      return;
    }
    if (!contents.length && !contentType) {
      toast.error("Nhập nội dung hoặc chọn đính kèm.");
      return;
    }
    if (contentType === "image" && !images.length) {
      toast.error("Vui lòng thêm ảnh.");
      return;
    }
    if (contentType === "image" && images.length > 1) {
      toast.error("Chỉ chấp nhận 1 ảnh. Từ 2 ảnh trở lên vui lòng gửi dạng album.");
      return;
    }
    if ((contentType === "video" || contentType === "album") && !selectedMediaId) {
      toast.error(
        contentType === "video" ? "Vui lòng chọn video." : "Vui lòng chọn album ảnh.",
      );
      return;
    }
    if (!selectedGroupIds.length) {
      toast.error("Chọn ít nhất một nhóm.");
      return;
    }
    const delay = Number(delayTime);
    const count = Number(numberCount);
    if (!Number.isFinite(delay) || delay <= 0) {
      toast.error("Thời gian chờ không hợp lệ.");
      return;
    }
    if (!Number.isFinite(count) || count <= 0) {
      toast.error("Số lượt gửi không hợp lệ.");
      return;
    }

    const payload = {
      id_category: editingCampaign?.id ?? null,
      name: trimmedName,
      type: contentType || null,
      contents,
      images: contentType === "image" ? images : [],
      id_video: contentType === "video" ? selectedMediaId : null,
      id_album: contentType === "album" ? selectedMediaId : null,
      delay_time: delay,
      number_count: count,
      id_groups: selectedGroupIds,
      id_account: selectedAccountId,
      from_time: formatTimeForApi(startTime),
      to_time: formatTimeForApi(endTime),
      loop,
      tag_all: tagAll,
    };

    try {
      await createOrEditCampaign(payload);
      toast.success(editingCampaign ? "Đã cập nhật kịch bản." : "Đã tạo kịch bản.");
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const wizardSteps: CampaignWizardStep[] = useMemo(
    () => [
      {
        id: "config",
        title: "Cấu hình + tin",
        hint: "Tên, tốc độ, khung giờ, nội dung và đính kèm",
      },
      {
        id: "account",
        title: "Nick Zalo",
        hint: "Chọn tài khoản gửi tin",
      },
      {
        id: "groups",
        title: "Nhóm",
        hint: "Chọn nhóm nhận tin (có thể chọn nhiều)",
      },
    ],
    [],
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
          toast.error("Số lượt gửi không hợp lệ.");
          return false;
        }
        if (!contents.length && !contentType) {
          toast.error("Nhập nội dung hoặc chọn đính kèm.");
          return false;
        }
        if (contentType === "image" && !images.length) {
          toast.error("Vui lòng thêm ảnh.");
          return false;
        }
        if (contentType === "image" && images.length > 1) {
          toast.error(
            "Chỉ chấp nhận 1 ảnh. Từ 2 ảnh trở lên vui lòng gửi dạng album.",
          );
          return false;
        }
        if (
          (contentType === "video" || contentType === "album") &&
          !selectedMediaId
        ) {
          toast.error(
            contentType === "video"
              ? "Vui lòng chọn video."
              : "Vui lòng chọn album ảnh.",
          );
          return false;
        }
        return true;
      }
      if (step === 1) {
        if (!selectedAccountId) {
          toast.error("Chọn tài khoản Zalo.");
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
      contents,
      contentType,
      images,
      selectedMediaId,
      selectedAccountId,
    ],
  );

  const modalTitle = editingCampaign
    ? readOnly
      ? "Xem kịch bản nhắn tin nhóm"
      : "Sửa kịch bản nhắn tin nhóm"
    : "Thêm kịch bản nhắn tin nhóm";

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
            Số lượt gửi / ngày
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

      <div className="flex flex-wrap gap-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <Checkbox checked={loop} onChange={setLoop} disabled={saving} />
          Vòng lặp
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <Checkbox checked={tagAll} onChange={setTagAll} disabled={saving} />
          Tag @All
        </label>
      </div>

      <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
        <p className="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">
          Nội dung tin nhắn
        </p>
        {tagAll ? (
          <p className="mb-3 text-xs text-brand-600 dark:text-brand-400">
            Đã bật Tag @All — hệ thống sẽ tag toàn bộ thành viên nhóm khi gửi.
          </p>
        ) : null}
        <SendMesFrContentEditor
          contents={contents}
          images={images}
          contentType={contentType}
          uploadingImage={uploadingImage}
          disabled={saving}
          showImages={false}
          // Nhóm: không [gender]/[name] — chỉ icon ngẫu nhiên + mẫu chào nhóm
          placeholders={[{ key: "[r]", label: "Icon ngẫu nhiên" }]}
          defaultTemplate="Xin chào cả nhóm! Chúc mọi người một ngày thật vui vẻ và tràn đầy năng lượng."
          onContentsChange={setContents}
          onImagesChange={setImages}
          onUploadImage={handleUploadImage}
        />
      </div>

      <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
        <CampaignAttachmentFields
          contentType={contentType}
          images={images}
          selectedMediaId={selectedMediaId}
          uploadingImage={uploadingImage}
          disabled={saving}
          resolveImageUrl={getSendMesGroupMediaUrl}
          onContentTypeChange={setContentType}
          onImagesChange={setImages}
          onSelectedMediaIdChange={setSelectedMediaId}
          onUploadImage={async (file) => {
            try {
              return await handleUploadImage(file);
            } catch (error) {
              toast.error(getApiErrorMessage(error));
              return null;
            }
          }}
        />
      </div>
    </div>
  );

  const accountPicker = (
    <div className="min-w-0">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
          Tài khoản gửi tin
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
          <p className="px-2 py-3 text-sm text-gray-500">Đang tải...</p>
        ) : activeAccounts.length === 0 ? (
          <p className="px-2 py-3 text-sm text-gray-500">Không có tài khoản</p>
        ) : (
          activeAccounts.map((account) => {
            const active = selectedAccountId === account.id;
            const label = account.name || `#${account.id}`;
            return (
              <button
                key={account.id}
                type="button"
                onClick={() => handleSelectAccount(account.id)}
                className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 transition ${
                  isWizard ? "w-full shrink-0 sm:w-auto" : "shrink-0"
                } ${
                  active
                    ? "border-brand-300 bg-white shadow-theme-xs ring-2 ring-brand-500/15 dark:border-brand-500/40 dark:bg-gray-900"
                    : "border-gray-200 bg-white/80 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900/60"
                }`}
              >
                <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
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
                <span
                  className={`min-w-0 text-left text-sm font-medium text-gray-800 dark:text-white/90 ${
                    isWizard ? "flex-1 truncate sm:max-w-[120px] sm:flex-none" : "max-w-[120px] truncate"
                  }`}
                >
                  {label}
                </span>
                {active && isWizard ? (
                  <span className="shrink-0 text-brand-600 sm:hidden">✓</span>
                ) : null}
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  const groupsListBody = (
    <>
      {!selectedAccountId ? (
        <p className="px-3 py-6 text-center text-xs text-gray-500">
          Chọn tài khoản để xem nhóm
        </p>
      ) : groupsLoading ? (
        <p className="px-3 py-6 text-center text-xs text-gray-500">Đang tải...</p>
      ) : filteredGroups.length === 0 ? (
        <p className="px-3 py-6 text-center text-xs text-gray-500">
          Không có nhóm phù hợp
        </p>
      ) : (
        <ul className="space-y-0.5">
          {filteredGroups.map((group) => {
            const selected = selectedGroupIds.includes(group.id);
            const groupName = getZaloGroupDisplayName(group);
            return (
              <li key={group.id}>
                <button
                  type="button"
                  disabled={!groupsEditable || saving}
                  onClick={() => toggleGroup(group.id)}
                  className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition ${
                    selected
                      ? "bg-brand-50 dark:bg-brand-500/10"
                      : "hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                  } ${isWizard ? "active:bg-brand-50/80 sm:py-2" : ""}`}
                >
                  <ContactAvatar
                    name={groupName}
                    avatar={getZaloGroupAvatar(group)}
                    size="sm"
                  />
                  <span className="min-w-0 flex-1 truncate text-gray-800 dark:text-white/90">
                    {groupName}
                  </span>
                  {selected ? (
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
    </>
  );

  const groupsPanel = (
    <div
      className={
        isWizard
          ? "box-border flex h-full min-h-0 w-full min-w-0 max-w-full flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.02]"
          : "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.02]"
      }
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-gray-100 px-3 py-2 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-md bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
            <GroupIcon className="size-3.5" />
          </span>
          <span className="text-sm font-semibold text-gray-800 dark:text-white/90">
            Chọn nhóm
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleAllFilteredGroups}
            disabled={
              !groupsEditable ||
              saving ||
              groupsLoading ||
              filteredGroups.length === 0
            }
            className="text-theme-xs font-semibold text-brand-600 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-40 dark:text-brand-400 dark:hover:text-brand-300"
          >
            {allFilteredGroupsSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
          </button>
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-theme-xs font-medium text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
            {selectedGroupIds.length} đã chọn
          </span>
        </div>
      </div>

      {!groupsEditable ? (
        <p className="shrink-0 border-b border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          Kịch bản đã bắt đầu và chưa hoàn tất nên danh sách nhóm được khóa để giữ
          đúng tiến độ, tránh gửi trùng hoặc bỏ sót. Nếu cần chọn nhóm khác, hãy
          sao chép hoặc tạo kịch bản mới.
        </p>
      ) : null}

      <div className="shrink-0 min-w-0 space-y-2 border-b border-gray-100 px-3 py-2 dark:border-gray-800">
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 text-theme-xs font-medium text-gray-500">
            Nhãn
          </span>
          <LabelChipFilter
            labels={labelCategories}
            value={groupLabelId}
            onChange={setGroupLabelId}
            disabled={!selectedAccountId || saving}
          />
        </div>
        <div className="flex h-10 items-stretch gap-2">
          <div className="min-w-0 flex-1 [&>div]:h-full [&_input]:!h-full">
            <Input
              value={groupSearch}
              onChange={(e) => setGroupSearch(e.target.value)}
              placeholder="Tìm nhóm..."
              disabled={!selectedAccountId || saving}
              className="!h-full !min-h-10 !px-3 !py-2 !text-sm"
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-10 shrink-0 whitespace-nowrap !py-0 px-3 text-xs"
            disabled={!selectedAccountId || scanningGroups || saving}
            onClick={() => void handleScanGroups()}
          >
            {scanningGroups ? "Đang quét..." : "Quét nhóm"}
          </Button>
        </div>
      </div>

      <div
        className={
          isWizard
            ? campaignFormWizardListScrollClass
            : "custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5"
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
        {groupsListBody}
      </div>
    </div>
  );

  const wizardBody =
    wizardStep === 0
      ? configFields
      : wizardStep === 1
        ? accountPicker
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
            {/*
              Step 2 (nhóm): flex-1 overflow-hidden + list maxHeight tường minh (iOS).
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
                Soạn nội dung, chọn tài khoản và nhóm nhận tin
              </p>
            </div>

            <div className={campaignFormMainClass}>
              <fieldset disabled={readOnly} className="contents">
                <div className={campaignFormGridEqualClass}>
                  <div className={campaignFormScrollPaneClass}>
                    {configFields}
                  </div>

                  <div
                    className={`${campaignFormSidePaneClass} gap-3 rounded-2xl border border-gray-200 bg-gray-50/40 p-3 dark:border-gray-800 dark:bg-white/[0.02]`}
                  >
                    {accountPicker}
                    {groupsPanel}
                  </div>
                </div>
              </fieldset>
            </div>

            <div className="mt-4 flex shrink-0 justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
              {readOnly ? (
                <Button variant="outline" onClick={onClose}>
                  Đóng
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={onClose} disabled={saving}>
                    Hủy
                  </Button>
                  <Button onClick={() => void handleSave()} disabled={saving}>
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
