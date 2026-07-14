import EmailActivationView from "@/components/auth/EmailActivationView";
import {
  createPublicMetadata,
  NOINDEX_ROBOTS,
} from "@/lib/seo/metadata";
import type { Metadata } from "next";

export const metadata: Metadata = createPublicMetadata({
  title: "Xác nhận email",
  description:
    "Kích hoạt tài khoản CAREVIPPRO qua liên kết xác nhận email sau đăng ký.",
  path: "/token",
  robots: NOINDEX_ROBOTS,
});

export default function EmailActivationPage() {
  return <EmailActivationView />;
}