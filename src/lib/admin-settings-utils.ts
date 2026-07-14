import { API_BASE_URL } from "@/config/api";

export function resolveAdminSettingsImage(path?: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${API_BASE_URL}/${path.replace(/^\//, "")}`;
}

export function normalizeHtmlContent(content?: string | null): string {
  return content?.replace(/&nbsp;/g, " ") ?? "";
}