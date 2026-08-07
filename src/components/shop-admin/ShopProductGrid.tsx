"use client";

import AdminIconButton from "@/components/admin-users/AdminIconButton";
import Badge from "@/components/ui/badge/Badge";
import ScrollableTableContainer, { stickyTableHeaderClass } from "@/components/ui/table/ScrollableTableContainer";
import { STORE_PUBLIC_BASE } from "@/config/api";
import { formatPriceRange, shopImageUrl } from "@/lib/shop-utils";
import { toast } from "@/lib/toast";
import { useAuthStore } from "@/stores/use-auth-store";
import { useZaloShopAdminStore } from "@/stores/use-zalo-shop-admin-store";
import type { ShopProduct } from "@/types/zalo-shop";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

interface ShopProductGridProps {
  userId: string;
  categoryId: number;
  domain: string | null;
}

function canDeleteProduct(
  product: ShopProduct,
  opts: { isManager?: boolean; username?: string },
): boolean {
  if (opts.isManager) return true;
  const pending = product.status !== 1;
  const mine = (product.creator_user_name || "") === (opts.username || "");
  return pending && mine;
}

export default function ShopProductGrid({
  userId,
  categoryId,
  domain,
}: ShopProductGridProps) {
  const router = useRouter();
  const authUser = useAuthStore((s) => s.user);
  const isManager = Boolean(authUser?.isManager);
  const products = useZaloShopAdminStore((s) => s.products);
  const isLoading = useZaloShopAdminStore((s) => s.isLoading);
  const deleteProduct = useZaloShopAdminStore((s) => s.deleteProduct);
  const toggleProductStatus = useZaloShopAdminStore((s) => s.toggleProductStatus);
  const copyProduct = useZaloShopAdminStore((s) => s.copyProduct);

  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "pending">("all");

  const filteredProducts = useMemo(() => {
    let list = products;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.title.toLowerCase().includes(q));
    }
    if (statusFilter === "published") {
      list = list.filter((p) => p.status === 1);
    } else if (statusFilter === "pending") {
      list = list.filter((p) => p.status !== 1);
    }
    return list;
  }, [products, search, statusFilter]);

  const handleCopyLink = (product: ShopProduct) => {
    const origin = domain || (typeof window !== "undefined" ? window.location.origin : "");
    const url = `${origin}${STORE_PUBLIC_BASE}/${userId}/${categoryId}/${product.id}`;
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

  const productActionClass =
    "inline-flex min-h-9 min-w-9 touch-manipulation items-center justify-center rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-brand-600 dark:hover:bg-gray-800";

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {/* Controls Header: Search + Status Filters + View Mode Switcher */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-0 flex-1 max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên sản phẩm..."
            className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-4 text-xs shadow-sm focus:border-brand-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
          />
          <svg
            className="absolute left-3 top-3 h-4 w-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          <div className="flex items-center rounded-xl border border-gray-200 bg-white p-1 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                statusFilter === "all"
                  ? "bg-brand-500 text-white shadow-xs"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              Tất cả ({products.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("published")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                statusFilter === "published"
                  ? "bg-brand-500 text-white shadow-xs"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              Đang bán
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("pending")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                statusFilter === "pending"
                  ? "bg-brand-500 text-white shadow-xs"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              Chờ duyệt
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-xl border border-gray-200 bg-white p-1 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              title="Lưới sản phẩm"
              className={`rounded-lg p-1.5 text-xs transition ${
                viewMode === "grid"
                  ? "bg-gray-100 text-brand-600 dark:bg-gray-800 dark:text-brand-400 font-bold"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <GridIcon />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              title="Bảng sản phẩm"
              className={`rounded-lg p-1.5 text-xs transition ${
                viewMode === "table"
                  ? "bg-gray-100 text-brand-600 dark:bg-gray-800 dark:text-brand-400 font-bold"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <ListIcon />
            </button>
          </div>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 py-16 dark:border-gray-700 dark:bg-gray-900/50">
          <div className="mb-4 rounded-full bg-brand-50 p-4 dark:bg-brand-500/10">
            <svg className="h-8 w-8 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Không tìm thấy sản phẩm phù hợp
          </p>
          <Link
            href={`/shop/categories/${categoryId}/products/new`}
            className="mt-4 rounded-lg bg-brand-500 px-4 py-2 text-xs font-bold text-white hover:bg-brand-600"
          >
            + Thêm sản phẩm
          </Link>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredProducts.map((product) => {
            const isPublished = product.status === 1;
            const imageSrc = product.images[0] ? shopImageUrl(product.images[0]) : null;
            return (
              <article
                key={product.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs transition hover:border-brand-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-brand-800"
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
                  <div className="absolute left-2 top-2 flex flex-col gap-1">
                    <Badge size="sm" color={isPublished ? "success" : "warning"}>
                      {isPublished ? "Đang bán" : "Chờ duyệt"}
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
                  <p className="mt-1 text-sm font-bold text-brand-600 dark:text-brand-400">
                    {formatPriceRange(product)}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {product.variants.length} phân loại
                    {product.creator_name ? ` · ${product.creator_name}` : ""}
                  </p>

                  <div className="mt-auto flex flex-wrap items-center justify-between gap-1.5 border-t border-gray-100 pt-3 dark:border-gray-800">
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
                    {isManager ? (
                      <AdminIconButton
                        label={isPublished ? "Ẩn sản phẩm" : "Duyệt / hiện SP"}
                        onClick={() => toggleProductStatus(product, !isPublished)}
                        className={productActionClass}
                      >
                        {isPublished ? <EyeOffIcon /> : <EyeIcon />}
                      </AdminIconButton>
                    ) : null}
                    {canDeleteProduct(product, {
                      isManager,
                      username: authUser?.username,
                    }) ? (
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
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <ScrollableTableContainer fill className="rounded-2xl border border-gray-200 dark:border-gray-800">
          <table className="w-full text-left text-xs">
            <thead className={stickyTableHeaderClass}>
              <tr className="border-b border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-300">
                <th className="px-4 py-3 font-semibold">Sản phẩm</th>
                <th className="px-4 py-3 font-semibold">Khoảng giá</th>
                <th className="px-4 py-3 font-semibold">Biến thể</th>
                <th className="px-4 py-3 font-semibold">Trạng thái</th>
                <th className="px-4 py-3 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-800 dark:bg-gray-900">
              {filteredProducts.map((product) => {
                const isPublished = product.status === 1;
                const imageSrc = product.images[0] ? shopImageUrl(product.images[0]) : null;
                return (
                  <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {imageSrc ? (
                          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                            <Image src={imageSrc} alt="" fill className="object-cover" unoptimized />
                          </div>
                        ) : (
                          <div className="h-10 w-10 shrink-0 rounded-lg bg-gray-100 dark:bg-gray-800" />
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-gray-900 dark:text-white">{product.title}</p>
                          <p className="text-[11px] text-gray-400">ID: #{product.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold text-brand-600 dark:text-brand-400">
                      {formatPriceRange(product)}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {product.variants.length} phân loại
                    </td>
                    <td className="px-4 py-3">
                      <Badge size="sm" color={isPublished ? "success" : "warning"}>
                        {isPublished ? "Đang bán" : "Chờ duyệt"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <AdminIconButton
                          label="Sửa"
                          onClick={() =>
                            router.push(`/shop/categories/${categoryId}/products/${product.id}/edit`)
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
                        {isManager ? (
                          <AdminIconButton
                            label={isPublished ? "Ẩn SP" : "Hiện SP"}
                            onClick={() => toggleProductStatus(product, !isPublished)}
                            className={productActionClass}
                          >
                            {isPublished ? <EyeOffIcon /> : <EyeIcon />}
                          </AdminIconButton>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </ScrollableTableContainer>
      )}
    </div>
  );
}

function GridIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
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