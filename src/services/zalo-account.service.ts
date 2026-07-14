import { API_ZALO_ACCOUNT } from "@/config/api";
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
};