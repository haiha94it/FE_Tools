import { GuestGuard } from "@/components/auth/GuestGuard";
import SignInForm from "@/components/auth/SignInForm";
import { createPublicMetadata } from "@/lib/seo/metadata";
import type { Metadata } from "next";

export const metadata: Metadata = createPublicMetadata({
  title: "Đăng nhập",
  description:
    "Đăng nhập CSKH để quản lý tài khoản Zalo, tin nhắn, chiến dịch marketing và cửa hàng online.",
  path: "/signin",
  keywords: ["đăng nhập CSKH", "login Zalo admin", "quản trị Zalo"],
});

export default function SignInPage() {
  return (
    <GuestGuard>
      <SignInForm />
    </GuestGuard>
  );
}