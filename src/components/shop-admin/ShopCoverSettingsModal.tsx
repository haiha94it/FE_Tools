"use client";

import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import { Modal } from "@/components/ui/modal";
import { shopImageUrl } from "@/lib/shop-utils";
import { toast } from "@/lib/toast";
import { zaloShopService } from "@/services/zalo-shop.service";
import { useZaloShopAdminStore } from "@/stores/use-zalo-shop-admin-store";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

interface ShopCoverSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export default function ShopCoverSettingsModal({
  isOpen,
  onClose,
  userId,
}: ShopCoverSettingsModalProps) {
  const cover = useZaloShopAdminStore((s) => s.cover);
  const updateCover = useZaloShopAdminStore((s) => s.updateCover);
  const isLoading = useZaloShopAdminStore((s) => s.isLoading);
  const bannerRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [banner, setBanner] = useState<string | null>(null);
  const [logo, setLogo] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isOpen && cover) {
      setName(cover.name ?? "");
      setBanner(cover.image ?? null);
      setLogo(cover.image_logo ?? null);
    }
  }, [isOpen, cover]);

  const handleUpload = async (file: File, type: "banner" | "logo") => {
    setUploading(true);
    try {
      const path = await zaloShopService.uploadFile(file);
      if (type === "banner") setBanner(path);
      else setLogo(path);
      toast.success("Tải ảnh thành công");
    } catch {
      toast.error("Tải ảnh thất bại");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    await updateCover({
      id_user: userId,
      name: name.trim(),
      image: banner,
      image_logo: logo,
    });
    toast.success("Đã lưu cài đặt cửa hàng");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      layer="top"
      className="max-w-2xl p-5 sm:p-6"
    >
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
        Cài đặt cửa hàng
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        Tùy chỉnh tên, logo và ảnh bìa hiển thị trên trang bán hàng.
      </p>

      <div className="mt-5 space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Tên cửa hàng
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tên hiển thị trên storefront"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Ảnh bìa
            </label>
            <div
              className="relative flex h-32 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
              onClick={() => bannerRef.current?.click()}
            >
              {banner ? (
                <Image src={shopImageUrl(banner)} alt="Banner" fill className="object-cover" unoptimized />
              ) : (
                <span className="text-xs text-gray-400">Nhấn để tải ảnh bìa</span>
              )}
            </div>
            <input
              ref={bannerRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleUpload(file, "banner");
              }}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Logo
            </label>
            <div
              className="relative flex h-32 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
              onClick={() => logoRef.current?.click()}
            >
              {logo ? (
                <Image src={shopImageUrl(logo)} alt="Logo" fill className="object-contain p-2" unoptimized />
              ) : (
                <span className="text-xs text-gray-400">Nhấn để tải logo</span>
              )}
            </div>
            <input
              ref={logoRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleUpload(file, "logo");
              }}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
          Hủy
        </Button>
        <Button
          onClick={() => void handleSave()}
          disabled={isLoading || uploading}
          className="w-full sm:w-auto"
        >
          Lưu thay đổi
        </Button>
      </div>
    </Modal>
  );
}