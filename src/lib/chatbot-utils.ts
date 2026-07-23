import type {
  ChatbotCategory,
  ChatbotInstance,
  ChatbotListResponse,
  TrainingImage,
  TrainingImageSendMode,
  TrainingImagesListResponse,
} from "@/types/chatbot";
import {
  CHATBOT_MAX_KEYWORD_LENGTH,
  CHATBOT_MAX_KEYWORDS,
} from "@/types/chatbot";

export function normalizeList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object") {
    const value = data as {
      results?: unknown;
      data?: unknown;
      items?: unknown;
    };
    if (Array.isArray(value.results)) return value.results as T[];
    if (Array.isArray(value.data)) return value.data as T[];
    if (Array.isArray(value.items)) return value.items as T[];
  }
  return [];
}

export function normalizePaginatedList<T>(data: unknown): {
  results: T[];
  count: number;
  pageLimit: number;
} {
  if (Array.isArray(data)) {
    return { results: data as T[], count: data.length, pageLimit: data.length };
  }

  if (data && typeof data === "object") {
    const value = data as {
      count?: number;
      page_limit?: number;
      results?: T[];
      data?: T[];
      items?: T[];
    };
    const results = Array.isArray(value.results)
      ? value.results
      : Array.isArray(value.data)
        ? value.data
        : Array.isArray(value.items)
          ? value.items
          : [];

    return {
      results,
      count: typeof value.count === "number" ? value.count : results.length,
      pageLimit:
        typeof value.page_limit === "number" ? value.page_limit : results.length,
    };
  }

  return { results: [], count: 0, pageLimit: 0 };
}

export function extractChatbotList(data: unknown): {
  results: ChatbotInstance[];
  count: number;
  maxChatbots: number;
} {
  if (Array.isArray(data)) {
    return {
      results: data as ChatbotInstance[],
      count: data.length,
      maxChatbots: 10,
    };
  }

  if (data && typeof data === "object") {
    const value = data as ChatbotListResponse;
    const results = normalizeList<ChatbotInstance>(data);
    return {
      results,
      count: typeof value.count === "number" ? value.count : results.length,
      maxChatbots:
        typeof value.max_chatbots === "number" ? value.max_chatbots : 10,
    };
  }

  return { results: [], count: 0, maxChatbots: 10 };
}

export function normalizeTrainingImagesResponse(data: unknown): {
  results: TrainingImage[];
  count: number;
  maxUpload: number;
} {
  if (!data || typeof data !== "object") {
    return { results: [], count: 0, maxUpload: 200 };
  }

  const value = data as TrainingImagesListResponse;
  const results = Array.isArray(value.results) ? value.results : [];

  return {
    results,
    count: typeof value.count === "number" ? value.count : results.length,
    maxUpload: typeof value.max_upload === "number" ? value.max_upload : 200,
  };
}

export function getChatbotTrainingCount(
  chatbot: ChatbotInstance | null | undefined,
): number {
  if (!chatbot) return 0;
  return chatbot.training_data?.length ?? 0;
}

export function getChatbotAccountKeys(
  chatbot: ChatbotInstance | null | undefined,
): string[] {
  if (!chatbot) return [];
  const keys = chatbot.zalo_account_keys ?? chatbot.zalo_accounts ?? [];
  return keys
    .map((item: any) => {
      if (item && typeof item === "object") {
        return String(item.id ?? item.key ?? "");
      }
      return String(item);
    })
    .filter(Boolean);
}

export function getTrainingImageUrl(image: TrainingImage): string {
  return image.url || image.file || "";
}

export function resolveTrainingImageMediaId(image: TrainingImage): number {
  if (typeof image.media === "number" && image.media > 0) return image.media;
  return image.id;
}

/** Chuẩn hóa mode gửi ảnh training — BE MANAGE dùng all | random_one */
export function resolveTrainingImageSendMode(
  value?: string | null,
): TrainingImageSendMode {
  if (value === "random" || value === "random_one") return "random_one";
  return "all";
}

