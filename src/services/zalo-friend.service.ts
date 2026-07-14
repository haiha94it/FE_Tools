import { API_ZALO_FRIEND, API_ZALO_LABEL } from "@/config/api";
import { zaloLabelService } from "@/services/zalo-label.service";
import { unwrapApiBody } from "@/lib/api-response";
import {
  buildFriendFetchPayload,
  extractFetchedContacts,
  extractPaginated,
  normalizeZaloFriendList,
} from "@/lib/zalo-contacts-utils";
import api from "@/lib/axios";
import type {
  PaginatedResponse,
  ScanTaskResponse,
  ZaloFriendItem,
  ZaloFriendRecommendItem,
  ZaloLabelCategory,
  ZaloSentFriendRequestItem,
} from "@/types/zalo-contacts";

export const zaloFriendService = {
  async list(params: {
    accountId: number;
    page?: number;
    pageSize?: number;
    name?: string;
    categoryId?: number;
  }): Promise<PaginatedResponse<ZaloFriendItem>> {
    const response = await api.get(API_ZALO_FRIEND.LIST, {
      params: {
        id_account: params.accountId,
        page: params.page ?? 1,
        number_per_page: params.pageSize ?? 100,
        type: "simple",
        ...(params.name ? { name: params.name } : {}),
        ...(params.categoryId
          ? { id_category_message: params.categoryId }
          : {}),
      },
    });
    const page = extractPaginated<unknown>(response.data);
    return {
      ...page,
      results: normalizeZaloFriendList(page.results ?? []),
    };
  },

  /** Lấy avatar/chi tiết — list API type=simple không trả ảnh */
  async fetchDetails(friends: ZaloFriendItem[]): Promise<ZaloFriendItem[]> {
    const idFriends = buildFriendFetchPayload(friends as unknown[]);
    if (!idFriends.length) return [];
    const response = await api.post(API_ZALO_FRIEND.FETCH_DETAILS, {
      id_friends: idFriends,
    });
    const details = normalizeZaloFriendList(
      extractFetchedContacts<unknown>(response.data),
    );
    return details.length
      ? details
      : normalizeZaloFriendList(friends as unknown[]);
  },

  async startScan(accountId: number): Promise<string | number | null> {
    const response = await api.post<ScanTaskResponse>(API_ZALO_FRIEND.SCAN, {
      id_account: accountId,
    });
    const body = unwrapApiBody<ScanTaskResponse>(response.data);
    return body.id_task ?? null;
  },

  async pollScanResult(taskId: string | number): Promise<ScanTaskResponse> {
    const response = await api.post<ScanTaskResponse>(
      API_ZALO_FRIEND.SCAN_RESULT,
      { id_task: taskId },
    );
    return unwrapApiBody<ScanTaskResponse>(response.data);
  },

  async startRecommendScan(accountId: number): Promise<string | number | null> {
    const response = await api.post<ScanTaskResponse>(
      API_ZALO_FRIEND.RECOMMEND_SCAN,
      { id_account: accountId },
    );
    const body = unwrapApiBody<ScanTaskResponse>(response.data);
    return body.id_task ?? null;
  },

  async pollRecommendResult(
    taskId: string | number,
  ): Promise<ScanTaskResponse> {
    const response = await api.post<ScanTaskResponse>(
      API_ZALO_FRIEND.RECOMMEND_RESULT,
      { id_task: taskId },
    );
    return unwrapApiBody<ScanTaskResponse>(response.data);
  },

  async listSentRequests(accountId: number): Promise<ZaloSentFriendRequestItem[]> {
    const response = await api.get(API_ZALO_FRIEND.SENT_REQUEST_SHOW, {
      params: { id_account: accountId },
    });
    const body = unwrapApiBody<unknown>(response.data);
    if (Array.isArray(body)) return body as ZaloSentFriendRequestItem[];
    if (body && typeof body === "object") {
      const record = body as { results?: ZaloSentFriendRequestItem[] };
      return record.results ?? [];
    }
    return [];
  },

  async startSentRequestScan(
    accountId: number,
  ): Promise<string | number | null> {
    const response = await api.post<ScanTaskResponse>(
      API_ZALO_FRIEND.SENT_REQUEST_SCAN,
      { id_account: accountId },
    );
    const body = unwrapApiBody<ScanTaskResponse>(response.data);
    return body.id_task ?? null;
  },

  async pollSentRequestResult(
    taskId: string | number,
  ): Promise<ScanTaskResponse> {
    const response = await api.post<ScanTaskResponse>(
      API_ZALO_FRIEND.SENT_REQUEST_RESULT,
      { id_task: taskId },
    );
    return unwrapApiBody<ScanTaskResponse>(response.data);
  },

  async getRecommendList(
    taskId: string | number,
  ): Promise<ZaloFriendRecommendItem[]> {
    const result = await this.pollRecommendResult(taskId);
    if (Array.isArray(result.data)) {
      return result.data as ZaloFriendRecommendItem[];
    }
    return [];
  },

  async listLabelCategories(accountId: number): Promise<ZaloLabelCategory[]> {
    return zaloLabelService.listCategories(accountId);
  },

  async assignLabel(payload: {
    categoryId: number;
    friendIds: number[];
  }): Promise<void> {
    await api.post(API_ZALO_LABEL.ADD, {
      id_category: payload.categoryId,
      id_friends: payload.friendIds,
    });
  },

  async removeLabel(payload: {
    categoryId: number;
    friendIds: number[];
  }): Promise<void> {
    await api.post(API_ZALO_LABEL.REMOVE, {
      id_category: payload.categoryId,
      id_friends: payload.friendIds,
    });
  },
};