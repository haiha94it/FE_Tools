import LandingJsonLd from "@/components/landing/LandingJsonLd";
import LandingPage from "@/components/landing/LandingPage";
import { APP_NAME } from "@/constants/brand";
import { createPublicMetadata } from "@/lib/seo/metadata";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "@/styles/landing-theme.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "vietnamese"],
  display: "swap",
  variable: "--font-plus-jakarta",
});

export const metadata: Metadata = createPublicMetadata({
  title: `${APP_NAME} — Quản trị Zalo thông minh`,
  description:
    "Nền tảng quản lý tài khoản Zalo, tin nhắn realtime, chiến dịch marketing và cửa hàng online cho doanh nghiệp. Vận hành sale & marketing trên một bảng điều khiển.",
  path: "/",
  absoluteTitle: true,
  keywords: [
    "quản trị Zalo",
    "phần mềm Zalo",
    "Zalo marketing",
    "chat Zalo doanh nghiệp",
    "CAREVIPPRO",
    "bán hàng Zalo",
  ],
});

export default function PublicHomePage() {
  return (
    <>
      <LandingJsonLd />
      <div className={`${plusJakarta.className} landing-page min-h-dvh antialiased`}>
        <LandingPage />
      </div>
    </>
  );
}