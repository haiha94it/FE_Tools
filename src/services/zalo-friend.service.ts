import { API_ZALO_FRIEND } from "@/config/api";
import { zaloLabelService } from "@/services/zalo-label.service";
import { unwrapApiBody } from "@/lib/api-response";
import { normalizeCeleryPollResponse } from "@/lib/celery-poll";
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
    /** false/undefined → type=simple + hydrate; true → full FriendDetail (§2.1 contract) */
    detail?: boolean;
  }): Promise<PaginatedResponse<ZaloFriendItem>> {
    const response = await api.get(API_ZALO_FRIEND.LIST, {
      params: {
        id_account: params.accountId,
        page: params.page ?? 1,
        number_per_page: params.pageSize ?? 100,
        ...(params.detail ? {} : { type: "simple" }),
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
    const response = await api.post(API_ZALO_FRIEND.SCAN, { id_task: taskId });
    return normalizeCeleryPollResponse(
      unwrapApiBody<ScanTaskResponse>(response.data),
    );
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
    const response = await api.post(API_ZALO_FRIEND.RECOMMEND_SCAN, {
      id_task: taskId,
    });
    return normalizeCeleryPollResponse(
      unwrapApiBody<ScanTaskResponse>(response.data),
    );
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
    const response = await api.post(API_ZALO_FRIEND.SENT_REQUEST_SCAN, {
      id_task: taskId,
    });
    return normalizeCeleryPollResponse(
      unwrapApiBody<ScanTaskResponse>(response.data),
    );
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

  async startAcceptFriendRequest(
    accountId: number,
    fid: string,
  ): Promise<string | number | null> {
    const response = await api.post(API_ZALO_FRIEND.RECOMMEND_ACCEPT, {
      id_account: accountId,
      fid,
    });
    const body = unwrapApiBody<ScanTaskResponse>(response.data);
    return body.id_task ?? null;
  },

  async pollAcceptFriendRequest(
    taskId: string | number,
  ): Promise<ScanTaskResponse> {
    const response = await api.post(API_ZALO_FRIEND.RECOMMEND_ACCEPT, {
      id_task: taskId,
    });
    return normalizeCeleryPollResponse(
      unwrapApiBody<ScanTaskResponse>(response.data),
    );
  },

  async startRejectFriendRequest(
    accountId: number,
    fid: string,
  ): Promise<string | number | null> {
    const response = await api.post(API_ZALO_FRIEND.RECOMMEND_REMOVE, {
      id_account: accountId,
      fid,
    });
    const body = unwrapApiBody<ScanTaskResponse>(response.data);
    return body.id_task ?? null;
  },

  async pollRejectFriendRequest(
    taskId: string | number,
  ): Promise<ScanTaskResponse> {
    const response = await api.post(API_ZALO_FRIEND.RECOMMEND_REMOVE, {
      id_task: taskId,
    });
    return normalizeCeleryPollResponse(
      unwrapApiBody<ScanTaskResponse>(response.data),
    );
  },

  async startAddFriend(
    accountId: number,
    uids: string[],
    msg: string,
  ): Promise<string | number | null> {
    const response = await api.post(API_ZALO_FRIEND.ADD_FRIEND, {
      id_account: accountId,
      uids,
      msg,
    });
    const body = unwrapApiBody<ScanTaskResponse>(response.data);
    return body.id_task ?? null;
  },

  async pollAddFriend(taskId: string | number): Promise<ScanTaskResponse> {
    const response = await api.post(API_ZALO_FRIEND.ADD_FRIEND, {
      id_task: taskId,
    });
    return normalizeCeleryPollResponse(
      unwrapApiBody<ScanTaskResponse>(response.data),
    );
  },

  async startUnfriend(
    accountId: number,
    fids: string[],
  ): Promise<string | number | null> {
    const response = await api.post(API_ZALO_FRIEND.UNFRIEND, {
      id_account: accountId,
      fids,
    });
    const body = unwrapApiBody<ScanTaskResponse>(response.data);
    return body.id_task ?? null;
  },

  async pollUnfriend(taskId: string | number): Promise<ScanTaskResponse> {
    const response = await api.post(API_ZALO_FRIEND.UNFRIEND, {
      id_task: taskId,
    });
    return normalizeCeleryPollResponse(
      unwrapApiBody<ScanTaskResponse>(response.data),
    );
  },

  async startRecallSentRequest(
    accountId: number,
    fids: string[],
  ): Promise<string | number | null> {
    const response = await api.post(API_ZALO_FRIEND.SENT_REQUEST_REMOVE, {
      id_account: accountId,
      fids,
    });
    const body = unwrapApiBody<ScanTaskResponse>(response.data);
    return body.id_task ?? null;
  },

  async pollRecallSentRequest(
    taskId: string | number,
  ): Promise<ScanTaskResponse> {
    const response = await api.post(API_ZALO_FRIEND.SENT_REQUEST_REMOVE, {
      id_task: taskId,
    });
    return normalizeCeleryPollResponse(
      unwrapApiBody<ScanTaskResponse>(response.data),
    );
  },

  async listLabelCategories(accountId: number): Promise<ZaloLabelCategory[]> {
    return zaloLabelService.listCategories(accountId);
  },

  async assignLabel(payload: {
    accountId: number;
    categoryId: number;
    friendIds: number[];
  }): Promise<void> {
    await zaloLabelService.addMembers({
      categoryId: payload.categoryId,
      accountId: payload.accountId,
      friendIds: payload.friendIds,
    });
  },

  async removeLabel(payload: {
    accountId: number;
    categoryId: number;
    friendIds: number[];
  }): Promise<void> {
    await zaloLabelService.removeMembers({
      categoryId: payload.categoryId,
      accountId: payload.accountId,
      friendIds: payload.friendIds,
    });
  },
};