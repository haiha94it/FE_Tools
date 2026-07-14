import ShopOrdersView from "@/components/shop-admin/ShopOrdersView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Đơn hàng cửa hàng | Zalo Admin",
  description: "Quản lý đơn hàng từ cửa hàng trực tuyến",
};

export default function ShopOrdersPage() {
  return <ShopOrdersView />;
}