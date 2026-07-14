import { API_CHANNEL_VIDEO } from "@/config/api";
import { unwrapApiBody } from "@/lib/api-response";
import api from "@/lib/axios";
import {
  getVideoTaskStatus,
  isVideoTaskPending,
  isVideoTaskTerminal,
  normalizeVideoTaskResult,
} from "@/lib/zalo-video/task-utils";
import type {
  DownloadZaloVideoPayload,
  PostZaloVideoPayload,
  RenewGeneralType,
  ZaloChannelInfo,
  ZaloVideoTaskResultResponse,
  ZaloVideoUploadResponse,
} from "@/types/zalo-video";

function buildTaskResultPayload(taskId: string | number) {
  return { id_task: taskId };
}

function extractTaskId(data: unknown): string | number | null {
  if (data == null) return null;
  if (typeof data === "string" || typeof data === "number") return data;

  if (typeof data === "object") {
    const record = data as Record<string, unknown>;
    const id = record.id_task ?? record.task_id ?? record.id;
    if (typeof id === "string" || typeof id === "number") return id;
  }

  return null;
}

async function pollTask(
  pollFn: (taskId: string | number) => Promise<ZaloVideoTaskResultResponse>,
  taskId: string | number,
  intervalMs = 3000,
): Promise<ZaloVideoTaskResultResponse> {
  return new Promise((resolve, reject) => {
    let timer: ReturnType<typeof setInterval> | null = null;
    let settled = false;
    let inFlight = false;

    const cleanup = () => {
      if (timer != null) {
        clearInterval(timer);
        timer = null;
      }
    };

    const finish = (handler: () => void) => {
      if (settled) return;
      settled = true;
      cleanup();
      handler();
    };

    const run = async () => {
      if (settled || inFlight) return;
      inFlight = true;

      try {
        const raw = await pollFn(taskId);
        if (settled) return;

        const normalized = normalizeVideoTaskResult(raw);
        const taskStatus = getVideoTaskStatus(normalized);

        if (isVideoTaskPending(taskStatus)) return;

        finish(() => resolve(normalized));
      } catch (error) {
        finish(() => reject(error));
      } finally {
        inFlight = false;
      }
    };

    void run();
    timer = setInterval(() => void run(), intervalMs);
  });
}

