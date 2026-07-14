"use client";

import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import TimePicker from "@/components/form/time-picker";
import { Modal } from "@/components/ui/modal";
import Checkbox from "@/components/form/input/Checkbox";
import {
  MAX_PHONE_NUMBERS,
  canEditSendMessPhoneNumbers,
  formatTimeForApi,
  isZaloAccountRunnable,
  normalizePhoneNumbers,
  parseTimeToDate,
  splitLines,
} from "@/lib/zalo-send-mess-phone-campaign-utils";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { zaloSendMessPhoneCampaignService } from "@/services/zalo-send-mess-phone-campaign.service";
import { useZaloSendMessPhoneCampaignStore } from "@/stores/use-zalo-send-mess-phone-campaign-store";
import SendMessPhoneContentEditor from "./SendMessPhoneContentEditor";
import type {
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
}: SendMessPhoneCampaignFormModalProps) {
  const createOrEditCampaign = useZaloSendMessPhoneCampaignStore(
    (s) => s.createOrEditCampaign,
  );
  const saving = useZaloSendMessPhoneCampaignStore((s) => s.saving);

  const [name, setName] = useState("");
  const [delayTime, setDelayTime] = useState("350");
  const [numberCount, setNumberCount] = useState("50");
  const [phoneNumbers, setPhoneNumbers] = useState("");
  const [divide, setDivide] = useState(false);
  const [splitAttachment, setSplitAttachment] = useState(false);
  const [contents, setContents] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [contentType] = useState<SendMessPhoneContentType>("");
  const [startTime, setStartTime] = useState(defaultStart);
  const [endTime, setEndTime] = useState(defaultEnd);
  const [selectedAccountIds, setSelectedAccountIds] = useState<number[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  const phonesEditable = editingCampaign
    ? canEditSendMessPhoneNumbers(editingCampaign.status)
    : true;

  const runnableAccounts = useMemo(
    () => accounts.filter(isZaloAccountRunnable),
    [accounts],
  );

  const phoneLineCount = splitLines(phoneNumbers).length;

  const resetForm = useCallback(() => {
    setName("");
    setDelayTime("350");
    setNumberCount("50");
    setPhoneNumbers("");
    setDivide(false);
    setSplitAttachment(false);
    setContents([]);
    setImages([]);
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
    setDivide(editingCampaign.divide ?? false);
    setSplitAttachment(editingCampaign.split_attachment ?? false);
    setContents(editingCampaign.contents ?? []);
    setImages(editingCampaign.images ?? []);
    setStartTime(parseTimeToDate(editingCampaign.from_time) ?? defaultStart());
    setEndTime(parseTimeToDate(editingCampaign.to_time) ?? defaultEnd());
    setSelectedAccountIds(editingCampaign.accounts ?? []);
  }, [open, editingCampaign, resetForm]);

  const handlePhoneChange = (value: string) => {
    if (!phonesEditable) return;
    const lines = splitLines(value);
    if (lines.length > MAX_PHONE_NUMBERS) {
      toast.error(`Không được quá ${MAX_PHONE_NUMBERS} số.`);
      return;
    }
    setPhoneNumbers(value);
  };

  const toggleAccount = (accountId: number) => {
    setSelectedAccountIds((prev) =>
      prev.includes(accountId)
        ? prev.filter((id) => id !== accountId)
        : [...prev, accountId],
    );
  };

  const toggleSelectAllAccounts = () => {
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

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Vui lòng nhập tên kịch bản.");
      return;
    }
    if (!contents.length && !images.length) {
      toast.error("Nhập nội dung hoặc chọn ít nhất một hình ảnh.");
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

    const payload = {
      id_category: editingCampaign?.id ?? null,
      name: trimmedName,
      phone_numbers: phones,
      type: contentType,
      contents,
      images,
      delay_time: delay,
      number_count: count,
      divide,
      split_attachment: splitAttachment,
      id_accounts: selectedAccountIds,
      from_time: formatTimeForApi(startTime),
      to_time: formatTimeForApi(endTime),
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
    <Modal isOpen={open} onClose={onClose} className="max-w-6xl" showCloseButton>
      <div className="flex max-h-[min(92vh,820px)] flex-col overflow-hidden p-5 sm:p-6">
        <div className="mb-4 shrink-0 pr-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {editingCampaign
              ? "Sửa kịch bản nhắn tin SĐT"
              : "Thêm kịch bản nhắn tin SĐT"}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Soạn nội dung, nhập danh sách số điện thoại và chọn tài khoản gửi
          </p>
        </div>

        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="custom-scrollbar min-h-0 space-y-4 overflow-y-auto pr-1">
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
                rows={5}
                disabled={saving || !phonesEditable}
                placeholder={"09xxxxxxxx\n84xxxxxxxxx"}
                className={textareaClassName}
              />
              {!phonesEditable ? (
                <p className="mt-1.5 text-xs text-amber-700 dark:text-amber-400">
                  Kịch bản đang chạy — không thể thay đổi danh sách số điện thoại.
                </p>
              ) : null}
            </div>

            <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-gray-200 bg-gray-50/60 p-3 text-sm text-gray-600 dark:border-gray-700 dark:bg-white/[0.02] dark:text-gray-400">
              <Checkbox
                checked={divide}
                onChange={setDivide}
                disabled={saving}
              />
              <span>
                Chia đều danh sách SĐT cho các tài khoản đã chọn khi chạy kịch bản.
                Ví dụ: 100 số và 2 tài khoản → mỗi tài khoản nhắn 50 số.
              </span>
            </label>

            <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
              <p className="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">
                Nội dung tin nhắn
              </p>
              <SendMessPhoneContentEditor
                contents={contents}
                images={images}
                contentType={contentType}
                splitAttachment={splitAttachment}
                uploadingImage={uploadingImage}
                disabled={saving}
                onContentsChange={setContents}
                onImagesChange={setImages}
                onSplitAttachmentChange={setSplitAttachment}
                onUploadImage={handleUploadImage}
              />
            </div>
          </div>

          <div className="flex min-h-0 flex-col gap-3 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50/40 p-3 dark:border-gray-800 dark:bg-white/[0.02]">
            <div className="shrink-0">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                  Tài khoản gửi tin
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
                        onClick={() => toggleAccount(account.id)}
                        className={`flex shrink-0 items-center gap-2.5 rounded-xl border px-2.5 py-2 transition ${
                          active
                            ? "border-brand-300 bg-white shadow-theme-xs ring-2 ring-brand-500/15 dark:border-brand-500/40 dark:bg-gray-900"
                            : "border-gray-200 bg-white/80 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900/60 dark:hover:border-gray-600"
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
              {selectedAccountIds.length > 0 ? (
                <p className="mt-2 text-theme-xs text-gray-500">
                  Đã chọn {selectedAccountIds.length} tài khoản
                </p>
              ) : null}
            </div>

            <p className="shrink-0 text-xs leading-5 text-gray-500 dark:text-gray-400">
              Khuyến nghị: thời gian chờ tối thiểu 350 giây, số lượt gửi 50/ngày để
              giảm rủi ro bị hạn chế tài khoản.
            </p>
          </div>
        </div>

        <div className="mt-4 flex shrink-0 justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Hủy
          </Button>
          <Button onClick={() => void handleSave()} disabled={saving}>
            {saving ? "Đang lưu..." : "Lưu kịch bản"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}