import {
  API_BASE_URL,
  API_ZALO_ACCOUNT,
  API_ZALO_USER_ADMIN,
} from "@/config/api";
import api from "@/lib/axios";
import type {
  ActivityLogsResponse,
  CheckedZaloAccount,
  CreateManagedUserPayload,
  EditManagedUserPayload,
  ListManagedUsersParams,
  ManagedUser,
  ManagedUsersResponse,
  ResetPasswordRequest,
  UserActivityLog,
} from "@/types/zalo-user-admin";

function buildListQuery(params: ListManagedUsersParams): string {
  const search = new URLSearchParams();
  search.set("number_per_page", String(params.pageSize ?? 50));
  search.set("page", String(params.page ?? 1));
  if (params.keyword?.trim()) {
    search.set("keyword", params.keyword.trim());
  }
  if (
    params.permission &&
    params.permission !== "all" &&
    params.permission !== "no_active"
  ) {
    search.set("permission", params.permission);
  }
  if (params.startDate) search.set("start_date", params.startDate);
  if (params.endDate) search.set("end_date", params.endDate);
  return search.toString();
}

function normalizePaginated<T>(body: unknown): { results: T[]; count: number } {
  if (body && typeof body === "object" && "results" in body) {
    const data = body as { results?: T[]; count?: number };
    return {
      results: Array.isArray(data.results) ? data.results : [],
      count: typeof data.count === "number" ? data.count : 0,
    };
  }
  return { results: [], count: 0 };
}

export const zaloUserAdminService = {
  async listUsers(params: ListManagedUsersParams): Promise<ManagedUsersResponse> {
    const query = buildListQuery(params);
    const endpoint =
      params.permission === "no_active"
        ? API_ZALO_USER_ADMIN.LIST_ACTIVATIONS
        : API_ZALO_USER_ADMIN.LIST;
    const response = await api.get(`${endpoint}?${query}`);
    const normalized = normalizePaginated<ManagedUser>(response.data);
    return {
      ...normalized,
      next: null,
      previous: null,
    };
  },

  async listActivityLogs(params: {
    page?: number;
    pageSize?: number;
  }): Promise<ActivityLogsResponse> {
    const search = new URLSearchParams();
    search.set("number_per_page", String(params.pageSize ?? 50));
    search.set("page", String(params.page ?? 1));
    const response = await api.get(
      `${API_ZALO_USER_ADMIN.ACTIVITY_LOGS}?${search.toString()}`,
    );
    const normalized = normalizePaginated<UserActivityLog>(response.data);
    return {
      ...normalized,
      next: null,
      previous: null,
    };
  },

  async createUser(payload: CreateManagedUserPayload): Promise<void> {
    await api.post(API_ZALO_USER_ADMIN.CREATE, payload);
  },

  async editUser(payload: EditManagedUserPayload): Promise<void> {
    await api.patch(API_ZALO_USER_ADMIN.EDIT, payload);
  },

  async deleteUser(id: number): Promise<void> {
    await api.post(API_ZALO_USER_ADMIN.DELETE, { id_manager: id });
  },

  async lockUser(id: number): Promise<void> {
    await api.post(API_ZALO_USER_ADMIN.LOCK, { id_user: id });
  },

  async unblockUser(id: number): Promise<void> {
    await api.post(API_ZALO_USER_ADMIN.UNBLOCK, { id_user: id });
  },

  async activateUser(token: string): Promise<void> {
    const url = `${API_BASE_URL}${API_ZALO_USER_ADMIN.ACTIVATE}?token=${encodeURIComponent(token)}`;
    const response = await fetch(url, { method: "GET" });
    if (!response.ok) {
      let message = "Kích hoạt thất bại";
      try {
        const data = (await response.json()) as { error?: string; message?: string };
        message = data.error ?? data.message ?? message;
      } catch {
        /* ignore */
      }
      throw new Error(message);
    }
  },

  async searchManagers(keyword: string): Promise<ManagedUser[]> {
    const search = new URLSearchParams({
      number_per_page: "20",
      page: "1",
      keyword,
      permission: "is_manager",
    });
    const response = await api.get(`${API_ZALO_USER_ADMIN.LIST}?${search.toString()}`);
    return normalizePaginated<ManagedUser>(response.data).results;
  },

  async addAccountLimit(userId: number, accountLimit: number): Promise<void> {
    await api.post(API_ZALO_USER_ADMIN.ADD_ACCOUNT_LIMIT, {
      user_id: userId,
      account_limit: accountLimit,
    });
  },

  async addEmployeeLimit(userId: number, employeeLimit: number): Promise<void> {
    await api.post(API_ZALO_USER_ADMIN.ADD_EMPLOYEE_LIMIT, {
      user_id: userId,
      employee_limit: employeeLimit,
    });
  },

  async listResetPasswordRequests(): Promise<ResetPasswordRequest[]> {
    const response = await api.get(API_ZALO_USER_ADMIN.RESET_PASS_LIST);
    return Array.isArray(response.data) ? response.data : [];
  },

  async resetPassword(username: string): Promise<void> {
    await api.post(API_ZALO_USER_ADMIN.RESET_PASS, { username });
  },

  async deleteResetPasswordRequest(id: number): Promise<void> {
    await api.post(API_ZALO_USER_ADMIN.RESET_PASS_DELETE, { id });
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await api.post(API_ZALO_USER_ADMIN.CHANGE_PASSWORD, {
      old_password: oldPassword,
      new_password: newPassword,
    });
  },

  async checkAccounts(phone: string, name: string): Promise<CheckedZaloAccount[]> {
    const search = new URLSearchParams({
      phone_number: phone,
      name,
    });
    const response = await api.get(`${API_ZALO_ACCOUNT.ACCOUNTS}?${search.toString()}`);
    return Array.isArray(response.data) ? response.data : [];
  },

  async deleteCheckedAccount(id: number): Promise<void> {
    await api.post(API_ZALO_ACCOUNT.DELETE, { ids: [id] });
  },

  async exportUsers(params: {
    permission: string;
    startDate: string;
    endDate: string;
  }): Promise<Record<string, unknown>[]> {
    const search = new URLSearchParams({
      permission: params.permission,
      start_date: params.startDate,
      end_date: params.endDate,
    });
    const response = await api.get(
      `${API_ZALO_USER_ADMIN.EXPORT}?${search.toString()}`,
    );
    return Array.isArray(response.data) ? response.data : [];
  },
};