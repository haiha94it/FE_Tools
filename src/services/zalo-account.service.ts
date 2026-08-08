import { API_ZALO_ACCOUNT, API_ZALO_GROUP } from "@/config/api";
import { unwrapPaginatedPayload } from "@/lib/campaign-service";
import { unwrapApiBody } from "@/lib/api-response";
import api from "@/lib/axios";
import { extractZaloAccounts } from "@/lib/zalo-account-utils";
import { extractGroupMembersFromPoll } from "@/lib/zalo-contacts-utils";
import type {
  EditZaloAccountPayload,
  ToggleChatbotPayload,
  ToggleMessageListenerPayload,
  ZaloAccount,
  ZaloAccountCheckResultResponse,
  ZaloAccountCheckTaskResponse,
} from "@/types/zalo-account";
import type { ZaloGroupMember } from "@/types/zalo-contacts";
import type { PaginatedResponse } from "@/types/api";

export interface FriendAutomationItem {
  id?: number;
  uid: string;
  name?: string;
  alias_name?: string;
  avatar?: string;
  is_chatbot_disabled: boolean;
  is_reminder_paused: boolean;
  last_interaction?: string | null;
}

export interface FriendAutomationPage extends PaginatedResponse<FriendAutomationItem> {
  account_id?: number;
  chatbot_disabled_friend_uids: string[];
  reminder_paused_friend_uids: string[];
}

/**
 * ZaloCN /accounts — dùng API chính + token login (/api/users/login).
 * Không gọi login-care hay care-axios riêng.
 */
