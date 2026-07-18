import { API_ZALO_GROUP, API_ZALO_MESSENGER } from "@/config/api";
import {
  CREATE_GROUP_MAX_POLL_ATTEMPTS,
  CREATE_GROUP_POLL_INTERVAL_MS,
} from "@/lib/zalo-messenger-create-group-utils";
import api from "@/lib/axios";
import { getApiSuccessMessage, unwrapApiBody } from "@/lib/api-response";
import {
  buildFastReplyCreateBody,
  buildFastReplyUpdateBody,
} from "@/lib/zalo-messenger-fast-reply";
import { parseUploadedFileLink } from "@/lib/zalo-messenger-send-utils";
import type {
  MessengerAccount,
  MessengerConversation,
  MessengerConversationPage,
  MessengerConversationPosition,
  MessengerCreateGroupResult,
  FastReplyUpdateBody,
  MessengerFastReply,
  MessengerMessagePage,
  MessengerStickerItem,
} from "@/types/zalo-messenger";

function normalizeStickerList(body: unknown): MessengerStickerItem[] {
  const list = Array.isArray(body)
    ? body
    : body && typeof body === "object" && Array.isArray((body as { results?: unknown }).results)
      ? (body as { results: unknown[] }).results
      : [];

  return list
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const id = record.id ?? record.id_sticker ?? record.stickerId;
      if (id == null) return null;
      return {
        id: id as string | number,
        catId: (record.catId ?? record.cat_id ?? record.categoryId) as
          | string
          | number
          | undefined,
        thumb: (record.thumb ?? record.thumbnail ?? record.url) as
          | string
          | null
          | undefined,
        url: (record.url ?? record.href ?? record.thumb) as
          | string
          | null
          | undefined,
        name: (record.name ?? record.title) as string | null | undefined,
      } satisfies MessengerStickerItem;
    })
    .filter(Boolean) as MessengerStickerItem[];
}

export interface FetchConversationsParams {
  id_account: number;
  page?: number;
  name?: string;
  unread?: boolean;
  conversation_type?: "friend" | "group" | "all";
  id_category?: number;
  id_conversation?: number;
  position?: 1;
}

