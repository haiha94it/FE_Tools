import { API_BASE_URL } from "@/config/api";
import type { ShopProduct, ShopSortOption } from "@/types/zalo-shop";

export function shopImageUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = API_BASE_URL.replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

export function formatVnd(amount: number | string | null | undefined): string {
  const value = Number(amount);
  if (Number.isNaN(value)) return "0 ₫";
  return `${value.toLocaleString("vi-VN")} ₫`;
}

/** Giá bán = `price` (promotion_price chỉ là giá gạch/niêm yết cũ) */
export function getMinVariantPrice(product: ShopProduct): number {
  const prices = product.variants
    .map((v) => Number(v.price))
    .filter((p) => !Number.isNaN(p));
  return prices.length ? Math.min(...prices) : 0;
}

export function getMaxVariantPrice(product: ShopProduct): number {
  const prices = product.variants
    .map((v) => Number(v.price))
    .filter((p) => !Number.isNaN(p));
  return prices.length ? Math.max(...prices) : 0;
}

export function formatPriceRange(product: ShopProduct): string {
  const min = getMinVariantPrice(product);
  const max = getMaxVariantPrice(product);
  if (min === max) return formatVnd(min);
  return `${formatVnd(min)} – ${formatVnd(max)}`;
}

export function isProductActive(product: ShopProduct): boolean {
  return product.status === 1 && product.variants.length > 0;
}

export function sortProducts(
  products: ShopProduct[],
  sort: ShopSortOption,
): ShopProduct[] {
  const list = [...products];
  switch (sort) {
    case "price_asc":
      return list.sort((a, b) => getMinVariantPrice(a) - getMinVariantPrice(b));
    case "price_desc":
      return list.sort((a, b) => getMinVariantPrice(b) - getMinVariantPrice(a));
    case "name_asc":
      return list.sort((a, b) => a.title.localeCompare(b.title, "vi"));
    case "name_desc":
      return list.sort((a, b) => b.title.localeCompare(a.title, "vi"));
    default:
      return list;
  }
}

export function getShopSessionKey(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("session_key") ?? "";
}

export function setShopSessionKey(key: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("session_key", key);
}

export function clearShopSessionKey() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("session_key");
}

/**
 * Storefront URL ngắn:
 *  /store/{seller}
 *  /store/{seller}/{category}
 *  /store/{seller}/{category}/{product}
 */
export function buildStoreUrl(sellerId: number | string, path = ""): string {
  const base = `/store/${sellerId}`;
  return path ? `${base}${path.startsWith("/") ? path : `/${path}`}` : base;
}

export function buildStoreCategoryUrl(
  sellerId: number | string,
  categoryId: number | string,
): string {
  return `/store/${sellerId}/${categoryId}`;
}

export function buildStoreProductUrl(
  sellerId: number | string,
  productId: number | string,
  categoryId: number | string,
): string {
  return `/store/${sellerId}/${categoryId}/${productId}`;
}

/** Hostname domain shop (API thường trả `shop.dahangsi.com`, không scheme). */
export function normalizeShopDomain(domain?: string | null): string {
  if (!domain) return "";
  let host = domain.trim().toLowerCase();
  host = host.replace(/^https?:\/\//i, "");
  host = host.split("/")[0] ?? "";
  // Bỏ port nếu có (vd shop.xxx:443)
  host = host.split(":")[0] ?? "";
  return host.trim();
}

/**
 * Host admin CSKH / site quản trị — không bao giờ dùng làm origin storefront khách.
 * Gồm NEXT_PUBLIC_SITE_URL + một số host prod biết trước.
 */
export function isAdminAppHost(host: string): boolean {
  const h = normalizeShopDomain(host);
  if (!h) return false;
  const blocked = new Set<string>([
    "cskh.tudongai.com",
    "localhost",
    "127.0.0.1",
  ]);
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (site) {
    try {
      const siteHost = normalizeShopDomain(new URL(site).host);
      if (siteHost) blocked.add(siteHost);
    } catch {
      /* ignore bad SITE_URL */
    }
  }
  if (typeof window !== "undefined" && window.location?.hostname) {
    // Origin tab admin hiện tại cũng block (tránh dính cskh khi env thiếu)
    blocked.add(normalizeShopDomain(window.location.hostname));
  }
  return blocked.has(h);
}

/**
 * Origin storefront public từ env build-time.
 * VD: NEXT_PUBLIC_STOREFRONT_URL=https://shop.dahangsi.com
 * Không dùng NEXT_PUBLIC_SITE_URL (đó là admin).
 */
export function getStorefrontPublicOrigin(): string {
  const raw =
    process.env.NEXT_PUBLIC_STOREFRONT_URL?.trim() ||
    process.env.NEXT_PUBLIC_SHOP_URL?.trim() ||
    "";
  if (!raw) return "";
  try {
    const u = new URL(raw.includes("://") ? raw : `https://${raw}`);
    const host = normalizeShopDomain(u.host);
    if (!host || isAdminAppHost(host)) return "";
    return `${u.protocol}//${host}`;
  } catch {
    const host = normalizeShopDomain(raw);
    if (!host || isAdminAppHost(host)) return "";
    return `https://${host}`;
  }
}

/**
 * Absolute URL cửa hàng công khai (admin: Xem Storefront / Xem cửa hàng / copy link).
 *
 * Ưu tiên:
 * 1. Domain shop tenant (API `/api/users/domain`) → `https://{domain}/store/{id}`
 * 2. `NEXT_PUBLIC_STOREFRONT_URL` (base storefront chung)
 *
 * **Không** dùng `window.location.origin` / domain admin CSKH.
 * Trả `""` nếu chưa có base hợp lệ — UI ẩn link / toast nhắc gắn domain.
 */
export function buildPublicStorefrontAbsoluteUrl(
  sellerId: number | string,
  domain?: string | null,
  opts?: {
    categoryId?: number | string;
    productId?: number | string;
  },
): string {
  let path: string;
  if (opts?.productId != null && opts?.categoryId != null) {
    path = buildStoreProductUrl(sellerId, opts.productId, opts.categoryId);
  } else if (opts?.categoryId != null) {
    path = buildStoreCategoryUrl(sellerId, opts.categoryId);
  } else {
    path = buildStoreUrl(sellerId);
  }

  const tenantHost = normalizeShopDomain(domain);
  if (tenantHost && !isAdminAppHost(tenantHost)) {
    return `https://${tenantHost}${path}`;
  }

  const origin = getStorefrontPublicOrigin();
  if (origin) return `${origin}${path}`;

  return "";
}

export function buildLegacyStoreRedirect(
  type: "shoplinkhome" | "showproduct",
  segments: string[],
): string {
  if (type === "shoplinkhome") {
    const [sellerId, categoryId] = segments;
    if (categoryId) return buildStoreCategoryUrl(sellerId, categoryId);
    return buildStoreUrl(sellerId);
  }
  const [sellerId, categoryId, productId] = segments;
  return buildStoreProductUrl(sellerId, productId, categoryId);
}