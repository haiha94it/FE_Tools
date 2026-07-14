import axios, { AxiosError, type AxiosResponse } from "axios";
import { API_ERROR_REQUEST_FAILED } from "@/constants/api-errors";
import type { ApiResponse } from "@/types/api";

/** Message từ envelope — gắn sau interceptor */
export const API_MESSAGE_KEY = "__apiMessage";

export function isApiEnvelope(body: unknown): body is ApiResponse<unknown> {
  if (body == null || typeof body !== "object") return false;
  const record = body as Record<string, unknown>;
  return "success" in record && "data" in record;
}

export function getApiResponseMessage(response: AxiosResponse): string | undefined {
  return (response as AxiosResponse & { [API_MESSAGE_KEY]?: string })[
    API_MESSAGE_KEY
  ];
}

/** Message success từ envelope — toast sau DELETE/mutate */
export function getApiSuccessMessage(response: AxiosResponse): string | undefined {
  return (
    getApiResponseMessage(response) ??
    (response as AxiosResponse & { apiMessage?: string }).apiMessage
  );
}

/** Unwrap body envelope — dùng cho axios.post thô (refresh token) */
export function unwrapApiBody<T>(body: unknown): T {
  if (!isApiEnvelope(body)) {
    return body as T;
  }

  if (!body.success) {
    throw new AxiosError(
      body.message || API_ERROR_REQUEST_FAILED,
      AxiosError.ERR_BAD_REQUEST,
      undefined,
      undefined,
      {
        data: body,
        status: 400,
        statusText: "Bad Request",
        headers: {},
        config: { headers: {} } as AxiosResponse["config"],
      },
    );
  }

  return body.data as T;
}

/** Chuẩn hóa response axios — unwrap data + giữ message */
export function normalizeApiResponse<T>(
  response: AxiosResponse<unknown>,
): AxiosResponse<T> {
  const body = response.data;

  if (!isApiEnvelope(body)) {
    return response as AxiosResponse<T>;
  }

  if (!body.success) {
    throw new AxiosError(
      body.message || API_ERROR_REQUEST_FAILED,
      AxiosError.ERR_BAD_REQUEST,
      response.config,
      response.request,
      {
        ...response,
        data: body,
      },
    );
  }

  const normalized = response as AxiosResponse<T> & {
    [API_MESSAGE_KEY]?: string;
  };
  normalized.data = body.data as T;
  normalized[API_MESSAGE_KEY] = body.message;
  return normalized;
}

const AUTH_TOKEN_EXPIRED_RE =
  /token\s+has\s+expired|token\s+expired|expired\s+token|jwt\s+expired|access\s+token\s+expired/i;

function collectAuthErrorTexts(error: AxiosError): string[] {
  const texts: string[] = [];
  if (error.message?.trim()) texts.push(error.message.trim());

  const data = error.response?.data;
  if (typeof data === "string" && data.trim()) {
    texts.push(data.trim());
    return texts;
  }

  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    for (const key of ["message", "detail", "error", "status"] as const) {
      const value = record[key];
      if (typeof value === "string" && value.trim()) texts.push(value.trim());
    }
  }

  return texts;
}

/** Token hết hạn — HTTP 401/403 hoặc envelope/message "Token has expired" */
export function isAuthTokenExpiredError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;

  const status = error.response?.status;
  if (status === 401 || status === 403) return true;

  return collectAuthErrorTexts(error).some((text) =>
    AUTH_TOKEN_EXPIRED_RE.test(text),
  );
}

/** Unwrap tokens refresh/login từ response thô hoặc envelope */
export function unwrapAuthTokens(body: unknown): {
  access: string;
  refresh: string;
} {
  const payload = unwrapApiBody<{ access: string; refresh: string }>(body);
  if (!payload?.access || !payload?.refresh) {
    throw new AxiosError("Phản hồi token không hợp lệ");
  }
  return payload;
}