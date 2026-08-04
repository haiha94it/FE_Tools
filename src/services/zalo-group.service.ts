import { API_ZALO_GROUP } from "@/config/api";
import { zaloLabelService } from "@/services/zalo-label.service";
import { unwrapApiBody } from "@/lib/api-response";
import {
  extractGroupsFromScanTaskPayload,
  getCeleryTaskStatus,
  isCeleryTaskDone,
  normalizeCeleryPollResponse,
} from "@/lib/celery-poll";
import {
  buildGroupFetchPayload,
  extractFetchedContacts,
  extractGroupMembersFromPoll,
  extractPaginated,
  normalizeZaloGroupList,
} from "@/lib/zalo-contacts-utils";
import api from "@/lib/axios";
import { dedupeInflight } from "@/lib/inflight";
import type {
  GroupMemberTaskResponse,
  PaginatedResponse,
  ScanTaskResponse,
  ZaloGroupItem,
  ZaloGroupLinkItem,
  ZaloGroupMember,
  ZaloLabelCategory,
} from "@/types/zalo-contacts";
import type { ZaloGroupSettingPayload } from "@/types/zalo-group-settings";

const GROUP_TASK_POLL_MS = 1200;
const GROUP_TASK_MAX_ATTEMPTS = 40;

/** Poll Celery group task tới xong — trả result SUCCESS hoặc fail message */
async function pollGroupCeleryTask(
  startPath: string,
  resultPath: string,
  body: Record<string, unknown>,
): Promise<{ ok: boolean; message?: string; data?: unknown }> {
  const startRes = await api.post(startPath, body);
  const startBody = unwrapApiBody<{ id_task?: string | number; message?: string }>(
    startRes.data,
  );
  const idTask = startBody.id_task;
  if (!idTask) {
    return { ok: false, message: startBody.message || "Không tạo được tác vụ." };
  }

  for (let i = 0; i < GROUP_TASK_MAX_ATTEMPTS; i += 1) {
    await new Promise((r) => setTimeout(r, GROUP_TASK_POLL_MS));
    const pollRes = await api.post(resultPath, { id_task: idTask });
    const raw = pollRes.data;
    const normalized = normalizeCeleryPollResponse(
      raw && typeof raw === "object" && "task_status" in (raw as object)
        ? (raw as ScanTaskResponse)
        : unwrapApiBody<ScanTaskResponse>(raw),
    );
    const status = getCeleryTaskStatus(normalized);
    if (!isCeleryTaskDone(status)) continue;

    if (status === "SUCCESS") {
      const payload = normalized.data ?? normalized.result;
      // result có thể envelope { success: false }
      if (
        payload &&
        typeof payload === "object" &&
        "success" in (payload as object) &&
        (payload as { success?: boolean }).success === false
      ) {
        return {
          ok: false,
          message:
            (payload as { message?: string }).message ||
            normalized.message ||
            "Thao tác thất bại.",
          data: payload,
        };
      }
      return {
        ok: true,
        message: normalized.message || "Thành công",
        data: payload,
      };
    }
    return {
      ok: false,
      message: normalized.message || "Tác vụ thất bại.",
      data: normalized.data ?? normalized.result,
    };
  }
  return { ok: false, message: "Hết thời gian chờ tác vụ nhóm." };
}

