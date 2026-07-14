import ZaloProxiesView from "@/components/zalo-proxies";
import { pageTitle } from "@/constants/brand";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: pageTitle("Quản lý Proxy"),
  description: "Quản lý proxy Zalo — thêm, kiểm tra, sửa, xóa.",
};

export default function ZaloAccountsProxyPage() {
  return <ZaloProxiesView />;
}