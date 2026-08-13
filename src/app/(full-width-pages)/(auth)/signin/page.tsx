import { GuestGuard } from "@/components/auth/GuestGuard";
import SignInForm from "@/components/auth/SignInForm";
import { createPublicMetadata } from "@/lib/seo/metadata";
import type { Metadata } from "next";

export const metadata: Metadata = createPublicMetadata({
  title: "Đăng nhập",
  description: "Đăng nhập quản trị Công cụ xanh",
  path: "/signin",
});

export default function SignInPage() {
  return (
    <GuestGuard>
      <SignInForm />
    </GuestGuard>
  );
}
