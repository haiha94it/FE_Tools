import { GuestGuard } from "@/components/auth/GuestGuard";
import SignUpForm from "@/components/auth/SignUpForm";
import { createPublicMetadata } from "@/lib/seo/metadata";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = createPublicMetadata({
  title: "Đăng ký",
  description:
    "Đăng ký tài khoản CSKH miễn phí — bắt đầu quản lý Zalo, chat khách hàng và chạy chiến dịch marketing ngay hôm nay.",
  path: "/signup",
  keywords: [
    "đăng ký CSKH",
    "tạo tài khoản Zalo",
    "dùng thử Zalo marketing",
    "phần mềm Zalo miễn phí",
  ],
});

function SignUpFallback() {
  return (
    <div className="flex min-h-[50vh] flex-1 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
    </div>
  );
}

export default function SignUpPage() {
  return (
    <GuestGuard>
      <Suspense fallback={<SignUpFallback />}>
        <SignUpForm />
      </Suspense>
    </GuestGuard>
  );
}