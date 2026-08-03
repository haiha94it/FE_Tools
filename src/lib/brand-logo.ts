import { API_POPUP } from "@/config/api";
import { resolveAdminSettingsImage } from "@/lib/admin-settings-utils";
import { unwrapApiBody } from "@/lib/api-response";
import { dedupeInflight } from "@/lib/inflight";
import publicApi from "@/lib/public-api";

/** Fallback khi API logo trống / lỗi — file tĩnh public */
export const FALLBACK_BRAND_LOGO = "/images/logo/logobanner.png";
export const FALLBACK_BRAND_ICON = "/images/logo/favicon.png";

const BRAND_LOGO_EVENT = "brand-logo-updated";

let cachedLogoUrl: string | null = null;

interface LogoApiBody {
  id?: number;
  link?: string;
  image?: string;
}

/**
 * Lấy URL logo hệ thống từ GET /api/popup/logo/get (AllowAny).
 * Cache memory + dedupe inflight — sidebar/header/landing dùng chung 1 request.
 */
export async function fetchBrandLogoUrl(options?: {
  force?: boolean;
}): Promise<string> {
  if (!options?.force && cachedLogoUrl) return cachedLogoUrl;

  return dedupeInflight("brand-logo:get", async () => {
    try {
      const response = await publicApi.get(API_POPUP.LOGO);
      const body = unwrapApiBody<LogoApiBody>(response.data);
      const path = body?.link ?? body?.image ?? "";
      const url = resolveAdminSettingsImage(path) ?? FALLBACK_BRAND_LOGO;
      cachedLogoUrl = url;
      return url;
    } catch {
      cachedLogoUrl = FALLBACK_BRAND_LOGO;
      return FALLBACK_BRAND_LOGO;
    }
  });
}

/** Xóa cache + báo component reload (sau khi admin Lưu logo). */
export function invalidateBrandLogoCache(): void {
  cachedLogoUrl = null;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(BRAND_LOGO_EVENT));
  }
}

export function subscribeBrandLogoUpdated(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(BRAND_LOGO_EVENT, listener);
  return () => window.removeEventListener(BRAND_LOGO_EVENT, listener);
}
