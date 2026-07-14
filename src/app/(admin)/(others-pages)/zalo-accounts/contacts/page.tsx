import ZaloContactsView from "@/components/zalo-contacts";
import { pageTitle } from "@/constants/brand";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: pageTitle("Quản lý Bạn bè / Nhóm"),
  description: "Quản lý bạn bè và nhóm Zalo theo tài khoản đã kết nối.",
};

export default function ZaloAccountsContactsPage() {
  return (
    <Suspense fallback={null}>
      <ZaloContactsView />
    </Suspense>
  );
}