import { APP_NAME, LEGAL_BRAND_NAME } from "@/constants/brand";

/** URL gốc site */
export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  return "https://tools.dahangsi.com";
}

export const SITE_NAME = APP_NAME;
export const SITE_TAGLINE = "Máy tính online cho người làm nghề";
export const DEFAULT_DESCRIPTION =
  "Công Cụ Nghề — máy tính online cho người làm nghề. Tính nhanh, vào là dùng.";

export const DEFAULT_KEYWORDS = [
  "công cụ",
  "calculator",
  "đa ngành nghề",
  APP_NAME,
  LEGAL_BRAND_NAME,
] as const;

export const PUBLIC_ROUTES = [
  { path: "/", changeFrequency: "weekly" as const, priority: 1 },
  { path: "/dieu-khoan", changeFrequency: "yearly" as const, priority: 0.3 },
];

export const ROBOTS_DISALLOW = [
  "/dashboard",
  "/users",
  "/settings",
  "/login",
  "/signin",
  "/django-admin",
  "/api",
] as const;
