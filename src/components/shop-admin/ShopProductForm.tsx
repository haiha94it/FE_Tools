"use client";

import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import { shopImageUrl } from "@/lib/shop-utils";
import { toast } from "@/lib/toast";
import { zaloShopService } from "@/services/zalo-shop.service";
import { useAuthStore } from "@/stores/use-auth-store";
import { useZaloShopAdminStore } from "@/stores/use-zalo-shop-admin-store";
import type { ShopProduct, ShopProductVariant } from "@/types/zalo-shop";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const emptyVariant = (): ShopProductVariant => ({
  classify: "",
  price: "",
  promotion_price: "",
  total_quantity: "",
  sold_quantity: 0,
  options: [{ name: "", value: "" }],
});

interface ShopProductFormProps {
  categoryId: number;
  productId?: number;
}

export default function ShopProductForm({
  categoryId,
  productId,
}: ShopProductFormProps) {
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id ?? "");
  const saveProduct = useZaloShopAdminStore((s) => s.saveProduct);
  const isLoading = useZaloShopAdminStore((s) => s.isLoading);
  const imageRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [sellOption, setSellOption] = useState(0);
  const [linkZalo, setLinkZalo] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [variants, setVariants] = useState<ShopProductVariant[]>([emptyVariant()]);
  const [loadingProduct, setLoadingProduct] = useState(Boolean(productId));

  useEffect(() => {
    if (!productId) return;
    let cancelled = false;
    void (async () => {
      try {
        const response = await zaloShopService.listProducts({
          employeeId: userId,
          categoryId,
        });
        const product = response.results.find((p) => p.id === productId);
        if (cancelled || !product) return;
        setTitle(product.title);
        setDescription(product.description ?? "");
        setPhone(product.phone_number ?? "");
        setSellOption(product.sell_option ?? 0);
        setLinkZalo(product.link_zalo ?? "");
        setImages(product.images ?? []);
        setVariants(product.variants.length ? product.variants : [emptyVariant()]);
      } finally {
        if (!cancelled) setLoadingProduct(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId, userId, categoryId]);

  const handleUpload = async (file: File) => {
    try {
      const path = await zaloShopService.uploadFile(file);
      setImages((prev) => [...prev, path]);
      toast.success("Tải ảnh thành công");
    } catch {
      toast.error("Tải ảnh thất bại");
    }
  };

  const updateVariant = (
    index: number,
    key: keyof ShopProductVariant,
    value: string | number,
  ) => {
    setVariants((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Tên sản phẩm là bắt buộc");
      return;
    }
    if (!description.trim()) {
      toast.error("Mô tả là bắt buộc");
      return;
    }
    if (images.length === 0) {
      toast.error("Cần ít nhất một hình ảnh");
      return;
    }
    if (!variants[0]?.classify) {
      toast.error("Cần ít nhất một phân loại");
      return;
    }
    if (sellOption === 1 && !linkZalo) {
      toast.error("Thêm link liên hệ Zalo");
      return;
    }

    await saveProduct({
      id_account: userId,
      id_category: categoryId,
      title: title.trim(),
      description: description.trim(),
      phone_number: phone,
      sell_option: sellOption,
      images,
      variants,
      link_zalo: linkZalo || null,
      ...(productId ? { id_product: productId } : {}),
    });
    toast.success(productId ? "Đã cập nhật sản phẩm" : "Đã tạo sản phẩm");
    router.push(`/shop/categories/${categoryId}`);
  };

  if (loadingProduct) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="w-full min-w-0 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            {productId ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
          </h2>
          <p className="text-sm text-gray-500">Danh mục #{categoryId}</p>
        </div>
        <Link
          href={`/shop/categories/${categoryId}`}
          className="inline-flex min-h-11 touch-manipulation items-center text-sm font-medium text-brand-600 hover:text-brand-700 sm:min-h-0"
        >
          ← Quay lại
        </Link>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 sm:p-6">
        <h3 className="mb-4 text-sm font-semibold text-gray-800 dark:text-white/90">
          Thông tin cơ bản
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tên sản phẩm *
            </label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nhập tên sản phẩm" />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Mô tả *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              placeholder="Mô tả chi tiết sản phẩm"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Số điện thoại
            </label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Hotline liên hệ" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Hình thức bán
            </label>
            <select
              value={sellOption}
              onChange={(e) => setSellOption(Number(e.target.value))}
              className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            >
              <option value={0}>Đặt hàng qua giỏ</option>
              <option value={1}>Liên hệ Zalo trực tiếp</option>
            </select>
          </div>
          {sellOption === 1 ? (
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Link Zalo *
              </label>
              <Input value={linkZalo} onChange={(e) => setLinkZalo(e.target.value)} placeholder="Link Zalo liên hệ" />
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 sm:p-6">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Hình ảnh</h3>
          <button
            type="button"
            onClick={() => imageRef.current?.click()}
            className="inline-flex min-h-11 touch-manipulation items-center text-sm font-medium text-brand-600 hover:text-brand-700 sm:min-h-0"
          >
            + Thêm ảnh
          </button>
          <input
            ref={imageRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleUpload(file);
            }}
          />
        </div>
        <div className="flex flex-wrap gap-3">
          {images.map((img, idx) => (
            <div key={idx} className="group relative h-24 w-24 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
              <Image src={shopImageUrl(img)} alt="" fill className="object-cover" unoptimized />
              <button
                type="button"
                onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                className="absolute right-1 top-1 min-h-8 min-w-8 touch-manipulation rounded bg-black/60 px-1.5 py-0.5 text-xs text-white opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100"
              >
                ×
              </button>
            </div>
          ))}
          {images.length === 0 ? (
            <p className="text-sm text-gray-500">Chưa có ảnh sản phẩm</p>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 sm:p-6">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">Phân loại & giá</h3>
          <button
            type="button"
            onClick={() => setVariants((prev) => [...prev, emptyVariant()])}
            className="inline-flex min-h-11 touch-manipulation items-center text-sm font-medium text-brand-600 hover:text-brand-700 sm:min-h-0"
          >
            + Thêm phân loại
          </button>
        </div>
        <div className="space-y-4">
          {variants.map((variant, index) => (
            <div
              key={index}
              className="rounded-xl border border-gray-100 bg-gray-50/80 p-4 dark:border-gray-800 dark:bg-gray-800/50"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Phân loại {index + 1}</span>
                {variants.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => setVariants((prev) => prev.filter((_, i) => i !== index))}
                    className="text-xs text-error-600"
                  >
                    Xóa
                  </button>
                ) : null}
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs text-gray-500">Tên phân loại *</label>
                  <Input
                    value={String(variant.classify)}
                    onChange={(e) => updateVariant(index, "classify", e.target.value)}
                    placeholder="VD: Size M"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">Giá bán</label>
                  <Input
                    type="number"
                    value={String(variant.price)}
                    onChange={(e) => updateVariant(index, "price", e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">Giá khuyến mãi</label>
                  <Input
                    type="number"
                    value={String(variant.promotion_price ?? "")}
                    onChange={(e) => updateVariant(index, "promotion_price", e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">Tồn kho</label>
                  <Input
                    type="number"
                    value={String(variant.total_quantity)}
                    onChange={(e) => updateVariant(index, "total_quantity", e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link href={`/shop/categories/${categoryId}`} className="w-full sm:w-auto">
          <Button variant="outline" type="button" className="w-full sm:w-auto">
            Hủy
          </Button>
        </Link>
        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
          {productId ? "Cập nhật" : "Tạo sản phẩm"}
        </Button>
      </div>
    </form>
  );
}