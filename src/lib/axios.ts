import axios from "axios";
import { API_AUTH, API_BASE_URL } from "@/config/api";
import { STORAGE_KEYS } from "@/constants/storage-keys";
import {
  API_MESSAGE_KEY,
  isAuthTokenExpiredError,
  normalizeApiResponse,
  unwrapAuthTokens,
} from "@/lib/api-response";

export const TOKEN_REFRESH_FAILURE = "tokenRefreshFailure";

interface QueuedRequest {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}

const markTokenRefreshFailure = (error: unknown) => {
  if (error && typeof error === "object") {
    (error as Record<string, unknown>)[TOKEN_REFRESH_FAILURE] = true;
  }
  return error;
};

export function isTokenRefreshFailure(error: unknown): boolean {
  if (error && typeof error === "object" && TOKEN_REFRESH_FAILURE in error) {
    return Boolean((error as Record<string, unknown>)[TOKEN_REFRESH_FAILURE]);
  }

  if (axios.isAxiosError(error)) {
    const url = error.config?.url ?? "";
    return url.includes(API_AUTH.REFRESH);
  }

  return false;
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
}

export function updateTokens(access: string, refresh: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access);
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh);
}

export function clearTokens() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
}

let isRefreshing = false;
let requestQueue: QueuedRequest[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  requestQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else if (token) prom.resolve(token);
  });
  requestQueue = [];
};

async function performTokenRefresh(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    logoutAndRedirect();
    throw new Error("Missing refresh token");
  }

  const response = await axios.post(
    `${API_BASE_URL}${API_AUTH.REFRESH}`,
    { refresh: refreshToken },
  );
  const { access, refresh } = unwrapAuthTokens(response.data);
  updateTokens(access, refresh || refreshToken);
  return access;
}

/** Làm mới access token; chỉ xóa phiên khi refresh token bị máy chủ từ chối. */
export async function refreshAccessToken(): Promise<string | null> {
  if (isRefreshing) {
    return new Promise((resolve) => {
      requestQueue.push({
        resolve: (token: string) => resolve(token),
        reject: () => resolve(null),
      });
    });
  }

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    logoutAndRedirect();
    return null;
  }

  isRefreshing = true;
  try {
    const access = await performTokenRefresh();
    processQueue(null, access);
    return access;
  } catch (error) {
    markTokenRefreshFailure(error);
    processQueue(error, null);
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      logoutAndRedirect();
    }
    return null;
  } finally {
    isRefreshing = false;
  }
}

export function logoutAndRedirect() {
  clearTokens();
  if (
    typeof window !== "undefined" &&
    !window.location.pathname.includes("/login")
  ) {
    window.location.href = "/login";
  }
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.data instanceof FormData) {
      if (config.headers instanceof axios.AxiosHeaders) {
        config.headers.delete("Content-Type");
      } else if (config.headers) {
        delete config.headers["Content-Type"];
      }
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => {
    const normalized = normalizeApiResponse(response);
    const message = (normalized as typeof normalized & {
      [API_MESSAGE_KEY]?: string;
    })[API_MESSAGE_KEY];
    if (message) {
      normalized.apiMessage = message;
    }
    return normalized;
  },
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url ?? "";

    if (
      !originalRequest ||
      originalRequest._retry ||
      requestUrl.includes(API_AUTH.REFRESH) ||
      !isAuthTokenExpiredError(error)
    ) {
      return Promise.reject(error);
    }

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      logoutAndRedirect();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        requestQueue.push({
          resolve: (token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const access = await performTokenRefresh();
      originalRequest.headers.Authorization = `Bearer ${access}`;
      processQueue(null, access);

      return api(originalRequest);
    } catch (refreshError: unknown) {
      markTokenRefreshFailure(refreshError);
      processQueue(refreshError, null);
      const status = axios.isAxiosError(refreshError)
        ? refreshError.response?.status
        : undefined;

      if (status === 401) {
        logoutAndRedirect();
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
