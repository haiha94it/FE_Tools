import { APP_NAME, LEGAL_BRAND_NAME } from "@/constants/brand";

/** URL gốc site */
export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  return "https://tools.dahangsi.com";
}

export const SITE_NAME = APP_NAME;
export const SITE_TAGLINE = "Công cụ tính toán & hỗ trợ đa ngành nghề";
export const DEFAULT_DESCRIPTION =
  "Công cụ xanh — nền tảng công cụ tính toán và hỗ trợ đa ngành nghề.";

export const DEFAULT_KEYWORDS = [
  "công cụ",
  "calculator",
  "đa ngành nghề",
  APP_NAME,
  LEGAL_BRAND_NAME,
] as const;

export const PUBLIC_ROUTES = [
  { path: "/", changeFrequency: "weekly" as const, priority: 1 },
  { path: "/signin", changeFrequency: "monthly" as const, priority: 0.5 },
  { path: "/dieu-khoan", changeFrequency: "yearly" as const, priority: 0.3 },
];

export const ROBOTS_DISALLOW = [
  "/dashboard",
  "/users",
  "/settings",
  "/signin",
  "/django-admin",
  "/api",
] as const;
