import ShopProductFormPage from "@/components/shop-admin/ShopProductFormPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Thêm sản phẩm | Zalo Admin",
  description: "Tạo sản phẩm mới cho cửa hàng",
};

interface PageProps {
  params: Promise<{ categoryId: string }>;
}

export default async function NewShopProductPage({ params }: PageProps) {
  const { categoryId } = await params;
  return (
    <ShopProductFormPage
      categoryId={Number(categoryId)}
      pageTitle="Thêm sản phẩm"
    />
  );
}