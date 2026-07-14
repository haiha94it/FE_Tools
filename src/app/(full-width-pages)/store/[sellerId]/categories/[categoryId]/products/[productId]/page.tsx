import ProductDetailView from "@/components/storefront/ProductDetailView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chi tiết sản phẩm",
  description: "Xem chi tiết và đặt hàng sản phẩm",
};

interface PageProps {
  params: Promise<{
    sellerId: string;
    categoryId: string;
    productId: string;
  }>;
}

export default async function StoreProductPage({ params }: PageProps) {
  const { sellerId, categoryId, productId } = await params;
  return (
    <ProductDetailView
      sellerId={sellerId}
      categoryId={Number(categoryId)}
      productId={Number(productId)}
    />
  );
}