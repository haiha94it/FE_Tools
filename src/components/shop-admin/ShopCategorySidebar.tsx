"use client";

import AdminIconButton from "@/components/admin-users/AdminIconButton";
import Badge from "@/components/ui/badge/Badge";
import { STORE_PUBLIC_BASE } from "@/config/api";
import { shopImageUrl } from "@/lib/shop-utils";
import { toast } from "@/lib/toast";
import { useAuthStore } from "@/stores/use-auth-store";
import { useZaloShopAdminStore } from "@/stores/use-zalo-shop-admin-store";
import type { ShopCategory } from "@/types/zalo-shop";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ShopCategorySidebarProps {
  userId: string;
  selectedCategoryId: number | null;
  domain: string | null;
  onCreateCategory: () => void;
  onEditCategory: (category: ShopCategory) => void;
  onDeleteCategory: (category: ShopCategory) => void;
}

/** NV chỉ xóa DM chờ duyệt do mình tạo/sửa cuối; manager xóa mọi. */
function canDeleteCategory(
  category: ShopCategory,
  opts: { isManager?: boolean; username?: string },
): boolean {
  if (opts.isManager) return true;
  const pending = category.status !== 1;
  const mine = (category.creator_user_name || "") === (opts.username || "");
  return pending && Boolean(opts.username) && mine;
}

