import AccountInfoView from "@/components/account/AccountInfoView";
import { createAdminMetadata } from "@/lib/seo/metadata";
import type { Metadata } from "next";

export const metadata: Metadata = createAdminMetadata(
  "Trang thông tin",
  "Thông tin tài khoản và cài đặt bảo mật CSKH",
);

export default function MePage() {
  return <AccountInfoView />;
}