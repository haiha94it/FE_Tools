import { API_ZALO_LABEL } from "@/config/api";
import { unwrapApiBody } from "@/lib/api-response";
import api from "@/lib/axios";
import type { ZaloLabelCategory } from "@/types/zalo-contacts";

interface CreateLabelResponse {
  id?: number;
  id_category?: number;
}

export const zaloLabelService = {
  async listCategories(accountId: number): Promise<ZaloLabelCategory[]> {
    const response = await api.get(API_ZALO_LABEL.CATEGORIES, {
      params: { id_account: accountId, type: "detail" },
    });
    const body = unwrapApiBody<unknown>(response.data);
    if (Array.isArray(body)) return body as ZaloLabelCategory[];
    return [];
  },

  async createCategory(payload: {
    name: string;
    color?: string;
  }): Promise<number | null> {
    const response = await api.post<CreateLabelResponse>(
      API_ZALO_LABEL.CREATE_OR_EDIT,
      {
        id_category: null,
        name: payload.name.trim(),
        color: payload.color ?? "#465fff",
      },
    );
    const body = unwrapApiBody<CreateLabelResponse>(response.data);
    return body.id ?? body.id_category ?? null;
  },

  async editCategory(payload: {
    id: number;
    name: string;
    color?: string;
  }): Promise<void> {
    await api.post(API_ZALO_LABEL.CREATE_OR_EDIT, {
      id_category: payload.id,
      name: payload.name.trim(),
      color: payload.color ?? "#465fff",
    });
  },

  async deleteCategory(categoryId: number): Promise<void> {
    await api.post(API_ZALO_LABEL.DELETE, { id_category: categoryId });
  },

  async assignToConversation(payload: {
    categoryId: number;
    conversationId: number;
  }): Promise<void> {
    await api.post(API_ZALO_LABEL.ADD, {
      id_category: payload.categoryId,
      id_conversation: payload.conversationId,
    });
  },

  async removeFromConversation(payload: {
    categoryId: number;
    conversationId: number;
  }): Promise<void> {
    await api.post(API_ZALO_LABEL.REMOVE, {
      id_category: payload.categoryId,
      id_conversation: payload.conversationId,
    });
  },
};