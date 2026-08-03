import { API_SUPPORT_CHATBOT } from "@/config/api";
import api from "@/lib/axios";
import {
  pollCeleryTask,
  type CeleryPollData,
} from "@/lib/celery-poll";
import { normalizeSupportFaqList } from "@/lib/support-chatbot-utils";
import type {
  SupportAskResult,
  SupportEditor,
  SupportEligibleUser,
  SupportFaq,
  SupportRoleOption,
  SupportFaqCreatePayload,
  SupportFaqUpdatePayload,
  SupportMedia,
  SupportMissConvertPayload,
  SupportMissQuery,
} from "@/types/support-chatbot";

function isAskResult(value: unknown): value is SupportAskResult {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  return "message" in o || "answer" in o || "miss_data" in o || "faq_id" in o;
}

export const supportChatbotService = {
  /**
   * Hỏi bot CSKH — BE queue Celery, FE poll id_task (không block gunicorn worker lâu).
   * Fallback: response sync trực tiếp nếu BE không Celery.
   */
  async ask(message: string): Promise<SupportAskResult> {
    const response = await api.post(API_SUPPORT_CHATBOT.ASK, { message });
    const data = response.data as
      | SupportAskResult
      | { id_task?: string | number; task_status?: string }
      | undefined;

    // Sync fallback (no celery)
    if (isAskResult(data) && !(data as { id_task?: unknown }).id_task) {
      return data;
    }

    const idTask =
      data && typeof data === "object" && "id_task" in data
        ? (data as { id_task?: string | number }).id_task
        : undefined;

    if (idTask == null || idTask === "") {
      // Unexpected shape — try treat as result
      return (data ?? {}) as SupportAskResult;
    }

    const result = await pollCeleryTask<SupportAskResult>(
      async (taskId) => {
        const pollRes = await api.post(API_SUPPORT_CHATBOT.ASK, {
          id_task: taskId,
        });
        // axios unwrap → data = { task_status, result? } | ask result
        return (pollRes.data ?? {}) as CeleryPollData<SupportAskResult>;
      },
      idTask,
      { maxAttempts: 80, intervalMs: 800 },
    );

    // pollCeleryTask returns body.result on SUCCESS; guard nested
    if (isAskResult(result)) return result;
    if (result && typeof result === "object" && "result" in result) {
      const nested = (result as { result?: SupportAskResult }).result;
      if (isAskResult(nested)) return nested;
    }
    return (result ?? {}) as SupportAskResult;
  },

  async listFaqs(params?: {
    page?: number;
    number_per_page?: number;
    search?: string;
    is_active?: boolean | string;
  }): Promise<ReturnType<typeof normalizeSupportFaqList>> {
    const response = await api.get(API_SUPPORT_CHATBOT.FAQS, { params });
    return normalizeSupportFaqList(response.data);
  },

  async getFaq(id: number): Promise<SupportFaq> {
    const response = await api.get(API_SUPPORT_CHATBOT.FAQ_DETAIL(id));
    return response.data as SupportFaq;
  },

  async createFaq(payload: SupportFaqCreatePayload): Promise<SupportFaq> {
    const response = await api.post(API_SUPPORT_CHATBOT.FAQS, payload);
    return response.data as SupportFaq;
  },

  async updateFaq(
    id: number,
    payload: SupportFaqUpdatePayload,
  ): Promise<SupportFaq> {
    const response = await api.patch(API_SUPPORT_CHATBOT.FAQ_DETAIL(id), payload);
    return response.data as SupportFaq;
  },

  async deleteFaq(id: number): Promise<void> {
    await api.delete(API_SUPPORT_CHATBOT.FAQ_DETAIL(id));
  },

  async clearFaqs(): Promise<number> {
    const response = await api.post(API_SUPPORT_CHATBOT.FAQ_CLEAR);
    const data = response.data as { deleted?: number } | undefined;
    return data?.deleted ?? 0;
  },

  async exportFaqsText(): Promise<string> {
    const response = await api.get(API_SUPPORT_CHATBOT.FAQ_EXPORT);
    const data = response.data as { text?: string } | undefined;
    return data?.text ?? "";
  },

  async syncEmbeddings(ids?: number[]): Promise<number> {
    const response = await api.post(
      API_SUPPORT_CHATBOT.FAQ_SYNC,
      ids?.length ? { ids } : {},
    );
    const data = response.data as { count?: number } | undefined;
    return data?.count ?? 0;
  },

  async listMedia(params?: {
    page?: number;
    number_per_page?: number;
  }): Promise<{ results: SupportMedia[]; count: number }> {
    const response = await api.get(API_SUPPORT_CHATBOT.MEDIA, { params });
    const data = response.data as
      | { results?: SupportMedia[]; count?: number }
      | SupportMedia[]
      | undefined;
    if (Array.isArray(data)) {
      return { results: data, count: data.length };
    }
    return {
      results: data?.results ?? [],
      count: data?.count ?? 0,
    };
  },

  async uploadMedia(file: File): Promise<SupportMedia> {
    const form = new FormData();
    form.append("file", file);
    const response = await api.post(API_SUPPORT_CHATBOT.MEDIA, form, {
      timeout: 120_000,
    });
    return response.data as SupportMedia;
  },

  async deleteMedia(id: number, force = false): Promise<void> {
    await api.delete(API_SUPPORT_CHATBOT.MEDIA_DETAIL(id), {
      params: force ? { force: 1 } : undefined,
    });
  },

  async listEligibleUsers(params?: {
    search?: string;
    role?: string;
    only_not_editor?: boolean;
    limit?: number;
  }): Promise<{
    results: SupportEligibleUser[];
    count: number;
    roles: SupportRoleOption[];
  }> {
    const response = await api.get(API_SUPPORT_CHATBOT.EDITORS_ELIGIBLE, {
      params: {
        search: params?.search || undefined,
        role: params?.role || undefined,
        only_not_editor: params?.only_not_editor ? 1 : undefined,
        limit: params?.limit ?? 200,
      },
    });
    const data = response.data as
      | {
          results?: SupportEligibleUser[];
          count?: number;
          roles?: SupportRoleOption[];
        }
      | undefined;
    return {
      results: data?.results ?? [],
      count: data?.count ?? 0,
      roles: data?.roles ?? [],
    };
  },

  async listEditors(): Promise<SupportEditor[]> {
    const response = await api.get(API_SUPPORT_CHATBOT.EDITORS);
    const data = response.data as
      | { results?: SupportEditor[] }
      | SupportEditor[]
      | undefined;
    if (Array.isArray(data)) return data;
    return data?.results ?? [];
  },

  async grantEditor(userId: number): Promise<SupportEditor> {
    const response = await api.post(API_SUPPORT_CHATBOT.EDITORS, {
      user_id: userId,
    });
    return response.data as SupportEditor;
  },

  async revokeEditor(userId: number): Promise<void> {
    await api.delete(API_SUPPORT_CHATBOT.EDITOR_DETAIL(userId));
  },

  async listMissQueries(params?: {
    page?: number;
    number_per_page?: number;
    search?: string;
  }): Promise<{ results: SupportMissQuery[]; count: number }> {
    const response = await api.get(API_SUPPORT_CHATBOT.MISS_QUERIES, { params });
    const data = response.data as
      | { results?: SupportMissQuery[]; count?: number }
      | SupportMissQuery[]
      | undefined;
    if (Array.isArray(data)) {
      return { results: data, count: data.length };
    }
    return {
      results: data?.results ?? [],
      count: data?.count ?? 0,
    };
  },

  async deleteMissQuery(id: number): Promise<void> {
    await api.delete(API_SUPPORT_CHATBOT.MISS_QUERY_DETAIL(id));
  },

  async clearMissQueries(): Promise<number> {
    const response = await api.delete(API_SUPPORT_CHATBOT.MISS_QUERIES, {
      params: { confirm: 1 },
    });
    const data = response.data as { deleted?: number } | undefined;
    return data?.deleted ?? 0;
  },

  async convertMissQuery(
    id: number,
    payload: SupportMissConvertPayload,
  ): Promise<SupportFaq> {
    const response = await api.post(
      API_SUPPORT_CHATBOT.MISS_QUERY_DETAIL(id),
      payload,
    );
    return response.data as SupportFaq;
  },
};
