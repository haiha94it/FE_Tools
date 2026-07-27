import LandingJsonLd from "@/components/landing/LandingJsonLd";
import LandingPage from "@/components/landing/LandingPage";
import { APP_NAME } from "@/constants/brand";
import { createPublicMetadata } from "@/lib/seo/metadata";
import type { Metadata } from "next";
import "@/styles/landing-theme.css";

export const metadata: Metadata = createPublicMetadata({
  title: `${APP_NAME} — Quản trị Zalo thông minh`,
  description:
    "Quản lý Zalo thông minh. Tích hợp AI tự động hóa chiến dịch marketing cho doanh nghiệp. Vận hành quản lý sale & marketing trên một giao diện thân thiện",
  path: "/",
  absoluteTitle: true,
  keywords: [
    "quản trị Zalo",
    "phần mềm Zalo",
    "Zalo marketing",
    "chat Zalo doanh nghiệp",
    "CSKH",
    "bán hàng Zalo",
  ],
});

export default function PublicHomePage() {
  return (
    <>
      <LandingJsonLd />
      <div className="landing-page min-h-dvh antialiased">
        <LandingPage />
      </div>
    </>
  );
}