export function toApiTrainingImageSendMode(
  value?: TrainingImageSendMode | string | null,
): "all" | "random_one" {
  return resolveTrainingImageSendMode(value) === "random_one"
    ? "random_one"
    : "all";
}

export function formatTimeForInput(time?: string | null): string {
  if (!time) return "08:00";
  // "08:00:00" | "08:00"
  const match = time.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return "08:00";
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

export function formatTimeForApi(time: string): string {
  const match = time.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return "08:00:00";
  return `${match[1].padStart(2, "0")}:${match[2]}:00`;
}

export function resolveCategoryBgColor(color?: string | null): string {
  if (!color) return "#64748b";
  const normalized = color.trim().toLowerCase();
  if (normalized.startsWith("#")) return color.trim();

  const presets: Record<string, string> = {
    blue: "#3b82f6",
    indigo: "#6366f1",
    violet: "#8b5cf6",
    red: "#ef4444",
    orange: "#f97316",
    amber: "#f59e0b",
    emerald: "#10b981",
    green: "#22c55e",
    slate: "#64748b",
  };

  return presets[normalized] ?? "#64748b";
}

export const CATEGORY_COLOR_PRESETS = [
  { value: "blue", label: "Xanh dương", hex: "#3b82f6" },
  { value: "indigo", label: "Chàm", hex: "#6366f1" },
  { value: "violet", label: "Tím", hex: "#8b5cf6" },
  { value: "red", label: "Đỏ", hex: "#ef4444" },
  { value: "orange", label: "Cam", hex: "#f97316" },
  { value: "amber", label: "Vàng", hex: "#f59e0b" },
  { value: "emerald", label: "Xanh lá", hex: "#10b981" },
  { value: "slate", label: "Xám", hex: "#64748b" },
] as const;

export function truncateText(text: string, max = 100): string {
  const value = text.trim();
  if (value.length <= max) return value;
  return `${value.slice(0, max)}…`;
}

export function normalizeKeywordValue(
  value: string,
  maxLength = CHATBOT_MAX_KEYWORD_LENGTH,
): string | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) return null;
  return trimmed;
}

export function mergeKeywords(
  existing: string[],
  incoming: string[],
  max = CHATBOT_MAX_KEYWORDS,
  maxLength = CHATBOT_MAX_KEYWORD_LENGTH,
): {
  keywords: string[];
  addedCount: number;
  limitReached: boolean;
  skippedTooLongCount: number;
} {
  const result = [...existing];
  const seen = new Set(existing.map((k) => k.trim().toLowerCase()));
  let addedCount = 0;
  let skippedTooLongCount = 0;
  let limitReached = result.length >= max;

  for (const raw of incoming) {
    if (result.length >= max) {
      limitReached = true;
      break;
    }

    const trimmed = raw.trim();
    if (!trimmed) continue;

    const value = normalizeKeywordValue(trimmed, maxLength);
    if (!value) {
      if (trimmed.length > maxLength) skippedTooLongCount += 1;
      continue;
    }

    const key = value.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    result.push(value);
    addedCount += 1;
    if (result.length >= max) limitReached = true;
  }

  return { keywords: result, addedCount, limitReached, skippedTooLongCount };
}

export function parseCommaSeparatedKeywords(value: string): string[] {
  return value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function sortCategories(categories: ChatbotCategory[]): ChatbotCategory[] {
  return [...categories].sort((a, b) =>
    a.name.localeCompare(b.name, "vi", { sensitivity: "base" }),
  );
}

export function formatDelayLabel(minutes: number): string {
  if (minutes < 60) return `Sau ${minutes} phút`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (rest === 0) return `Sau ${hours} giờ`;
  return `Sau ${hours} giờ ${rest} phút`;
}

export function isValidImageFile(file: File): {
  ok: boolean;
  reason?: string;
} {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowed.includes(file.type)) {
    return {
      ok: false,
      reason: "Chỉ hỗ trợ JPG, PNG, WEBP, GIF.",
    };
  }
  if (file.size > 10 * 1024 * 1024) {
    return { ok: false, reason: "Mỗi ảnh tối đa 10 MB." };
  }
  return { ok: true };
}
