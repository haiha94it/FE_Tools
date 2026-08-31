import { GuestGuard } from "@/components/auth/GuestGuard";
import SignUpForm from "@/components/auth/SignUpForm";
import { ADMIN_ROBOTS, createPublicMetadata } from "@/lib/seo/metadata";
import type { Metadata } from "next";

export const metadata: Metadata = {
  ...createPublicMetadata({
    title: "Đăng ký Đại lý",
    description: "Đăng ký trở thành Đại lý phân phối bản quyền GGMaps — Công Cụ Nghề",
    path: "/signup",
  }),
  robots: ADMIN_ROBOTS,
};

export default function SignUpPage() {
  return (
    <GuestGuard>
      <SignUpForm />
    </GuestGuard>
  );
}
