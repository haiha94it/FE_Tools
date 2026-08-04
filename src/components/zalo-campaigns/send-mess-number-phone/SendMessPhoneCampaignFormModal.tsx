"use client";

import AvatarText from "@/components/ui/avatar/AvatarText";
import Button from "@/components/ui/button/Button";
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
import Checkbox from "@/components/form/input/Checkbox";
import CampaignAttachmentFields from "@/components/zalo-campaigns/shared/CampaignAttachmentFields";
import SendMessMemberGrFirstMessageEditor from "@/components/zalo-campaigns/send-mess-member-gr/SendMessMemberGrFirstMessageEditor";
import { useCampaignFormWizard } from "@/hooks/use-campaign-form-wizard";
import {
  MAX_PHONE_NUMBERS,
  canEditSendMessPhoneStructure,
  formatTimeForApi,
  getSendMessPhoneMediaUrl,
  isZaloAccountRunnable,
  normalizePhoneNumbers,
  parseTimeToDate,
  resolveAssignMode,
  splitLines,
} from "@/lib/zalo-send-mess-phone-campaign-utils";
import { getApiErrorMessage } from "@/lib/errors";
import { canSkipZaloProxyRequirement } from "@/lib/map-auth-user";
import { toast } from "@/lib/toast";
import { zaloSendMessPhoneCampaignService } from "@/services/zalo-send-mess-phone-campaign.service";
import { useAuthStore } from "@/stores/use-auth-store";
import { useZaloSendMessPhoneCampaignStore } from "@/stores/use-zalo-send-mess-phone-campaign-store";
import SendMessPhoneContentEditor from "./SendMessPhoneContentEditor";
import type {
  SendMessPhoneAssignMode,
  SendMessPhoneCampaignDetail,
  SendMessPhoneContentType,
} from "@/types/zalo-send-mess-phone-campaign";
import type { ZaloAccount } from "@/types/zalo-account";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

