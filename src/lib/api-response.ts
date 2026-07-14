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

/** error_code JWT/token — vẫn cho phép refresh */
const TOKEN_AUTH_ERROR_CODES = new Set([
  "TOKEN_EXPIRED",
  "INVALID_TOKEN",
  "AUTHENTICATION_FAILED",
]);

/**
 * error_code nghiệp vụ/quyền — HTTP 403 không phải lỗi token.
 * Đồng bộ team-collaboration contract §10.
 */
const BUSINESS_FORBIDDEN_ERROR_CODES = new Set([
  "DOMAIN_NOT_ALLOWED",
  "NOT_MANAGER",
  "CAMPAIGN_TYPE_DENIED",
  "CATEGORY_FORBIDDEN",
  "ACCOUNT_EXPIRED",
]);

function getErrorBodyRecord(error: AxiosError): Record<string, unknown> | null {
  const data = error.response?.data;
  if (!data || typeof data !== "object") return null;
  return data as Record<string, unknown>;
}

export function getApiErrorCode(error: unknown): string | undefined {
  if (!axios.isAxiosError(error)) return undefined;
  const record = getErrorBodyRecord(error);
  if (!record) return undefined;
  const code = record.error_code;
  return typeof code === "string" && code.trim() ? code.trim() : undefined;
}

/** 403 envelope / error_code nghiệp vụ — không refresh token, chỉ hiện message */
export function isBusinessForbiddenError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;

  const status = error.response?.status;
  if (status !== 403) return false;

  const record = getErrorBodyRecord(error);
  if (!record) return false;

  const errorCode = getApiErrorCode(error);
  if (errorCode) {
    if (TOKEN_AUTH_ERROR_CODES.has(errorCode)) return false;
    if (BUSINESS_FORBIDDEN_ERROR_CODES.has(errorCode)) return true;
    return true;
  }

  return record.success === false;
}

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

/** Token hết hạn — HTTP 401 hoặc message "Token has expired" (không gồm 403 nghiệp vụ) */
export function isAuthTokenExpiredError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  if (isBusinessForbiddenError(error)) return false;

  const status = error.response?.status;
  if (status === 401) return true;

  if (status === 403) {
    return collectAuthErrorTexts(error).some((text) =>
      AUTH_TOKEN_EXPIRED_RE.test(text),
    );
  }

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