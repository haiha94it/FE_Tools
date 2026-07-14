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

export function getMinVariantPrice(product: ShopProduct): number {
  const prices = product.variants
    .map((v) => Number(v.promotion_price || v.price))
    .filter((p) => !Number.isNaN(p));
  return prices.length ? Math.min(...prices) : 0;
}

export function getMaxVariantPrice(product: ShopProduct): number {
  const prices = product.variants
    .map((v) => Number(v.promotion_price || v.price))
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

export function buildStoreUrl(sellerId: number | string, path = ""): string {
  const base = `/store/${sellerId}`;
  return path ? `${base}${path.startsWith("/") ? path : `/${path}`}` : base;
}

export function buildStoreProductUrl(
  sellerId: number | string,
  productId: number | string,
  categoryId: number | string,
): string {
  return `/store/${sellerId}/categories/${categoryId}/products/${productId}`;
}

export function buildLegacyStoreRedirect(
  type: "shoplinkhome" | "showproduct",
  segments: string[],
): string {
  if (type === "shoplinkhome") {
    const [sellerId, categoryId] = segments;
    if (categoryId) return `/store/${sellerId}/categories/${categoryId}`;
    return `/store/${sellerId}`;
  }
  const [sellerId, categoryId, productId] = segments;
  return `/store/${sellerId}/categories/${categoryId}/products/${productId}`;
}