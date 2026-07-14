import AdminSettingsView from "@/components/admin-settings";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cài đặt hệ thống | Zalo Admin",
  description:
    "Quản lý thông báo, logo, popup đăng ký, hết hạn và nội dung hệ thống — đồng bộ ZaloCN /setting",
};

export default function AdminSettingsPage() {
  return <AdminSettingsView />;
}