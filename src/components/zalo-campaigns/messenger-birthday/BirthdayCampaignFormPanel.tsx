"use client";

import Button from "@/components/ui/button/Button";
import Checkbox from "@/components/form/input/Checkbox";
import Select from "@/components/form/Select";
import ContactAvatar from "@/components/zalo-contacts/shared/ContactAvatar";
import {
  BIRTHDAY_CAMPAIGN_NAME,
  BIRTHDAY_DEFAULT_TEMPLATE,
  getBirthdayMediaUrl,
} from "@/lib/zalo-birthday-campaign-utils";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { zaloBirthdayCampaignService } from "@/services/zalo-birthday-campaign.service";
import { useZaloBirthdayCampaignStore } from "@/stores/use-zalo-birthday-campaign-store";
import type {
  BirthdayCampaign,
  BirthdayContentType,
  BirthdayMediaItem,
} from "@/types/zalo-birthday-campaign";
import type { ZaloAccount } from "@/types/zalo-account";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  HiOutlinePhotograph,
  HiOutlinePlus,
  HiOutlineTrash,
} from "react-icons/hi";

interface BirthdayCampaignFormPanelProps {
  campaign: BirthdayCampaign | null;
  accounts: ZaloAccount[];
  accountsLoading: boolean;
  videos: BirthdayMediaItem[];
  albums: BirthdayMediaItem[];
  mediaLoading: boolean;
  saving: boolean;
}

const MAX_IMAGES = 2;
const MAX_CONTENT_LENGTH = 2000;

const textareaClassName =
  "w-full resize-y rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-800 shadow-theme-xs outline-none placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

const CONTENT_TYPE_OPTIONS: { value: BirthdayContentType; label: string }[] = [
  { value: "", label: "Chỉ văn bản" },
  { value: "image", label: "Ảnh" },
  { value: "video", label: "Video" },
  { value: "album", label: "Album ảnh" },
];

