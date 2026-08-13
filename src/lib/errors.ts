import axios, { AxiosError } from "axios";
import {
  API_ERROR_FALLBACK,
  API_ERROR_NETWORK,
  API_ERROR_REQUEST_FAILED,
} from "@/constants/api-errors";
import { isTokenRefreshFailure } from "@/lib/axios";
import { toast } from "@/lib/toast";
import type { ApiErrorBody, ParsedApiError } from "@/types/api";

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

/** Trích message từ body API */
export function extractApiErrorMessages(data: unknown): string[] {
  if (data == null) return [];
  if (typeof data === "string") return data.trim() ? [data.trim()] : [];
  if (Array.isArray(data)) return data.flatMap(extractApiErrorMessages);
  if (typeof data !== "object") return [];

  const record = data as Record<string, unknown>;
  const messages: string[] = [];
  for (const key of ["error", "message", "detail", "status"]) {
    messages.push(...flattenErrorValue(record[key]));
  }
  if (record.errors) messages.push(...flattenErrorValue(record.errors));
  if (record.non_field_errors) {
    messages.push(...flattenErrorValue(record.non_field_errors));
  }
  return [...new Set(messages.filter(Boolean))];
}

export function parseApiError(error: unknown): ParsedApiError {
  if (isTokenRefreshFailure(error)) {
    return { messages: [], skipped: true };
  }

  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const messages = extractApiErrorMessages(error.response?.data);
    if (messages.length > 0) {
      return { messages, status, isNetworkError: !error.response };
    }
    if (!error.response) {
      return {
        messages: [error.message || API_ERROR_NETWORK],
        isNetworkError: true,
      };
    }
    return { messages: [API_ERROR_REQUEST_FAILED], status };
  }

  if (error instanceof Error) {
    return { messages: [error.message || API_ERROR_FALLBACK] };
  }
  return { messages: [API_ERROR_FALLBACK] };
}

export function getApiErrorMessage(error: unknown): string {
  const { messages, skipped } = parseApiError(error);
  if (skipped) return API_ERROR_FALLBACK;
  return messages[0] ?? API_ERROR_FALLBACK;
}

export function getApiErrorCode(error: unknown): string | undefined {
  if (!axios.isAxiosError(error)) return undefined;
  const data = error.response?.data;
  if (!data || typeof data !== "object") return undefined;
  const code = (data as Record<string, unknown>).error_code;
  return typeof code === "string" && code.trim() ? code.trim() : undefined;
}

export function getApiErrorMessages(error: unknown): string[] {
  const { messages, skipped } = parseApiError(error);
  if (skipped) return [];
  return messages.length > 0 ? messages : [API_ERROR_FALLBACK];
}

export interface HandleApiErrorOptions {
  silent?: boolean;
}

export function handleApiError(
  error: unknown,
  options?: HandleApiErrorOptions,
): string[] {
  const parsed = parseApiError(error);
  if (parsed.skipped) return [];
  const messages =
    parsed.messages.length > 0 ? parsed.messages : [API_ERROR_FALLBACK];
  if (!options?.silent) {
    messages.forEach((m) => toast.error(m));
  }
  return messages;
}

export function isAxiosApiError(
  error: unknown,
): error is AxiosError<ApiErrorBody> {
  return axios.isAxiosError<ApiErrorBody>(error);
}
