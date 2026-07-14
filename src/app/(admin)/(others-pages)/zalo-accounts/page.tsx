import ZaloAccountsView from "@/components/zalo-accounts";
import { pageTitle } from "@/constants/brand";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: pageTitle("Quản lý tài khoản Zalo"),
  description: "Quản lý tài khoản Zalo đã kết nối — thêm, kiểm tra, sửa, xóa.",
};

export default function ZaloAccountsPage() {
  return <ZaloAccountsView />;
}