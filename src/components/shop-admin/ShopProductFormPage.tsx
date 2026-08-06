"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ShopProductForm from "@/components/shop-admin/ShopProductForm";
import { useAuthStore } from "@/stores/use-auth-store";
import { useZaloShopAdminStore } from "@/stores/use-zalo-shop-admin-store";
import { useEffect, useMemo } from "react";

interface ShopProductFormPageProps {
  categoryId: number;
  productId?: number;
  pageTitle: string;
}

export default function ShopProductFormPage({
  categoryId,
  productId,
  pageTitle,
}: ShopProductFormPageProps) {
  const userId = useAuthStore((s) => s.user?.id ?? "");
  const categories = useZaloShopAdminStore((s) => s.categories);
  const loadCategories = useZaloShopAdminStore((s) => s.loadCategories);

  useEffect(() => {
    if (!userId) return;
    if (categories.some((c) => c.id === categoryId)) return;
    void loadCategories(userId);
  }, [userId, categoryId, categories, loadCategories]);

  const categoryName = useMemo(() => {
    return categories.find((c) => c.id === categoryId)?.name?.trim() || "";
  }, [categories, categoryId]);

  return (
    <div className="w-full min-w-0">
      <PageBreadcrumb
        pageTitle={pageTitle}
        backHref={`/shop/categories/${categoryId}`}
        backLabel="Quay lại"
        parents={[
          { label: "Cửa hàng", href: "/shop" },
          {
            label: categoryName || "Danh mục",
            href: `/shop/categories/${categoryId}`,
          },
        ]}
      />
      <div className="mt-4">
        <ShopProductForm
          categoryId={categoryId}
          categoryName={categoryName}
          productId={productId}
        />
      </div>
    </div>
  );
}