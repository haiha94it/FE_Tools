import { GuestGuard } from "@/components/auth/GuestGuard";
import SignInForm from "@/components/auth/SignInForm";
import { ADMIN_ROBOTS, createPublicMetadata } from "@/lib/seo/metadata";
import type { Metadata } from "next";

export const metadata: Metadata = {
  ...createPublicMetadata({ title: "Đăng nhập", description: "Đăng nhập quản trị Công Cụ Nghề", path: "/login" }),
  robots: ADMIN_ROBOTS,
};

/** Trang đăng nhập riêng, chỉ truy cập trực tiếp tại /login. */
export default function LoginPage() {
  return <GuestGuard><SignInForm /></GuestGuard>;
}