export default function ShopCategorySidebar({
  userId,
  selectedCategoryId,
  domain,
  onCreateCategory,
  onEditCategory,
  onDeleteCategory,
}: ShopCategorySidebarProps) {
  const router = useRouter();
  const authUser = useAuthStore((s) => s.user);
  const isManager = Boolean(authUser?.isManager);
  const categories = useZaloShopAdminStore((s) => s.categories);
  const toggleCategoryStatus = useZaloShopAdminStore((s) => s.toggleCategoryStatus);

  const copyLink = (category: ShopCategory) => {
    const origin = domain || (typeof window !== "undefined" ? window.location.origin : "");
    const url = `${origin}${STORE_PUBLIC_BASE}/${userId}/${category.id}`;
    void navigator.clipboard.writeText(url).then(() => {
      toast.success("Đã sao chép liên kết danh mục");
    });
  };

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const categoryActionClass =
    "inline-flex min-h-11 min-w-11 touch-manipulation items-center justify-center rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-brand-600 dark:hover:bg-gray-800 lg:min-h-0 lg:min-w-0 lg:p-1.5";

  return (
    <>
      {/* Mobile: cuộn ngang danh mục + thanh thao tác */}
      <div className="w-full min-w-0 lg:hidden">
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-2.5 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">
            Danh mục
          </h3>
          <button
            type="button"
            onClick={onCreateCategory}
            className="min-h-11 touch-manipulation rounded-lg bg-brand-500 px-4 py-2 text-xs font-medium text-white transition hover:bg-brand-600"
          >
            + Tạo
          </button>
        </div>

        {categories.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-gray-200 px-3 py-6 text-center text-sm text-gray-500 dark:border-gray-700">
            Chưa có danh mục. Tạo danh mục đầu tiên để bắt đầu bán hàng.
          </p>
        ) : (
          <div className="custom-scrollbar mt-2 flex gap-2 overflow-x-auto overscroll-x-contain pb-1 [-webkit-overflow-scrolling:touch]">
            {categories.map((category) => {
              const isActive = selectedCategoryId === category.id;
              const isPublished = category.status === 1;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => router.push(`/shop/categories/${category.id}`)}
                  className={`flex shrink-0 touch-manipulation snap-start items-center gap-2 rounded-xl border px-3 py-2.5 transition ${
                    isActive
                      ? "border-brand-200 bg-brand-50 dark:border-brand-800 dark:bg-brand-500/10"
                      : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900"
                  }`}
                >
                  <ShopCategoryAvatar category={category} size="sm" />
                  <span className="max-w-[8.5rem] truncate text-sm font-medium text-gray-800 dark:text-white/90">
                    {category.name}
                  </span>
                  <Badge size="sm" color={isPublished ? "success" : "warning"}>
                    {isPublished ? "Hiện" : "Chờ duyệt"}
                  </Badge>
                </button>
              );
            })}
          </div>
        )}

        {selectedCategory ? (
          <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl border border-gray-100 bg-gray-50/80 p-2 dark:border-gray-800 dark:bg-gray-800/40">
            <span className="min-w-0 flex-1 truncate px-1 text-xs font-medium text-gray-600 dark:text-gray-400">
              {selectedCategory.name}
              {selectedCategory.creator_name
                ? ` · ${selectedCategory.creator_name}`
                : ""}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <AdminIconButton
                label="Sao chép link"
                onClick={() => copyLink(selectedCategory)}
                className={categoryActionClass}
              >
                <LinkIcon />
              </AdminIconButton>
              <AdminIconButton
                label="Sửa tên"
                onClick={() => onEditCategory(selectedCategory)}
                className={categoryActionClass}
              >
                <EditIcon />
              </AdminIconButton>
              {isManager ? (
                <AdminIconButton
                  label={
                    selectedCategory.status === 1
                      ? "Ẩn danh mục"
                      : selectedCategory.creator_name
                        ? `Duyệt danh mục do ${selectedCategory.creator_name} tạo/sửa`
                        : "Duyệt / hiện danh mục"
                  }
                  onClick={() =>
                    toggleCategoryStatus(
                      selectedCategory,
                      selectedCategory.status !== 1,
                    )
                  }
                  className={categoryActionClass}
                >
                  {selectedCategory.status === 1 ? (
                    <EyeOffIcon />
                  ) : (
                    <EyeIcon />
                  )}
                </AdminIconButton>
              ) : null}
              {canDeleteCategory(selectedCategory, {
                isManager,
                username: authUser?.username,
              }) ? (
                <AdminIconButton
                  label={
                    selectedCategory.status === 1
                      ? "Xóa"
                      : "Xóa (chờ duyệt)"
                  }
                  onClick={() => onDeleteCategory(selectedCategory)}
                  className={`${categoryActionClass} hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-500/10`}
                >
                  <TrashIcon />
                </AdminIconButton>
              ) : null}
            </div>
          </div>
        ) : null}

        {domain ? (
          <Link
            href={`${STORE_PUBLIC_BASE}/${userId}`}
            target="_blank"
            className="mt-2 flex min-h-11 touch-manipulation items-center justify-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2.5 text-xs font-medium text-brand-700 transition hover:bg-brand-100 dark:border-brand-800 dark:bg-brand-500/10 dark:text-brand-300"
          >
            <ExternalIcon />
            Xem cửa hàng
          </Link>
        ) : null}
      </div>

      {/* Desktop: sidebar dọc */}
      <aside className="hidden w-full shrink-0 flex-col rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 lg:flex lg:w-72 xl:w-80">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">
            Danh mục
          </h3>
          <button
            type="button"
            onClick={onCreateCategory}
            className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-brand-600"
          >
            + Tạo
          </button>
        </div>

        <nav className="custom-scrollbar flex max-h-[calc(100vh-16rem)] flex-col gap-1 overflow-y-auto overscroll-contain p-2">
          {categories.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-gray-500">
              Chưa có danh mục. Tạo danh mục đầu tiên để bắt đầu bán hàng.
            </p>
          ) : (
            categories.map((category) => {
              const isActive = selectedCategoryId === category.id;
              const isPublished = category.status === 1;
              return (
                <div
                  key={category.id}
                  className={`group rounded-xl border transition ${
                    isActive
                      ? "border-brand-200 bg-brand-50 dark:border-brand-800 dark:bg-brand-500/10"
                      : "border-transparent hover:border-gray-200 hover:bg-gray-50 dark:hover:border-gray-700 dark:hover:bg-white/[0.03]"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      router.push(`/shop/categories/${category.id}`)
                    }
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
                  >
                    <ShopCategoryAvatar category={category} />
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-gray-800 dark:text-white/90">
                        {category.name}
                      </span>
                      {category.creator_name ? (
                        <span className="block truncate text-[11px] text-gray-400">
                          {category.creator_name}
                        </span>
                      ) : null}
                    </div>
                    <Badge size="sm" color={isPublished ? "success" : "warning"}>
                      {isPublished ? "Hiện" : "Chờ duyệt"}
                    </Badge>
                  </button>
                  <div className="flex items-center gap-2 px-2 pb-2 opacity-100 transition lg:gap-1 lg:opacity-0 lg:group-hover:opacity-100">
                    <AdminIconButton
                      label="Sao chép link"
                      side="top"
                      onClick={() => copyLink(category)}
                      className={categoryActionClass}
                    >
                      <LinkIcon />
                    </AdminIconButton>
                    <AdminIconButton
                      label="Sửa tên"
                      onClick={() => onEditCategory(category)}
                      className={categoryActionClass}
                    >
                      <EditIcon />
                    </AdminIconButton>
                    {isManager ? (
                      <AdminIconButton
                        label={
                          isPublished
                            ? "Ẩn danh mục"
                            : category.creator_name
                              ? `Duyệt do ${category.creator_name}`
                              : "Duyệt / hiện danh mục"
                        }
                        onClick={() =>
                          toggleCategoryStatus(category, !isPublished)
                        }
                        className={categoryActionClass}
                      >
                        {isPublished ? <EyeOffIcon /> : <EyeIcon />}
                      </AdminIconButton>
                    ) : null}
                    {canDeleteCategory(category, {
                      isManager,
                      username: authUser?.username,
                    }) ? (
                      <AdminIconButton
                        label={isPublished ? "Xóa" : "Xóa (chờ duyệt)"}
                        side="left"
                        onClick={() => onDeleteCategory(category)}
                        className={`${categoryActionClass} hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-500/10`}
                      >
                        <TrashIcon />
                      </AdminIconButton>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </nav>

        {domain ? (
          <div className="border-t border-gray-100 p-3 dark:border-gray-800">
            <Link
              href={`${STORE_PUBLIC_BASE}/${userId}`}
              target="_blank"
              className="flex items-center justify-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-medium text-brand-700 transition hover:bg-brand-100 dark:border-brand-800 dark:bg-brand-500/10 dark:text-brand-300"
            >
              <ExternalIcon />
              Xem cửa hàng
            </Link>
          </div>
        ) : null}
      </aside>
    </>
  );
}

function ShopCategoryAvatar({
  category,
  size = "md",
}: {
  category: ShopCategory;
  size?: "sm" | "md";
}) {
  const imageSrc = category.avt ? shopImageUrl(category.avt) : null;
  const initial = category.name.trim().charAt(0).toUpperCase() || "?";
  const boxClass = size === "sm" ? "h-8 w-8 rounded-lg text-xs" : "h-10 w-10 rounded-xl text-sm";

  if (imageSrc) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden bg-gray-100 ring-1 ring-gray-200/80 dark:bg-gray-800 dark:ring-gray-700 ${boxClass}`}
      >
        <Image
          src={imageSrc}
          alt={category.name}
          fill
          className="object-cover"
          sizes={size === "sm" ? "32px" : "40px"}
          unoptimized
        />
      </div>
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center bg-brand-50 font-semibold text-brand-600 ring-1 ring-brand-100 dark:bg-brand-500/15 dark:text-brand-300 dark:ring-brand-500/20 ${boxClass}`}
    >
      {initial}
    </div>
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

function EditIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
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
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
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

function ExternalIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}