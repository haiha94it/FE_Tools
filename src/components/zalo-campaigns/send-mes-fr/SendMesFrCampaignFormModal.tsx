"use client";

import AvatarText from "@/components/ui/avatar/AvatarText";
import Button from "@/components/ui/button/Button";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import TimePicker from "@/components/form/time-picker";
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
import ContactAvatar from "@/components/zalo-contacts/shared/ContactAvatar";
import { useCampaignFormWizard } from "@/hooks/use-campaign-form-wizard";
import { UserIcon } from "@/icons";
import { resolveZaloLabelColor } from "@/lib/zalo-label-utils";
import CampaignAttachmentFields from "@/components/zalo-campaigns/shared/CampaignAttachmentFields";
import {
  canEditSendMesFrFriends,
  formatTimeForApi,
  getSendMesFrMediaUrl,
  parseTimeToDate,
} from "@/lib/zalo-send-mes-fr-campaign-utils";
import {
  getZaloFriendDisplayName,
  getZaloGroupAvatar,
} from "@/lib/zalo-contacts-utils";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { zaloFriendService } from "@/services/zalo-friend.service";
import { zaloLabelService } from "@/services/zalo-label.service";
import { zaloSendMesFrCampaignService } from "@/services/zalo-send-mes-fr-campaign.service";
import { useZaloSendMesFrCampaignStore } from "@/stores/use-zalo-send-mes-fr-campaign-store";
import SendMesFrContentEditor from "./SendMesFrContentEditor";
import type {
  SendMesFrCampaignDetail,
  SendMesFrContentType,
} from "@/types/zalo-send-mes-fr-campaign";
import type { ZaloFriendItem, ZaloLabelCategory } from "@/types/zalo-contacts";
import type { ZaloAccount } from "@/types/zalo-account";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

interface SendMesFrCampaignFormModalProps {
  open: boolean;
  editingCampaign: SendMesFrCampaignDetail | null;
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

export default function SendMesFrCampaignFormModal({
  open,
  editingCampaign,
  accounts,
  accountsLoading,
  onClose,
  readOnly = false,
}: SendMesFrCampaignFormModalProps) {
  const createOrEditCampaign = useZaloSendMesFrCampaignStore((s) => s.createOrEditCampaign);
  const saving = useZaloSendMesFrCampaignStore((s) => s.saving);
  const { isWizard, wizardStep, setWizardStep, goBack, goNext } =
    useCampaignFormWizard(open);

  const [name, setName] = useState("");
  const [delayTime, setDelayTime] = useState("60");
  const [numberCount, setNumberCount] = useState("20");
  const [contents, setContents] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [contentType, setContentType] = useState<SendMesFrContentType>("");
  const [splitAttachment, setSplitAttachment] = useState(false);
  const [selectedMediaId, setSelectedMediaId] = useState<number | null>(null);
  const [startTime, setStartTime] = useState(defaultStart);
  const [endTime, setEndTime] = useState(defaultEnd);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [selectedFriendIds, setSelectedFriendIds] = useState<number[]>([]);
  const [friendSearch, setFriendSearch] = useState("");
  const [debouncedFriendSearch, setDebouncedFriendSearch] = useState("");
  const [friendLabelId, setFriendLabelId] = useState<number | null>(null);
  const [labelCategories, setLabelCategories] = useState<ZaloLabelCategory[]>([]);
  const [friends, setFriends] = useState<ZaloFriendItem[]>([]);
  const [friendPage, setFriendPage] = useState(1);
  const [friendTotal, setFriendTotal] = useState(0);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [selectingAllFriends, setSelectingAllFriends] = useState(false);
  const [scanningFriends, setScanningFriends] = useState(false);
  const [scanTaskId, setScanTaskId] = useState<string | number | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const friendsEditable = editingCampaign
    ? canEditSendMesFrFriends(editingCampaign.status)
    : true;

  const FRIEND_PAGE_SIZE = 50;
  const FRIEND_SEARCH_DEBOUNCE_MS = 350;

  const activeAccounts = useMemo(
    () => accounts.filter((item) => item.checkpoint === false),
    [accounts],
  );

  const isSelectedAccountActive = useMemo(
    () =>
      selectedAccountId != null &&
      activeAccounts.some((item) => item.id === selectedAccountId),
    [selectedAccountId, activeAccounts],
  );

  const pageFriends = isSelectedAccountActive ? friends : [];
  const friendTotalPages = Math.max(
    1,
    Math.ceil(friendTotal / FRIEND_PAGE_SIZE) || 1,
  );
  const allPageFriendsSelected =
    pageFriends.length > 0 &&
    pageFriends.every((friend) => selectedFriendIds.includes(friend.id));

  const resetFriendPaging = useCallback(() => {
    setFriendPage(1);
    setFriendTotal(0);
    setFriends([]);
    setFriendSearch("");
    setDebouncedFriendSearch("");
    setFriendLabelId(null);
  }, []);

  const resetForm = useCallback(() => {
    setName("");
    setDelayTime("60");
    setNumberCount("20");
    setContents([]);
    setImages([]);
    setContentType("");
    setSplitAttachment(false);
    setSelectedMediaId(null);
    setStartTime(defaultStart());
    setEndTime(defaultEnd());
    setSelectedAccountId(null);
    setSelectedFriendIds([]);
    setLabelCategories([]);
    resetFriendPaging();
  }, [resetFriendPaging]);

  useEffect(() => {
    if (!open) return;
    if (!editingCampaign) {
      resetForm();
      return;
    }
    setName(editingCampaign.name ?? "");
    setDelayTime(String(editingCampaign.delay_time ?? 60));
    setNumberCount(String(editingCampaign.number_count ?? 20));
    setContents(editingCampaign.contents ?? []);
    setImages(editingCampaign.images ?? []);
    const type = editingCampaign.type ?? "";
    setContentType(type);
    setSplitAttachment(editingCampaign.split_attachment ?? false);
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
    setSelectedFriendIds(editingCampaign.friend ?? []);
    resetFriendPaging();
  }, [open, editingCampaign, resetForm, resetFriendPaging]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      setDebouncedFriendSearch(friendSearch.trim());
      setFriendPage(1);
    }, FRIEND_SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [friendSearch, open]);

