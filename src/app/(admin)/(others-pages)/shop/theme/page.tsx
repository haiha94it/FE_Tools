import ShopThemeSettings from "@/components/shop-admin/ShopThemeSettings";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Theme cửa hàng | Zalo Admin",
  description: "Chọn template, màu sắc và layout cá nhân hóa storefront",
};

export default function ShopThemePage() {
  return <ShopThemeSettings />;
}