export const zaloVideoService = {
  async getChannelInfo(accountId: number): Promise<ZaloChannelInfo | null> {
    const response = await api.get<ZaloChannelInfo>(API_CHANNEL_VIDEO.INFO, {
      params: { id_account: accountId },
    });
    return response.data ?? null;
  },

  async startLoginChannel(accountId: number): Promise<string | number> {
    const response = await api.post(API_CHANNEL_VIDEO.LOGIN, {
      id_account: accountId,
    });
    const taskId = extractTaskId(unwrapApiBody(response.data));
    if (taskId == null) throw new Error("Không nhận được mã tác vụ đăng nhập kênh.");
    return taskId;
  },

  async pollLoginResult(taskId: string | number): Promise<ZaloVideoTaskResultResponse> {
    const response = await api.post<ZaloVideoTaskResultResponse>(
      API_CHANNEL_VIDEO.LOGIN_RESULT,
      buildTaskResultPayload(taskId),
    );
    return unwrapApiBody<ZaloVideoTaskResultResponse>(response.data);
  },

  async loginChannel(accountId: number): Promise<ZaloVideoTaskResultResponse> {
    const taskId = await this.startLoginChannel(accountId);
    return pollTask((id) => this.pollLoginResult(id), taskId, 1000);
  },

  async startRenewChannel(accountId: number): Promise<string | number> {
    const response = await api.post(API_CHANNEL_VIDEO.RENEW, {
      id_account: accountId,
    });
    const taskId = extractTaskId(unwrapApiBody(response.data));
    if (taskId == null) throw new Error("Không nhận được mã tác vụ làm mới kênh.");
    return taskId;
  },

  async pollRenewResult(taskId: string | number): Promise<ZaloVideoTaskResultResponse> {
    const response = await api.post<ZaloVideoTaskResultResponse>(
      API_CHANNEL_VIDEO.RENEW_RESULT,
      buildTaskResultPayload(taskId),
    );
    return unwrapApiBody<ZaloVideoTaskResultResponse>(response.data);
  },

  async renewChannel(accountId: number): Promise<void> {
    const taskId = await this.startRenewChannel(accountId);
    await pollTask((id) => this.pollRenewResult(id), taskId, 3000);
  },

  async startRenewGeneral(
    accountId: number,
    type: RenewGeneralType,
  ): Promise<string | number> {
    const response = await api.post(API_CHANNEL_VIDEO.RENEW_GENERAL, {
      id_account: accountId,
      type,
    });
    const taskId = extractTaskId(unwrapApiBody(response.data));
    if (taskId == null) throw new Error("Không nhận được mã tác vụ làm mới thống kê.");
    return taskId;
  },

  async pollRenewGeneralResult(
    taskId: string | number,
  ): Promise<ZaloVideoTaskResultResponse> {
    const response = await api.post<ZaloVideoTaskResultResponse>(
      API_CHANNEL_VIDEO.RENEW_GENERAL_RESULT,
      buildTaskResultPayload(taskId),
    );
    return unwrapApiBody<ZaloVideoTaskResultResponse>(response.data);
  },

  async renewGeneralChannel(
    accountId: number,
    type: RenewGeneralType,
  ): Promise<void> {
    const taskId = await this.startRenewGeneral(accountId, type);
    await pollTask((id) => this.pollRenewGeneralResult(id), taskId, 3000);
  },

  async uploadVideoFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post<ZaloVideoUploadResponse>(
      API_CHANNEL_VIDEO.UPLOAD_VIDEO,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );

    const body = unwrapApiBody<ZaloVideoUploadResponse>(response.data);
    if (!body.file) throw new Error("Không nhận được đường dẫn video sau khi upload.");
    return body.file;
  },

  async uploadThumbnailBlob(blob: Blob): Promise<string> {
    const formData = new FormData();
    formData.append("file", blob, "thumbnail.jpg");

    const response = await api.post<ZaloVideoUploadResponse>(
      API_CHANNEL_VIDEO.UPLOAD_VIDEO,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );

    const body = unwrapApiBody<ZaloVideoUploadResponse>(response.data);
    if (!body.file) throw new Error("Không nhận được đường dẫn ảnh bìa.");
    return body.file;
  },

  async startPostVideo(payload: PostZaloVideoPayload): Promise<string | number> {
    const response = await api.post(API_CHANNEL_VIDEO.POST_VIDEO, payload);
    const taskId = extractTaskId(unwrapApiBody(response.data));
    if (taskId == null) throw new Error("Không nhận được mã tác vụ đăng video.");
    return taskId;
  },

  async pollPostVideoResult(taskId: string | number): Promise<ZaloVideoTaskResultResponse> {
    const response = await api.post<ZaloVideoTaskResultResponse>(
      API_CHANNEL_VIDEO.POST_VIDEO_RESULT,
      buildTaskResultPayload(taskId),
    );
    return unwrapApiBody<ZaloVideoTaskResultResponse>(response.data);
  },

  async postVideo(payload: PostZaloVideoPayload): Promise<ZaloVideoTaskResultResponse> {
    const taskId = await this.startPostVideo(payload);
    return pollTask((id) => this.pollPostVideoResult(id), taskId, 3000);
  },

  async startDownloadVideo(payload: DownloadZaloVideoPayload): Promise<string | number> {
    const response = await api.post(API_CHANNEL_VIDEO.DOWNLOAD_VIDEO, payload);
    const taskId = extractTaskId(unwrapApiBody(response.data));
    if (taskId == null) throw new Error("Không nhận được mã tác vụ tải video.");
    return taskId;
  },

  async pollDownloadVideoResult(taskId: string | number): Promise<ZaloVideoTaskResultResponse> {
    const response = await api.post<ZaloVideoTaskResultResponse>(
      API_CHANNEL_VIDEO.DOWNLOAD_VIDEO_RESULT,
      buildTaskResultPayload(taskId),
    );
    return unwrapApiBody<ZaloVideoTaskResultResponse>(response.data);
  },

  async downloadVideoFromLink(link: string): Promise<ZaloVideoTaskResultResponse> {
    const taskId = await this.startDownloadVideo({ link });
    return pollTask((id) => this.pollDownloadVideoResult(id), taskId, 3000);
  },

  async startRenewComments(accountId: number): Promise<string | number> {
    const response = await api.post(API_CHANNEL_VIDEO.RENEW_COMMENT, {
      id_account: accountId,
    });
    const taskId = extractTaskId(unwrapApiBody(response.data));
    if (taskId == null) {
      throw new Error("Không nhận được mã tác vụ làm mới bình luận.");
    }
    return taskId;
  },

  async pollRenewCommentsResult(
    taskId: string | number,
  ): Promise<ZaloVideoTaskResultResponse> {
    const response = await api.post<ZaloVideoTaskResultResponse>(
      API_CHANNEL_VIDEO.RENEW_COMMENT_RESULT,
      buildTaskResultPayload(taskId),
    );
    return unwrapApiBody<ZaloVideoTaskResultResponse>(response.data);
  },

  async renewComments(accountId: number): Promise<void> {
    const taskId = await this.startRenewComments(accountId);
    await pollTask((id) => this.pollRenewCommentsResult(id), taskId, 3000);
  },

  async startPhoneStatus(accountId: number): Promise<string | number> {
    const response = await api.post(API_CHANNEL_VIDEO.PHONE, {
      id_account: accountId,
    });
    const taskId = extractTaskId(unwrapApiBody(response.data));
    if (taskId == null) throw new Error("Không nhận được mã tác vụ trạng thái Zalo.");
    return taskId;
  },

  async pollPhoneStatusResult(
    taskId: string | number,
  ): Promise<ZaloVideoTaskResultResponse> {
    const response = await api.post<ZaloVideoTaskResultResponse>(
      API_CHANNEL_VIDEO.PHONE_RESULT,
      buildTaskResultPayload(taskId),
    );
    return unwrapApiBody<ZaloVideoTaskResultResponse>(response.data);
  },

  async fetchPhoneStatus(accountId: number): Promise<boolean> {
    const taskId = await this.startPhoneStatus(accountId);
    const result = await pollTask((id) => this.pollPhoneStatusResult(id), taskId, 1000);
    const inner = result.result ?? result.data;
    if (inner && typeof inner === "object") {
      const record = inner as Record<string, unknown>;
      if (typeof record.status === "boolean") return record.status;
      const nested = record.data;
      if (nested && typeof nested === "object" && "status" in nested) {
        return Boolean((nested as { status?: boolean }).status);
      }
    }
    return false;
  },

  async startAddPhone(
    accountId: number,
    phone: string,
  ): Promise<string | number> {
    const response = await api.post(API_CHANNEL_VIDEO.PHONE_ADD, {
      id_account: accountId,
      phone,
    });
    const taskId = extractTaskId(unwrapApiBody(response.data));
    if (taskId == null) throw new Error("Không nhận được mã tác vụ liên kết Zalo.");
    return taskId;
  },

  async pollAddPhoneResult(
    taskId: string | number,
  ): Promise<ZaloVideoTaskResultResponse> {
    const response = await api.post<ZaloVideoTaskResultResponse>(
      API_CHANNEL_VIDEO.PHONE_ADD_RESULT,
      buildTaskResultPayload(taskId),
    );
    return unwrapApiBody<ZaloVideoTaskResultResponse>(response.data);
  },

  async addPhoneContact(accountId: number, phone: string): Promise<void> {
    const taskId = await this.startAddPhone(accountId, phone);
    await pollTask((id) => this.pollAddPhoneResult(id), taskId, 3000);
  },

  async startDeletePhone(accountId: number): Promise<string | number> {
    const response = await api.post(API_CHANNEL_VIDEO.PHONE_DELETE, {
      id_account: accountId,
    });
    const taskId = extractTaskId(unwrapApiBody(response.data));
    if (taskId == null) throw new Error("Không nhận được mã tác vụ hủy liên kết.");
    return taskId;
  },

  async pollDeletePhoneResult(
    taskId: string | number,
  ): Promise<ZaloVideoTaskResultResponse> {
    const response = await api.post<ZaloVideoTaskResultResponse>(
      API_CHANNEL_VIDEO.PHONE_DELETE_RESULT,
      buildTaskResultPayload(taskId),
    );
    return unwrapApiBody<ZaloVideoTaskResultResponse>(response.data);
  },

  async deletePhoneContact(accountId: number): Promise<void> {
    const taskId = await this.startDeletePhone(accountId);
    await pollTask((id) => this.pollDeletePhoneResult(id), taskId, 3000);
  },
};