interface SendMessPhoneCampaignFormModalProps {
  open: boolean;
  editingCampaign: SendMessPhoneCampaignDetail | null;
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

export default function SendMessPhoneCampaignFormModal({
  open,
  editingCampaign,
  accounts,
  accountsLoading,
  onClose,
  readOnly = false,
}: SendMessPhoneCampaignFormModalProps) {
  const createOrEditCampaign = useZaloSendMessPhoneCampaignStore(
    (s) => s.createOrEditCampaign,
  );
  const saving = useZaloSendMessPhoneCampaignStore((s) => s.saving);
  const user = useAuthStore((s) => s.user);
  const canSkipProxy = canSkipZaloProxyRequirement(user);
  const { isWizard, wizardStep, setWizardStep, goBack, goNext } =
    useCampaignFormWizard(open);

  const [name, setName] = useState("");
  const [delayTime, setDelayTime] = useState("350");
  const [numberCount, setNumberCount] = useState("50");
  const [phoneNumbers, setPhoneNumbers] = useState("");
  const [assignMode, setAssignMode] =
    useState<SendMessPhoneAssignMode>("distribute");
  const [splitAttachment, setSplitAttachment] = useState(false);
  const [sendMessage, setSendMessage] = useState(true);
  const [addFriend, setAddFriend] = useState(false);
  const [firstMessages, setFirstMessages] = useState<string[]>([]);
  const [contents, setContents] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [contentType, setContentType] = useState<SendMessPhoneContentType>("");
  const [selectedMediaId, setSelectedMediaId] = useState<number | null>(null);
  const [startTime, setStartTime] = useState(defaultStart);
  const [endTime, setEndTime] = useState(defaultEnd);
  const [selectedAccountIds, setSelectedAccountIds] = useState<number[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  const structureEditable = editingCampaign
    ? canEditSendMessPhoneStructure(editingCampaign.status)
    : true;

  const runnableAccounts = useMemo(
    () => accounts.filter((a) => isZaloAccountRunnable(a, canSkipProxy)),
    [accounts, canSkipProxy],
  );

  const allRunnableSelected =
    runnableAccounts.length > 0 &&
    runnableAccounts.every((item) => selectedAccountIds.includes(item.id));

  const phoneLineCount = splitLines(phoneNumbers).length;

  const resetForm = useCallback(() => {
    setName("");
    setDelayTime("350");
    setNumberCount("50");
    setPhoneNumbers("");
    setAssignMode("distribute");
    setSplitAttachment(false);
    setSendMessage(true);
    setAddFriend(false);
    setFirstMessages([]);
    setContents([]);
    setImages([]);
    setContentType("");
    setSelectedMediaId(null);
    setStartTime(defaultStart());
    setEndTime(defaultEnd());
    setSelectedAccountIds([]);
  }, []);

  useEffect(() => {
    if (!open) return;
    if (!editingCampaign) {
      resetForm();
      return;
    }
    setName(editingCampaign.name ?? "");
    setDelayTime(String(editingCampaign.delay_time ?? 350));
    setNumberCount(String(editingCampaign.number_count ?? 50));
    setPhoneNumbers(normalizePhoneNumbers(editingCampaign.phone_numbers));
    setAssignMode(resolveAssignMode(editingCampaign));
    setSplitAttachment(editingCampaign.split_attachment ?? false);
    setSendMessage(editingCampaign.send_message ?? true);
    setAddFriend(editingCampaign.add_friend ?? false);
    setFirstMessages(editingCampaign.first_messages ?? []);
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
    setSelectedAccountIds(editingCampaign.accounts ?? []);
  }, [open, editingCampaign, resetForm]);

  const handlePhoneChange = (value: string) => {
    if (!structureEditable) return;
    const lines = splitLines(value);
    if (lines.length > MAX_PHONE_NUMBERS) {
      toast.error(`Không được quá ${MAX_PHONE_NUMBERS} số.`);
      return;
    }
    setPhoneNumbers(value);
  };

  const toggleAccount = (accountId: number) => {
    if (!structureEditable) return;
    setSelectedAccountIds((prev) =>
      prev.includes(accountId)
        ? prev.filter((id) => id !== accountId)
        : [...prev, accountId],
    );
  };

  const toggleSelectAllAccounts = () => {
    if (!structureEditable) return;
    const allIds = runnableAccounts.map((item) => item.id);
    const allSelected =
      allIds.length > 0 && allIds.every((id) => selectedAccountIds.includes(id));
    setSelectedAccountIds(allSelected ? [] : allIds);
  };

  const handleUploadImage = async (file: File) => {
    setUploadingImage(true);
    try {
      return await zaloSendMessPhoneCampaignService.uploadImage(file);
    } finally {
      setUploadingImage(false);
    }
  };

  const validateContentFields = useCallback((): boolean => {
    if (sendMessage && !contents.length && !contentType) {
      toast.error("Nhập nội dung tin nhắn hoặc chọn đính kèm.");
      return false;
    }
    if (sendMessage && contentType === "image" && !images.length) {
      toast.error("Vui lòng thêm ảnh.");
      return false;
    }
    if (sendMessage && contentType === "image" && images.length > 1) {
      toast.error(
        "Chỉ chấp nhận 1 ảnh. Từ 2 ảnh trở lên vui lòng gửi dạng album.",
      );
      return false;
    }
    if (
      sendMessage &&
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
    if (addFriend && !firstMessages.length) {
      toast.error("Thêm ít nhất một lời chào kết bạn.");
      return false;
    }
    return true;
  }, [
    sendMessage,
    contents,
    contentType,
    images,
    selectedMediaId,
    addFriend,
    firstMessages,
  ]);

  const handleSave = async () => {
    const isRunningContentOnly = editingCampaign?.status === 1;

    if (!validateContentFields()) return;

    if (isRunningContentOnly && editingCampaign?.id) {
      try {
        await createOrEditCampaign({
          id_category: editingCampaign.id,
          type: contentType || null,
          contents,
          images: contentType === "image" ? images : [],
          id_video: contentType === "video" ? selectedMediaId : null,
          id_album: contentType === "album" ? selectedMediaId : null,
          first_messages: firstMessages,
          split_attachment: splitAttachment,
        });
        toast.success("Đã cập nhật nội dung kịch bản đang chạy.");
        onClose();
      } catch (error) {
        toast.error(getApiErrorMessage(error));
      }
      return;
    }

    if (!sendMessage && !addFriend) {
      toast.error("Chọn ít nhất một chức năng: Nhắn tin hoặc Kết bạn.");
      return;
    }
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Vui lòng nhập tên kịch bản.");
      return;
    }
    const phones = splitLines(phoneNumbers);
    if (!phones.length) {
      toast.error("Nhập ít nhất một số điện thoại.");
      return;
    }
    if (!selectedAccountIds.length) {
      toast.error("Chọn ít nhất một tài khoản Zalo.");
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

    if (assignMode === "all") {
      const volume = selectedAccountIds.length * phones.length;
      if (volume > 2000) {
        toast.info(
          `Mode "mọi nick × mọi SĐT" ≈ ${volume} lượt — số lượt lớn, hãy cân nhắc.`,
        );
      }
    }

    try {
      await createOrEditCampaign({
        id_category: editingCampaign?.id ?? null,
        name: trimmedName,
        phone_numbers: phones,
        type: contentType || null,
        contents,
        images: contentType === "image" ? images : [],
        id_video: contentType === "video" ? selectedMediaId : null,
        id_album: contentType === "album" ? selectedMediaId : null,
        delay_time: delay,
        number_count: count,
        assign_mode: assignMode,
        split_attachment: splitAttachment,
        id_accounts: selectedAccountIds,
        from_time: formatTimeForApi(startTime),
        to_time: formatTimeForApi(endTime),
        add_friend: addFriend,
        send_message: sendMessage,
        first_messages: firstMessages,
      });
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
        hint: "Tên, tốc độ, khung giờ, chức năng và nội dung tin / kết bạn",
      },
      {
        id: "accounts",
        title: "Nick Zalo",
        hint: "Chọn nick gửi tin / kết bạn",
      },
      {
        id: "phones",
        title: "SĐT + gán",
        hint: "Danh sách SĐT và chế độ gán cho các nick",
      },
    ],
    [],
  );

  const validateWizardStep = useCallback(
    (step: number): boolean => {
      if (step === 0) {
        if (structureEditable) {
          if (!sendMessage && !addFriend) {
            toast.error("Chọn ít nhất một chức năng: Nhắn tin hoặc Kết bạn.");
            return false;
          }
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
        }
        return validateContentFields();
      }
      if (step === 1) {
        if (structureEditable && !selectedAccountIds.length) {
          toast.error("Chọn ít nhất một tài khoản Zalo.");
          return false;
        }
        return true;
      }
      return true;
    },
    [
      structureEditable,
      sendMessage,
      addFriend,
      name,
      delayTime,
      numberCount,
      validateContentFields,
      selectedAccountIds,
    ],
  );

  const modalTitle = editingCampaign
    ? readOnly
      ? "Xem kịch bản SĐT"
      : "Sửa kịch bản SĐT"
    : "Thêm kịch bản tương tác đến SĐT";

  const runningBanner = !structureEditable ? (
    <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
      Kịch bản đang chạy — chỉ sửa nội dung tin / lời kết bạn / media.
    </p>
  ) : null;

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
          disabled={saving || !structureEditable}
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
            disabled={saving || !structureEditable}
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
            disabled={saving || !structureEditable}
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
            <TimePicker
              value={startTime}
              onChange={setStartTime}
              disabled={saving || !structureEditable}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-theme-xs text-gray-500">Đến</span>
            <TimePicker
              value={endTime}
              onChange={setEndTime}
              disabled={saving || !structureEditable}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <Checkbox
            checked={sendMessage}
            onChange={setSendMessage}
            disabled={saving || !structureEditable}
          />
          Nhắn tin
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <Checkbox
            checked={addFriend}
            onChange={setAddFriend}
            disabled={saving || !structureEditable}
          />
          Kết bạn
        </label>
      </div>

      {sendMessage ? (
        <>
          <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
            <p className="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">
              Nội dung tin nhắn
            </p>
            <SendMessPhoneContentEditor
              contents={contents}
              disabled={saving}
              onContentsChange={setContents}
            />
          </div>

          <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
            <CampaignAttachmentFields
              contentType={contentType}
              images={images}
              selectedMediaId={selectedMediaId}
              uploadingImage={uploadingImage}
              disabled={saving || readOnly}
              resolveImageUrl={getSendMessPhoneMediaUrl}
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
        </>
      ) : null}

      {addFriend ? (
        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <SendMessMemberGrFirstMessageEditor
            contents={firstMessages}
            disabled={saving}
            onContentsChange={setFirstMessages}
          />
        </div>
      ) : null}
    </div>
  );

  const accountsPanel = (
    <div
      className={
        isWizard
          ? "flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900"
          : "shrink-0"
      }
    >
      <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
        <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
          {isWizard ? "Chọn tài khoản Zalo" : "Tài khoản gửi"}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={saving || !structureEditable || !runnableAccounts.length}
            onClick={toggleSelectAllAccounts}
            className="text-theme-xs font-medium text-brand-600 hover:underline disabled:opacity-50 dark:text-brand-400"
          >
            {isWizard
              ? allRunnableSelected
                ? "Bỏ chọn tất cả"
                : "Chọn tất cả"
              : "Chọn tất cả"}
          </button>
          {isWizard ? (
            <span className="text-theme-xs text-gray-500">
              {selectedAccountIds.length} đã chọn
            </span>
          ) : null}
        </div>
      </div>

      {isWizard ? (
        <div
          className={`${campaignFormWizardListScrollClass} space-y-1`}
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
              const selected = selectedAccountIds.includes(account.id);
              const label = account.name || `Tài khoản #${account.id}`;
              return (
                <button
                  key={account.id}
                  type="button"
                  disabled={!structureEditable || saving}
                  onClick={() => toggleAccount(account.id)}
                  className={`flex w-full min-w-0 items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition active:bg-brand-50/80 sm:py-2 ${
                    selected
                      ? "border-brand-300 bg-brand-50 dark:border-brand-500/30 dark:bg-brand-500/10"
                      : "border-transparent hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  <Checkbox
                    checked={selected}
                    onChange={() => toggleAccount(account.id)}
                    disabled={!structureEditable || saving}
                  />
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
                      <AvatarText
                        name={label}
                        size="sm"
                        className="!h-9 !w-9"
                      />
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
      ) : (
        <>
          <div className="custom-scrollbar flex gap-2 overflow-x-auto pb-0.5">
            {accountsLoading ? (
              <p className="px-2 py-3 text-sm text-gray-500">Đang tải...</p>
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
                    disabled={!structureEditable || saving}
                    onClick={() => toggleAccount(account.id)}
                    className={`flex shrink-0 items-center gap-2.5 rounded-xl border px-2.5 py-2 transition ${
                      active
                        ? "border-brand-300 bg-white shadow-theme-xs ring-2 ring-brand-500/15 dark:border-brand-500/40 dark:bg-gray-900"
                        : "border-gray-200 bg-white/80 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900/60 dark:hover:border-gray-600"
                    } disabled:cursor-not-allowed disabled:opacity-60`}
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
                        <AvatarText
                          name={label}
                          size="md"
                          className="!h-10 !w-10"
                        />
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
          {selectedAccountIds.length > 0 ? (
            <p className="mt-2 text-theme-xs text-gray-500">
              Đã chọn {selectedAccountIds.length} tài khoản
            </p>
          ) : null}
        </>
      )}

      {!structureEditable && isWizard ? (
        <p className="mt-2 shrink-0 text-xs text-amber-700 dark:text-amber-400">
          Đang chạy — không đổi danh sách nick.
        </p>
      ) : null}
    </div>
  );

  const phoneAssignFields = (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div
        className={
          isWizard
            ? "flex min-h-0 flex-1 flex-col rounded-xl border border-gray-200 bg-white p-3 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.02]"
            : "flex min-h-0 flex-1 flex-col rounded-xl border border-gray-200 bg-white p-3 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.02]"
        }
      >
        <div className="mb-1.5 flex shrink-0 items-center justify-between gap-2">
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
          disabled={saving || !structureEditable}
          placeholder={"09xxxxxxxx\n84xxxxxxxxx"}
          rows={isWizard ? 12 : undefined}
          className={`${textareaClassName} ${
            isWizard ? "min-h-[220px] flex-1" : "min-h-[140px] flex-1"
          }`}
        />
        {!structureEditable ? (
          <p className="mt-1.5 shrink-0 text-xs text-amber-700 dark:text-amber-400">
            Đang chạy — không đổi danh sách SĐT.
          </p>
        ) : null}
      </div>

      <div className="shrink-0 rounded-xl border border-gray-200 bg-white p-3 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.02]">
        <p className="mb-2 text-sm font-semibold text-gray-800 dark:text-white/90">
          Chế độ gán SĐT
        </p>
        <div className="space-y-2">
          <label
            className={`flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2 text-sm ${
              assignMode === "distribute"
                ? "border-brand-300 bg-brand-50/60 dark:border-brand-500/40 dark:bg-brand-500/10"
                : "border-gray-200 dark:border-gray-700"
            }`}
          >
            <input
              type="radio"
              name="assign_mode_phone"
              className="mt-1"
              checked={assignMode === "distribute"}
              disabled={!structureEditable || saving}
              onChange={() => setAssignMode("distribute")}
            />
            <span>
              <span className="font-medium text-gray-800 dark:text-white/90">
                Chia SĐT cho các nick
              </span>
              <span className="mt-0.5 block text-theme-xs text-gray-500">
                Mỗi SĐT chỉ 1 nick xử lý full (KB + tin).
              </span>
            </span>
          </label>
          <label
            className={`flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2 text-sm ${
              assignMode === "all"
                ? "border-brand-300 bg-brand-50/60 dark:border-brand-500/40 dark:bg-brand-500/10"
                : "border-gray-200 dark:border-gray-700"
            }`}
          >
            <input
              type="radio"
              name="assign_mode_phone"
              className="mt-1"
              checked={assignMode === "all"}
              disabled={!structureEditable || saving}
              onChange={() => setAssignMode("all")}
            />
            <span>
              <span className="font-medium text-gray-800 dark:text-white/90">
                Mọi nick × mọi SĐT
              </span>
              <span className="mt-0.5 block text-theme-xs text-gray-500">
                Mỗi SĐT: mọi nick hợp lệ đều chạy full.
              </span>
            </span>
          </label>
        </div>
      </div>
    </div>
  );

  const wizardBody =
    wizardStep === 0
      ? configFields
      : wizardStep === 1
        ? accountsPanel
        : phoneAssignFields;

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
              {runningBanner}
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
                wizardStep === 1
                  ? "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
                  : "custom-scrollbar min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain"
              }
              style={
                wizardStep !== 1
                  ? { WebkitOverflowScrolling: "touch", touchAction: "pan-y" }
                  : undefined
              }
            >
              <fieldset
                disabled={readOnly}
                className={
                  wizardStep === 1
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
                Nhắn tin và/hoặc kết bạn theo danh sách SĐT — multi-nick
              </p>
              {runningBanner}
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
                    <div className="custom-scrollbar flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain">
                      {accountsPanel}
                      {phoneAssignFields}
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
          </>
        )}
      </div>
    </Modal>
  );
}
