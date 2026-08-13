/** Brand logo helpers — Tools Platform (static fallback). */

export const FALLBACK_BRAND_LOGO = "/images/brand/cong-cu-nghe-wordmark.png";
export const FALLBACK_BRAND_ICON = "/images/brand/cong-cu-nghe-icon-512.png";

export async function fetchBrandLogoUrl(): Promise<string> {
  return FALLBACK_BRAND_LOGO;
}

export function subscribeBrandLogoUpdated(_cb: () => void): () => void {
  return () => undefined;
}
