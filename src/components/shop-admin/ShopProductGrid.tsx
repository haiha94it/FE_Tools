"use client";

import AdminIconButton from "@/components/admin-users/AdminIconButton";
import Badge from "@/components/ui/badge/Badge";
import { STORE_PUBLIC_BASE } from "@/config/api";
import { formatPriceRange, shopImageUrl } from "@/lib/shop-utils";
import { toast } from "@/lib/toast";
import { useZaloShopAdminStore } from "@/stores/use-zalo-shop-admin-store";
import type { ShopProduct } from "@/types/zalo-shop";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ShopProductGridProps {
  userId: string;
  categoryId: number;
  domain: string | null;
}

export default function ShopProductGrid({
  userId,
  categoryId,
  domain,
}: ShopProductGridProps) {
  const router = useRouter();
  const products = useZaloShopAdminStore((s) => s.products);
  const isLoading = useZaloShopAdminStore((s) => s.isLoading);
  const deleteProduct = useZaloShopAdminStore((s) => s.deleteProduct);
  const toggleProductStatus = useZaloShopAdminStore((s) => s.toggleProductStatus);
  const copyProduct = useZaloShopAdminStore((s) => s.copyProduct);

  const handleCopyLink = (product: ShopProduct) => {
    const origin = domain || (typeof window !== "undefined" ? window.location.origin : "");
    const url = `${origin}${STORE_PUBLIC_BASE}/${userId}/categories/${categoryId}/products/${product.id}`;
    void navigator.clipboard.writeText(url).then(() => {
      toast.success("Đã sao chép liên kết sản phẩm");
    });
  };

  const handleCopyProduct = async (product: ShopProduct) => {
    const title = window.prompt("Nhập tên sản phẩm mới", `${product.title} (bản sao)`);
    if (!title?.trim()) return;
    await copyProduct(product.id, title.trim());
    toast.success("Sao chép sản phẩm thành công");
  };

  if (isLoading && products.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 py-16 dark:border-gray-700 dark:bg-gray-900/50">
        <div className="mb-4 rounded-full bg-brand-50 p-4 dark:bg-brand-500/10">
          <svg className="h-8 w-8 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Chưa có sản phẩm trong danh mục này
        </p>
        <Link
          href={`/shop/categories/${categoryId}/products/new`}
          className="mt-4 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
        >
          Thêm sản phẩm đầu tiên
        </Link>
      </div>
    );
  }

  const productActionClass =
    "inline-flex min-h-11 min-w-11 touch-manipulation items-center justify-center rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-brand-600 dark:hover:bg-gray-800 sm:min-h-0 sm:min-w-0";

  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {products.map((product) => {
        const isPublished = product.status === 1;
        const imageSrc = product.images[0] ? shopImageUrl(product.images[0]) : null;
        return (
          <article
            key={product.id}
            className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs transition hover:border-brand-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-brand-800"
          >
            <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800">
              {imageSrc ? (
                <Image
                  src={imageSrc}
                  alt={product.title}
                  fill
                  className="object-cover transition duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, 280px"
                  unoptimized
                />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-400">
                  <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              <div className="absolute left-2 top-2">
                <Badge size="sm" color={isPublished ? "success" : "warning"}>
                  {isPublished ? "Đang bán" : "Ẩn"}
                </Badge>
              </div>
              {product.is_hot ? (
                <div className="absolute right-2 top-2">
                  <Badge size="sm" color="error">Hot</Badge>
                </div>
              ) : null}
            </div>

            <div className="flex flex-1 flex-col p-4">
              <h4 className="line-clamp-2 text-sm font-semibold text-gray-800 dark:text-white/90">
                {product.title}
              </h4>
              <p className="mt-1 text-sm font-medium text-brand-600 dark:text-brand-400">
                {formatPriceRange(product)}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {product.variants.length} phân loại
              </p>

              <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
                <AdminIconButton
                  label="Sửa"
                  onClick={() =>
                    router.push(
                      `/shop/categories/${categoryId}/products/${product.id}/edit`,
                    )
                  }
                  className={productActionClass}
                >
                  <EditIcon />
                </AdminIconButton>
                <AdminIconButton
                  label="Sao chép link"
                  onClick={() => handleCopyLink(product)}
                  className={productActionClass}
                >
                  <LinkIcon />
                </AdminIconButton>
                <AdminIconButton
                  label="Nhân bản"
                  onClick={() => void handleCopyProduct(product)}
                  className={productActionClass}
                >
                  <CopyIcon />
                </AdminIconButton>
                <AdminIconButton
                  label={isPublished ? "Ẩn" : "Hiện"}
                  onClick={() => toggleProductStatus(product, !isPublished)}
                  className={productActionClass}
                >
                  {isPublished ? <EyeOffIcon /> : <EyeIcon />}
                </AdminIconButton>
                <AdminIconButton
                  label="Xóa"
                  side="left"
                  onClick={() => {
                    if (window.confirm(`Xóa sản phẩm "${product.title}"?`)) {
                      void deleteProduct(userId, product.id);
                      toast.success("Đã xóa sản phẩm");
                    }
                  }}
                  className={`${productActionClass} hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-500/10`}
                >
                  <TrashIcon />
                </AdminIconButton>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function EditIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}