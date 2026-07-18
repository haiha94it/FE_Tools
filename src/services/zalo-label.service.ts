import { API_ZALO_LABEL } from "@/config/api";
import { unwrapApiBody } from "@/lib/api-response";
import { isGroupConversation } from "@/lib/zalo-messenger-utils";
import api from "@/lib/axios";
import type { MessengerConversation } from "@/types/zalo-messenger";
import type { ZaloLabelCategory } from "@/types/zalo-contacts";

function parseLabelList(body: unknown): ZaloLabelCategory[] {
  if (Array.isArray(body)) return body as ZaloLabelCategory[];
  if (body && typeof body === "object") {
    const record = body as { results?: ZaloLabelCategory[] };
    if (Array.isArray(record.results)) return record.results;
  }
  return [];
}

export const zaloLabelService = {
  /** GET /api/message/category/?id_account= */
  async listCategories(
    accountId: number,
    options?: { signal?: AbortSignal },
  ): Promise<ZaloLabelCategory[]> {
    const response = await api.get(API_ZALO_LABEL.LIST, {
      params: { id_account: accountId },
      signal: options?.signal,
    });
    return parseLabelList(unwrapApiBody<unknown>(response.data));
  },

  /** POST /api/message/category/ — body { name, color } */
  async createCategory(payload: {
    name: string;
    color?: string;
  }): Promise<number | null> {
    const response = await api.post(API_ZALO_LABEL.LIST, {
      name: payload.name.trim(),
      color: payload.color ?? "#465fff",
    });
    const body = unwrapApiBody<{ id?: number }>(response.data);
    return body.id ?? null;
  },

  /** PATCH /api/message/category/{id}/ */
  async editCategory(payload: {
    id: number;
    name: string;
    color?: string;
  }): Promise<void> {
    await api.patch(API_ZALO_LABEL.detail(payload.id), {
      name: payload.name.trim(),
      color: payload.color ?? "#465fff",
    });
  },

  /** DELETE /api/message/category/{id}/ */
  async deleteCategory(categoryId: number): Promise<void> {
    await api.delete(API_ZALO_LABEL.detail(categoryId));
  },

  /** POST /api/message/category/{id}/members/ */
  async addMembers(payload: {
    categoryId: number;
    accountId: number;
    friendIds?: number[];
    groupIds?: number[];
  }): Promise<void> {
    const body: Record<string, unknown> = {
      id_account: payload.accountId,
    };
    if (payload.friendIds?.length) body.id_friends = payload.friendIds;
    if (payload.groupIds?.length) body.id_groups = payload.groupIds;
    await api.post(API_ZALO_LABEL.members(payload.categoryId), body);
  },

  /** DELETE /api/message/category/{id}/members/ */
  async removeMembers(payload: {
    categoryId: number;
    accountId: number;
    friendIds?: number[];
    groupIds?: number[];
  }): Promise<void> {
    const body: Record<string, unknown> = {
      id_account: payload.accountId,
    };
    if (payload.friendIds?.length) body.id_friends = payload.friendIds;
    if (payload.groupIds?.length) body.id_groups = payload.groupIds;
    await api.delete(API_ZALO_LABEL.members(payload.categoryId), { data: body });
  },

  /** Gán nhãn hội thoại messenger — map conversation → friend/group id */
  async assignToConversation(payload: {
    categoryId: number;
    accountId: number;
    conversation: Pick<
      MessengerConversation,
      "conversation_type" | "friend" | "group"
    >;
  }): Promise<void> {
    const { categoryId, accountId, conversation } = payload;
    if (isGroupConversation(conversation) && conversation.group?.id) {
      await this.addMembers({
        categoryId,
        accountId,
        groupIds: [conversation.group.id],
      });
      return;
    }
    const friendId = conversation.friend?.id;
    if (friendId) {
      await this.addMembers({
        categoryId,
        accountId,
        friendIds: [friendId],
      });
      return;
    }
    throw new Error("Không xác định được bạn bè/nhóm của hội thoại.");
  },

  async removeFromConversation(payload: {
    categoryId: number;
    accountId: number;
    conversation: Pick<
      MessengerConversation,
      "conversation_type" | "friend" | "group"
    >;
  }): Promise<void> {
    const { categoryId, accountId, conversation } = payload;
    if (isGroupConversation(conversation) && conversation.group?.id) {
      await this.removeMembers({
        categoryId,
        accountId,
        groupIds: [conversation.group.id],
      });
      return;
    }
    const friendId = conversation.friend?.id;
    if (friendId) {
      await this.removeMembers({
        categoryId,
        accountId,
        friendIds: [friendId],
      });
      return;
    }
    throw new Error("Không xác định được bạn bè/nhóm của hội thoại.");
  },
};