  useEffect(() => {
    if (!open || accountsLoading) return;
    if (selectedAccountId == null) return;
    if (isSelectedAccountActive) return;
    const wasCampaign = editingCampaign?.account === selectedAccountId;
    setSelectedAccountId(null);
    setSelectedFriendIds([]);
    setLabelCategories([]);
    resetFriendPaging();
    if (wasCampaign) {
      toast.warning(
        "Nick gốc của kịch bản không còn hoạt động. Chọn nick đang hoạt động.",
      );
    }
  }, [
    open,
    accountsLoading,
    selectedAccountId,
    isSelectedAccountActive,
    editingCampaign?.account,
    resetFriendPaging,
  ]);

  const loadFriends = useCallback(
    async (
      accountId: number,
      search: string,
      categoryId: number | null,
      page: number,
    ) => {
      setFriendsLoading(true);
      try {
        const data = await zaloFriendService.list({
          accountId,
          page,
          pageSize: FRIEND_PAGE_SIZE,
          name: search.trim() || undefined,
          categoryId: categoryId ?? undefined,
          mode: "list",
        });
        setFriends(data.results ?? []);
        setFriendTotal(data.count ?? data.results?.length ?? 0);
      } catch {
        setFriends([]);
        setFriendTotal(0);
      } finally {
        setFriendsLoading(false);
      }
    },
    [],
  );

  const fetchMatchingFriendIds = useCallback(
    async (
      accountId: number,
      options?: { search?: string; categoryId?: number | null },
    ) => {
      const page = await zaloFriendService.list({
        accountId,
        mode: "simple",
        name: options?.search?.trim() || undefined,
        categoryId: options?.categoryId ?? undefined,
      });
      return (page.results ?? []).map((item) => item.id);
    },
    [],
  );

