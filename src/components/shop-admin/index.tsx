"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { adminDataPanelClass } from "@/components/ui/table/ScrollableTableContainer";
import { Modal } from "@/components/ui/modal";
import ShopCategorySidebar from "@/components/shop-admin/ShopCategorySidebar";
import ShopCoverSettingsModal from "@/components/shop-admin/ShopCoverSettingsModal";
import ShopDomainSettingsModal from "@/components/shop-admin/ShopDomainSettingsModal";
import ShopProductGrid from "@/components/shop-admin/ShopProductGrid";
import { buildPublicStorefrontAbsoluteUrl } from "@/lib/shop-utils";
import { toast } from "@/lib/toast";
import { zaloShopService } from "@/services/zalo-shop.service";
import { useAuthStore } from "@/stores/use-auth-store";
import { useZaloShopAdminStore } from "@/stores/use-zalo-shop-admin-store";
import type { ShopCategory } from "@/types/zalo-shop";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

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
  const [domainModalOpen, setDomainModalOpen] = useState(false);
  const [domainAlertOpen, setDomainAlertOpen] = useState(false);
  const [categoryPrompt, setCategoryPrompt] = useState<{
    mode: "create" | "edit";
    category?: ShopCategory;
  } | null>(null);
  const [categoryName, setCategoryName] = useState("");
  /** null = đang check; true = chưa có địa giới → hiện nút load; false = ẩn */
  const [showLoadGeo, setShowLoadGeo] = useState<boolean | null>(null);
  const [loadingGeo, setLoadingGeo] = useState(false);
  const loadedRef = useRef("");
  const domainAlertShownRef = useRef(false);

  useEffect(() => {
    if (!userId) return;
    const key = `${userId}`;
    if (loadedRef.current === key) return;
    loadedRef.current = key;
    void loadDomain();
    void loadCategories(userId);
    void loadCover(userId);
  }, [userId, loadDomain, loadCategories, loadCover]);

  // Ẩn nút nếu DB đã có tỉnh/TP
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const cities = await zaloShopService.listCities();
        if (!cancelled) setShowLoadGeo(cities.length === 0);
      } catch {
        if (!cancelled) setShowLoadGeo(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // null = chưa load xong; "" = chưa cấu hình domain
    if (domain === null) return;
    if (!domain && !domainAlertShownRef.current) {
      domainAlertShownRef.current = true;
      setDomainAlertOpen(true);
    }
  }, [domain]);

  useEffect(() => {
    if (!userId || !categoryId) return;
    setSelectedCategoryId(categoryId);
    void loadProducts(userId, categoryId);
  }, [userId, categoryId, loadProducts, setSelectedCategoryId]);

  const activeCategory = categories.find((c) => c.id === categoryId);

  /**
   * Link public absolute — domain tenant hoặc NEXT_PUBLIC_STOREFRONT_URL.
   * domain === null: đang load → chưa render (tránh dính origin admin).
   */
  const storefrontHref = useMemo(() => {
    if (!userId || domain === null) return null;
    const url = buildPublicStorefrontAbsoluteUrl(userId, domain);
    return url.startsWith("http") ? url : null;
  }, [userId, domain]);

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

  const handleLoadGeo = async () => {
    setLoadingGeo(true);
    try {
      const result = await zaloShopService.loadCityData();
      const cities = result.cities_count ?? 0;
      const wards = result.wards_count ?? 0;
      toast.success(
        `Đã đồng bộ địa giới: ${cities} tỉnh/TP, ${wards} phường/xã`,
      );
      setShowLoadGeo(false);
    } catch {
      toast.error("Đồng bộ địa giới thất bại. Kiểm tra file JSON trên server.");
    } finally {
      setLoadingGeo(false);
    }
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
        <div className="flex flex-col gap-4 border-b border-gray-100 pb-5 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <h2 className="truncate text-lg font-bold text-gray-900 dark:text-white">
                {cover?.name || "Quản lý Cửa hàng"}
              </h2>
              {domain !== null ? (
                <button
                  type="button"
                  onClick={() => setDomainModalOpen(true)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition ${
                    domain
                      ? "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400"
                      : "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-300"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      domain ? "bg-success-500" : "bg-warning-500"
                    }`}
                  />
                  {domain ? domain : "Chưa gắn tên miền"}
                </button>
              ) : null}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              <span>Quản lý danh mục, sản phẩm & đơn hàng trực tuyến</span>
              {storefrontHref ? (
                <>
                  <span>•</span>
                  <a
                    href={storefrontHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-brand-600 hover:underline dark:text-brand-400"
                  >
                    Xem Storefront ➔
                  </a>
                </>
              ) : null}
            </div>
          </div>
          <div className="grid w-full shrink-0 grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
            <Link
              href="/shop/theme"
              className="inline-flex min-h-10 touch-manipulation items-center justify-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3.5 py-2 text-xs font-semibold text-brand-700 shadow-sm transition hover:bg-brand-100 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300 sm:min-h-0"
            >
              Theme & Template
            </Link>
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="min-h-10 touch-manipulation rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-750 sm:min-h-0"
            >
              Cài đặt Bìa & Logo
            </button>
            <button
              type="button"
              onClick={() => setDomainModalOpen(true)}
              className={`min-h-10 touch-manipulation rounded-lg border px-3.5 py-2 text-xs font-semibold transition shadow-sm sm:min-h-0 ${
                domain
                  ? "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                  : "border-warning-300 bg-warning-50 text-warning-700 hover:bg-warning-100 dark:border-warning-700 dark:bg-warning-500/10 dark:text-warning-300"
              }`}
            >
              Tên miền
            </button>
            {showLoadGeo ? (
              <button
                type="button"
                onClick={() => void handleLoadGeo()}
                disabled={loadingGeo}
                title="Import Vietnam_province_new.json vào DB (chỉ khi chưa có tỉnh)"
                className="min-h-10 touch-manipulation rounded-lg border border-brand-200 bg-brand-50 px-3.5 py-2 text-xs font-semibold text-brand-700 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300 sm:min-h-0"
              >
                {loadingGeo ? "Đang đồng bộ…" : "Đồng bộ địa giới VN"}
              </button>
            ) : null}
            <Link
              href="/shop/orders"
              className="inline-flex min-h-10 touch-manipulation items-center justify-center rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-750 sm:min-h-0"
            >
              Đơn hàng
            </Link>
            {categoryId ? (
              <Link
                href={`/shop/categories/${categoryId}/products/new`}
                className="col-span-2 inline-flex min-h-10 touch-manipulation items-center justify-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-brand-600 sm:col-span-1 sm:min-h-0"
              >
                + Thêm sản phẩm
              </Link>
            ) : null}
          </div>
        </div>

        <div className="custom-scrollbar flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain lg:flex-row lg:overflow-hidden">
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

      <ShopDomainSettingsModal
        isOpen={domainModalOpen}
        onClose={() => setDomainModalOpen(false)}
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
          Vui lòng cập nhật tên miền để dùng đầy đủ chức năng cửa hàng và chia
          sẻ link bán hàng. Bạn có thể setup ngay trong mục Cửa hàng (không cần
          menu riêng).
        </p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => setDomainAlertOpen(false)}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.03]"
          >
            Để sau
          </button>
          <button
            type="button"
            onClick={() => {
              setDomainAlertOpen(false);
              setDomainModalOpen(true);
            }}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            Cấu hình ngay
          </button>
        </div>
      </Modal>
    </div>
  );
}