export default function BirthdayCampaignFormPanel({
  campaign,
  accounts,
  accountsLoading,
  videos,
  albums,
  mediaLoading,
  saving,
}: BirthdayCampaignFormPanelProps) {
  const createOrEditCampaign = useZaloBirthdayCampaignStore(
    (s) => s.createOrEditCampaign,
  );

  const [selectedAccountIds, setSelectedAccountIds] = useState<number[]>([]);
  const [contentType, setContentType] = useState<BirthdayContentType>("");
  const [contents, setContents] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [selectedMediaId, setSelectedMediaId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeAccounts = useMemo(
    () => accounts.filter((item) => item.checkpoint === false),
    [accounts],
  );

  const mediaOptions = useMemo(() => {
    const list = contentType === "video" ? videos : contentType === "album" ? albums : [];
    return list.map((item) => ({
      value: String(item.id),
      label: item.name_video || item.name || `#${item.id}`,
    }));
  }, [contentType, videos, albums]);

  useEffect(() => {
    if (!campaign?.id) {
      setSelectedAccountIds([]);
      setContentType("");
      setContents([]);
      setImages([]);
      setSelectedMediaId(null);
      return;
    }
    const type = campaign.type ?? "";
    setContentType(type);
    setContents(campaign.contents ?? []);
    setImages(campaign.images ?? []);
    setSelectedAccountIds(campaign.account ?? []);
    setSelectedMediaId(
      type === "video"
        ? (campaign.video ?? null)
        : type === "album"
          ? (campaign.album ?? null)
          : null,
    );
  }, [campaign]);

  const toggleAccount = (accountId: number) => {
    setSelectedAccountIds((prev) =>
      prev.includes(accountId)
        ? prev.filter((id) => id !== accountId)
        : [...prev, accountId],
    );
  };

  const toggleAllAccounts = () => {
    const allIds = activeAccounts.map((item) => item.id);
    const allSelected =
      allIds.length > 0 && allIds.every((id) => selectedAccountIds.includes(id));
    setSelectedAccountIds(allSelected ? [] : allIds);
  };

  const insertPlaceholder = (token: string) => {
    const input = inputRef.current;
    if (!input) {
      setDraft((prev) => (prev + token).slice(0, MAX_CONTENT_LENGTH));
      return;
    }
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const next = `${draft.slice(0, start)}${token}${draft.slice(end)}`.slice(
      0,
      MAX_CONTENT_LENGTH,
    );
    setDraft(next);
  };

  const addContent = () => {
    const value = draft.trim();
    if (!value) return;
    setContents((prev) => [...prev, value]);
    setDraft("");
  };

  const handleContentTypeChange = (next: BirthdayContentType) => {
    setContentType(next);
    if (next !== "image") setImages([]);
    if (next !== "video" && next !== "album") setSelectedMediaId(null);
  };

  const handleUploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    if (images.length + files.length > MAX_IMAGES) {
      toast.error(`Chỉ được chọn tối đa ${MAX_IMAGES} ảnh.`);
      return;
    }
    setUploadingImage(true);
    let nextImages = [...images];
    try {
      for (const file of files) {
        const path = await zaloBirthdayCampaignService.uploadImage(file);
        nextImages = [...nextImages, path];
      }
      setImages(nextImages);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  };

  const handleSave = async () => {
    if (!selectedAccountIds.length) {
      toast.error("Chọn ít nhất một tài khoản Zalo.");
      return;
    }
    if (!contents.length) {
      toast.error("Thêm ít nhất một nội dung tin nhắn.");
      return;
    }
    if (contentType === "image" && !images.length) {
      toast.error("Chọn ít nhất một ảnh đính kèm.");
      return;
    }
    if ((contentType === "video" || contentType === "album") && !selectedMediaId) {
      toast.error(
        contentType === "video" ? "Chọn video đính kèm." : "Chọn album ảnh đính kèm.",
      );
      return;
    }

    const payload = {
      id_category: campaign?.id ?? null,
      name: campaign?.name?.trim() || BIRTHDAY_CAMPAIGN_NAME,
      type: contentType,
      contents,
      images: contentType === "image" ? images : [],
      id_accounts: selectedAccountIds,
      id_video: contentType === "video" ? selectedMediaId : null,
      id_album: contentType === "album" ? selectedMediaId : null,
    };

    try {
      await createOrEditCampaign(payload);
      toast.success(campaign?.id ? "Đã cập nhật kịch bản." : "Đã tạo kịch bản.");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <div className="custom-scrollbar flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
            Tài khoản gửi tin
          </p>
          <button
            type="button"
            disabled={saving || accountsLoading || activeAccounts.length === 0}
            onClick={toggleAllAccounts}
            className="text-theme-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
          >
            {activeAccounts.length > 0 &&
            activeAccounts.every((item) => selectedAccountIds.includes(item.id))
              ? "Bỏ chọn tất cả"
              : "Chọn tất cả"}
          </button>
        </div>
        {accountsLoading ? (
          <p className="text-sm text-gray-500">Đang tải tài khoản...</p>
        ) : activeAccounts.length === 0 ? (
          <p className="text-sm text-gray-500">Không có tài khoản khả dụng</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {activeAccounts.map((account) => {
              const selected = selectedAccountIds.includes(account.id);
              return (
                <button
                  key={account.id}
                  type="button"
                  disabled={saving}
                  onClick={() => toggleAccount(account.id)}
                  className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 transition ${
                    selected
                      ? "border-brand-300 bg-brand-50 shadow-theme-xs ring-2 ring-brand-500/15 dark:border-brand-500/40 dark:bg-brand-500/10"
                      : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900/60"
                  }`}
                >
                  <ContactAvatar
                    name={account.name || `#${account.id}`}
                    avatar={account.avatar}
                    size="sm"
                  />
                  <span className="max-w-[120px] truncate text-sm font-medium text-gray-800 dark:text-white/90">
                    {account.name || `#${account.id}`}
                  </span>
                  {selected ? (
                    <span className="text-brand-600 dark:text-brand-400">✓</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-gray-800 dark:text-white/90">
          Loại đính kèm
        </p>
        <div className="flex flex-wrap gap-3">
          {CONTENT_TYPE_OPTIONS.map((item) => (
            <label
              key={item.value || "text"}
              className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
            >
              <Checkbox
                checked={contentType === item.value}
                onChange={() =>
                  handleContentTypeChange(
                    contentType === item.value ? "" : item.value,
                  )
                }
                disabled={saving}
              />
              {item.label}
            </label>
          ))}
        </div>
      </div>

      {contentType === "image" ? (
        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Ảnh đính kèm (tối đa {MAX_IMAGES})
            </p>
            <Button
              size="sm"
              variant="outline"
              disabled={saving || uploadingImage || images.length >= MAX_IMAGES}
              onClick={() => fileInputRef.current?.click()}
            >
              <HiOutlinePhotograph className="mr-1" size={14} />
              {uploadingImage ? "Đang tải..." : "Chọn ảnh"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,image/png,image/jpeg"
              multiple
              className="hidden"
              onChange={(e) => void handleUploadImage(e)}
            />
          </div>
          {images.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {images.map((path, index) => (
                <div key={`${path}-${index}`} className="relative">
                  <span className="relative block h-20 w-20 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                    <Image
                      src={getBirthdayMediaUrl(path)}
                      alt={`upload-${index}`}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </span>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => setImages(images.filter((_, i) => i !== index))}
                    className="absolute -right-1 -top-1 rounded-full bg-error-500 p-0.5 text-white"
                  >
                    <HiOutlineTrash size={12} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-theme-xs text-gray-500">
              Khuyến nghị 1 ảnh đầy đủ thông tin để tối ưu hiệu suất.
            </p>
          )}
        </div>
      ) : null}

      {contentType === "video" || contentType === "album" ? (
        <div>
          <p className="mb-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">
            {contentType === "video" ? "Chọn video" : "Chọn album ảnh"}
          </p>
          {mediaLoading ? (
            <p className="text-sm text-gray-500">Đang tải thư viện...</p>
          ) : mediaOptions.length === 0 ? (
            <p className="text-sm text-gray-500">Chưa có dữ liệu trong thư viện</p>
          ) : (
            <Select
              options={mediaOptions}
              defaultValue={selectedMediaId ? String(selectedMediaId) : ""}
              placeholder={
                contentType === "video" ? "Chọn video..." : "Chọn album..."
              }
              onChange={(value) => setSelectedMediaId(Number(value))}
            />
          )}
        </div>
      ) : null}

      <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
        <p className="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">
          Nội dung chúc mừng
        </p>
        <div className="mb-3 flex flex-wrap gap-2">
          {[
            { key: "[gender]", label: "Giới tính" },
            { key: "[name]", label: "Tên" },
            { key: "[r]", label: "Icon ngẫu nhiên" },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              disabled={saving}
              onClick={() => insertPlaceholder(item.key)}
              className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-theme-xs font-medium text-brand-700 transition hover:bg-brand-100 disabled:opacity-50 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300"
            >
              {item.label} ({item.key})
            </button>
          ))}
          <button
            type="button"
            disabled={saving}
            onClick={() => setDraft(BIRTHDAY_DEFAULT_TEMPLATE)}
            className="rounded-full border border-gray-200 px-3 py-1 text-theme-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
          >
            Mẫu
          </button>
        </div>
        <textarea
          ref={inputRef}
          value={draft}
          disabled={saving}
          onChange={(e) => setDraft(e.target.value.slice(0, MAX_CONTENT_LENGTH))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              addContent();
            }
          }}
          rows={4}
          placeholder="Nhập nội dung mẫu... (Enter để thêm)"
          className={textareaClassName}
        />
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-theme-xs text-gray-500">
            {draft.length}/{MAX_CONTENT_LENGTH}
          </span>
          <Button size="sm" disabled={saving || !draft.trim()} onClick={addContent}>
            <HiOutlinePlus className="mr-1" size={14} />
            Thêm nội dung
          </Button>
        </div>
        {contents.length > 0 ? (
          <div className="mt-3 space-y-2">
            {contents.map((item, index) => (
              <div
                key={`content-${index}`}
                className="flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-white/[0.02]"
              >
                <p className="min-w-0 flex-1 whitespace-pre-wrap break-words text-sm text-gray-700 dark:text-gray-300">
                  {item}
                </p>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setContents(contents.filter((_, i) => i !== index))}
                  className="shrink-0 rounded-lg p-1.5 text-error-500 hover:bg-error-50 disabled:opacity-50"
                >
                  <HiOutlineTrash size={16} />
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="sticky bottom-0 border-t border-gray-100 bg-white/95 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
        <Button className="w-full" disabled={saving} onClick={() => void handleSave()}>
          {saving ? "Đang lưu..." : campaign?.id ? "Sửa kịch bản" : "Tạo kịch bản"}
        </Button>
      </div>
    </div>
  );
}