function extractGroupMembers(body: unknown): ZaloGroupMember[] {
  return extractGroupMembersFromPoll(body).members;
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
    const key = `group:fetchs:${[...idGroups].sort((a, b) => a - b).join(",")}`;
    return dedupeInflight(key, async () => {
      const response = await api.post(API_ZALO_GROUP.FETCH_DETAILS, {
        id_groups: idGroups,
      });
      const details = normalizeZaloGroupList(
        extractFetchedContacts<unknown>(response.data),
      );
      return details.length
        ? details
        : normalizeZaloGroupList(groups as unknown[]);
    });
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
    accountId: number;
    categoryId: number;
    groupIds: number[];
  }): Promise<void> {
    await zaloLabelService.addMembers({
      categoryId: payload.categoryId,
      accountId: payload.accountId,
      groupIds: payload.groupIds,
    });
  },

  async removeLabel(payload: {
    accountId: number;
    categoryId: number;
    groupIds: number[];
  }): Promise<void> {
    await zaloLabelService.removeMembers({
      categoryId: payload.categoryId,
      accountId: payload.accountId,
      groupIds: payload.groupIds,
    });
  },

  async showMembers(
    groupId: number,
    options?: { signal?: AbortSignal },
  ): Promise<ZaloGroupMember[]> {
    const response = await api.post(
      API_ZALO_GROUP.GET_MEMBER_SHOW,
      { id_group: groupId, type: "basic" },
      { signal: options?.signal },
    );
    // interceptor unwrap envelope — body có thể là list hoặc { data, group_name }
    return extractGroupMembers(response.data);
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
    // axios interceptor may already unwrap envelope → Celery poll body
    const rawBody = response.data;
    const raw =
      rawBody &&
      typeof rawBody === "object" &&
      "task_status" in (rawBody as object)
        ? (rawBody as GroupMemberTaskResponse)
        : unwrapApiBody<GroupMemberTaskResponse>(rawBody);
    const body = normalizeCeleryPollResponse(raw) as GroupMemberTaskResponse;
    const extracted = extractGroupMembersFromPoll({
      ...body,
      // Prefer original nested result for double unwrap (result.data)
      result: raw.result ?? body.result,
      data: body.data,
      task_status: body.task_status ?? raw.task_status,
    });
    return {
      ...body,
      data: extracted.members,
      group_name: extracted.groupName ?? body.group_name,
      total_member: extracted.totalMember ?? body.total_member,
    };
  },

  async showMembersByLink(
    accountId: number,
    link: string,
  ): Promise<ZaloGroupMember[]> {
    const response = await api.post(API_ZALO_GROUP.SHOW_MEMBER_LINK, {
      id_account: accountId,
      link,
    });
    return extractGroupMembers(response.data);
  },

  /** GET setting nhóm — poll result → { setting, group_id } */
  async getGroupSetting(
    accountId: number,
    groupId: number,
  ): Promise<{ ok: boolean; setting?: ZaloGroupSettingPayload; message?: string }> {
    const res = await pollGroupCeleryTask(
      API_ZALO_GROUP.GET_SETTING,
      API_ZALO_GROUP.GET_SETTING_RESULT,
      { id_account: accountId, id_group: groupId },
    );
    if (!res.ok) return { ok: false, message: res.message };
    const data = res.data as Record<string, unknown> | null;
    const setting =
      (data?.setting as ZaloGroupSettingPayload | undefined) ??
      (data as ZaloGroupSettingPayload | undefined);
    return { ok: true, setting: setting ?? undefined, message: res.message };
  },

  /** Cập nhật setting — body.setting gồm grid + cờ 0/1 (Care) */
  async changeGroupSetting(
    accountId: number,
    setting: ZaloGroupSettingPayload,
  ): Promise<{ ok: boolean; message?: string }> {
    return pollGroupCeleryTask(
      API_ZALO_GROUP.CHANGE_SETTING,
      API_ZALO_GROUP.CHANGE_SETTING_RESULT,
      { id_account: accountId, setting },
    );
  },

  async changeGroupName(
    accountId: number,
    groupId: number,
    name: string,
  ): Promise<{ ok: boolean; message?: string }> {
    return pollGroupCeleryTask(
      API_ZALO_GROUP.CHANGE_NAME,
      API_ZALO_GROUP.CHANGE_NAME_RESULT,
      { id_account: accountId, id_group: groupId, name },
    );
  },

  /**
   * Đổi avatar nhóm — `file` path chứa chứa BE (chứa `/media/files/`).
   * Upload trước qua messenger uploadFile.
   */
  async changeGroupAvatar(
    accountId: number,
    groupId: number,
    filePath: string,
  ): Promise<{ ok: boolean; message?: string }> {
    return pollGroupCeleryTask(
      API_ZALO_GROUP.CHANGE_AVATAR,
      API_ZALO_GROUP.CHANGE_AVATAR_RESULT,
      {
        id_account: accountId,
        id_group: groupId,
        for_group: true,
        file: filePath,
      },
    );
  },

  async addGroupAdmin(
    accountId: number,
    groupId: number,
    uidAdmin: string,
  ): Promise<{ ok: boolean; message?: string }> {
    return pollGroupCeleryTask(
      API_ZALO_GROUP.ADD_ADMIN,
      API_ZALO_GROUP.ADD_ADMIN_RESULT,
      { id_account: accountId, id_group: groupId, uid_admin: uidAdmin },
    );
  },

  async removeGroupAdmin(
    accountId: number,
    groupId: number,
    uidAdmin: string,
  ): Promise<{ ok: boolean; message?: string }> {
    return pollGroupCeleryTask(
      API_ZALO_GROUP.REMOVE_ADMIN,
      API_ZALO_GROUP.REMOVE_ADMIN_RESULT,
      { id_account: accountId, id_group: groupId, uid_admin: uidAdmin },
    );
  },

  /** Kick members khỏi nhóm — POST /api/group/remove-member */
  async removeGroupMembers(
    accountId: number,
    groupId: number,
    uids: string[],
  ): Promise<{ ok: boolean; message?: string; data?: unknown }> {
    return pollGroupCeleryTask(
      API_ZALO_GROUP.REMOVE_MEMBER,
      API_ZALO_GROUP.REMOVE_MEMBER_RESULT,
      { id_account: accountId, id_group: groupId, uids },
    );
  },

  /** Mời bạn bè vào nhóm — POST /api/group/invite-member */
  async inviteGroupMembers(
    accountId: number,
    groupId: number,
    uids: string[],
  ): Promise<{ ok: boolean; message?: string; data?: unknown }> {
    return pollGroupCeleryTask(
      API_ZALO_GROUP.INVITE_MEMBER,
      API_ZALO_GROUP.INVITE_MEMBER_RESULT,
      { id_account: accountId, id_group: groupId, uids },
    );
  },
};