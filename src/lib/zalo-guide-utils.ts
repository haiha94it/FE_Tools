import { API_BASE_URL } from "@/config/api";
import type { GuideSystemKey } from "@/types/zalo-guide";

export function getZaloGuideImageUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const base = API_BASE_URL.replace(/\/$/, "");
  return `${base}/${path.replace(/^\//, "")}`;
}

/** Xác định hệ thống lọc tutorial — đồng bộ logic ZaloCN Huongdan.jsx */
export function resolveGuideSystemFilter(): GuideSystemKey {
  if (typeof window === "undefined") return "care";
  const host = window.location.hostname;
  if (host.includes("careplus")) return "ai";
  if (host.includes("zcare")) return "zcare";
  if (host.includes("care.chotnhanh") || host.includes("carepro")) return "care";
  return "pro";
}

export function toEmbedVideoUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = parsed.pathname.slice(1).split("/")[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = parsed.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
      const embedMatch = parsed.pathname.match(/\/embed\/([^/]+)/);
      if (embedMatch?.[1]) return `https://www.youtube.com/embed/${embedMatch[1]}`;
    }

    if (host === "vimeo.com") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }

    if (host.includes("facebook.com")) {
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(trimmed)}&show_text=false`;
    }

    return trimmed;
  } catch {
    return trimmed;
  }
}

export const GUIDE_SYSTEM_OPTIONS: { value: GuideSystemKey; label: string }[] = [
  { value: "care", label: "Care (bản chính)" },
  { value: "pro", label: "Pro (Care Pro)" },
  { value: "ai", label: "AI (careplus)" },
  { value: "zcare", label: "ZCare (zcare)" },
];