export const zaloAccountService = {
  async list(): Promise<ZaloAccount[]> {
    const response = await api.get(API_ZALO_ACCOUNT.ACCOUNTS);
    return extractZaloAccounts(response.data);
  },

  async edit(payload: EditZaloAccountPayload): Promise<void> {
    await api.post(API_ZALO_ACCOUNT.EDIT, payload);
  },

  async delete(ids: number[]): Promise<void> {
    await api.post(API_ZALO_ACCOUNT.DELETE, { ids });
  },

  async startCheck(ids: number[]): Promise<string | number | null> {
    const response = await api.post<ZaloAccountCheckTaskResponse>(
      API_ZALO_ACCOUNT.CHECK,
      { id_accounts: ids },
    );
    const body = unwrapApiBody<ZaloAccountCheckTaskResponse>(response.data);
    return body.id_task ?? null;
  },

  async pollCheckResult(
    taskId: string | number,
  ): Promise<ZaloAccountCheckResultResponse> {
    const response = await api.post<ZaloAccountCheckResultResponse>(
      API_ZALO_ACCOUNT.CHECK_RESULT,
      { id_task: taskId },
    );
    return unwrapApiBody<ZaloAccountCheckResultResponse>(response.data);
  },

  async createByCookie(body: {
    imei: string;
    proxy: string;
    cookie: string;
    user_agent: string;
  }): Promise<string | number | null> {
    const response = await api.post<{ id_task?: string | number; error?: string }>(
      API_ZALO_ACCOUNT.CREATE_ACCOUNT_MANUAL,
      body,
    );
    const data = unwrapApiBody<{ id_task?: string | number; error?: string }>(
      response.data,
    );
    if (!data.id_task) {
      throw new Error(data.error || "Không nhận được mã tác vụ thêm tài khoản.");
    }
    return data.id_task;
  },

  async toggleMessageListener(
    payload: ToggleMessageListenerPayload,
  ): Promise<void> {
    await api.post(API_ZALO_ACCOUNT.TOGGLE_MESSAGE_LISTENER, payload);
  },

  async toggleChatbot(payload: ToggleChatbotPayload): Promise<ZaloAccount> {
    const response = await api.post(API_ZALO_ACCOUNT.TOGGLE_CHATBOT, payload);
    // Interceptor đã unwrap envelope → response.data = account object
    const body = response.data as unknown;
    if (body && typeof body === "object" && "id" in (body as object)) {
      return body as ZaloAccount;
    }
    return unwrapApiBody<ZaloAccount>(body);
  },

  async pollCookieCreateResult(
    taskId: string | number,
  ): Promise<"pending" | "success" | "failure"> {
    type CookieCreatePoll = {
      task_status?: string;
      status?: string;
      message?: string;
      error?: string;
      result?: {
        success?: boolean;
        message?: string;
        error?: string;
      };
      data?: { message?: string; error?: string };
    };

    const response = await api.post<CookieCreatePoll>(
      API_ZALO_ACCOUNT.CREATE_ACCOUNT_MANUAL_RESULT,
      { id_task: taskId },
    );
    const data = unwrapApiBody<CookieCreatePoll>(response.data);
    const taskStatus = (data.task_status ?? data.status)?.toUpperCase();

    if (taskStatus === "PENDING" || taskStatus === "PROGRESS") {
      return "pending";
    }

    if (taskStatus === "SUCCESS" && data.result?.success !== false) {
      return "success";
    }

    const message =
      data.result?.message ||
      data.result?.error ||
      data.error ||
      data.data?.error ||
      data.data?.message ||
      data.message ||
      "Thêm tài khoản bằng cookie thất bại.";
    throw new Error(message);
  },

  async getChatbotDisabledFriends(
    accountId: number | string,
    params?: { page?: number; number_per_page?: number; name?: string; uid?: string },
  ): Promise<FriendAutomationPage> {
    const response = await api.get(
      API_ZALO_ACCOUNT.CHATBOT_DISABLED_FRIENDS(accountId),
      { params },
    );
    const body = unwrapApiBody<FriendAutomationPage>(response.data);
    return {
      ...unwrapPaginatedPayload<FriendAutomationItem>(body),
      account_id: body.account_id,
      chatbot_disabled_friend_uids: body.chatbot_disabled_friend_uids ?? [],
      reminder_paused_friend_uids: body.reminder_paused_friend_uids ?? [],
    };
  },

  async saveChatbotDisabledFriends(
    accountId: number | string,
    disabledUids: string[],
  ): Promise<void> {
    await api.put(
      API_ZALO_ACCOUNT.CHATBOT_DISABLED_FRIENDS(accountId),
      { chatbot_disabled_friend_uids: disabledUids },
    );
  },

  async patchChatbotDisabledFriends(
    accountId: number | string,
    action:
      | "add"
      | "remove"
      | "disable_all"
      | "enable_all"
      | "pause_reminder"
      | "resume_reminder"
      | "pause_reminder_all"
      | "resume_reminder_all",
    uids?: string[],
  ): Promise<{
    chatbot_disabled_friend_uids: string[];
    reminder_paused_friend_uids: string[];
  }> {
    const response = await api.patch(
      API_ZALO_ACCOUNT.CHATBOT_DISABLED_FRIENDS(accountId),
      { action, chatbot_disabled_friend_uids: uids },
    );
    return unwrapApiBody<{
      chatbot_disabled_friend_uids: string[];
      reminder_paused_friend_uids: string[];
    }>(response.data);
  },

  async fetchFriends(
    params: {
      id_account: number | string;
      page?: number;
      number_per_page?: number;
      all_friend?: boolean;
      name?: string;
    },
  ): Promise<PaginatedResponse<FriendAutomationItem>> {
    const response = await api.get("/api/friend/", { params });
    return unwrapPaginatedPayload<FriendAutomationItem>(
      unwrapApiBody(response.data),
    );
  },

  async fetchGroupsByAccount(
    accountId: number | string,
    page = 1,
    search = "",
  ): Promise<any> {
    const response = await api.get(API_ZALO_GROUP.LIST, {
      params: {
        number_per_page: 100,
        page,
        id_account: accountId,
        name: search.trim() || undefined,
      },
    });
    return response.data;
  },

  async scanGroupsByAccount(
    accountId: number | string,
  ): Promise<{ id_task: string | number }> {
    const response = await api.post(API_ZALO_GROUP.SCAN, {
      id_accounts: [accountId],
    });
    return response.data;
  },

  async pollGroupScanResult(
    taskId: string | number,
  ): Promise<{
    status?: string;
    task_status?: string;
    data?: unknown;
    message?: string;
    id_task?: string | number;
  }> {
    // BE: POST /api/group/get/result body { id_task } — GET → 405
    const response = await api.post(API_ZALO_GROUP.SCAN_RESULT, {
      id_task: taskId,
    });
    return response.data;
  },

  async fetchGroupMembers(
    groupId: number | string,
  ): Promise<ZaloGroupMember[]> {
    const response = await api.post(API_ZALO_GROUP.GET_MEMBER_SHOW, {
      id_group: groupId,
      type: "basic",
    });
    // interceptor unwrap envelope → { status, data: members[] } hoặc list
    return extractGroupMembersFromPoll(response.data).members;
  },

  async scanGroupMembers(
    accountId: number | string,
    groupId: number | string,
  ): Promise<{ id_task: string | number }> {
    const response = await api.post(API_ZALO_GROUP.GET_MEMBER, {
      id_account: accountId,
      id_group: groupId,
    });
    return response.data;
  },

  async pollGroupMemberScanResult(
    taskId: string | number,
  ): Promise<{
    status?: string;
    task_status?: string;
    data?: ZaloGroupMember[];
    message?: string;
  }> {
    const response = await api.post(API_ZALO_GROUP.GET_MEMBER_RESULT, {
      id_task: taskId,
    });
    const body =
      response.data && typeof response.data === "object"
        ? (response.data as Record<string, unknown>)
        : {};
    const status =
      (typeof body.task_status === "string" ? body.task_status : undefined) ??
      (typeof body.status === "string" ? body.status : undefined);
    const members = extractGroupMembersFromPoll(response.data).members;
    return {
      status,
      task_status: status,
      data: members,
      message:
        typeof body.message === "string" ? body.message : undefined,
    };
  },
};