  useEffect(() => {
    if (!open || !isSelectedAccountActive || selectedAccountId == null) {
      if (!isSelectedAccountActive) setLabelCategories([]);
      return;
    }
    let cancelled = false;
    void zaloLabelService
      .listCategories(selectedAccountId)
      .then((list) => {
        if (!cancelled) setLabelCategories(list);
      })
      .catch(() => {
        if (!cancelled) setLabelCategories([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, isSelectedAccountActive, selectedAccountId]);

  useEffect(() => {
    if (!open || !isSelectedAccountActive || selectedAccountId == null) {
      if (!isSelectedAccountActive) {
        setFriends([]);
        setFriendTotal(0);
        setFriendsLoading(false);
      }
      return;
    }
    void loadFriends(
      selectedAccountId,
      debouncedFriendSearch,
      friendLabelId,
      friendPage,
    );
  }, [
    open,
    isSelectedAccountActive,
    selectedAccountId,
    debouncedFriendSearch,
    friendLabelId,
    friendPage,
    loadFriends,
  ]);

  useEffect(() => {
    if (!open || !isSelectedAccountActive || selectedAccountId == null) return;
    if (!editingCampaign?.friend?.length) return;
    if (editingCampaign.account !== selectedAccountId) return;
    const raw = editingCampaign.friend;
    let cancelled = false;
    void (async () => {
      try {
        const allowed = new Set(await fetchMatchingFriendIds(selectedAccountId));
        if (cancelled) return;
        setSelectedFriendIds((prev) => {
          const isSeed =
            prev.length === raw.length && raw.every((id) => prev.includes(id));
          if (!isSeed) return prev;
          return prev.filter((id) => allowed.has(id));
        });
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    open,
    isSelectedAccountActive,
    selectedAccountId,
    editingCampaign,
    fetchMatchingFriendIds,
  ]);

  useEffect(() => {
    if (!scanTaskId) return;
    const interval = window.setInterval(() => {
      void zaloFriendService.pollScanResult(scanTaskId).then((result) => {
        const status = result.task_status ?? result.status;
        if (status === "PENDING" || status === "PROGRESS") return;
        setScanningFriends(false);
        setScanTaskId(null);
        const scanData = Array.isArray(result.data)
          ? (result.data as Array<{ status?: boolean }>)
          : [];
        if (scanData[0]?.status === true || status === "SUCCESS") {
          toast.success("Quét danh sách bạn bè thành công.");
          if (isSelectedAccountActive && selectedAccountId) {
            setFriendPage(1);
            void loadFriends(
              selectedAccountId,
              debouncedFriendSearch,
              friendLabelId,
              1,
            );
          }
        } else {
          toast.error("Quét danh sách bạn bè thất bại.");
        }
      });
    }, 3000);
    return () => window.clearInterval(interval);
  }, [
    scanTaskId,
    isSelectedAccountActive,
    selectedAccountId,
    debouncedFriendSearch,
    friendLabelId,
    loadFriends,
  ]);

  const handleSelectAccount = (accountId: number) => {
    if (selectedAccountId === accountId) return;
    if (!activeAccounts.some((item) => item.id === accountId)) {
      toast.error("Chỉ chọn nick đang hoạt động.");
      return;
    }
    setSelectedAccountId(accountId);
    setSelectedFriendIds([]);
    resetFriendPaging();
  };

  const toggleFriend = (friendId: number) => {
    if (!friendsEditable) return;
    setSelectedFriendIds((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId],
    );
  };

  const toggleAllPageFriends = () => {
    if (!friendsEditable || !pageFriends.length) return;
    const pageIds = new Set(pageFriends.map((f) => f.id));
    setSelectedFriendIds((current) =>
      allPageFriendsSelected
        ? current.filter((id) => !pageIds.has(id))
        : Array.from(new Set([...current, ...pageIds])),
    );
  };

  const selectAllMatchingFriends = async () => {
    if (!friendsEditable || !isSelectedAccountActive || !selectedAccountId) return;
    setSelectingAllFriends(true);
    try {
      const ids = await fetchMatchingFriendIds(selectedAccountId, {
        search: debouncedFriendSearch,
        categoryId: friendLabelId,
      });
      if (!ids.length) {
        toast.info("Không có bạn bè khớp bộ lọc để chọn.");
        return;
      }
      setSelectedFriendIds((prev) => Array.from(new Set([...prev, ...ids])));
      toast.success(`Đã chọn ${ids.length} bạn bè.`);
    } catch {
      toast.error("Không tải được danh sách bạn bè để chọn tất cả.");
    } finally {
      setSelectingAllFriends(false);
    }
  };

  const clearAllSelectedFriends = () => {
    if (!friendsEditable) return;
    setSelectedFriendIds([]);
  };

  const handleScanFriends = async () => {
    if (!selectedAccountId || !isSelectedAccountActive) return;
    try {
      setScanningFriends(true);
      const taskId = await zaloFriendService.startScan(selectedAccountId);
      if (!taskId) {
        setScanningFriends(false);
        toast.error("Không gửi được yêu cầu quét bạn bè.");
        return;
      }
      setScanTaskId(taskId);
    } catch (error) {
      setScanningFriends(false);
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleUploadImage = async (file: File) => {
    setUploadingImage(true);
    try {
      return await zaloSendMesFrCampaignService.uploadImage(file);
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
    if (!selectedAccountId || !isSelectedAccountActive) {
      toast.error("Chọn tài khoản Zalo đang hoạt động.");
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
    if (!selectedFriendIds.length) {
      toast.error("Chọn ít nhất một bạn bè.");
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
      id_friends: selectedFriendIds,
      id_account: selectedAccountId,
      from_time: formatTimeForApi(startTime),
      to_time: formatTimeForApi(endTime),
      split_attachment: splitAttachment,
    } as const;

    try {
      await createOrEditCampaign(payload);
      toast.success(editingCampaign ? "Đã cập nhật kịch bản." : "Đã tạo kịch bản mới.");
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
        id: "friends",
        title: "Bạn bè",
        hint: "Chọn bạn bè nhận tin",
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
          toast.error("Chỉ chấp nhận 1 ảnh. Từ 2 ảnh trở lên vui lòng gửi dạng album.");
          return false;
        }
        if ((contentType === "video" || contentType === "album") && !selectedMediaId) {
          toast.error(
            contentType === "video" ? "Vui lòng chọn video." : "Vui lòng chọn album ảnh.",
          );
          return false;
        }
        return true;
      }
      if (step === 1) {
        if (!selectedAccountId || !isSelectedAccountActive) {
          toast.error("Chọn tài khoản Zalo đang hoạt động.");
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
      isSelectedAccountActive,
    ],
  );

  const modalTitle = editingCampaign
    ? readOnly
      ? "Xem kịch bản nhắn tin bạn bè"
      : "Sửa kịch bản nhắn tin bạn bè"
    : "Thêm kịch bản nhắn tin bạn bè";

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

      <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
        <p className="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">
          Nội dung tin nhắn
        </p>
        <SendMesFrContentEditor
          contents={contents}
          images={images}
          contentType={contentType}
          uploadingImage={uploadingImage}
          disabled={saving || readOnly}
          showImages={false}
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
          disabled={saving || readOnly}
          resolveImageUrl={getSendMesFrMediaUrl}
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
        {contentType ? (
          <label className="mt-3 flex cursor-pointer items-start gap-2.5 text-sm text-gray-600 dark:text-gray-400">
            <Checkbox
              checked={splitAttachment}
              onChange={setSplitAttachment}
              disabled={saving || readOnly}
            />
            <span>Tách tin nhắn và đính kèm</span>
          </label>
        ) : null}
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
                    <Image src={account.avatar} alt="" fill unoptimized className="object-cover" />
                  ) : (
                    <AvatarText name={label} size="sm" className="!h-9 !w-9" />
                  )}
                </span>
                <span
                  className={`truncate text-left text-sm font-medium text-gray-800 dark:text-white/90 ${
                    isWizard ? "min-w-0 flex-1 sm:max-w-[120px]" : "max-w-[120px]"
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

  const friendsListBody = !isSelectedAccountActive ? (
    <p className="px-3 py-6 text-center text-xs text-gray-500">
      Chọn tài khoản đang hoạt động để xem bạn bè
    </p>
  ) : friendsLoading ? (
    <p className="px-3 py-6 text-center text-xs text-gray-500">Đang tải...</p>
  ) : pageFriends.length === 0 ? (
    <p className="px-3 py-6 text-center text-xs text-gray-500">
      Không có bạn bè phù hợp
    </p>
  ) : (
    <ul className="space-y-0.5">
      {pageFriends.map((friend) => {
        const selected = selectedFriendIds.includes(friend.id);
        const friendName = getZaloFriendDisplayName(friend);
        return (
          <li key={friend.id}>
            <button
              type="button"
              disabled={!friendsEditable || saving}
              onClick={() => toggleFriend(friend.id)}
              className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition ${
                selected
                  ? "bg-brand-50 dark:bg-brand-500/10"
                  : "hover:bg-gray-50 dark:hover:bg-white/[0.04]"
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
                <span className="shrink-0 text-brand-600 dark:text-brand-400">✓</span>
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  );

  const friendsPanel = (
    <div
      className={
        isWizard
          ? "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.02]"
          : "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.02]"
      }
    >
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-3 py-2 dark:border-gray-800">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
            <UserIcon className="size-3.5" />
          </span>
          <div className="min-w-0">
            <span className="text-sm font-semibold text-gray-800 dark:text-white/90">
              Chọn bạn bè
            </span>
            <p className="text-[11px] leading-tight text-gray-500">
              Tick nhiều trang — giữ lựa chọn khi lật trang
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1">
          <button
            type="button"
            onClick={toggleAllPageFriends}
            disabled={
              !friendsEditable ||
              saving ||
              friendsLoading ||
              selectingAllFriends ||
              pageFriends.length === 0
            }
            className="text-theme-xs font-semibold text-brand-600 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-40 dark:text-brand-400 dark:hover:text-brand-300"
          >
            {allPageFriendsSelected ? "Bỏ chọn trang" : "Chọn trang"}
          </button>
          <button
            type="button"
            onClick={() => void selectAllMatchingFriends()}
            disabled={
              !friendsEditable ||
              saving ||
              friendsLoading ||
              selectingAllFriends ||
              friendTotal === 0
            }
            className="text-theme-xs font-semibold text-brand-600 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-40 dark:text-brand-400 dark:hover:text-brand-300"
          >
            {selectingAllFriends ? "Đang chọn..." : "Chọn tất cả"}
          </button>
          <button
            type="button"
            onClick={clearAllSelectedFriends}
            disabled={
              !friendsEditable ||
              saving ||
              selectingAllFriends ||
              selectedFriendIds.length === 0
            }
            className="text-theme-xs font-semibold text-error-600 hover:text-error-700 disabled:cursor-not-allowed disabled:opacity-40 dark:text-error-400"
          >
            Bỏ chọn hết
          </button>
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-theme-xs font-medium text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
            {isSelectedAccountActive ? selectedFriendIds.length : 0} đã chọn
          </span>
        </div>
      </div>

      {!isSelectedAccountActive ? (
        <p className="shrink-0 border-b border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          Chưa chọn nick đang hoạt động — không tải danh sách bạn bè.
        </p>
      ) : !friendsEditable ? (
        <p className="shrink-0 border-b border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          Kịch bản đang chạy — không thể thay đổi bạn bè.
        </p>
      ) : null}

      <div className="shrink-0 min-w-0 space-y-2 border-b border-gray-100 px-3 py-2 dark:border-gray-800">
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 text-theme-xs font-medium text-gray-500">
            Nhãn
          </span>
          <LabelChipFilter
            labels={labelCategories}
            value={friendLabelId}
            onChange={(id) => {
              setFriendLabelId(id);
              setFriendPage(1);
            }}
            disabled={!isSelectedAccountActive || saving}
          />
        </div>
        <div className="flex h-10 items-stretch gap-2">
          <div className="min-w-0 flex-1 [&>div]:h-full [&_input]:!h-full">
            <Input
              value={friendSearch}
              onChange={(e) => setFriendSearch(e.target.value)}
              placeholder="Tìm bạn bè..."
              disabled={!isSelectedAccountActive || saving}
              className="!h-full !min-h-10 !px-3 !py-2 !text-sm"
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-10 shrink-0 whitespace-nowrap !py-0 px-3 text-xs"
            disabled={!isSelectedAccountActive || scanningFriends || saving}
            onClick={() => void handleScanFriends()}
          >
            {scanningFriends ? "Đang quét..." : "Quét bạn bè"}
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
        {friendsListBody}
      </div>

      {isSelectedAccountActive && friendTotal > 0 ? (
        <div className="flex shrink-0 items-center justify-between gap-2 border-t border-gray-100 px-3 py-2 dark:border-gray-800">
          <span className="text-theme-xs text-gray-500">
            Trang {friendPage}/{friendTotalPages} — {friendTotal} bạn
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={friendPage <= 1 || friendsLoading || saving}
              onClick={() => setFriendPage((p) => Math.max(1, p - 1))}
            >
              Trước
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={
                friendPage >= friendTotalPages || friendsLoading || saving
              }
              onClick={() =>
                setFriendPage((p) => Math.min(friendTotalPages, p + 1))
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
        ? accountPicker
        : friendsPanel;

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
                Soạn nội dung, chọn tài khoản và bạn bè nhận tin
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
                    {friendsPanel}
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
                    {saving ? "Đang lưu..." : editingCampaign ? "Lưu thay đổi" : "Lưu kịch bản"}
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
