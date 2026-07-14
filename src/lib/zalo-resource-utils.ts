import { API_BASE_URL } from "@/config/api";

export function getZaloResourceImageUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const base = API_BASE_URL.replace(/\/$/, "");
  return `${base}/${path.replace(/^\//, "")}`;
}

export function isExternalUrl(url: string): boolean {
  return /^https?:\/\//i.test(url.trim());
}