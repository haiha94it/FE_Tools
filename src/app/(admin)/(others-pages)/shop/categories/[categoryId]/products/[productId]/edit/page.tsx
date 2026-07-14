import ShopProductFormPage from "@/components/shop-admin/ShopProductFormPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sửa sản phẩm | Zalo Admin",
  description: "Chỉnh sửa sản phẩm cửa hàng",
};

interface PageProps {
  params: Promise<{ categoryId: string; productId: string }>;
}

export default async function EditShopProductPage({ params }: PageProps) {
  const { categoryId, productId } = await params;
  return (
    <ShopProductFormPage
      categoryId={Number(categoryId)}
      productId={Number(productId)}
      pageTitle="Sửa sản phẩm"
    />
  );
}