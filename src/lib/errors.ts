import axios, { AxiosError } from "axios";
import {
  API_ERROR_ACTIVATION,
  API_ERROR_ACTIVATION_HINT,
  API_ERROR_FALLBACK,
  API_ERROR_NETWORK,
  API_ERROR_REQUEST_FAILED,
} from "@/constants/api-errors";
import { isCareTokenRefreshFailure } from "@/lib/care-axios";
import { handleConsentChatRequired } from "@/lib/consent-utils";
import { isTokenRefreshFailure } from "@/lib/axios";
import { toast } from "@/lib/toast";
import type { ApiErrorBody, ParsedApiError } from "@/types/api";

const RESERVED_ROOT_KEYS = new Set([
  "error",
  "message",
  "detail",
  "errors",
  "non_field_errors",
  "error_code",
  "type",
  "expiration_date",
  "status",
  "code",
  "success",
  "data",
  "results",
  "count",
  "next",
  "previous",
]);

function flattenErrorValue(value: unknown): string[] {
  if (value == null) return [];
  if (typeof value === "string") return value.trim() ? [value.trim()] : [];
  if (typeof value === "number" || typeof value === "boolean") {
    return [String(value)];
  }
  if (Array.isArray(value)) return value.flatMap(flattenErrorValue);
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).flatMap(
      flattenErrorValue,
    );
  }
  return [];
}

function collectFieldErrors(
  record: Record<string, unknown>,
  skipKeys: Set<string> = RESERVED_ROOT_KEYS,
): string[] {
  const messages: string[] = [];

  Object.entries(record).forEach(([key, value]) => {
    if (skipKeys.has(key)) return;

    if (typeof value === "string" || Array.isArray(value)) {
      messages.push(...flattenErrorValue(value));
      return;
    }

    if (typeof value === "object" && value !== null) {
      messages.push(
        ...collectFieldErrors(value as Record<string, unknown>, new Set()),
      );
    }
  });

  return messages;
}

/** Trích xuất danh sách message lỗi từ body API — đồng bộ MANAGE_CN / ZaloCN */
export function extractApiErrorMessages(data: unknown): string[] {
  if (data == null) return [];
  if (typeof data === "string") return data.trim() ? [data.trim()] : [];

  if (Array.isArray(data)) {
    return data.flatMap(extractApiErrorMessages);
  }

  if (typeof data !== "object") return [];

  const record = data as Record<string, unknown>;
  const messages: string[] = [];

  if (typeof record.error === "string" && record.error.trim()) {
    messages.push(record.error.trim());
  }

  if (typeof record.message === "string" && record.message.trim()) {
    messages.push(record.message.trim());
  }

  if (typeof record.status === "string" && record.status.trim()) {
    messages.push(record.status.trim());
  }

  messages.push(...flattenErrorValue(record.detail));

  if (
    record.errors &&
    typeof record.errors === "object" &&
    !Array.isArray(record.errors)
  ) {
    messages.push(
      ...collectFieldErrors(record.errors as Record<string, unknown>, new Set()),
    );
  }

  messages.push(...flattenErrorValue(record.non_field_errors));
  messages.push(...collectFieldErrors(record));

  return [...new Set(messages.filter(Boolean))];
}

function uniqueMessages(messages: string[]): string[] {
  return [...new Set(messages.filter(Boolean))];
}

function resolveActivationMessages(messages: string[]): string[] {
  return messages.map((message) =>
    message === API_ERROR_ACTIVATION ? API_ERROR_ACTIVATION_HINT : message,
  );
}

/** Parse lỗi API thành cấu trúc chuẩn */
export function parseApiError(error: unknown): ParsedApiError {
  if (isCareTokenRefreshFailure(error) || isTokenRefreshFailure(error)) {
    return { messages: [], skipped: true };
  }

  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const messages = extractApiErrorMessages(error.response?.data);

    if (messages.length > 0) {
      return {
        messages: resolveActivationMessages(uniqueMessages(messages)),
        status,
        isNetworkError: !error.response,
      };
    }

    if (!error.response) {
      return {
        messages: [error.message || API_ERROR_NETWORK],
        isNetworkError: true,
      };
    }

    return {
      messages: [API_ERROR_REQUEST_FAILED],
      status,
    };
  }

  if (error instanceof Error) {
    const message =
      error.message === API_ERROR_ACTIVATION
        ? API_ERROR_ACTIVATION_HINT
        : error.message || API_ERROR_FALLBACK;

    return { messages: [message] };
  }

  return { messages: [API_ERROR_FALLBACK] };
}

/** Lấy 1 message lỗi để hiển thị inline (form, store) */
export function getApiErrorMessage(error: unknown): string {
  const { messages, skipped } = parseApiError(error);
  if (skipped) return API_ERROR_FALLBACK;
  return messages[0] ?? API_ERROR_FALLBACK;
}

/** Trích error_code từ body envelope / axios error */
export function getApiErrorCode(error: unknown): string | undefined {
  if (!axios.isAxiosError(error)) return undefined;
  const data = error.response?.data;
  if (!data || typeof data !== "object") return undefined;
  const code = (data as Record<string, unknown>).error_code;
  return typeof code === "string" && code.trim() ? code.trim() : undefined;
}

/** Lấy tất cả message lỗi */
export function getApiErrorMessages(error: unknown): string[] {
  const { messages, skipped } = parseApiError(error);
  if (skipped) return [];
  return messages.length > 0 ? messages : [API_ERROR_FALLBACK];
}

function showErrorToasts(messages: string[]) {
  const unique = uniqueMessages(messages);

  if (unique.length === 0) {
    toast.error(API_ERROR_FALLBACK);
    return;
  }

  unique.forEach((message) => {
    if (message === API_ERROR_ACTIVATION_HINT) {
      toast.success(message);
      return;
    }
    toast.error(message);
  });
}

export interface HandleApiErrorOptions {
  /** Không hiện toast — chỉ trả message (dùng khi form tự render lỗi) */
  silent?: boolean;
}

/**
 * Hàm báo lỗi chuẩn — parse API error + toast.
 * Dùng trong store/service catch hoặc component.
 */
export function handleApiError(
  error: unknown,
  options?: HandleApiErrorOptions,
): string[] {
  // Gate chat đồng thuận — mở modal ký (toast trong handleConsentChatRequired)
  if (handleConsentChatRequired(error)) {
    const parsed = parseApiError(error);
    return parsed.messages.length > 0 ? parsed.messages : [API_ERROR_FALLBACK];
  }

  const parsed = parseApiError(error);

  if (parsed.skipped) return [];

  const messages =
    parsed.messages.length > 0 ? parsed.messages : [API_ERROR_FALLBACK];

  if (!options?.silent) {
    showErrorToasts(messages);
  }

  if (process.env.NODE_ENV === "development" && axios.isAxiosError(error)) {
    console.error("[API Error]", {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      messages,
    });
  }

  return messages;
}

/** Type guard tiện dụng */
export function isAxiosApiError(error: unknown): error is AxiosError<ApiErrorBody> {
  return axios.isAxiosError<ApiErrorBody>(error);
}