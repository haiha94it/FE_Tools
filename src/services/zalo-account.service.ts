import { API_ZALO_ACCOUNT, API_ZALO_GROUP } from "@/config/api";
import { unwrapApiBody } from "@/lib/api-response";
import api from "@/lib/axios";
import { extractZaloAccounts } from "@/lib/zalo-account-utils";
import type {
  EditZaloAccountPayload,
  ToggleMessageListenerPayload,
  ZaloAccount,
  ZaloAccountCheckResultResponse,
  ZaloAccountCheckTaskResponse,
} from "@/types/zalo-account";

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

  async pollCookieCreateResult(
    taskId: string | number,
  ): Promise<"pending" | "success" | "failure"> {
    const response = await api.post<{
      status?: string;
      error?: string;
      data?: { message?: string; error?: string };
    }>(API_ZALO_ACCOUNT.CREATE_ACCOUNT_MANUAL_RESULT, { id_task: taskId });

    const data = unwrapApiBody<{
      status?: string;
      error?: string;
      data?: { message?: string; error?: string };
    }>(response.data);

    if (data.status === "PENDING" || data.status === "PROGRESS") {
      return "pending";
    }

    if (data.status === "SUCCESS") {
      return "success";
    }

    const message =
      data.error ||
      data.data?.error ||
      data.data?.message ||
      "Thêm tài khoản bằng cookie thất bại.";
    throw new Error(message);
  },

  async getChatbotDisabledFriends(
    accountId: number | string,
  ): Promise<{ chatbot_disabled_friend_uids: string[]; friends: any[] }> {
    const response = await api.get(
      API_ZALO_ACCOUNT.CHATBOT_DISABLED_FRIENDS(accountId),
    );
    return unwrapApiBody<{ chatbot_disabled_friend_uids: string[]; friends: any[] }>(
      response.data,
    );
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
    action: "add" | "remove" | "disable_all" | "enable_all",
    uids?: string[],
  ): Promise<{ chatbot_disabled_friend_uids: string[] }> {
    const response = await api.patch(
      API_ZALO_ACCOUNT.CHATBOT_DISABLED_FRIENDS(accountId),
      { action, chatbot_disabled_friend_uids: uids },
    );
    return unwrapApiBody<{ chatbot_disabled_friend_uids: string[] }>(response.data);
  },

  async fetchFriends(
    params: {
      id_account: number | string;
      page?: number;
      number_per_page?: number;
      all_friend?: boolean;
      name?: string;
    },
  ): Promise<any> {
    const response = await api.get("/api/friend/", { params });
    return response.data;
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
  ): Promise<any> {
    const response = await api.get(API_ZALO_GROUP.SCAN_RESULT, {
      params: { id_task: taskId },
    });
    return response.data;
  },

  async fetchGroupMembers(
    groupId: number | string,
  ): Promise<any> {
    const response = await api.get(API_ZALO_GROUP.GET_MEMBER, {
      params: { id_group: groupId },
    });
    return response.data;
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
  ): Promise<any> {
    const response = await api.post(API_ZALO_GROUP.GET_MEMBER_RESULT, {
      id_task: taskId,
    });
    return response.data;
  },
};