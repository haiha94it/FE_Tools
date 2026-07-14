import AdminUsersView from "@/components/admin-users";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quản lý người dùng | Zalo Admin",
  description: "Quản lý tài khoản người dùng hệ thống — phân quyền, giới hạn và trạng thái",
};

export default function AdminUsersPage() {
  return <AdminUsersView />;
}