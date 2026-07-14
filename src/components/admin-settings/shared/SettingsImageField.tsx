"use client";

import Button from "@/components/ui/button/Button";
import { resolveAdminSettingsImage } from "@/lib/admin-settings-utils";
import Image from "next/image";
import { useRef } from "react";
import { HiOutlinePhotograph } from "react-icons/hi";

interface SettingsImageFieldProps {
  label: string;
  imagePath: string;
  uploading?: boolean;
  onSelect: (file: File) => void | Promise<void>;
  onClear?: () => void | Promise<void>;
  clearing?: boolean;
  required?: boolean;
}

export default function SettingsImageField({
  label,
  imagePath,
  uploading = false,
  onSelect,
  onClear,
  clearing = false,
  required = false,
}: SettingsImageFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrl = resolveAdminSettingsImage(imagePath);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    void onSelect(file);
    event.target.value = "";
  };

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required ? <span className="text-error-500"> *</span> : null}
      </p>
      {previewUrl ? (
        <div className="relative mb-3 h-40 w-40 overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
          <Image
            src={previewUrl}
            alt=""
            fill
            unoptimized
            className="object-contain p-2"
          />
        </div>
      ) : null}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={uploading || clearing}
          onClick={() => fileInputRef.current?.click()}
          startIcon={<HiOutlinePhotograph className="size-4" />}
        >
          {uploading ? "Đang tải ảnh..." : "Chọn ảnh"}
        </Button>
        {previewUrl && onClear ? (
          <button
            type="button"
            onClick={() => void onClear()}
            disabled={uploading || clearing}
            className="text-sm font-medium text-error-500 hover:underline disabled:opacity-50"
          >
            {clearing ? "Đang xóa..." : "Xóa ảnh"}
          </button>
        ) : null}
      </div>
    </div>
  );
}