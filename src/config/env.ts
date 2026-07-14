const DEFAULT_API_URL = "https://testcare.chotnhanh.vn";

function readUrl(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  if (!trimmed) return fallback;
  try {
    new URL(trimmed);
    return trimmed.replace(/\/$/, "");
  } catch {
    return fallback;
  }
}

export const env = {
  NEXT_PUBLIC_API_URL: readUrl(
    process.env.NEXT_PUBLIC_API_URL,
    DEFAULT_API_URL,
  ),
  NEXT_PUBLIC_CARE_API_URL: readUrl(
    process.env.NEXT_PUBLIC_CARE_API_URL,
    DEFAULT_API_URL,
  ),
} as const;