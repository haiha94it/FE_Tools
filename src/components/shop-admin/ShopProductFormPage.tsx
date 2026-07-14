"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ShopProductForm from "@/components/shop-admin/ShopProductForm";

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
  return (
    <div className="w-full min-w-0">
      <PageBreadcrumb
        pageTitle={pageTitle}
        parents={[
          { label: "Cửa hàng", href: "/shop" },
          { label: "Danh mục", href: `/shop/categories/${categoryId}` },
        ]}
      />
      <div className="mt-4">
        <ShopProductForm categoryId={categoryId} productId={productId} />
      </div>
    </div>
  );
}