import type { SupportAskResult, SupportFaq } from "@/types/support-chatbot";

export function formatSupportAnswerText(
  answer: SupportAskResult["answer"],
): string {
  if (Array.isArray(answer)) {
    return answer.filter(Boolean).join("\n");
  }
  if (typeof answer === "string") return answer.trim();
  return "";
}

export const SUPPORT_MISS_FALLBACK =
  "Em chưa có câu trả lời phù hợp. Anh/chị thử hỏi cách khác hoặc liên hệ hỗ trợ.";

export const SUPPORT_WELCOME_TEXT =
  "Xin chào! Em là trợ lý hỗ trợ sử dụng hệ thống. Anh/chị cần hỗ trợ gì ạ?";

export function normalizeSupportFaqList(data: unknown): {
  results: SupportFaq[];
  count: number;
  page: number;
  pageSize: number;
} {
  if (Array.isArray(data)) {
    return {
      results: data as SupportFaq[],
      count: data.length,
      page: 1,
      pageSize: data.length,
    };
  }
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    const results = Array.isArray(o.results)
      ? (o.results as SupportFaq[])
      : [];
    return {
      results,
      count: typeof o.count === "number" ? o.count : results.length,
      page: typeof o.page === "number" ? o.page : 1,
      pageSize:
        typeof o.page_size === "number"
          ? o.page_size
          : typeof o.pageSize === "number"
            ? o.pageSize
            : 20,
    };
  }
  return { results: [], count: 0, page: 1, pageSize: 20 };
}

export function nowSupportTime(): string {
  return new Date().toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
