"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { adminDataPanelClass } from "@/components/ui/table/ScrollableTableContainer";
import { Modal } from "@/components/ui/modal";
import ShopCategorySidebar from "@/components/shop-admin/ShopCategorySidebar";
import ShopCoverSettingsModal from "@/components/shop-admin/ShopCoverSettingsModal";
import ShopProductGrid from "@/components/shop-admin/ShopProductGrid";
import { toast } from "@/lib/toast";
import { useAuthStore } from "@/stores/use-auth-store";
import { useZaloShopAdminStore } from "@/stores/use-zalo-shop-admin-store";
import type { ShopCategory } from "@/types/zalo-shop";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface ShopAdminViewProps {
  categoryId?: number;
}

export default function ShopAdminView({ categoryId }: ShopAdminViewProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const userId = user?.id ?? "";

  const domain = useZaloShopAdminStore((s) => s.domain);
  const cover = useZaloShopAdminStore((s) => s.cover);
  const categories = useZaloShopAdminStore((s) => s.categories);
  const loadDomain = useZaloShopAdminStore((s) => s.loadDomain);
  const loadCategories = useZaloShopAdminStore((s) => s.loadCategories);
  const loadCover = useZaloShopAdminStore((s) => s.loadCover);
  const loadProducts = useZaloShopAdminStore((s) => s.loadProducts);
  const createCategory = useZaloShopAdminStore((s) => s.createCategory);
  const deleteCategory = useZaloShopAdminStore((s) => s.deleteCategory);
  const setSelectedCategoryId = useZaloShopAdminStore((s) => s.setSelectedCategoryId);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [domainAlertOpen, setDomainAlertOpen] = useState(false);
  const [categoryPrompt, setCategoryPrompt] = useState<{
    mode: "create" | "edit";
    category?: ShopCategory;
  } | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const loadedRef = useRef("");

  useEffect(() => {
    if (!userId) return;
    const key = `${userId}`;
    if (loadedRef.current === key) return;
    loadedRef.current = key;
    void loadDomain();
    void loadCategories(userId);
    void loadCover(userId);
  }, [userId, loadDomain, loadCategories, loadCover]);

  useEffect(() => {
    if (domain === null) return;
    if (!domain) setDomainAlertOpen(true);
  }, [domain]);

  useEffect(() => {
    if (!userId || !categoryId) return;
    setSelectedCategoryId(categoryId);
    void loadProducts(userId, categoryId);
  }, [userId, categoryId, loadProducts, setSelectedCategoryId]);

  const activeCategory = categories.find((c) => c.id === categoryId);

  const handleSaveCategory = async () => {
    if (!categoryName.trim() || !userId) return;
    if (categoryPrompt?.mode === "edit" && categoryPrompt.category) {
      await createCategory({
        id_user: userId,
        id_category: categoryPrompt.category.id,
        name: categoryName.trim(),
      });
      toast.success("Đã cập nhật danh mục");
    } else {
      await createCategory({
        id_user: userId,
        name: categoryName.trim(),
      });
      toast.success("Đã tạo danh mục");
    }
    setCategoryPrompt(null);
    setCategoryName("");
  };

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden">
      <PageBreadcrumb
        pageTitle="Cửa hàng"
        parents={
          categoryId && activeCategory
            ? [{ label: "Cửa hàng", href: "/shop" }, { label: activeCategory.name }]
            : undefined
        }
      />

      <div className={`${adminDataPanelClass} flex min-h-0 flex-1 flex-col gap-4`}>
        <div className="flex flex-col gap-3 border-b border-gray-100 pb-4 sm:flex-row sm:items-start sm:justify-between dark:border-gray-800">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-gray-800 dark:text-white/90">
              {cover?.name || "Mini Shop"}
            </h2>
            <p className="text-sm text-gray-500">
              Quản lý danh mục, sản phẩm và liên kết bán hàng
            </p>
          </div>
          <div className="grid w-full shrink-0 grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="min-h-11 touch-manipulation rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:min-h-0"
            >
              Cài đặt shop
            </button>
            <Link
              href="/shop/orders"
              className="inline-flex min-h-11 touch-manipulation items-center justify-center rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:min-h-0"
            >
              Đơn hàng
            </Link>
            {categoryId ? (
              <Link
                href={`/shop/categories/${categoryId}/products/new`}
                className="col-span-2 inline-flex min-h-11 touch-manipulation items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600 sm:col-span-1 sm:min-h-0"
              >
                + Thêm sản phẩm
              </Link>
            ) : null}
          </div>
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain lg:flex-row lg:overflow-hidden">
          <ShopCategorySidebar
            userId={userId}
            selectedCategoryId={categoryId ?? null}
            domain={domain}
            onCreateCategory={() => {
              setCategoryPrompt({ mode: "create" });
              setCategoryName("");
            }}
            onEditCategory={(category) => {
              setCategoryPrompt({ mode: "edit", category });
              setCategoryName(category.name);
            }}
            onDeleteCategory={(category) => {
              if (window.confirm(`Xóa danh mục "${category.name}"?`)) {
                void deleteCategory(userId, category.id).then(() => {
                  toast.success("Đã xóa danh mục");
                  router.push("/shop");
                });
              }
            }}
          />

          <div className="flex min-w-0 flex-1 flex-col">
            {categoryId ? (
              <ShopProductGrid
                userId={userId}
                categoryId={categoryId}
                domain={domain}
              />
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 px-4 py-16 text-center dark:border-gray-700 dark:bg-gray-900/50 sm:py-20">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  <span className="lg:hidden">Chọn danh mục phía trên để quản lý sản phẩm</span>
                  <span className="hidden lg:inline">Chọn danh mục bên trái để quản lý sản phẩm</span>
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Hoặc tạo danh mục mới để bắt đầu
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <ShopCoverSettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        userId={userId}
      />

      <Modal
        isOpen={Boolean(categoryPrompt)}
        onClose={() => setCategoryPrompt(null)}
        layer="top"
        className="max-w-md p-5 sm:p-6"
      >
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          {categoryPrompt?.mode === "edit" ? "Sửa danh mục" : "Tạo danh mục"}
        </h4>
        <input
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
          placeholder="Tên danh mục"
          className="mt-4 h-11 w-full rounded-lg border border-gray-300 px-4 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          autoFocus
        />
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setCategoryPrompt(null)}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm dark:border-gray-700"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={() => void handleSaveCategory()}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            Lưu
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={domainAlertOpen}
        onClose={() => setDomainAlertOpen(false)}
        layer="top"
        showCloseButton={false}
        className="max-w-lg p-5 sm:p-6"
      >
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Cần cấu hình tên miền
        </h4>
        <p className="mt-2 text-sm text-gray-500">
          Vui lòng cập nhật tên miền để sử dụng đầy đủ chức năng cửa hàng và chia sẻ link bán hàng.
        </p>
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={() => setDomainAlertOpen(false)}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            Đã hiểu
          </button>
        </div>
      </Modal>
    </div>
  );
}