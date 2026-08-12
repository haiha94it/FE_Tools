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
  return host.trim();
}

/**
 * Absolute URL cửa hàng công khai (admin: Xem Storefront / Xem cửa hàng / copy link).
 * Ưu tiên domain riêng → `https://shop.xxx/store/{id}`; không có thì origin hiện tại.
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

  const host = normalizeShopDomain(domain);
  if (host) return `https://${host}${path}`;

  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}${path}`;
  }
  return path;
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