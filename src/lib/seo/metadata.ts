import {
  DEFAULT_DESCRIPTION,
  DEFAULT_KEYWORDS,
  getSiteUrl,
  OG_IMAGE,
  SITE_NAME,
} from "@/config/seo";
import type { Metadata } from "next";

type CreateMetadataOptions = {
  /** Tiêu đề trang (không kèm suffix — template root layout sẽ thêm | APP_NAME) */
  title: string;
  description?: string;
  /** Đường dẫn canonical, ví dụ `/signin` */
  path?: string;
  /** Tắt canonical (trang lỗi, redirect…) */
  skipCanonical?: boolean;
  keywords?: string[];
  robots?: Metadata["robots"];
  ogType?: "website" | "article";
  /** Trang chủ: dùng title tuyệt đối, không qua template */
  absoluteTitle?: boolean;
};

export const ADMIN_ROBOTS: Metadata["robots"] = {
  index: false,
  follow: false,
  googleBot: { index: false, follow: false },
};

export const NOINDEX_ROBOTS: Metadata["robots"] = {
  index: false,
  follow: true,
  googleBot: { index: false, follow: true },
};

function buildCanonical(path?: string): string {
  const base = getSiteUrl();
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

function buildOpenGraphImages() {
  return [
    {
      url: OG_IMAGE.url,
      width: OG_IMAGE.width,
      height: OG_IMAGE.height,
      alt: OG_IMAGE.alt,
      type: "image/png",
    },
  ];
}

/** Metadata chuẩn cho trang công khai */
export function createPublicMetadata(options: CreateMetadataOptions): Metadata {
  const description = options.description ?? DEFAULT_DESCRIPTION;
  const canonical = buildCanonical(options.path);
  const fullTitle = options.absoluteTitle
    ? options.title
    : options.title;

  const titleField: Metadata["title"] = options.absoluteTitle
    ? { absolute: options.title }
    : options.title;

  return {
    title: titleField,
    description,
    keywords: [...(options.keywords ?? DEFAULT_KEYWORDS)],
    alternates: options.skipCanonical ? undefined : { canonical },
    robots: options.robots ?? {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      title: fullTitle,
      description,
      url: canonical,
      siteName: SITE_NAME,
      locale: "vi_VN",
      type: options.ogType ?? "website",
      images: buildOpenGraphImages(),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [OG_IMAGE.url],
    },
  };
}

/** Metadata mặc định root layout */
export function createRootMetadata(): Metadata {
  const siteUrl = getSiteUrl();

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: `${SITE_NAME} — Quản trị Zalo thông minh`,
      template: `%s | ${SITE_NAME}`,
    },
    description: DEFAULT_DESCRIPTION,
    keywords: [...DEFAULT_KEYWORDS],
    applicationName: SITE_NAME,
    authors: [{ name: SITE_NAME, url: siteUrl }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    alternates: {
      canonical: siteUrl,
    },
    openGraph: {
      type: "website",
      locale: "vi_VN",
      url: siteUrl,
      siteName: SITE_NAME,
      title: `${SITE_NAME} — Quản trị Zalo thông minh`,
      description: DEFAULT_DESCRIPTION,
      images: buildOpenGraphImages(),
    },
    twitter: {
      card: "summary_large_image",
      title: `${SITE_NAME} — Quản trị Zalo thông minh`,
      description: DEFAULT_DESCRIPTION,
      images: [OG_IMAGE.url],
    },
    robots: {
      index: true,
      follow: true,
    },
    icons: {
      icon: [
        { url: "/images/logo/favicon.png", type: "image/png" },
      ],
      apple: "/images/logo/favicon.png",
    },
    category: "technology",
  };
}

/** Metadata cho khu vực admin — noindex mặc định */
export function createAdminMetadata(pageTitle: string, description?: string): Metadata {
  return {
    title: pageTitle,
    description: description ?? `${pageTitle} — ${SITE_NAME}`,
    robots: ADMIN_ROBOTS,
  };
}