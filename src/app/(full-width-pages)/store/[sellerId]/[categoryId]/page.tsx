import CategoryProductsView from "@/components/storefront/CategoryProductsView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Danh mục sản phẩm",
  description: "Khám phá sản phẩm theo danh mục",
};

interface PageProps {
  params: Promise<{ sellerId: string; categoryId: string }>;
}

/** Canonical: /store/{seller}/{category} */
export default async function StoreCategoryShortPage({ params }: PageProps) {
  const { sellerId, categoryId } = await params;
  return (
    <CategoryProductsView
      sellerId={sellerId}
      categoryId={Number(categoryId)}
    />
  );
}