export const zaloMessengerService = {
  async listAccounts(): Promise<MessengerAccount[]> {
    const response = await api.get<MessengerAccount[]>(
      API_ZALO_MESSENGER.ACCOUNTS,
      { params: { scope: "messenger" } },
    );
    return response.data ?? [];
  },

  async fetchConversations(
    params: FetchConversationsParams,
  ): Promise<MessengerConversationPage> {
    const response = await api.get<MessengerConversationPage>(
      API_ZALO_MESSENGER.CONVERSATIONS,
      { params },
    );
    return response.data ?? { results: [] };
  },

  async fetchConversationDetail(
    id_account: number,
    id_conversation: number,
  ): Promise<MessengerConversation> {
    const response = await api.get<MessengerConversation>(
      API_ZALO_MESSENGER.CONVERSATIONS,
      { params: { id_account, id_conversation } },
    );
    return response.data;
  },

  async fetchConversationPosition(
    id_account: number,
    id_conversation: number,
  ): Promise<MessengerConversationPosition> {
    const response = await api.get<MessengerConversationPosition>(
      API_ZALO_MESSENGER.CONVERSATIONS,
      {
        params: { id_account, id_conversation, position: 1 },
      },
    );
    return response.data;
  },

  async fetchMessages(
    id_account: number,
    id_conversation: number,
    page = 1,
  ): Promise<MessengerMessagePage> {
    const response = await api.get<MessengerMessagePage>(
      API_ZALO_MESSENGER.GET_MESSAGES,
      { params: { id_account, id_conversation, page } },
    );
    return response.data ?? { results: [] };
  },

  async openConversation(body: {
    id_account: number;
    id_friend?: number;
    id_group?: number;
  }): Promise<MessengerConversation> {
    const response = await api.post<MessengerConversation>(
      API_ZALO_MESSENGER.OPEN_CONVERSATION,
      body,
    );
    return response.data;
  },

  async pinConversation(
    id_account: number,
    id_conversation: number,
    pinning: boolean,
  ): Promise<void> {
    await api.post(API_ZALO_MESSENGER.PIN_CONVERSATION, {
      id_account,
      id_conversation,
      pinning,
    });
  },

  async pinAccount(id_account: number, pinning: boolean): Promise<void> {
    await api.post(API_ZALO_MESSENGER.PIN_ACCOUNT, {
      id_account,
      pinning,
    });
  },

  async saveNote(
    id_account: number,
    id_conversation: number,
    note: string,
  ): Promise<void> {
    await api.post(API_ZALO_MESSENGER.NOTE, {
      id_account,
      id_conversation,
      note,
    });
  },

  async fetchFastReplies(
    id_account: number,
    options?: { signal?: AbortSignal },
  ): Promise<MessengerFastReply[]> {
    const response = await api.get(API_ZALO_MESSENGER.FAST_REPLY, {
      params: { id_account },
      signal: options?.signal,
    });
    const body = response.data;
    return Array.isArray(body) ? (body as MessengerFastReply[]) : [];
  },

  async fetchFastReplyDetail(pk: number): Promise<MessengerFastReply> {
    const response = await api.get(
      `${API_ZALO_MESSENGER.FAST_REPLY}/${pk}`,
    );
    return response.data as MessengerFastReply;
  },

  async createFastReply(
    id_account: number,
    title: string,
    content: string,
    image?: string,
  ): Promise<MessengerFastReply> {
    const response = await api.post(
      API_ZALO_MESSENGER.FAST_REPLY,
      buildFastReplyCreateBody({ id_account, title, content, image }),
    );
    return response.data as MessengerFastReply;
  },

  async updateFastReply(
    id_fast_reply: number,
    body: FastReplyUpdateBody,
  ): Promise<MessengerFastReply> {
    const response = await api.patch(
      `${API_ZALO_MESSENGER.FAST_REPLY}/${id_fast_reply}`,
      buildFastReplyUpdateBody({
        title: body.title ?? "",
        content: body.content ?? "",
        image: body.image,
        command: body.title,
      }),
    );
    return response.data as MessengerFastReply;
  },

  async deleteFastReply(id_fast_reply: number): Promise<string | undefined> {
    const response = await api.delete(
      `${API_ZALO_MESSENGER.FAST_REPLY}/${id_fast_reply}`,
    );
    return getApiSuccessMessage(response);
  },

  async bulkDeleteFastReplies(
    ids: number[],
  ): Promise<string | undefined> {
    const response = await api.delete(API_ZALO_MESSENGER.FAST_REPLY, {
      data: { ids },
    });
    return getApiSuccessMessage(response);
  },

  async fetchStickerSuggest(
    id_account: number,
    limit = 24,
  ): Promise<MessengerStickerItem[]> {
    const response = await api.get(API_ZALO_MESSENGER.STICKERS_SUGGEST, {
      params: { id_account, limit },
    });
    const body = unwrapApiBody<unknown>(response.data);
    return normalizeStickerList(body);
  },

  async searchStickers(
    id_account: number,
    keyword: string,
    limit = 24,
  ): Promise<MessengerStickerItem[]> {
    const response = await api.get(API_ZALO_MESSENGER.STICKERS_SEARCH, {
      params: { id_account, keyword, limit },
    });
    const body = unwrapApiBody<unknown>(response.data);
    return normalizeStickerList(body);
  },

  async markAllConversationsRead(id_account: number): Promise<void> {
    await api.post(API_ZALO_MESSENGER.MARK_READ_ALL, { id_account });
  },

  async createGroup(payload: {
    name: string;
    accountId: number;
    memberUids: string[];
  }): Promise<{ ok: boolean; conversationId?: number; message?: string }> {
    try {
      const response = await api.post<{ id_task?: string | number }>(
        API_ZALO_GROUP.CREATE,
        {
          name: payload.name.trim(),
          id_account: payload.accountId,
          members: payload.memberUids,
        },
      );
      const createBody = unwrapApiBody<{ id_task?: string | number }>(
        response.data,
      );
      const idTask = createBody.id_task;
      if (!idTask) {
        return { ok: false, message: "Không tạo được tác vụ tạo nhóm." };
      }

      for (let attempt = 0; attempt < CREATE_GROUP_MAX_POLL_ATTEMPTS; attempt += 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, CREATE_GROUP_POLL_INTERVAL_MS),
        );
        const result = await api.post<MessengerCreateGroupResult>(
          API_ZALO_GROUP.CREATE_RESULT,
          { id_task: idTask },
        );
        const body = unwrapApiBody<MessengerCreateGroupResult>(result.data);
        if (body?.status === "SUCCESS") {
          return {
            ok: true,
            conversationId: body.data?.id_conversation,
          };
        }
        if (body?.status === "FAILURE" || body?.status === "ERROR") {
          return { ok: false, message: body.message || "Tạo nhóm thất bại." };
        }
      }

      return { ok: false, message: "Tạo nhóm quá thời gian chờ." };
    } catch {
      return { ok: false, message: "Đã xảy ra lỗi khi tạo nhóm." };
    }
  },

  async uploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<unknown>(
      API_ZALO_MESSENGER.UPLOAD_FILE,
      formData,
      { timeout: 120_000 },
    );
    const link = parseUploadedFileLink(response.data);
    if (!link) {
      throw new Error("Không nhận được link file sau khi upload.");
    }
    return link;
  },
};