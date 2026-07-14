import ShopAdminView from "@/components/shop-admin";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cửa hàng | Zalo Admin",
  description: "Quản lý danh mục, sản phẩm và cài đặt cửa hàng trực tuyến",
};

export default function ShopPage() {
  return <ShopAdminView />;
}