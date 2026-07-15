import { API_ZALO_GROUP, API_ZALO_LABEL } from "@/config/api";
import { zaloLabelService } from "@/services/zalo-label.service";
import { unwrapApiBody } from "@/lib/api-response";
import {
  extractGroupsFromScanTaskPayload,
  getCeleryTaskStatus,
  normalizeCeleryPollResponse,
  unwrapCeleryNestedPayload,
} from "@/lib/celery-poll";
import {
  buildGroupFetchPayload,
  extractFetchedContacts,
  extractPaginated,
  normalizeZaloGroupList,
} from "@/lib/zalo-contacts-utils";
import api from "@/lib/axios";
import type {
  GroupMemberTaskResponse,
  PaginatedResponse,
  ScanTaskResponse,
  ZaloGroupItem,
  ZaloGroupLinkItem,
  ZaloGroupMember,
  ZaloLabelCategory,
} from "@/types/zalo-contacts";

function extractGroupMembers(body: GroupMemberTaskResponse): ZaloGroupMember[] {
  const status = getCeleryTaskStatus(body);
  const payload =
    status === "SUCCESS" ? (body.result ?? body.data) : body.data;
  const unwrapped = unwrapCeleryNestedPayload(payload);
  if (Array.isArray(unwrapped)) return unwrapped as ZaloGroupMember[];
  if (Array.isArray(body.data)) return body.data;
  return [];
}

export const zaloGroupService = {
  async list(params: {
    accountId: number;
    page?: number;
    pageSize?: number;
    name?: string;
    categoryId?: number;
    /** false/undefined → type=simple; true → full GroupDetail (§2.2 contract) */
    detail?: boolean;
  }): Promise<PaginatedResponse<ZaloGroupItem>> {
    const response = await api.get(API_ZALO_GROUP.LIST, {
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
      results: normalizeZaloGroupList(page.results ?? []),
    };
  },

  /** Lấy avatar/chi tiết — list API type=simple không trả ảnh */
  async fetchDetails(groups: ZaloGroupItem[]): Promise<ZaloGroupItem[]> {
    const idGroups = buildGroupFetchPayload(groups as unknown[]);
    if (!idGroups.length) return [];
    const response = await api.post(API_ZALO_GROUP.FETCH_DETAILS, {
      id_groups: idGroups,
    });
    const details = normalizeZaloGroupList(
      extractFetchedContacts<unknown>(response.data),
    );
    return details.length
      ? details
      : normalizeZaloGroupList(groups as unknown[]);
  },

  async startScan(accountIds: number[]): Promise<string | number | null> {
    const response = await api.post<ScanTaskResponse>(API_ZALO_GROUP.SCAN, {
      id_accounts: accountIds,
    });
    const body = unwrapApiBody<ScanTaskResponse>(response.data);
    return body.id_task ?? null;
  },

  async pollScanResult(taskId: string | number): Promise<ScanTaskResponse> {
    const response = await api.post(API_ZALO_GROUP.SCAN_RESULT, {
      id_task: taskId,
    });
    return normalizeCeleryPollResponse(
      unwrapApiBody<ScanTaskResponse>(response.data),
    );
  },

  async startGetLink(accountId: number): Promise<string | number | null> {
    const response = await api.post<ScanTaskResponse>(API_ZALO_GROUP.GET_LINK, {
      id_account: accountId,
    });
    const body = unwrapApiBody<ScanTaskResponse>(response.data);
    return body.id_task ?? null;
  },

  async pollGetLinkResult(taskId: string | number): Promise<ScanTaskResponse> {
    const response = await api.post(API_ZALO_GROUP.GET_LINK_RESULT, {
      id_task: taskId,
    });
    return normalizeCeleryPollResponse(
      unwrapApiBody<ScanTaskResponse>(response.data),
    );
  },

  extractGroupLinks(result: ScanTaskResponse): ZaloGroupLinkItem[] {
    const payload = result.data ?? result.result;
    const groups = extractGroupsFromScanTaskPayload(payload);
    const source = groups.length
      ? groups
      : Array.isArray(payload)
        ? payload
        : [];
    return (source as ZaloGroupLinkItem[]).filter((item) =>
      Boolean(item.link_group?.trim()),
    );
  },

  async listLabelCategories(accountId: number): Promise<ZaloLabelCategory[]> {
    return zaloLabelService.listCategories(accountId);
  },

  async assignLabel(payload: {
    categoryId: number;
    groupIds: number[];
  }): Promise<void> {
    await api.post(API_ZALO_LABEL.ADD, {
      id_category: payload.categoryId,
      id_groups: payload.groupIds,
    });
  },

  async removeLabel(payload: {
    categoryId: number;
    groupIds: number[];
  }): Promise<void> {
    await api.post(API_ZALO_LABEL.REMOVE, {
      id_category: payload.categoryId,
      id_groups: payload.groupIds,
    });
  },

  async showMembers(groupId: number): Promise<ZaloGroupMember[]> {
    const response = await api.post<GroupMemberTaskResponse>(
      API_ZALO_GROUP.GET_MEMBER_SHOW,
      { id_group: groupId, type: "basic" },
    );
    const body = unwrapApiBody<GroupMemberTaskResponse>(response.data);
    return extractGroupMembers(body);
  },

  async startGetMembers(
    accountId: number,
    groupId: number,
  ): Promise<string | number | null> {
    const response = await api.post<ScanTaskResponse>(
      API_ZALO_GROUP.GET_MEMBER,
      { id_account: accountId, id_group: groupId },
    );
    const body = unwrapApiBody<ScanTaskResponse>(response.data);
    return body.id_task ?? null;
  },

  async pollGetMembersResult(
    taskId: string | number,
  ): Promise<GroupMemberTaskResponse> {
    const response = await api.post(API_ZALO_GROUP.GET_MEMBER_RESULT, {
      id_task: taskId,
    });
    const raw = unwrapApiBody<GroupMemberTaskResponse>(response.data);
    const body = normalizeCeleryPollResponse(raw) as GroupMemberTaskResponse;
    return {
      ...body,
      data: extractGroupMembers(body),
    };
  },

  async showMembersByLink(
    accountId: number,
    link: string,
  ): Promise<ZaloGroupMember[]> {
    const response = await api.post<GroupMemberTaskResponse>(
      API_ZALO_GROUP.SHOW_MEMBER_LINK,
      { id_account: accountId, link },
    );
    const body = unwrapApiBody<GroupMemberTaskResponse>(response.data);
    return extractGroupMembers(body);
  },
};