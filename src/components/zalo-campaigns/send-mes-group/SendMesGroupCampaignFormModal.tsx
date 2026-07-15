"use client";

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
  campaignFormScrollPaneClass,
  campaignFormSidePaneClass,
} from "@/components/zalo-campaigns/CampaignFormModalLayout";
import ContactAvatar from "@/components/zalo-contacts/shared/ContactAvatar";
import SendMesFrContentEditor from "@/components/zalo-campaigns/send-mes-fr/SendMesFrContentEditor";
import { GroupIcon } from "@/icons";
import { useScanTaskPoll } from "@/hooks/use-scan-task-poll";
import { resolveZaloLabelColor } from "@/lib/zalo-label-utils";
import {
  canEditSendMesGroupGroups,
  formatTimeForApi,
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

  const [name, setName] = useState("");
  const [delayTime, setDelayTime] = useState("60");
  const [numberCount, setNumberCount] = useState("20");
  const [loop, setLoop] = useState(false);
  const [tagAll, setTagAll] = useState(false);
  const [contents, setContents] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [contentType] = useState<SendMesGroupContentType>("");
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

  const resetForm = useCallback(() => {
    setName("");
    setDelayTime("60");
    setNumberCount("20");
    setLoop(false);
    setTagAll(false);
    setContents([]);
    setImages([]);
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
    if (!contents.length && !images.length) {
      toast.error("Nhập nội dung hoặc chọn ít nhất một hình ảnh.");
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
      type: contentType,
      contents,
      images,
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

  return (
    <Modal isOpen={open} onClose={onClose} className={campaignFormModalPanelClass.lg} showCloseButton>
      <div className={campaignFormBodyClass}>
        <div className="mb-4 shrink-0 pr-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {editingCampaign
              ? readOnly
                ? "Xem kịch bản nhắn tin nhóm"
                : "Sửa kịch bản nhắn tin nhóm"
              : "Thêm kịch bản nhắn tin nhóm"}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Soạn nội dung, chọn tài khoản và nhóm nhận tin
          </p>
        </div>

        <div className={campaignFormMainClass}>
          <fieldset disabled={readOnly} className="contents">
            <div className={campaignFormGridEqualClass}>
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
                onContentsChange={setContents}
                onImagesChange={setImages}
                onUploadImage={handleUploadImage}
              />
            </div>
                </div>
              </div>

              <div
                className={`${campaignFormSidePaneClass} gap-3 rounded-2xl border border-gray-200 bg-gray-50/40 p-3 dark:border-gray-800 dark:bg-white/[0.02]`}
              >
            <div className="shrink-0">
              <p className="mb-2 text-sm font-semibold text-gray-800 dark:text-white/90">
                Tài khoản gửi tin
              </p>
              <div className="custom-scrollbar flex gap-2 overflow-x-auto pb-0.5">
                {accountsLoading ? (
                  <p className="px-2 py-3 text-sm text-gray-500">Đang tải...</p>
                ) : activeAccounts.length === 0 ? (
                  <p className="px-2 py-3 text-sm text-gray-500">Không có tài khoản</p>
                ) : (
                  activeAccounts.map((account) => {
                    const active = selectedAccountId === account.id;
                    return (
                      <button
                        key={account.id}
                        type="button"
                        onClick={() => handleSelectAccount(account.id)}
                        className={`flex shrink-0 items-center gap-2 rounded-xl border px-2.5 py-2 transition ${
                          active
                            ? "border-brand-300 bg-white shadow-theme-xs ring-2 ring-brand-500/15 dark:border-brand-500/40 dark:bg-gray-900"
                            : "border-gray-200 bg-white/80 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900/60"
                        }`}
                      >
                        <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                          {account.avatar ? (
                            <Image src={account.avatar} alt="" fill unoptimized className="object-cover" />
                          ) : null}
                        </span>
                        <span className="max-w-[120px] truncate text-left text-sm font-medium text-gray-800 dark:text-white/90">
                          {account.name || `#${account.id}`}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.02]">
              <div className="flex shrink-0 items-center justify-between gap-2 border-b border-gray-100 px-3 py-2 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-md bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                    <GroupIcon className="size-3.5" />
                  </span>
                  <span className="text-sm font-semibold text-gray-800 dark:text-white/90">
                    Chọn nhóm
                  </span>
                </div>
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-theme-xs font-medium text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                  {selectedGroupIds.length} đã chọn
                </span>
              </div>

              {!groupsEditable ? (
                <p className="shrink-0 border-b border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                  Kịch bản đang chạy — không thể thay đổi nhóm.
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

              <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5">
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
                            }`}
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
                              <span className="shrink-0 text-brand-600 dark:text-brand-400">✓</span>
                            ) : null}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
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
      </div>
    </Modal>
  );
}