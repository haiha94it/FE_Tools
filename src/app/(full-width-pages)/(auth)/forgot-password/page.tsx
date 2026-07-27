import { GuestGuard } from "@/components/auth/GuestGuard";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import { createPublicMetadata, NOINDEX_ROBOTS } from "@/lib/seo/metadata";
import type { Metadata } from "next";

export const metadata: Metadata = createPublicMetadata({
  title: "Quên mật khẩu",
  description: "Khôi phục mật khẩu tài khoản CSKH của bạn.",
  path: "/forgot-password",
  robots: NOINDEX_ROBOTS,
});

export default function ForgotPasswordPage() {
  return (
    <GuestGuard>
      <ForgotPasswordForm />
    </GuestGuard>
  );
}