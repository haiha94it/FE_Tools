"use client";

import Button from "@/components/ui/button/Button";
import Checkbox from "@/components/form/input/Checkbox";
import { getSendMessPhoneMediaUrl } from "@/lib/zalo-send-mess-phone-campaign-utils";
import { toast } from "@/lib/toast";
import type { SendMessPhoneContentType } from "@/types/zalo-send-mess-phone-campaign";
import Image from "next/image";
import { useRef, useState } from "react";
import { HiOutlinePhotograph, HiOutlinePlus, HiOutlineTrash } from "react-icons/hi";

interface SendMessPhoneContentEditorProps {
  contents: string[];
  images: string[];
  contentType: SendMessPhoneContentType;
  splitAttachment: boolean;
  uploadingImage: boolean;
  disabled?: boolean;
  onContentsChange: (contents: string[]) => void;
  onImagesChange: (images: string[]) => void;
  onSplitAttachmentChange: (value: boolean) => void;
  onUploadImage: (file: File) => Promise<string | null>;
}

const PLACEHOLDERS = [
  { key: "[sdt]", label: "Số điện thoại" },
  { key: "[gender]", label: "Giới tính" },
  { key: "[name]", label: "Tên" },
  { key: "[r]", label: "Icon ngẫu nhiên" },
] as const;

const MAX_IMAGES = 2;
const MAX_CONTENT_LENGTH = 2000;
const DEFAULT_TEMPLATE = "Xin chào [gender] [name] ! ...... Chân thành cảm ơn!";

const textareaClassName =
  "w-full resize-y rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-800 shadow-theme-xs outline-none placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

export default function SendMessPhoneContentEditor({
  contents,
  images,
  contentType,
  splitAttachment,
  uploadingImage,
  disabled = false,
  onContentsChange,
  onImagesChange,
  onSplitAttachmentChange,
  onUploadImage,
}: SendMessPhoneContentEditorProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState("");

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
    onContentsChange([...contents, value]);
    setDraft("");
  };

  const removeContent = (index: number) => {
    onContentsChange(contents.filter((_, i) => i !== index));
  };

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    if (images.length + files.length > MAX_IMAGES) {
      toast.error(`Chỉ được chọn tối đa ${MAX_IMAGES} ảnh.`);
      return;
    }
    let nextImages = [...images];
    for (const file of files) {
      try {
        const path = await onUploadImage(file);
        if (path) nextImages = [...nextImages, path];
      } catch {
        toast.error("Upload ảnh thất bại.");
      }
    }
    if (nextImages.length > images.length) {
      onImagesChange(nextImages);
    }
    event.target.value = "";
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {PLACEHOLDERS.map((item) => (
          <button
            key={item.key}
            type="button"
            disabled={disabled}
            onClick={() => insertPlaceholder(item.key)}
            className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-theme-xs font-medium text-brand-700 transition hover:bg-brand-100 disabled:opacity-50 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300"
          >
            {item.label} ({item.key})
          </button>
        ))}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setDraft(DEFAULT_TEMPLATE)}
          className="rounded-full border border-gray-200 px-3 py-1 text-theme-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
        >
          Mẫu
        </button>
      </div>

      <div>
        <textarea
          ref={inputRef}
          value={draft}
          disabled={disabled}
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
          <Button size="sm" disabled={disabled || !draft.trim()} onClick={addContent}>
            <HiOutlinePlus className="mr-1" size={14} />
            Thêm nội dung
          </Button>
        </div>
      </div>

      {contents.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Danh sách nội dung ({contents.length})
          </p>
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
                disabled={disabled}
                onClick={() => removeContent(index)}
                className="shrink-0 rounded-lg p-1.5 text-error-500 hover:bg-error-50 disabled:opacity-50"
              >
                <HiOutlineTrash size={16} />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {contentType === "" ? (
        <div className="space-y-3">
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Hình ảnh (tối đa {MAX_IMAGES})
              </p>
              <Button
                size="sm"
                variant="outline"
                disabled={disabled || uploadingImage || images.length >= MAX_IMAGES}
                onClick={() => fileInputRef.current?.click()}
              >
                <HiOutlinePhotograph className="mr-1" size={14} />
                {uploadingImage ? "Đang tải..." : "Chọn ảnh"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => void handleImageSelect(e)}
              />
            </div>
            {images.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {images.map((path, index) => (
                  <div key={path} className="relative">
                    <span className="relative block h-20 w-20 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                      <Image
                        src={getSendMessPhoneMediaUrl(path)}
                        alt={`upload-${index}`}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </span>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => onImagesChange(images.filter((_, i) => i !== index))}
                      className="absolute -right-1 -top-1 rounded-full bg-error-500 p-0.5 text-white"
                    >
                      <HiOutlineTrash size={12} />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {images.length > 0 ? (
            <label className="flex cursor-pointer items-start gap-2.5 text-sm text-gray-600 dark:text-gray-400">
              <Checkbox
                checked={splitAttachment}
                onChange={onSplitAttachmentChange}
                disabled={disabled}
              />
              <span>
                Tách tin nhắn và đính kèm — gửi nội dung và ảnh thành hai tin riêng
              </span>
            </label>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}