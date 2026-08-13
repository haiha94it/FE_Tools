/** Brand logo helpers — Tools Platform (static fallback). */

export const FALLBACK_BRAND_LOGO = "/images/logo/logo.svg";
export const FALLBACK_BRAND_ICON = "/images/logo/logo-icon.svg";

export async function fetchBrandLogoUrl(): Promise<string> {
  return FALLBACK_BRAND_LOGO;
}

export function subscribeBrandLogoUpdated(_cb: () => void): () => void {
  return () => undefined;
}
