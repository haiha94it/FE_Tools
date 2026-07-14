import ShopAdminView from "@/components/shop-admin";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sản phẩm cửa hàng | Zalo Admin",
  description: "Quản lý sản phẩm theo danh mục",
};

interface PageProps {
  params: Promise<{ categoryId: string }>;
}

export default async function ShopCategoryPage({ params }: PageProps) {
  const { categoryId } = await params;
  return <ShopAdminView categoryId={Number(categoryId)} />;
}