import { API_ZALO_PROXY } from "@/config/api";
import { unwrapApiBody } from "@/lib/api-response";
import { extractZaloProxies } from "@/lib/zalo-proxy-utils";
import api from "@/lib/axios";
import type {
  CreateZaloProxyPayload,
  EditZaloProxyPayload,
  ZaloProxyCheckTaskResponse,
  ZaloProxyItem,
} from "@/types/zalo-proxy";

export const zaloProxyService = {
  async list(): Promise<ZaloProxyItem[]> {
    const response = await api.get(API_ZALO_PROXY.LIST);
    return extractZaloProxies(response.data);
  },

  async create(payload: CreateZaloProxyPayload): Promise<void> {
    await api.post(API_ZALO_PROXY.ADD, payload);
  },

  async edit(payload: EditZaloProxyPayload): Promise<void> {
    await api.post(API_ZALO_PROXY.EDIT, payload);
  },

  async delete(ids: number[]): Promise<void> {
    await api.post(API_ZALO_PROXY.DELETE, { id_proxies: ids });
  },

  async startCheck(ids: number[]): Promise<string | number | null> {
    const response = await api.post<ZaloProxyCheckTaskResponse>(
      API_ZALO_PROXY.CHECK,
      { id_proxies: ids },
    );
    const body = unwrapApiBody<ZaloProxyCheckTaskResponse>(response.data);
    return body.id_task ?? null;
  },

  async pollCheckResult(
    taskId: string | number,
  ): Promise<ZaloProxyCheckTaskResponse> {
    const response = await api.post<ZaloProxyCheckTaskResponse>(
      API_ZALO_PROXY.CHECK_RESULT,
      { id_task: taskId },
    );
    return unwrapApiBody<ZaloProxyCheckTaskResponse>(response.data);
  },
};