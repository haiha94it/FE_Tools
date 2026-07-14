import { APP_NAME, LEGAL_BRAND_NAME } from "@/constants/brand";

/** URL gốc site — bắt buộc set NEXT_PUBLIC_SITE_URL trên production */
export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

export const SITE_NAME = APP_NAME;

export const SITE_TAGLINE = "Quản trị Zalo thông minh cho doanh nghiệp";

export const DEFAULT_DESCRIPTION =
  "CAREVIPPRO — nền tảng quản lý tài khoản Zalo, tin nhắn realtime, chiến dịch marketing tự động và cửa hàng online. Vận hành sale & marketing trên một bảng điều khiển.";

export const DEFAULT_KEYWORDS = [
  "CAREVIPPRO",
  "quản trị Zalo",
  "Zalo marketing",
  "tin nhắn Zalo",
  "Zalo OA",
  "bán hàng Zalo",
  "chiến dịch Zalo",
  "quản lý tài khoản Zalo",
  "chat Zalo",
  "phần mềm Zalo",
  LEGAL_BRAND_NAME,
] as const;

export const OG_IMAGE = {
  url: "/images/logo/logo.png",
  width: 300,
  height: 80,
  alt: `${APP_NAME} — ${SITE_TAGLINE}`,
} as const;

/** Trang công khai — đưa vào sitemap */
export const PUBLIC_ROUTES = [
  { path: "/", changeFrequency: "weekly" as const, priority: 1 },
  { path: "/signup", changeFrequency: "monthly" as const, priority: 0.9 },
  { path: "/signin", changeFrequency: "monthly" as const, priority: 0.8 },
  { path: "/dieu-khoan", changeFrequency: "yearly" as const, priority: 0.5 },
] as const;

/** Đường dẫn không index (robots.txt) */
export const ROBOTS_DISALLOW = [
  "/zalo-messages",
  "/zalo-messenger",
  "/zalo-accounts",
  "/zalo-campaigns",
  "/shop",
  "/admin",
  "/resource",
  "/guides",
  "/profile",
  "/calendar",
  "/forgot-password",
  "/next-api",
] as const;